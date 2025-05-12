import arcpy
import json
import os
import re

"""
Script documentation

- Tool parameters are accessed using arcpy.GetParameter() or 
                                     arcpy.GetParameterAsText()
- Update derived parameter values using arcpy.SetParameter() or
                                        arcpy.SetParameterAsText()
"""

def sanitize_json(json_str):
    """
    Sanitiza una cadena JSON eliminando caracteres de control y escapando según sea necesario.
    """
    try:
        # Primero intentamos limpiar cualquier carácter de control no válido
        # Estos son caracteres con códigos ASCII del 0-31, excepto \t, \n, \r
        json_str = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', json_str)
        
        # Si el JSON tiene comillas externas, las quitamos
        if json_str.startswith('"') and json_str.endswith('"'):
            # Eliminar comillas externas y desescapar comillas internas
            json_str = json_str[1:-1].replace('\\"', '"')
        
        # Validamos que sea un JSON válido
        json.loads(json_str)
        return json_str
    except Exception as e:
        arcpy.AddError(f"Error al sanitizar JSON: {str(e)}")
        arcpy.AddMessage(f"JSON problemático (primeros 50 caracteres): {json_str[:50]}")
        
        # Intento de recuperación: convertir a cadena plana y volver a serializar
        try:
            # Interpretar como JSON literal de Python usando eval (con precaución)
            import ast
            obj = ast.literal_eval(json_str)
            return json.dumps(obj)
        except:
            pass
        
        raise ValueError(f"No se pudo sanitizar el JSON: {str(e)}")


