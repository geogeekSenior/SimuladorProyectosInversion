/**
 * script.js - Lógica principal para HORIZONTE 2.0
 * Simulador de Inversiones Estratégicas - Con modo lighten y pesos actualizados
 */

// URLs de servicios
/**
const serviceURLs = {
     // SERVICIOS DIMENSIÓN SEGURIDAD
     seguridad: [
        "https://arcgis.esri.co/image/rest/services/TransformedHomicidiosRaster/ImageServer",
        "https://arcgis.esri.co/image/rest/services/DEX/TransformedLesionesPersonalesRaster/ImageServer",
        "https://arcgis.esri.co/image/rest/services/DEX/TransformedTerrorismoRaster/ImageServer",
        "https://arcgis.esri.co/image/rest/services/DEX/TransformedExtorsionRaster/ImageServer", 
        "https://arcgis.esri.co/image/rest/services/DEX/TransformedDelitosSexualesRaster/ImageServer",
        "https://arcgis.esri.co/image/rest/services/DEX/TransformedMinasR22/ImageServer",
        "https://arcgis.esri.co/image/rest/services/DEX/TransformedEstacionPoliciaR22/ImageServer",
        "https://arcgis.esri.co/image/rest/services/DEX/TransformedCultivosilicitosRaster/ImageServer",
        "https://arcgis.esri.co/image/rest/services/DEX/TransformedDrogaRaster/ImageServer"
     ],
        
     // SERVICIOS DIMENSIÓN DESARROLLO
     desarrollo: [
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedAcueductoSI/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedEnergiaElectrica/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedAlfabetismo/ImageServer",
         "https://arcgis.esri.co/image/rest/services/TransformedNivelEducaci%C3%B3n/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedTasaDesnutricionAguda/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedDesempleo/ImageServer",
         "https://arcgis.esri.co/image/rest/services/TransformedInternet/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedGas/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedBajoPesoAlNacer/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedHotelesHosteles/ImageServer"
     ],
        
     // SERVICIOS DIMENSIÓN GOBERNABILIDAD
     gobernabilidad: [
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedInstitucionesSalud/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedColegios/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedCensoPersonasSectores/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedComunidadesNegras/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedTerritoriosIndigenas/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedAreasProtegidas/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/AreaInteres1/ImageServer",
         "https://arcgis.esri.co/image/rest/services/DEX/TransformedDesarrolloTur/ImageServer"
     ]
 };
 */
const serviceURLs = {
     // SERVICIOS DIMENSIÓN SEGURIDAD
     seguridad: [
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedHomicidiosRaster/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedLesionesPersonalesRaster/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedTerrorismoRaster/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedExtorsionRaster/ImageServer", 
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedDelitosSexualesRaster/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedMinasR22/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedEstacionPoliciaR22/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedCultivosilicitosRaster/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedDrogaRaster/ImageServer"
     ],
        
     // SERVICIOS DIMENSIÓN DESARROLLO
     desarrollo: [
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedAcueductoSI/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedEnergiaElectrica/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedAlfabetismo/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedNivelEducaci%C3%B3n/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedTasaDesnutricionAguda/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedDesempleo/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedInternet/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedGas/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedBajoPesoAlNacer/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedHotelesHosteles/ImageServer"
     ],
        
     // SERVICIOS DIMENSIÓN GOBERNABILIDAD
     gobernabilidad: [
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedInstitucionesSalud/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedColegios/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedCensoPersonasSectores/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedComunidadesNegras/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedTerritoriosIndigenas/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedAreasProtegidas/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/AreaInteres1/ImageServer",
         "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/TransformedDesarrolloTuristico/ImageServer"
     ]
 };

// Matriz de pesos para las variables por dimensión
const weightsMatrix = {
    seguridad: {
        'Homicidios': 0.2,
        'Lesiones personales': 0.1,
        'Terrorismo': 0.1,
        'Extorsión': 0.1,
        'Delitos sexuales': 0.1,
        'Minas antipersona': 0.1,
        'Estaciones de Policía': 0.1,
        'Cultivos ilícitos': 0.1,
        'Narcotráfico (proximidad a puerto)': 0.05
    },
    desarrollo: {
        'Acueducto y Alcantarillado': 0.05,
        'Energía Eléctrica': 0.04,
        'Alfabetismo': 0.04,
        'Nivel de Educación': 0.04,
        'Desnutrición aguda': 0.03,
        'Tasa de ocupación': 0.03,
        'Internet': 0.01,
        'Gas': 0.01,
        'Bajo peso al nacer': 0.01,
        'Cantidad de hoteles': 0.01
    },
    gobernabilidad: {
        'Instituciones de salud': 0.09,
        'Instituciones educativas': 0.07,
        'Censo': 0.05,
        'Comunidades étnicas': 0.04,
        'Reservas indígenas': 0.04,
        'Áreas protegidas': 0.04,
        'Límites administrativos': 0.02,
        'Desarrollo Turístico': 0.01750
    }
};

