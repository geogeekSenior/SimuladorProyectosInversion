# -*- coding: utf-8 -*-
import arcpy
import json
import csv
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import os

# Ruta a la toolbox y Feature Service
toolbox_path = r"C:/Users/Sebastian/Documents/ArcGIS/Projects/Simulador/Simulador.atbx"
proyectos_fc = r"https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/ProyectosR/FeatureServer/0"

# Campos requeridos
campos = [
    "OBJECTID", "proyecto", "seguridad", "desarrollo", "gobernabilidad",
    "valorinversion", "areaafectacion", "ubicacion", "x", "y",
    "id_proyecto", "descripcion"
]

# Archivo de salida log
log_file = "log_resultados.csv"

def procesar_proyecto(row):
    try:
        arcpy.ImportToolbox(toolbox_path)

        atributos = {
            "objectid": row[0],
            "proyecto": row[1],
            "seguridad": row[2],
            "desarrollo": row[3],
            "gobernabilidad": row[4],
            "valorinversion": row[5],
            "areaafectacion": row[6],
            "ubicacion": row[7],
            "x": row[8],
            "y": row[9],
            "id_proyecto": row[10],
            "descripcion": row[11],
            "teamName": "team_ubicaciones",
            "teamCode": "0003-000000",
            "sessionTimestamp": "2025-06-12T00:00:00.000Z"
        }

        geometria = {
            "type": "point",
            "objectid": row[0],
            "longitude": row[8],
            "latitude": row[9]
        }

        atributos_json = json.dumps([atributos])
        geometrias_json = json.dumps([geometria])

        resultado = arcpy.Simuladoratbx.CICLO1(atributos_json, geometrias_json)

        mensaje = f"✔ Proyecto {row[0]} - {row[1]} procesado correctamente"
        return (row[0], row[1], "OK", mensaje)
    except Exception as e:
        mensaje = f"✖ Error en proyecto {row[0]} - {row[1]}: {e}"
        return (row[0], row[1], "ERROR", mensaje)

def guardar_log(resultados):
    with open(log_file, mode="w", newline='', encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["objectid", "proyecto", "estado", "mensaje"])
        writer.writerows(resultados)

def main():
    print("🔄 Iniciando procesamiento paralelo con ThreadPoolExecutor...")

    with arcpy.da.SearchCursor(proyectos_fc, campos) as cursor:
        filas = [row for row in cursor]

    resultados = []
    with ThreadPoolExecutor(max_workers=6) as executor:
        futuros = [executor.submit(procesar_proyecto, fila) for fila in filas]
        for futuro in as_completed(futuros):
            resultado = futuro.result()
            print(resultado[3])
            resultados.append(resultado)

    guardar_log(resultados)

    print(f"\n📄 Resultados guardados en: {os.path.abspath(log_file)}")
    print("✅ Procesamiento finalizado.")

if __name__ == "__main__":
    main()