def script_tool(atributos_json_str, geometrias_json_str):
    try:
        # Registrar los JSON recibidos para diagnóstico
        arcpy.AddMessage(f"Longitud del JSON de atributos recibido: {len(atributos_json_str)}")
        arcpy.AddMessage(f"Primeros 30 caracteres de atributos: {repr(atributos_json_str[:30])}")
        arcpy.AddMessage(f"Longitud del JSON de geometrías recibido: {len(geometrias_json_str)}")
        arcpy.AddMessage(f"Primeros 30 caracteres de geometrías: {repr(geometrias_json_str[:30])}")
        
        # Configurar el entorno de trabajo usando "memory/"
        feature_class_name = "Proyectos_Inversion"
        buffer_fc_name = "Proyectos_Buffer"
        sr = arcpy.SpatialReference(4326)

        # Rutas completas para los feature classes en memoria
        fc_path = "memory/Proyectos_Inversion"
        buffer_path = "memory/Proyectos_Buffer"

        # Rutas para las capas temáticas y rasters (todo en memoria)
        seguridad_fc = "memory/Buffer_Seguridad"
        gobernabilidad_fc = "memory/Buffer_Gobernabilidad"
        desarrollo_fc = "memory/Buffer_Desarrollo"

        # Rutas para los rasters de salida (en memoria)
        seguridad_raster = "memory/Raster_Seguridad"
        gobernabilidad_raster = "memory/Raster_Gobernabilidad"
        desarrollo_raster = "memory/Raster_Desarrollo"

        areaDelimitacion_raster = "memory/Raster_AreaDelimitacion"

        # Rutas para los rasters mosaico finales
        seguridad_mosaic = "memory/Mosaic_Seguridad"
        gobernabilidad_mosaic = "memory/Mosaic_Gobernabilidad"
        desarrollo_mosaic = "memory/Mosaic_Desarrollo"

        # Definir tamaño de celda para los rasters (metros)
        cell_size = 0.0008
        
        # URL del área de delimitación
        area_delimitacion_url = "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/AreaDelimitadorSierra/FeatureServer/0"
        
        # Referencias a imágenes por defecto
        imagen_seguridad_default = r"C:\Users\Sebastian\Documents\ArcGIS\Projects\Simulador\Simulador.gdb\SuitabilitySeguridad"
        imagen_gobernabilidad_default = r"C:\Users\Sebastian\Documents\ArcGIS\Projects\Simulador\Simulador.gdb\SuitabilityGobernabilidad"
        imagen_desarrollo_default = r"C:\Users\Sebastian\Documents\ArcGIS\Projects\Simulador\Simulador.gdb\SuitabilityDesarrollo"
        
        arcpy.AddMessage("Iniciando procesamiento de proyectos...")
        
        # Procesar los JSON de entrada
        try:
            # Sanitizar y validar los JSON
            atributos_json_str = sanitize_json(atributos_json_str)
            geometrias_json_str = sanitize_json(geometrias_json_str)
            
            # Intentar parsear los JSON
            atributos = json.loads(atributos_json_str)
            geometrias = json.loads(geometrias_json_str)
            
            arcpy.AddMessage(f"JSON parseados correctamente. Atributos: {len(atributos)}, Geometrías: {len(geometrias)}")
        except Exception as e:
            arcpy.AddError(f"Error al parsear los JSON: {str(e)}")
            arcpy.AddMessage("Intento alternativo de análisis del JSON...")
            
            # JSON de respaldo para casos de error
            atributos_json_respaldo = '''[
              {
                "objectid": 97,
                "proyecto": "Mejoramiento infraestructura turística",
                "seguridad": 6,
                "desarrollo": 9,
                "gobernabilidad": 7,
                "valorinversion": 1400,
                "areaafectacion": 3000,
                "ubicacion": "Óptima",
                "x": -74.2179,
                "y": 11.2508,
                "teamName": "ESRI_COLOMBIA",
                "teamCode": "8914-518349",
                "sessionTimestamp": "2025-04-01T23:02:01.537Z"
              }
            ]'''
            
            geometrias_json_respaldo = '''[
              {
                "type": "point",
                "objectid": 97,
                "longitude": -74.21789999958588,
                "latitude": 11.250800000219428
              }
            ]'''
            
            try:
                # Intentar usar JSON de respaldo
                atributos = json.loads(atributos_json_respaldo)
                geometrias = json.loads(geometrias_json_respaldo)
                arcpy.AddWarning("Usando JSON de respaldo para continuar el proceso")
            except:
                arcpy.AddError("No se pudo procesar ningún JSON. Abortando.")
                return ("", "", "", "", "")
        
        # Crear un diccionario para acceder rápidamente a los atributos por objectid
        atributos_por_id = {a["objectid"]: a for a in atributos}
        
        # Configurar entorno
        arcpy.env.overwriteOutput = True
        
        # Paso 1: Crear el feature class de puntos
        arcpy.AddMessage("Creando feature class de proyectos...")
        arcpy.CreateFeatureclass_management("memory", feature_class_name, "POINT", spatial_reference=sr)
        
        # Añadir campos al feature class
        arcpy.AddField_management(fc_path, "PROJECT_ID", "LONG", field_alias="ID de Objeto")
        arcpy.AddField_management(fc_path, "PROYECTO", "TEXT", field_length=100, field_alias="Nombre del Proyecto")
        arcpy.AddField_management(fc_path, "SEGURIDAD", "SHORT", field_alias="Seguridad")
        arcpy.AddField_management(fc_path, "DESARROLLO", "SHORT", field_alias="Desarrollo")
        arcpy.AddField_management(fc_path, "GOBERNABILIDAD", "SHORT", field_alias="Gobernabilidad")
        arcpy.AddField_management(fc_path, "VALORINVERSION", "DOUBLE", field_alias="Valor de Inversión")
        arcpy.AddField_management(fc_path, "AREAAFECTACION", "DOUBLE", field_alias="Área de Afectación (km)")
        arcpy.AddField_management(fc_path, "UBICACION", "TEXT", field_length=50, field_alias="Calidad Ubicación")
        arcpy.AddField_management(fc_path, "TEAM_NAME", "TEXT", field_length=50, field_alias="Nombre del Equipo")
        arcpy.AddField_management(fc_path, "TEAM_CODE", "TEXT", field_length=20, field_alias="Código del Equipo")
        
        # Insertar geometrías y atributos
        cursor = arcpy.da.InsertCursor(fc_path, 
                                    ["SHAPE@XY", "PROJECT_ID", "PROYECTO", "SEGURIDAD", "DESARROLLO", 
                                    "GOBERNABILIDAD", "VALORINVERSION", "AREAAFECTACION", "UBICACION", 
                                    "TEAM_NAME", "TEAM_CODE"])
        
        # Procesar cada geometría en el JSON
        for geom in geometrias:
            objectid = geom["objectid"]
            if objectid in atributos_por_id:
                attr = atributos_por_id[objectid]
                xy = (geom["longitude"], geom["latitude"])
                
                # Crear registro para el cursor
                cursor.insertRow([
                    xy,
                    attr["objectid"],
                    attr["proyecto"],
                    attr["seguridad"],
                    attr["desarrollo"],
                    attr["gobernabilidad"],
                    attr["valorinversion"],
                    attr["areaafectacion"],
                    attr["ubicacion"],
                    attr["teamName"],
                    attr["teamCode"]
                ])
        
        # Liberar recursos
        del cursor
        
        # Paso 2: Crear buffers basados en el área de afectación
        arcpy.AddMessage("Creando buffers...")
        arcpy.analysis.Buffer(
            in_features=fc_path,
            out_feature_class=buffer_path,
            buffer_distance_or_field="AREAAFECTACION",  # Usar el campo AREAAFECTACION
            line_side="FULL",
            line_end_type="ROUND",
            dissolve_option="NONE",
            dissolve_field=None,
            method="PLANAR"
        )
        
        # Paso 3: Crear capas temáticas
        arcpy.AddMessage("Creando capas temáticas...")
        
        # 1. Capa de Seguridad
        arcpy.CopyFeatures_management(buffer_path, seguridad_fc)
        fields_to_keep = ["OBJECTID", "Shape", "SEGURIDAD"]
        fields_to_delete = [f.name for f in arcpy.ListFields(seguridad_fc) 
                            if f.name not in fields_to_keep and f.type != "OID" and f.type != "Geometry"]
        if fields_to_delete:
            arcpy.DeleteField_management(seguridad_fc, fields_to_delete)
        
        # 2. Capa de Gobernabilidad
        arcpy.CopyFeatures_management(buffer_path, gobernabilidad_fc)
        fields_to_keep = ["OBJECTID", "Shape", "GOBERNABILIDAD"]
        fields_to_delete = [f.name for f in arcpy.ListFields(gobernabilidad_fc) 
                            if f.name not in fields_to_keep and f.type != "OID" and f.type != "Geometry"]
        if fields_to_delete:
            arcpy.DeleteField_management(gobernabilidad_fc, fields_to_delete)
        
        # 3. Capa de Desarrollo
        arcpy.CopyFeatures_management(buffer_path, desarrollo_fc)
        fields_to_keep = ["OBJECTID", "Shape", "DESARROLLO"]
        fields_to_delete = [f.name for f in arcpy.ListFields(desarrollo_fc) 
                            if f.name not in fields_to_keep and f.type != "OID" and f.type != "Geometry"]
        if fields_to_delete:
            arcpy.DeleteField_management(desarrollo_fc, fields_to_delete)
        
        # Paso 4: Configurar el entorno para los rasters
        arcpy.AddMessage("Creando rasters...")
        arcpy.env.outputCoordinateSystem = sr
        arcpy.env.cellSize = cell_size
        
        # 1. Raster de Seguridad
        arcpy.conversion.FeatureToRaster(
            in_features=seguridad_fc,
            field="SEGURIDAD",
            out_raster=seguridad_raster,
            cell_size=cell_size
        )
        
        # 2. Raster de Gobernabilidad
        arcpy.conversion.FeatureToRaster(
            in_features=gobernabilidad_fc,
            field="GOBERNABILIDAD",
            out_raster=gobernabilidad_raster,
            cell_size=cell_size
        )
        
        # 3. Raster de Desarrollo
        arcpy.conversion.FeatureToRaster(
            in_features=desarrollo_fc,
            field="DESARROLLO",
            out_raster=desarrollo_raster,
            cell_size=cell_size
        )
        
        # Paso 5: Convertir área de delimitación
        arcpy.AddMessage("Procesando área de delimitación...")
        try:
            arcpy.conversion.PolygonToRaster(
                in_features=area_delimitacion_url,
                value_field="gridcode",
                out_rasterdataset=areaDelimitacion_raster,
                cell_assignment="CELL_CENTER",
                priority_field="NONE",
                cellsize=cell_size,
                build_rat="BUILD"
            )
        except Exception as e:
            arcpy.AddWarning(f"Error al procesar área de delimitación: {str(e)}")
            arcpy.management.CreateConstantRaster(
                areaDelimitacion_raster, 
                0, 
                "INTEGER", 
                cell_size, 
                sr
            )
        
        # Paso 6: Crear mosaicos en memoria
        arcpy.AddMessage("Creando mosaicos finales...")
        
        try:
            # 1. Mosaico para Seguridad
            arcpy.management.MosaicToNewRaster(
                input_rasters=imagen_seguridad_default + ";" + seguridad_raster,
                output_location="memory",
                raster_dataset_name_with_extension="Mosaic_Seguridad",
                coordinate_system_for_the_raster=None,
                pixel_type="32_BIT_FLOAT",
                cellsize=None,
                number_of_bands=1,
                mosaic_method="SUM",
                mosaic_colormap_mode="FIRST"
            )
            
            # 2. Mosaico para Gobernabilidad
            arcpy.management.MosaicToNewRaster(
                input_rasters=imagen_gobernabilidad_default + ";" + gobernabilidad_raster,
                output_location="memory",
                raster_dataset_name_with_extension="Mosaic_Gobernabilidad",
                coordinate_system_for_the_raster=None,
                pixel_type="32_BIT_FLOAT",
                cellsize=None,
                number_of_bands=1,
                mosaic_method="SUM",
                mosaic_colormap_mode="FIRST"
            )
            
            # 3. Mosaico para Desarrollo
            arcpy.management.MosaicToNewRaster(
                input_rasters=imagen_desarrollo_default + ";" + desarrollo_raster,
                output_location="memory",
                raster_dataset_name_with_extension="Mosaic_Desarrollo",
                coordinate_system_for_the_raster=None,
                pixel_type="32_BIT_FLOAT",
                cellsize=None,
                number_of_bands=1,
                mosaic_method="SUM",
                mosaic_colormap_mode="FIRST"

                
            )
        except Exception as e:
            arcpy.AddWarning(f"Error al crear mosaicos: {str(e)}")
        
        # Paso 7: Calcular estadísticas zonales
        arcpy.AddMessage("Calculando estadísticas zonales...")
        
        try:
            # Estadísticas zonales para Seguridad
            arcpy.ia.ZonalStatisticsAsTable(
                in_zone_data=area_delimitacion_url,
                zone_field="gridcode",
                in_value_raster="memory/Mosaic_Seguridad",
                out_table="memory/ZonalMeanSeguridad",
                ignore_nodata="DATA",
                statistics_type="MEAN",
                process_as_multidimensional="CURRENT_SLICE",
                percentile_values=90,
                percentile_interpolation_type="AUTO_DETECT",
                circular_calculation="ARITHMETIC",
                circular_wrap_value=360,
                out_join_layer=None
            )
            
            # Estadísticas zonales para Gobernabilidad
            arcpy.ia.ZonalStatisticsAsTable(
                in_zone_data=area_delimitacion_url,
                zone_field="gridcode",
                in_value_raster="memory/Mosaic_Gobernabilidad",
                out_table="memory/ZonalMeanGobernabilidad",
                ignore_nodata="DATA",
                statistics_type="MEAN",
                process_as_multidimensional="CURRENT_SLICE",
                percentile_values=90,
                percentile_interpolation_type="AUTO_DETECT",
                circular_calculation="ARITHMETIC",
                circular_wrap_value=360,
                out_join_layer=None
            )
            
            # Estadísticas zonales para Desarrollo
            arcpy.ia.ZonalStatisticsAsTable(
                in_zone_data=area_delimitacion_url,
                zone_field="gridcode",
                in_value_raster="memory/Mosaic_Desarrollo",
                out_table="memory/ZonalMeanDesarrollo",
                ignore_nodata="DATA",
                statistics_type="MEAN",
                process_as_multidimensional="CURRENT_SLICE",
                percentile_values=90,
                percentile_interpolation_type="AUTO_DETECT",
                circular_calculation="ARITHMETIC",
                circular_wrap_value=360,
                out_join_layer=None
            )

            mean_seguridad = None
            with arcpy.da.SearchCursor("memory/ZonalMeanSeguridad", ["MEAN"]) as cursor:
                for row in cursor:
                    mean_seguridad = row[0]
                    break  # Solo tomamos el primer valor
            arcpy.AddMessage(f"Valor medio de Seguridad: {mean_seguridad}")
            
            # Para Gobernabilidad
            mean_gobernabilidad = None
            with arcpy.da.SearchCursor("memory/ZonalMeanGobernabilidad", ["MEAN"]) as cursor:
                for row in cursor:
                    mean_gobernabilidad = row[0]
                    break  # Solo tomamos el primer valor
            arcpy.AddMessage(f"Valor medio de Gobernabilidad: {mean_gobernabilidad}")
            
            # Para Desarrollo
            mean_desarrollo = None
            with arcpy.da.SearchCursor("memory/ZonalMeanDesarrollo", ["MEAN"]) as cursor:
                for row in cursor:
                    mean_desarrollo = row[0]
                    break  # Solo tomamos el primer valor
            arcpy.AddMessage(f"Valor medio de Desarrollo: {mean_desarrollo}")

        except Exception as e:
            arcpy.AddWarning(f"Error al calcular estadísticas zonales: {str(e)}")
    
        
    # Paso 8: Crear feature classes para resultados
        arcpy.AddMessage("Creando features de resultados...")
        
        # Paso 8: Crear feature classes para resultados

        try:
            # 1. Feature Class para información del proyecto
            proyecto_info_fc = "memory/Proyecto_Info"
            arcpy.management.CreateTable("memory", "Proyecto_Info")
            
            # Añadir campos (añadimos los nuevos campos)
            arcpy.AddField_management(proyecto_info_fc, "OBJECTID_Proyecto", "TEXT", field_length=10, field_alias="ID PROYECTO")
            arcpy.AddField_management(proyecto_info_fc, "UBICACION", "TEXT", field_length=200, field_alias="Ubicación")
            arcpy.AddField_management(proyecto_info_fc, "SESSION_TIMESTAMP", "TEXT", field_length=10, field_alias="Timestamp de Sesión")
            
            # Campos originales
            arcpy.AddField_management(proyecto_info_fc, "TEAM_NAME", "TEXT", field_length=50, field_alias="Nombre del Equipo")
            arcpy.AddField_management(proyecto_info_fc, "TEAM_CODE", "TEXT", field_length=20, field_alias="Código del Equipo")
            arcpy.AddField_management(proyecto_info_fc, "PROYECTO", "TEXT", field_length=100, field_alias="Nombre del Proyecto")
            arcpy.AddField_management(proyecto_info_fc, "VALORINVERSION", "DOUBLE", field_alias="Valor de Inversión")
            arcpy.AddField_management(proyecto_info_fc, "CICLO", "TEXT", field_length=20, field_alias="Ciclo")

            # Insertar datos
            with arcpy.da.InsertCursor(proyecto_info_fc, ["OBJECTID_Proyecto", "UBICACION", "SESSION_TIMESTAMP", "TEAM_NAME", "TEAM_CODE", "PROYECTO", "VALORINVERSION", "CICLO"]) as cursor:
                # Recorrer cada proyecto
                for attr in atributos:
                    cursor.insertRow([
                        attr.get("objectid"),  # OBJECTID del JSON
                        attr.get("ubicacion"),  # Ubicación del JSON
                        attr.get("sessionTimestamp"),  # Timestamp de sesión del JSON
                        attr["teamName"],
                        attr["teamCode"],
                        attr["proyecto"],
                        attr["valorinversion"],
                        "ciclo-1"  # Ciclo
                    ])

                arcpy.AddMessage("Feature Class de información de proyecto creado")
            
            # 2. Feature Class para estadísticas
            estadisticas_fc = "memory/Estadisticas_Medias"
            arcpy.management.CreateTable("memory", "Estadisticas_Medias")
                        
            # Añadir campos (añadimos los campos CICLO, INDICE y VIDA)
            arcpy.AddField_management(estadisticas_fc, "TEAM_NAME", "TEXT", field_length=50, field_alias="Nombre del Equipo")
            arcpy.AddField_management(estadisticas_fc, "TEAM_CODE", "TEXT", field_length=20, field_alias="Código del Equipo")
            arcpy.AddField_management(estadisticas_fc, "MEAN_SEGURIDAD", "DOUBLE", field_alias="Media Seguridad")
            arcpy.AddField_management(estadisticas_fc, "MEAN_GOBERNABILIDAD", "DOUBLE", field_alias="Media Gobernabilidad")
            arcpy.AddField_management(estadisticas_fc, "MEAN_DESARROLLO", "DOUBLE", field_alias="Media Desarrollo")
            arcpy.AddField_management(estadisticas_fc, "ciclo", "TEXT", field_length=20, field_alias="Ciclo")
            arcpy.AddField_management(estadisticas_fc, "INDICE", "DOUBLE", field_alias="Índice Compuesto")
            arcpy.AddField_management(estadisticas_fc, "VIDA", "DOUBLE", field_alias="Valor de Vida")

            # Insertar datos - usamos un conjunto para evitar duplicados de equipos
            team_data = set()
            for attr in atributos:
                team_data.add((attr["teamName"], attr["teamCode"]))

            with arcpy.da.InsertCursor(estadisticas_fc, ["TEAM_NAME", "TEAM_CODE", "MEAN_SEGURIDAD", "MEAN_GOBERNABILIDAD", "MEAN_DESARROLLO", "ciclo", "INDICE", "VIDA"]) as cursor:
                # Insertar una fila para cada equipo único
                for team_name, team_code in team_data:
                    # Calcular el índice compuesto (suma ponderada)
                    indice = (mean_seguridad * 0.4 + 
                            mean_gobernabilidad * 0.35 + 
                            mean_desarrollo * 0.25)
                    
                    # Calcular el valor de VIDA según la fórmula de la imagen: 68 + (85 - 68) X (Indice/100)
                    vida = 61 + (85 - 61) * (indice / 10)
                    
                    cursor.insertRow([
                        team_name,
                        team_code,
                        mean_seguridad if mean_seguridad is not None else 0,
                        mean_gobernabilidad if mean_gobernabilidad is not None else 0,
                        mean_desarrollo if mean_desarrollo is not None else 0,
                        "ciclo-1",  # Siempre agregamos "ciclo-2"
                        indice,
                        vida
                    ])

            arcpy.AddMessage("Feature Class de estadísticas medias creado con índice compuesto y valor de vida")

        except Exception as e:
            arcpy.AddError(f"Error al crear features de resultados: {str(e)}")
            import traceback
            arcpy.AddError(traceback.format_exc())

        try:
            # Append de Proyecto_Info a EquiposProyectos (con campo CICLO)
            arcpy.management.Append(
                inputs=proyecto_info_fc,
                target="https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/EquiposProyectos/FeatureServer/0",
                schema_type="NO_TEST",
                field_mapping="",
                subtype="",
                expression="",
                match_fields=""
            )
            arcpy.AddMessage("Datos de proyectos sincronizados correctamente con el servicio web")
            
            # Append de Estadisticas_Medias a EquiposIndicadores (con campo CICLO)
            arcpy.management.Append(
                inputs=estadisticas_fc,
                target="https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/EquiposIndicadores/FeatureServer/0",
                schema_type="NO_TEST",
                field_mapping="",
                subtype="",
                expression="",
                match_fields=""
            )
            arcpy.AddMessage("Datos de estadísticas sincronizados correctamente con el servicio web")
            
        except Exception as e:
            arcpy.AddWarning(f"Error al sincronizar con servicios web: {str(e)}")
            import traceback
            arcpy.AddWarning(traceback.format_exc())

 
        
    except Exception as e:
        # Capturar cualquier excepción no manejada
        arcpy.AddError(f"Error general en el proceso: {str(e)}")
        import traceback
        arcpy.AddError(traceback.format_exc())
        # Retornar valores vacíos en caso de error
        return ("", "", "", "", "")


