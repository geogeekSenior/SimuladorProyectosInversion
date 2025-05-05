/**
 * script.js - Lógica principal para HORIZONTE 2.0
 * Simulador de Inversiones Estratégicas - Con modo lighten y pesos actualizados
 */

// URLs de servicios (las que proporcionaste)
const serviceURLs = {
    // SERVICIOS DIMENSIÓN SEGURIDAD (19 URLs)
    seguridad: [
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Violencia_Homicidios/ImageServer", // Homicidios
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Violencia_HomicidiosTransito/ImageServer", // Homicidios por accidente de tránsito
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Violencia_Lesiones/ImageServer", // Lesiones Personales
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Violencia_LesionesTransito/ImageServer", // Lesiones por accidentes de tránsito
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Economia_Incautacion_Cocaina/ImageServer", // Incautación Cocaína
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Economia_Incautacion_Base_Coca/ImageServer", // Incautación Base de Coca
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Economia_Incautacion_Basuco/ImageServer", // Incautación Basuco
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Economia_Incautacion_Armas/ImageServer", // Incautación de armas de fuego
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Economia_Minas_Antipersona/ImageServer", // Minas Antipersona
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Economia_Mineria_Intervenida/ImageServer", // Minas Intervenidas
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Economia_Capturas_Mineria/ImageServer", // Capturas en minería ilegal
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Economia_Grupos_Armados_Guerrilla/ImageServer", // Grupos armados organizados
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Economia_Presencia_Ejercito/ImageServer", // Presencia de áreas base
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Criminalidad_Delitos_Sexuales/ImageServer", // Delitos Sexuales
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Criminalidad_Extorsion/ImageServer", // Extorsión y secuestro
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Criminalidad_Estaciones_Policia/ImageServer", // Estaciones de policia
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Criminalidad_Abiegato/ImageServer", // Abigeato
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Factores_MigrantesIrregulares/ImageServer", // Migración irregular y tráfico de migrantes
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Seguridad_Factores_AtentadosSIEVCAC/ImageServer" // Violencia terrorista (atentados)
    ],

    // SERVICIOS DIMENSIÓN DESARROLLO (13 URLs)
    desarrollo: [
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Infraestructura_Acueducto/ImageServer", // Acueducto y Alcantarillado
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Infraestructura_Energia/ImageServer", // Energía Eléctrica
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Infraestructura_Gas/ImageServer", // Gas
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Infraestructura_Internet/ImageServer", // Internet
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Riesgo_Deslizamiento/ImageServer", // Amenaza por Deslizamiento de tierras
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Riesgo_Hidrologica/ImageServer", // Alertas por Amenazas Hidrológicas
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Riesgo_Incendios/ImageServer", // Alertas por incendios Vegetales
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Humano_Alfabetismo/ImageServer", // Alfabetismo
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Humano_Educacion/ImageServer", // Nivel de Educación
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Humano_BajoPeso/ImageServer", // Bajo peso al nacer
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Humano_Desnutricion/ImageServer", // Desnutrición aguda
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Factores_Desempleo/ImageServer", // Tasa de Ocupación
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Desarrollo_Factores_IPM/ImageServer" // IPM - Pobreza Multidimensional
    ],

    // SERVICIOS DIMENSIÓN GOBERNABILIDAD (8 URLs)
    gobernabilidad: [
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Gobernabilidad_Infraestructura_Salud/ImageServer", // Instituciones de Salud
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Gobernabilidad_Infraestructura_Educacion/ImageServer", // Instituciones Educativas
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Gobernabilidad_Territorio_Censo/ImageServer", // Censo Poblacional
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Gobernabilidad_Territorio_Comunidades/ImageServer", // Comunidades Negras
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Gobernabilidad_Territorio_Indigenas/ImageServer", // Reservas Indígenas
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Gobernabilidad_Territorio_Protegidas/ImageServer", // Áreas Protegidas
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Gobernabilidad_Planeacion_Turistico/ImageServer", // Desarrollo turístico (prestadores servicios formales)
        "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Transformed_Gobernabilidad_Planeacion_Hoteles/ImageServer" // Hoteles
    ]
};

