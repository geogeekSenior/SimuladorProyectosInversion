# -*- coding: utf-8 -*-
"""
Simulador de impacto por proyectos de inversión
· Lee proyectos (JSON) y geometrías (JSON)
· Calcula impacto exponencial por dimensión (Seguridad, Gobernabilidad, Desarrollo)
· Penaliza por parques, aplica tope a 100
· Envía resultados a tablas y las sincroniza con servicios Hosted
Compatible con ArcGIS Pro / ArcGIS Enterprise GP Tool
"""

import os, arcpy, json, re, ast, traceback, uuid
from arcpy.sa import *

# ───────────────────── 1 · CONFIGURACIÓN GLOBAL ──────────────────────────────
arcpy.CheckOutExtension("Spatial")
arcpy.env.overwriteOutput = True
arcpy.env.addOutputsToMap = False     # no capas automáticas


# Rásters base (0-100)
rasters_base = {
    "SEGURIDAD":      r"C:/Users/Sebastian/Documents/ArcGIS/Projects/CIDENAL/CIDENAL.gdb/Score_Seguridad",
    "GOBERNABILIDAD": r"C:/Users/Sebastian/Documents/ArcGIS/Projects/CIDENAL/CIDENAL.gdb/Score_Gobernabilidad",
    "DESARROLLO":     r"C:/Users/Sebastian/Documents/ArcGIS/Projects/CIDENAL/CIDENAL.gdb/Score_Desarrollo",
}

# Raster de penalización (1 = normal; 2 = parque)
raster_penalizacion = r"C:/Users/Sebastian/Documents/ArcGIS/Projects/CIDENAL/CIDENAL.gdb/parqueraster2"

# Máscara / área de estadísticas
area_interes = r"C:/Users/Sebastian/Documents/ArcGIS/Projects/CIDENAL/CIDENAL.gdb/AreaInteres"
extent_ai = arcpy.Describe(area_interes).extent

# Constantes
limite_superior = 100
cell_size       = 0.0008           # ≈ 90 m
sr              = arcpy.SpatialReference(4326)

# URLs de los servicios Hosted
srv_proyectos   = "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/EquiposProyectos/FeatureServer/0"
srv_indicadores = "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/EquiposIndicadores/FeatureServer/0"

# ───────────────────── 2 · UTILIDADES ───────────────────────────────────────
def sanitize_json(s: str) -> str:
    """Limpia caracteres de control y devuelve JSON válido."""
    s = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', s)
    if s.startswith('"') and s.endswith('"'):
        s = s[1:-1].replace('\\"', '"')
    try:
        json.loads(s); return s
    except Exception:
        return json.dumps(ast.literal_eval(s))