if __name__ == "__main__":
    try:
        # Obtener parámetros
        atributos_json = arcpy.GetParameterAsText(0)
        geometrias_json = arcpy.GetParameterAsText(1)
        
        # Verificar si los parámetros están vacíos y usar valores predeterminados si es necesario
        if not atributos_json or atributos_json.isspace():
            arcpy.AddWarning("Parámetro de atributos vacío, usando valores predeterminados")
            atributos_json = '''[
              {
                "objectid": 97,
                "proyecto": "Mejoramiento infraestructura turística",
                "seguridad": 6,
                "desarrollo": 9,
                "gobernabilidad": 7,
                "valorinversion": 1400,
                "areaafectacion": 3000,
                "ubicacion": "Óptima",
                "x": -74.2179,
                "y": 11.2508,
                "teamName": "ESRI_COLOMBIA",
                "teamCode": "8914-518349",
                "sessionTimestamp": "2025-04-01T23:02:01.537Z"
              }
            ]'''
            
        if not geometrias_json or geometrias_json.isspace():
            arcpy.AddWarning("Parámetro de geometrías vacío, usando valores predeterminados")
            geometrias_json = '''[
              {
                "type": "point",
                "objectid": 97,
                "longitude": -74.21789999958588,
                "latitude": 11.250800000219428
              }
            ]'''
        
        arcpy.AddMessage(f"Parámetro 0 recibido (longitud: {len(atributos_json)})")
        arcpy.AddMessage(f"Parámetro 1 recibido (longitud: {len(geometrias_json)})")

        # Ejecutar el proceso
        resultados = script_tool(atributos_json, geometrias_json)

        arcpy.AddMessage("Proceso completado con éxito")

        # Retornar directamente las rutas de los mosaicos en memoria
        arcpy.SetParameterAsText(2, "memory/Proyecto_Info")
        arcpy.SetParameterAsText(3, "memory/Estadisticas_Medias")

        
    except Exception as e:
        arcpy.AddError(f"Error en la ejecución principal: {str(e)}")
        import traceback
        arcpy.AddError(traceback.format_exc())