// Matriz de pesos para las variables por dimensión (ACTUALIZADA SEGÚN IMAGEN)
const weightsMatrix = {
   seguridad: {
       'Homicidios': 0.15,
       'Homicidios por accidente de tránsito': 0.05,
       'Lesiones Personales': 0.05,
       'Lesiones por accidentes de tránsito': 0.05,
       'Incautación Cocaína': 0.04,
       'Incautación Base de Coca': 0.04,
       'Incautación Basuco': 0.02,
       'Incautación de armas de fuego': 0.03,
       'Minas Antipersona': 0.03,
       'Minas Intervenidas': 0.03,
       'Capturas en minería ilegal': 0.02,
       'Grupos armados organizados': 0.05,
       'Presencia de áreas base': 0.04,
       'Delitos Sexuales': 0.08,
       'Extorsión y secuestro': 0.10,
       'Estaciones de policia': 0.05,
       'Abigeato': 0.02,
       'Migración irregular y tráfico de migrantes': 0.05,
       'Violencia terrorista (atentados)': 0.10
   },
   desarrollo: {
       'Acueducto y Alcantarillado': 0.05,
       'Energía Eléctrica': 0.13,
       'Gas': 0.09,
       'Internet': 0.03,
       'Amenaza por Deslizamiento de tierras': 0.08,
       'Alertas por Amenazas Hidrológicas': 0.05,
       'Alertas por incendios Vegetales': 0.07,
       'Alfabetismo': 0.10,
       'Nivel de Educación': 0.07,
       'Bajo peso al nacer': 0.15,
       'Desnutrición aguda': 0.03,
       'Tasa de Ocupación': 0.05,
       'IPM - Pobreza Multidimensional': 0.10
   },
   gobernabilidad: {
       'Instituciones de Salud': 0.15,
       'Instituciones Educativas': 0.15,
       'Censo Poblacional': 0.15,
       'Comunidades Negras': 0.10,
       'Reservas Indígenas': 0.10,
       'Áreas Protegidas': 0.05,
       'Desarrollo turístico (prestadores servicios formales)': 0.15,
       'Hoteles': 0.10
   }
};


// Pesos globales para cada dimensión (Estos se mantienen)
const dimensionWeights = {
   seguridad: 0.40,
   desarrollo: 0.25,
   gobernabilidad: 0.35
};

// --- EL RESTO DEL CÓDIGO DE script.js PERMANECE IGUAL ---
// --- EXCEPTO LA PARTE DE loadLayers DONDE SE MAPEAN LOS NOMBRES ---

// Función para actualizar la fecha y hora
function updateDateTime() {
   const now = new Date();
   const options = {
       year: 'numeric',
       month: '2-digit',
       day: '2-digit',
       hour: '2-digit',
       minute: '2-digit',
       hour12: false
   };
   document.getElementById('currentDate').textContent = now.toLocaleString('es-ES', options).replace(',', ' / ');
}

// Función para mostrar mensajes de estado
function showStatus(message, type = 'info') {
   const statusLog = document.getElementById('statusLog');
   statusLog.textContent = message;
   statusLog.className = type + ' visible';

   // Registrar también en consola para depuración
   console.log(`[${type.toUpperCase()}] ${message}`);

   // Ocultar automáticamente después de 5 segundos excepto si es error
   if (type !== 'error') {
       setTimeout(() => {
           statusLog.classList.remove('visible');
       }, 5000);
   }
}

// Mostrar/ocultar indicador de carga
function toggleLoading(show) {
   document.getElementById('loadingIndicator').style.display = show ? 'flex' : 'none';
}