# ───────────────────── 3 · LÓGICA PRINCIPAL ─────────────────────────────────
def script_tool(atributos_json_str, geometrias_json_str):
    try:
        # --- 3.1 Parseo de JSON ----
        atributos  = json.loads(sanitize_json(atributos_json_str))
        geometrias = json.loads(sanitize_json(geometrias_json_str))
        attr_by_id = {a["objectid"]: a for a in atributos}

        # --- 3.2 Crear puntos de proyecto (memory) ----
        fc_path = "memory/Proyectos_Inversion"
        arcpy.CreateFeatureclass_management("memory", "Proyectos_Inversion",
                                            "POINT", spatial_reference=sr)
        for name, ftype, length in [
            ("PROJECT_ID","LONG",None), ("PROYECTO","TEXT",100),
            ("SEGURIDAD","SHORT",None), ("DESARROLLO","SHORT",None),
            ("GOBERNABILIDAD","SHORT",None), ("VALORINVERSION","DOUBLE",None),
            ("AREAAFECTACION","DOUBLE",None), ("UBICACION","TEXT",50),
            ("TEAM_NAME","TEXT",50), ("TEAM_CODE","TEXT",20)
        ]:
            arcpy.AddField_management(fc_path, name, ftype, field_length=length or "")

        with arcpy.da.InsertCursor(
            fc_path,
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

        # --- 3.3 Preparar capa de proyectos ----
        arcpy.MakeFeatureLayer_management(fc_path, "proyectos_lyr")
        deltas_dim = {k: [] for k in rasters_base}

        # --- 3.4 Recorrer proyectos ----
        with arcpy.da.SearchCursor(
            fc_path,
            ["OID@","SEGURIDAD","GOBERNABILIDAD","DESARROLLO","AREAAFECTACION"]
        ) as cur:
            for oid, seg, gob, des, radio in cur:
                arcpy.SelectLayerByAttribute_management("proyectos_lyr", "NEW_SELECTION",
                                                        f"OBJECTID = {oid}")

                # Distancia acumulada (una vez por proyecto)
                radio_impacto = max(radio, 1)
                with arcpy.EnvManager(extent=extent_ai,
                      cellSize=cell_size,
                      outputCoordinateSystem=sr):
                    dist = DistanceAccumulation("proyectos_lyr",
                                distance_method="GEODESIC",
                                vertical_factor="BINARY 1 -30 30",
                                horizontal_factor="BINARY 1 45")
                dist_adj = dist * Raster(raster_penalizacion)

                # Delta por dimensión
                for dim, valor in (("SEGURIDAD", seg),
                                   ("GOBERNABILIDAD", gob),
                                   ("DESARROLLO", des)):
                    if valor <= 0:
                        continue
                    impacto   = Exp(-dist_adj / float(radio_impacto)) + 1
                    base      = Raster(rasters_base[dim])
                    necesidad = 1 - (base / 100.0)
                    incremento = (impacto - 1) * valor * necesidad
                    delta_path = f"in_memory/R_{dim.lower()}_{oid}_delta"
                    incremento.save(delta_path)
                    deltas_dim[dim].append(delta_path)

        # --- 3.5 Consolidar ráster final por dimensión ----
        rasters_final = {}
        for dim, deltas in deltas_dim.items():
            if not deltas:
                continue
            inc_sum = (Raster(deltas[0]) if len(deltas) == 1
                       else CellStatistics([Raster(p) for p in deltas], "SUM", "DATA"))
            base     = Raster(rasters_base[dim])
            final_r  = Con(base + inc_sum > limite_superior,
                           limite_superior,
                           base + inc_sum)
            out_path = f"in_memory/R_{dim.lower()}_final"
            final_r.save(out_path)
            rasters_final[dim] = out_path

        # ---------------- 3.5-bis · Índice combinado -----------------
        import uuid, os  #  ← asegúrate de que 'uuid' y 'os' ya estén importados arriba

        # 0) Solo seguimos si existen las tres dimensiones finales
        if all(k in rasters_final for k in ("SEGURIDAD", "GOBERNABILIDAD", "DESARROLLO")):

            # 1) Cálculo del índice (limitado a 100)
            indice_raster = (
                Raster(rasters_final["SEGURIDAD"])      * 0.45 +
                Raster(rasters_final["GOBERNABILIDAD"]) * 0.30 +
                Raster(rasters_final["DESARROLLO"])     * 0.25
            )
            indice_raster = Con(indice_raster > limite_superior,
                                limite_superior,
                                indice_raster)

            # 2) Carpeta/GDB válida donde guardar
            scratch_gdb = arcpy.env.scratchGDB
            if not scratch_gdb or not arcpy.Exists(scratch_gdb):
                scratch_gdb = arcpy.env.scratchFolder     # fallback a carpeta temporal

            # 3) Nombre único para evitar bloqueos
            indice_name = f"indice_{uuid.uuid4().hex[:8]}"   # p.ej. indice_A1B2C3D4

            # 4) Ruta completa (en .gdb → sin extensión, en carpeta → .tif)
            if scratch_gdb.lower().endswith(".gdb"):
                indice_path = os.path.join(scratch_gdb, indice_name)          # FGDBR
            else:
                indice_path = os.path.join(scratch_gdb, f"{indice_name}.tif") # GeoTIFF

            # 5) Si existe, bórralo para evitar ERROR 010240
            if arcpy.Exists(indice_path):
                arcpy.management.Delete(indice_path)

            # 6) Guardar ráster y exponerlo como parámetro 4
            indice_raster.save(indice_path)
            arcpy.SetParameterAsText(4, indice_path)

        else:
            # Si faltara alguna dimensión, avisa y deja el parámetro vacío
            arcpy.AddWarning("No se generó el Índice: faltan una o más dimensiones finales.")
            indice_path = ""
            arcpy.SetParameterAsText(4, indice_path)



        # --- 3.6 Medias globales (máscara area_interes) ----
        medias = {}
        for dim, path in rasters_final.items():
            with arcpy.EnvManager(mask=area_interes, extent=area_interes):
                val = arcpy.GetRasterProperties_management(Raster(path), "MEAN").getOutput(0)
                medias[dim] = float(val.replace(",", "."))
        medias = {k: medias.get(k, 0) for k in rasters_base}

        # --- 3.7 Crear tablas de salida ----
        proyecto_info_fc = "memory/Proyecto_Info"
        estadisticas_fc  = "memory/Estadisticas_Medias"
        arcpy.CreateTable_management("memory", "Proyecto_Info")
        arcpy.CreateTable_management("memory", "Estadisticas_Medias")

        # Proyecto_Info
        for name, length in [("OBJECTID_Proyecto",10),("UBICACION",200),
                             ("SESSION_TIMESTAMP",30),("TEAM_NAME",50),
                             ("TEAM_CODE",20),("PROYECTO",120),
                             ("VALORINVERSION",None),("CICLO",20)]:
            arcpy.AddField_management(proyecto_info_fc, name,
                                      "TEXT" if length else "DOUBLE",
                                      field_length=length or "")
        with arcpy.da.InsertCursor(
            proyecto_info_fc,
            ["OBJECTID_Proyecto","UBICACION","SESSION_TIMESTAMP",
             "TEAM_NAME","TEAM_CODE","PROYECTO","VALORINVERSION","CICLO"]
        ) as ic:
            for a in atributos:
                ic.insertRow([a["objectid"], a["ubicacion"],
                              a["sessionTimestamp"], a["teamName"],
                              a["teamCode"], a["proyecto"],
                              a["valorinversion"], "ciclo-1"])

        # Estadisticas_Medias
        for name, length in [("TEAM_NAME",50),("TEAM_CODE",20),
                             ("MEAN_SEGURIDAD",None),("MEAN_GOBERNABILIDAD",None),
                             ("MEAN_DESARROLLO",None),("CICLO",20),
                             ("INDICE",None),("VIDA",None)]:
            arcpy.AddField_management(estadisticas_fc, name,
                                      "TEXT" if length else "DOUBLE",
                                      field_length=length or "")
        teams = {(a["teamName"], a["teamCode"]) for a in atributos}
        indice = medias["SEGURIDAD"]*0.45 + medias["GOBERNABILIDAD"]*0.3 + medias["DESARROLLO"]*0.25
        vida   = 68 + (85-68)*(indice/100)
        with arcpy.da.InsertCursor(
            estadisticas_fc,
            ["TEAM_NAME","TEAM_CODE","MEAN_SEGURIDAD","MEAN_GOBERNABILIDAD",
             "MEAN_DESARROLLO","CICLO","INDICE","VIDA"]
        ) as ic:
            for tname, tcode in teams:
                ic.insertRow([tname, tcode,
                              medias["SEGURIDAD"], medias["GOBERNABILIDAD"],
                              medias["DESARROLLO"], "ciclo-1",
                              indice, vida])

        # --- 3.8 Sincronizar con servicios Hosted ----
        try:
            arcpy.Append_management(proyecto_info_fc, srv_proyectos,   "NO_TEST")
            arcpy.Append_management(estadisticas_fc,  srv_indicadores, "NO_TEST")
        except Exception as e:
            arcpy.AddWarning(f"No se pudo sincronizar con servicios: {e}")

        return proyecto_info_fc, estadisticas_fc, indice_path

    except Exception as e:
        arcpy.AddError(f"Error general: {e}")
        arcpy.AddError(traceback.format_exc())
        return "", "", ""       


# ───────────────────── 4 · Entrypoint para la GP Tool ───────────────────────
if __name__ == "__main__":
    at_json   = arcpy.GetParameterAsText(0)  # JSON atributos
    geom_json = arcpy.GetParameterAsText(1)  # JSON geometrías
    proj_fc, est_fc, idx_fc = script_tool(at_json, geom_json)
    arcpy.SetParameterAsText(2, proj_fc)
    arcpy.SetParameterAsText(3, est_fc)
    arcpy.SetParameterAsText(4, idx_fc)
