# -*- coding: utf-8 -*-
"""
Simulador de impacto por proyectos de inversión
· Lee proyectos (JSON) y geometrías (JSON)
· Calcula impacto exponencial por dimensión (Seguridad, Gobernabilidad, Desarrollo)
· Penaliza por parques, aplica tope a 100
· Genera un índice combinado (0-100) como ráster (parámetro 4)
· Devuelve dos tablas de resultados (parámetros 2 y 3) **fuera de memory**
· Sincroniza con servicios Hosted (opcional)
Compatible con ArcGIS Pro 3.4+ / ArcGIS Enterprise 11.4+
"""

import arcpy, json, re, ast, traceback, os, uuid
from arcpy.sa import *

# ───────────────── 1 · CONFIGURACIÓN GLOBAL ──────────────────────────────
arcpy.CheckOutExtension("Spatial")
arcpy.env.overwriteOutput = True
arcpy.env.addOutputsToMap = False

rasters_base = {
    "SEGURIDAD":      r"C:/Users/Sebastian/Documents/ArcGIS/Projects/CIDENAL/CIDENAL.gdb/Score_Seguridad",
    "GOBERNABILIDAD": r"C:/Users/Sebastian/Documents/ArcGIS/Projects/CIDENAL/CIDENAL.gdb/Score_Gobernabilidad",
    "DESARROLLO":     r"C:/Users/Sebastian/Documents/ArcGIS/Projects/CIDENAL/CIDENAL.gdb/Score_Desarrollo",
}

raster_penalizacion = r"C:/Users/Sebastian/Documents/ArcGIS/Projects/CIDENAL/CIDENAL.gdb/parqueraster2"
area_interes        = r"C:/Users/Sebastian/Documents/ArcGIS/Projects/CIDENAL/CIDENAL.gdb/AreaInteres"
limite_superior     = 100
cell_size           = 0.0008         # ≈ 90 m
sr                  = arcpy.SpatialReference(4326)

srv_proyectos   = "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/EquiposProyectos/FeatureServer/0"
srv_indicadores = "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/EquiposIndicadores/FeatureServer/0"

# ───────────────── 2 · FUNCIONES AUXILIARES ─────────────────────────────
def sanitize_json(s: str) -> str:
    s = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', s)
    if s.startswith('"') and s.endswith('"'):
        s = s[1:-1].replace('\\"', '"')
    try:
        json.loads(s); return s
    except Exception:
        return json.dumps(ast.literal_eval(s))

def scratch_ws() -> str:
    """FGDB scratch del servidor o carpeta scratch."""
    if arcpy.env.scratchGDB and arcpy.Exists(arcpy.env.scratchGDB):
        return arcpy.env.scratchGDB
    return arcpy.env.scratchFolder