// Inicializar el mapa de ArcGIS cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
   // Actualizar fecha ahora y cada minuto
   updateDateTime();
   setInterval(updateDateTime, 60000);

   // Mostrar mensaje inicial
   showStatus('Sistema HORIZONTE 2.0 inicializado', 'info');

   require([
       "esri/Map",
       "esri/views/MapView",
       "esri/layers/ImageryLayer",
       "esri/renderers/RasterStretchRenderer",
       "esri/Color"
   ], function(Map, MapView, ImageryLayer, RasterStretchRenderer, Color) {
       // Crear mapa base
       const map = new Map({
           basemap: "dark-gray-vector"
       });

       // Crear vista del mapa
       const view = new MapView({
           container: "viewDiv",
           map: map,
           center: [-73.198537, 10.809386], // Colombia
           zoom: 7,
           ui: {
               components: ["zoom", "compass", "attribution"] // Solo componentes esenciales
           }
       });

       // Mapa para rastrear las capas por nombre de variable
       let layerByVariable = {
           seguridad: {},
           desarrollo: {},
           gobernabilidad: {}
       };

       // Función para crear un renderizador para valores (rojo a verde)
       function createRenderer() {
        // *** AJUSTE: Usar el rango 1-10 de tus datos originales ***
        const minValue = 1;
        const maxValue = 10;

        return new RasterStretchRenderer({
            stretchType: "min-max",
            // Usa el rango real de tus datos de entrada
            minInput: minValue,
            maxInput: maxValue,
            // Puedes ajustar min y max (opcional) si quieres cortar valores extremos
            // min: minValue,
            // max: maxValue,
            colorRamp: {
                type: "multipart",
                colorRamps: [{
                    type: "algorithmic",
                    fromColor: new Color([255, 0, 0]), // Rojo (valor menor = 1)
                    toColor: new Color([255, 255, 0]), // Amarillo
                    algorithm: "linear"
                }, {
                    type: "algorithmic",
                    fromColor: new Color([255, 255, 0]), // Amarillo
                    toColor: new Color([0, 255, 0]), // Verde (valor mayor = 10)
                    algorithm: "linear"
                }]
            }
            // Opcionalmente, define un NoData value si aplica a tus capas
            // noDataValue: [0], // Ejemplo si 0 es NoData
        });
    }

       // Array para almacenar capas cargadas
       let loadedLayers = [];

       // Función para cargar las capas desde los servicios configurados
       function loadLayers() {
           toggleLoading(true);
           showStatus('Cargando capas desde servicios preconfigurados...', 'info');

           // Primero, eliminar capas existentes si hay
           if (loadedLayers.length > 0) {
               loadedLayers.forEach(layer => {
                   map.remove(layer);
               });
           }

           // Arrays para rastrear capas y contadores
           loadedLayers = [];
           layerByVariable = {
               seguridad: {},
               desarrollo: {},
               gobernabilidad: {}
           };

           let loadedCount = 0;
           let errorCount = 0;
           const totalLayers =
               serviceURLs.seguridad.length +
               serviceURLs.desarrollo.length +
               serviceURLs.gobernabilidad.length;

           // Función para crear y cargar una capa
           function loadLayer(url, dimensionName, variableName, weight) {
               // Verificar que la URL no esté vacía
               if (!url || !url.trim()) {
                   console.error(`URL vacía para ${dimensionName}: ${variableName}`);
                   errorCount++;
                   if (loadedCount + errorCount === totalLayers) {
                       finishLoading();
                   }
                   return;
               }

               try {
                   // Crear la capa de imagen
                   const layer = new ImageryLayer({
                       url: url,
                       title: `${dimensionName}: ${variableName}`,
                       visible: false,          // Comienza invisible
                       opacity: 0.7,            // Opacidad base
                       format: "png",           // Usar PNG para transparencia
                       renderer: createRenderer()
                   });

                   // Almacenar metadatos adicionales en la capa
                   layer.dimensionName = dimensionName.toLowerCase();
                   layer.variableName = variableName;
                   layer.weight = weight;  // Peso individual de la variable

                   // Aplicar el peso de la dimensión
                   const dimensionWeight = dimensionWeights[dimensionName.toLowerCase()] || 1.0;
                   layer.dimensionWeight = dimensionWeight;

                   // Cálculo del peso combinado
                   layer.combinedWeight = weight * dimensionWeight;

                   // Guardar referencia a la capa en el mapa por variable
                   if (dimensionName.toLowerCase() === "seguridad") {
                       layerByVariable.seguridad[variableName] = layer;
                   } else if (dimensionName.toLowerCase() === "desarrollo") {
                       layerByVariable.desarrollo[variableName] = layer;
                   } else if (dimensionName.toLowerCase() === "gobernabilidad") {
                       layerByVariable.gobernabilidad[variableName] = layer;
                   }

                   // Añadir manejador para errores de renderizado
                   layer.on("error", function(error) {
                       console.warn(`Error en capa ${variableName}:`, error);
                   });

                   // Mostrar progreso
                   layer.load().then(() => {
                       // Añadir la capa al mapa solo si se cargó correctamente
                       map.add(layer);
                       loadedLayers.push(layer);

                       loadedCount++;
                       // Solo actualizar en consola el progreso
                       console.log(`Cargando capa ${loadedCount} de ${totalLayers}...`);

                       // Cuando todas las capas están cargadas
                       if (loadedCount + errorCount === totalLayers) {
                           finishLoading();
                       }
                   }).catch(error => {
                       console.error(`Error al cargar capa ${variableName} desde ${url}:`, error);
                       errorCount++;

                       // Incluso con errores, continuar cuando todas las capas se hayan procesado
                       if (loadedCount + errorCount === totalLayers) {
                           finishLoading();
                       }
                   });
               } catch (error) {
                   console.error(`Error al crear capa ${variableName} desde ${url}:`, error);
                   errorCount++;
                   if (loadedCount + errorCount === totalLayers) {
                       finishLoading();
                   }
               }
           }

           // Función para finalizar la carga
           function finishLoading() {
               toggleLoading(false);

               if (errorCount > 0) {
                   showStatus(`Carga completada con ${errorCount} errores. ${loadedCount} capas cargadas correctamente.`, 'warning');
               } else if (loadedCount === 0) {
                   showStatus(`No se pudo cargar ninguna capa. Verifica la conexión al servidor.`, 'error');
               } else {
                   showStatus(`${loadedCount} capas cargadas exitosamente.`, 'success');
               }

               // Activar las capas iniciales basadas en los checkboxes marcados
               if (loadedLayers.length > 0) {
                   // Almacenar las capas cargadas para uso posterior
                   window.horizonte = window.horizonte || {};
                   window.horizonte.layers = loadedLayers;
                   window.horizonte.layerByVariable = layerByVariable;

                   // Aplicar pesos inmediatamente después de cargar
                   applyWeightsToLayers();

                   // Disparar evento para que layer-connections.js configure las conexiones
                   window.dispatchEvent(new CustomEvent('horizonte:layersLoaded'));
               }
           }

           // *** MAPEO ACTUALIZADO ***
           // Obtener los nombres de las variables directamente de las claves de weightsMatrix
           // Asegura que el orden de carga coincida con el orden de las URLs
           const dimensionVariableNames = {
               seguridad: Object.keys(weightsMatrix.seguridad),
               desarrollo: Object.keys(weightsMatrix.desarrollo),
               gobernabilidad: Object.keys(weightsMatrix.gobernabilidad)
           };

           // Cargar capas de seguridad
           serviceURLs.seguridad.forEach((url, index) => {
               if (index < dimensionVariableNames.seguridad.length) {
                   const varName = dimensionVariableNames.seguridad[index];
                   loadLayer(
                       url,
                       "Seguridad",
                       varName,
                       weightsMatrix.seguridad[varName]
                   );
               } else {
                   console.warn(`URL extra en seguridad[${index}]: ${url}. No hay variable correspondiente.`);
                   errorCount++; // Contar como error si hay URL sin variable
               }
           });

           // Cargar capas de desarrollo
           serviceURLs.desarrollo.forEach((url, index) => {
               if (index < dimensionVariableNames.desarrollo.length) {
                   const varName = dimensionVariableNames.desarrollo[index];
                   loadLayer(
                       url,
                       "Desarrollo",
                       varName,
                       weightsMatrix.desarrollo[varName]
                   );
               } else {
                    console.warn(`URL extra en desarrollo[${index}]: ${url}. No hay variable correspondiente.`);
                    errorCount++;
               }
           });

           // Cargar capas de gobernabilidad
           serviceURLs.gobernabilidad.forEach((url, index) => {
               if (index < dimensionVariableNames.gobernabilidad.length) {
                   const varName = dimensionVariableNames.gobernabilidad[index];
                   loadLayer(
                       url,
                       "Gobernabilidad",
                       varName,
                       weightsMatrix.gobernabilidad[varName]
                   );
               } else {
                   console.warn(`URL extra en gobernabilidad[${index}]: ${url}. No hay variable correspondiente.`);
                   errorCount++;
               }
           });

            // Si todos los procesamientos (correctos o con error) han terminado y no se llamó a finishLoading antes
            if (loadedCount + errorCount === totalLayers && !document.getElementById('loadingIndicator').style.display !== 'none') {
                finishLoading();
            }
       }

       // Función para aplicar pesos a las capas basados en los checkboxes seleccionados
       function applyWeightsToLayers() {
           // Verificar si las capas están cargadas
           if (!window.horizonte || !window.horizonte.layers || window.horizonte.layers.length === 0) {
               console.warn('No hay capas cargadas aún. Espere mientras se cargan las capas...');
               return;
           }

           console.log("Aplicando pesos a las capas...");

           // Recopilar los checkboxes activos para cada dimensión
           const activeVariables = {
               seguridad: [],
               desarrollo: [],
               gobernabilidad: []
           };

           // Obtener todas las dimensiones y sus checkboxes activos
           ['seguridad', 'desarrollo', 'gobernabilidad'].forEach(dimensionId => {
               const variableCheckboxes = document.querySelectorAll(`.${dimensionId}-variable`);
                variableCheckboxes.forEach(checkbox => {
                   if (!checkbox.nextElementSibling) return; // Seguridad
                   const variableName = checkbox.nextElementSibling.textContent.trim();
                   if (checkbox.checked) {
                       activeVariables[dimensionId].push(variableName);
                   }
               });
           });


           console.log("Variables activas:", activeVariables);

           // Calcular el peso total por dimensión y el peso total general
           const totalWeightByDimension = {};
           let totalCombinedWeight = 0;

           for (const dimension in activeVariables) {
               totalWeightByDimension[dimension] = 0;
               activeVariables[dimension].forEach(varName => {
                   // Asegurarse que la variable exista en la matriz de pesos
                   if (weightsMatrix[dimension] && weightsMatrix[dimension][varName] !== undefined) {
                       const variableWeight = weightsMatrix[dimension][varName];
                       const dimensionWeight = dimensionWeights[dimension] || 1.0;
                       const combinedWeight = variableWeight * dimensionWeight;

                       totalWeightByDimension[dimension] += variableWeight; // Suma pesos relativos a la dimensión
                       totalCombinedWeight += combinedWeight; // Suma pesos combinados
                   } else {
                        console.warn(`Variable activa "${varName}" en dimensión "${dimension}" no encontrada en weightsMatrix.`);
                   }
               });
           }

           console.log("Peso total relativo por dimensión:", totalWeightByDimension);
           console.log("Peso combinado total:", totalCombinedWeight);

           // Primero, ocultar todas las capas (más eficiente que iterar para ocultar)
           // map.layers.forEach(layer => {
           //     if(layer.declaredClass === "esri.layers.ImageryLayer") { // Asegurar que solo afectamos las capas de imagen
           //         layer.visible = false;
           //     }
           // });
           // Alternativa más segura usando nuestro array:
            if (window.horizonte && window.horizonte.layers) {
                window.horizonte.layers.forEach(layer => layer.visible = false);
            }


           // Contador para el orden visual
           let activeLayerCount = 0;

           // Inicializar arrays para construir un log detallado
           const activeLayersLog = [];

           // Recopilar todas las capas activas para ordenarlas por peso
           const processLayers = [];

           for (const dimensionName in layerByVariable) {
               for (const varName in layerByVariable[dimensionName]) {
                   const layer = layerByVariable[dimensionName][varName];
                   if (!layer) continue;

                   // Verificar si está activa
                   const isActive = activeVariables[dimensionName].includes(varName);
                   if (!isActive) continue;

                    // Asegurarse que la variable exista en la matriz de pesos antes de procesar
                   if (weightsMatrix[dimensionName] && weightsMatrix[dimensionName][varName] !== undefined) {
                       // Calcular peso ajustado
                       const variableWeight = weightsMatrix[dimensionName][varName];
                       const dimensionWeight = dimensionWeights[dimensionName] || 1.0;
                       const combinedWeight = variableWeight * dimensionWeight;
                       const normalizedWeight = totalCombinedWeight > 0 ? combinedWeight / totalCombinedWeight : 0;

                       // Añadir al array para procesamiento
                       processLayers.push({
                           layer: layer,
                           dimensionName: dimensionName,
                           variableName: varName,
                           variableWeight: variableWeight,
                           dimensionWeight: dimensionWeight,
                           combinedWeight: combinedWeight,
                           normalizedWeight: normalizedWeight
                       });
                   }
               }
           }

           // Ordenar capas por peso combinado (de mayor a menor)
           processLayers.sort((a, b) => b.combinedWeight - a.combinedWeight);

           // Ahora procesar las capas en orden de peso
           processLayers.forEach((layerInfo, index) => {
               const { layer, dimensionName, variableName, variableWeight, dimensionWeight,
                     combinedWeight, normalizedWeight } = layerInfo;

               // Activar la capa
               layer.visible = true;
               activeLayerCount++;

               // Calcular la opacidad basada en el peso normalizado
               // Usar un rango de opacidad de 0.3 a 0.7 para evitar que sea demasiado transparente o demasiado opaca
               const minOpacity = 0.3;
               const maxOpacity = 0.7;
               const opacityRange = maxOpacity - minOpacity;
               // Ajuste para que la capa con más peso tenga más opacidad
               const calculatedOpacity = minOpacity + (normalizedWeight * opacityRange);

               // Limitar la opacidad a valores razonables
               layer.opacity = Math.min(maxOpacity, Math.max(minOpacity, calculatedOpacity));

               // Asignar modo "lighten" a todas las capas como solicitado
               layer.blendMode = "lighten";

               // Especificar el orden de renderizado para que las capas más importantes estén más arriba
               // Cuanto mayor sea el índice, más arriba estará en la pila de visualización
               // El índice 0 (la capa más pesada) debe estar arriba. map.reorder(layer, map.layers.length - 1 - index) podría ser más robusto.
               // O simplemente usar el index directamente si se añaden secuencialmente.
               map.reorder(layer, index); // El índice 0 (más pesado) se renderiza último (más arriba)

               // Registrar para análisis
               activeLayersLog.push({
                   dimensión: dimensionName,
                   variable: variableName,
                   peso: variableWeight.toFixed(3),
                   pesoDimensión: dimensionWeight.toFixed(2),
                   pesoCombinado: combinedWeight.toFixed(3),
                   pesoNormalizado: normalizedWeight.toFixed(3),
                   opacidad: layer.opacity.toFixed(2),
                   modo: layer.blendMode,
                   orden: index // Orden visual (0 = arriba)
               });

               // Registrar en la consola
               console.log(`Capa ${dimensionName}:${variableName} - Opacidad: ${layer.opacity.toFixed(2)}, Modo: ${layer.blendMode} (Peso Comb: ${combinedWeight.toFixed(3)}, Orden: ${index})`);
           });

           // Mostrar tabla resumen de capas activas
           console.table(activeLayersLog);
           console.log(`Visualización actualizada: ${activeLayerCount} capas activas (Peso total combinado: ${totalCombinedWeight.toFixed(3)})`);
       }

       // Añadir event listeners para los checkboxes en el panel de control
       document.addEventListener('calciteCheckboxChange', function(event) {
           // Verificar si el cambio fue en un checkbox de variable o de dimensión
           if (event.target && (event.target.classList.contains('variable-checkbox') || event.target.classList.contains('dimension-checkbox'))) {
               // Aplicar pesos automáticamente cuando cambia un checkbox relevante
               console.log("Checkbox changed, applying weights:", event.target.id);
               applyWeightsToLayers();
           }
       });

       // Exponer la función toggleDimensionLayers para que se pueda usar desde otros scripts
       window.toggleDimensionLayers = function(dimensionName, isChecked) {
           if (!window.horizonte || !window.horizonte.layerByVariable) return;

           const dimensionLayersMap = window.horizonte.layerByVariable[dimensionName.toLowerCase()];
           if (!dimensionLayersMap) return;

           for (const varName in dimensionLayersMap) {
                const layer = dimensionLayersMap[varName];
                if (layer) {
                   // La visibilidad ya se maneja por los checkboxes individuales y su evento
                   // Este manejador de grupo sólo necesita gatillar la recalculación de pesos
                }
            }

           // Aplicar los pesos para actualizar todo correctamente
            // applyWeightsToLayers(); // Esto ya se llama desde el evento 'calciteCheckboxChange' que se dispara programáticamente en index.html
       };

       // Manejador para el botón de reinicio
       document.getElementById('resetBtn').addEventListener('click', function() {
           showStatus('Reiniciando sistema...', 'warning');

           // Recargar la página después de un segundo
           setTimeout(() => {
               location.reload();
           }, 1000);
       });

       // Cargar capas automáticamente al inicio
       setTimeout(() => {
           loadLayers();
       }, 1000); // Dar tiempo a que el DOM y Calcite se estabilicen

       // Inicialización completada
       view.when(() => {
           showStatus('Vista del mapa inicializada. Sistema operativo.', 'success');
       }).catch(error => {
            console.error("Error inicializando la vista del mapa:", error);
            showStatus('Error al inicializar la vista del mapa.', 'error');
       });
   });
});