// Pesos globales para cada dimensión
const dimensionWeights = {
    seguridad: 0.40,
    desarrollo: 0.25,
    gobernabilidad: 0.35
};

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
            return new RasterStretchRenderer({
                stretchType: "min-max",
                minInput: 0,
                maxInput: 255,
                colorRamp: {
                    type: "multipart",
                    colorRamps: [{
                        type: "algorithmic",
                        fromColor: new Color([255, 0, 0]), // Rojo (valor menor)
                        toColor: new Color([255, 255, 0]), // Amarillo
                        algorithm: "linear"
                    }, {
                        type: "algorithmic",
                        fromColor: new Color([255, 255, 0]), // Amarillo
                        toColor: new Color([0, 255, 0]), // Verde (valor mayor)
                        algorithm: "linear"
                    }]
                }
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
            
            // Variables para mapear nombres a índices
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
                }
            });
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
            
            // Obtener todas las dimensiones
            const dimensionContainers = document.querySelectorAll('.dimension-container');
            
            // Para cada dimensión, verificar sus variables activas
            dimensionContainers.forEach((container, dimensionIndex) => {
                // Determinar a qué dimensión pertenece
                let dimensionName;
                if (dimensionIndex === 0) {
                    dimensionName = "seguridad";
                } else if (dimensionIndex === 1) {
                    dimensionName = "desarrollo";
                } else if (dimensionIndex === 2) {
                    dimensionName = "gobernabilidad";
                } else {
                    return; // No es una dimensión con variables
                }
                
                // Buscar checkboxes dentro de esta dimensión
                const checkboxes = container.querySelectorAll('.variable-checkbox');
                checkboxes.forEach(checkbox => {
                    if (!checkbox.nextElementSibling) return; // Seguridad
                    const variableName = checkbox.nextElementSibling.textContent.trim();
                    
                    // Si está marcado, añadir a variables activas
                    if (checkbox.checked) {
                        activeVariables[dimensionName].push(variableName);
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
                    const variableWeight = weightsMatrix[dimension][varName] || 0;
                    const dimensionWeight = dimensionWeights[dimension] || 1.0;
                    const combinedWeight = variableWeight * dimensionWeight;
                    
                    totalWeightByDimension[dimension] += variableWeight;
                    totalCombinedWeight += combinedWeight;
                });
            }
            
            console.log("Peso total por dimensión:", totalWeightByDimension);
            console.log("Peso combinado total:", totalCombinedWeight);
            
            // Primero, ocultar todas las capas
            window.horizonte.layers.forEach(layer => {
                layer.visible = false;
            });
            
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
                    
                    // Calcular peso ajustado
                    const variableWeight = weightsMatrix[dimensionName][varName] || 0;
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
                const calculatedOpacity = minOpacity + (normalizedWeight * opacityRange * 2); // Multiplicador para aumentar el efecto
                
                // Limitar la opacidad a valores razonables
                layer.opacity = Math.min(maxOpacity, Math.max(minOpacity, calculatedOpacity));
                
                // Asignar modo "lighten" a todas las capas como solicitado
                layer.blendMode = "lighten";
                
                // Especificar el orden de renderizado para que las capas más importantes estén más arriba
                // Cuanto mayor sea el índice, más arriba estará en la pila de visualización
                map.reorder(layer, index);
                
                // Registrar para análisis
                activeLayersLog.push({
                    dimensión: dimensionName,
                    variable: variableName,
                    peso: variableWeight.toFixed(3),
                    pesoDimensión: dimensionWeight.toFixed(2),
                    pesoCombinado: combinedWeight.toFixed(3),
                    pesoNormalizado: normalizedWeight.toFixed(3),
                    opacidad: layer.opacity.toFixed(2),
                    modo: layer.blendMode
                });
                
                // Registrar en la consola
                console.log(`Capa ${dimensionName}:${variableName} - Opacidad: ${layer.opacity.toFixed(2)}, Modo: ${layer.blendMode} (Peso: ${variableWeight.toFixed(2)})`);
            });
            
            // Mostrar tabla resumen de capas activas
            console.table(activeLayersLog);
            console.log(`Visualización actualizada: ${activeLayerCount} capas activas (Peso total: ${totalCombinedWeight.toFixed(2)})`);
        }
        
        // Añadir event listeners para los checkboxes en el panel de control
        document.addEventListener('calciteCheckboxChange', function(event) {
            // Verificar si el cambio fue en un checkbox de variable
            if (event.target && event.target.classList.contains('variable-checkbox')) {
                // Aplicar pesos automáticamente cuando cambia un checkbox
                console.log("Checkbox changed:", event.target);
                applyWeightsToLayers();
            }
        });
        
        // Exponer la función toggleDimensionLayers para que se pueda usar desde otros scripts
        window.toggleDimensionLayers = function(dimensionName, isChecked) {
            if (!window.horizonte || !window.horizonte.layerByVariable) return;
            
            const dimensionLayers = window.horizonte.layerByVariable[dimensionName.toLowerCase()];
            for (const varName in dimensionLayers) {
                const layer = dimensionLayers[varName];
                if (layer) {
                    // Solo actualizamos la visibilidad, applyWeightsToLayers manejará el resto
                    layer.visible = isChecked;
                }
            }
            
            // Aplicar los pesos para actualizar todo correctamente
            applyWeightsToLayers();
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
        }, 1000);
        
        // Inicialización completada
        view.when(() => {
            showStatus('Vista del mapa inicializada. Sistema operativo.', 'success');
        });
    });
});