# ───────────────── 3 · LÓGICA PRINCIPAL ─────────────────────────────────
def script_tool(atrib_json_str: str, geom_json_str: str):
    """Devuelve: (tabla_proyectos, tabla_estadísticas, ráster_índice o '')"""
    idx_path = ""  # valor por defecto
    try:
        # 3.1 Parsear JSON ---------------------------------------------------
        atributos  = json.loads(sanitize_json(atrib_json_str))
        geometrias = json.loads(sanitize_json(geom_json_str))
        attr_by_id = {a["objectid"]: a for a in atributos}

        # 3.2 FeatureClass in-memory ----------------------------------------
        fc_mem = "memory/Proyectos_Inversion"
        arcpy.CreateFeatureclass_management("memory", "Proyectos_Inversion",
                                            "POINT", spatial_reference=sr)
        for name, ftype, length in [
            ("PROJECT_ID","LONG",None), ("PROYECTO","TEXT",100),
            ("SEGURIDAD","SHORT",None), ("DESARROLLO","SHORT",None),
            ("GOBERNABILIDAD","SHORT",None), ("VALORINVERSION","DOUBLE",None),
            ("AREAAFECTACION","DOUBLE",None), ("UBICACION","TEXT",50),
            ("TEAM_NAME","TEXT",50), ("TEAM_CODE","TEXT",20)
        ]:
            arcpy.AddField_management(fc_mem, name, ftype, field_length=length or "")

        with arcpy.da.InsertCursor(
            fc_mem,
            ["SHAPE@XY","PROJECT_ID","PROYECTO","SEGURIDAD",
             "DESARROLLO","GOBERNABILIDAD","VALORINVERSION",
             "AREAAFECTACION","UBICACION","TEAM_NAME","TEAM_CODE"]
        ) as ic:
            for g in geometrias:
                a = attr_by_id.get(g["objectid"])
                if a:
                    ic.insertRow([(g["longitude"], g["latitude"]),
                                  a["objectid"], a["proyecto"],
                                  a["seguridad"], a["desarrollo"],
                                  a["gobernabilidad"], a["valorinversion"],
                                  a["areaafectacion"], a["ubicacion"],
                                  a["teamName"], a["teamCode"]])

        # 3.3 Impacto por proyecto ------------------------------------------
        arcpy.MakeFeatureLayer_management(fc_mem, "proyectos_lyr")
        deltas = {k: [] for k in rasters_base}

        with arcpy.da.SearchCursor(
            fc_mem,
            ["OID@","SEGURIDAD","GOBERNABILIDAD","DESARROLLO","AREAAFECTACION"]
        ) as cur:
            for oid, seg, gob, des, radio in cur:
                arcpy.SelectLayerByAttribute_management("proyectos_lyr",
                                                         "NEW_SELECTION",
                                                         f"OBJECTID = {oid}")
                radio = max(radio, 1)
                with arcpy.EnvManager(extent=area_interes,
                                      cellSize=cell_size,
                                      outputCoordinateSystem=sr):
                    dist = DistanceAccumulation("proyectos_lyr",
                                                distance_method="GEODESIC",
                                                vertical_factor="BINARY 1 -30 30",
                                                horizontal_factor="BINARY 1 45")
                dist_adj = dist * Raster(raster_penalizacion)

                for dim, valor in (("SEGURIDAD", seg),
                                   ("GOBERNABILIDAD", gob),
                                   ("DESARROLLO", des)):
                    if valor <= 0:
                        continue
                    impacto   = Exp(-dist_adj / float(radio)) + 1
                    base      = Raster(rasters_base[dim])
                    necesidad = 1 - (base / 100.0)
                    incremento = (impacto - 1) * valor * necesidad
                    delta_p = f"in_memory/R_{dim.lower()}_{oid}_delta"
                    incremento.save(delta_p)
                    deltas[dim].append(delta_p)

        # 3.4 Consolidar ráster final ----------------------------------------
        rasters_final = {}
        for dim, lst in deltas.items():
            if not lst:
                continue
            suma = (Raster(lst[0]) if len(lst) == 1
                    else CellStatistics([Raster(p) for p in lst], "SUM", "DATA"))
            base = Raster(rasters_base[dim])
            final = Con(base + suma > limite_superior, limite_superior, base + suma)
            path = f"in_memory/R_{dim.lower()}_final"
            final.save(path)
            rasters_final[dim] = path

     # 3.5 Índice combinado 
        if all(k in rasters_final for k in ("SEGURIDAD","GOBERNABILIDAD","DESARROLLO")):
            idx_r = (Raster(rasters_final["SEGURIDAD"]) * 0.45 +
                    Raster(rasters_final["GOBERNABILIDAD"]) * 0.30 +
                    Raster(rasters_final["DESARROLLO"])   * 0.25)
            idx_r = Con(idx_r > limite_superior, limite_superior, idx_r)

            # ← usa SIEMPRE la scratch GDB; si no existe, créala
            ws = arcpy.env.scratchGDB or os.path.join(arcpy.env.scratchFolder, "jobScratch.gdb")
            if not arcpy.Exists(ws):
                arcpy.CreateFileGDB_management(os.path.dirname(ws), os.path.basename(ws))

            idx_path = os.path.join(ws, arcpy.CreateUniqueName("indice", ws))
            idx_r.save(idx_path)
        else:
            arcpy.AddWarning("No se generó índice: faltan dimensiones finales.")


        # 3.6 Medias globales -----------------------------------------------
        medias = {}
        for dim, path in rasters_final.items():
            with arcpy.EnvManager(mask=area_interes, extent=area_interes):
                val = arcpy.GetRasterProperties_management(Raster(path), "MEAN").getOutput(0)
                medias[dim] = float(val.replace(",", "."))
        medias = {k: medias.get(k, 0) for k in rasters_base}

        # 3.7 Tablas en scratch GDB -----------------------------------------
        ws = scratch_ws()
        tab_proy = os.path.join(ws, arcpy.CreateUniqueName("Proyecto_Info", ws))
        tab_est  = os.path.join(ws, arcpy.CreateUniqueName("Estadisticas_Medias", ws))

        arcpy.CreateTable_management(os.path.dirname(tab_proy),
                                    os.path.basename(tab_proy))
        arcpy.CreateTable_management(os.path.dirname(tab_est),
                                    os.path.basename(tab_est))

        for name, length in [("OBJECTID_Proyecto",10),("UBICACION",200),
                             ("SESSION_TIMESTAMP",30),("TEAM_NAME",50),
                             ("TEAM_CODE",20),("PROYECTO",120),
                             ("VALORINVERSION",None),("CICLO",20)]:
            arcpy.AddField_management(tab_proy, name, "TEXT" if length else "DOUBLE",
                                      field_length=length or "")
        with arcpy.da.InsertCursor(
                tab_proy,
                ["OBJECTID_Proyecto","UBICACION","SESSION_TIMESTAMP",
                 "TEAM_NAME","TEAM_CODE","PROYECTO","VALORINVERSION","CICLO"]) as ic:
            for a in atributos:
                ic.insertRow([a["objectid"], a["ubicacion"],
                              a["sessionTimestamp"], a["teamName"],
                              a["teamCode"], a["proyecto"],
                              a["valorinversion"], "ciclo-1"])

        for name, length in [("TEAM_NAME",50),("TEAM_CODE",20),
                             ("MEAN_SEGURIDAD",None),("MEAN_GOBERNABILIDAD",None),
                             ("MEAN_DESARROLLO",None),("CICLO",20),
                             ("INDICE",None),("VIDA",None)]:
            arcpy.AddField_management(tab_est, name, "TEXT" if length else "DOUBLE",
                                      field_length=length or "")
        teams = {(a["teamName"], a["teamCode"]) for a in atributos}
        indice = medias["SEGURIDAD"]*0.45 + medias["GOBERNABILIDAD"]*0.30 + medias["DESARROLLO"]*0.25
        vida   = 68 + (85-68)*(indice/100)
        with arcpy.da.InsertCursor(
                tab_est,
                ["TEAM_NAME","TEAM_CODE","MEAN_SEGURIDAD","MEAN_GOBERNABILIDAD",
                 "MEAN_DESARROLLO","CICLO","INDICE","VIDA"]) as ic:
            for tn, tc in teams:
                ic.insertRow([tn, tc, medias["SEGURIDAD"], medias["GOBERNABILIDAD"],
                              medias["DESARROLLO"], "ciclo-1", indice, vida])

        # 3.8 Sincronizar (opcional) ----------------------------------------
        try:
            arcpy.Append_management(tab_proy, srv_proyectos,   "NO_TEST")
            arcpy.Append_management(tab_est,  srv_indicadores, "NO_TEST")
        except Exception as e:
            arcpy.AddWarning(f"No se pudo sincronizar con servicios: {e}")

        return tab_proy, tab_est, idx_path

    except Exception as exc:
        arcpy.AddError(f"Error general: {exc}")
        arcpy.AddError(traceback.format_exc())
        return "", "", idx_path

# ───────────────── 4 · Entrypoint (GP Tool) ─────────────────────────────
if __name__ == "__main__":
    at_json   = arcpy.GetParameterAsText(0)
    geom_json = arcpy.GetParameterAsText(1)

    # Inicializa variables para que existan en finally
    proy_fc = est_fc = idx_fc = ""

    try:
        proy_fc, est_fc, idx_fc = script_tool(at_json, geom_json)
    finally:
        # Par-2: Tabla Proyecto_Info
        arcpy.SetParameterAsText(2, proy_fc)
        # Par-3: Tabla Estadisticas_Medias
        arcpy.SetParameterAsText(3, est_fc)
        # Par-4: Índice ráster
        arcpy.SetParameterAsText(4, idx_fc)
