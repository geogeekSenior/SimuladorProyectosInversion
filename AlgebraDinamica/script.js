/**
 * script.js - Lógica principal para HORIZONTE 2.0
 * Simulador de Inversiones Estratégicas - Con RasterFunction y servicio único
 */

// URLs del servicio de imagen (principal y respaldo)
const imageServiceURLs = {
    primary: "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Dimensiones_Scaled/ImageServer",
    fallback: "https://arcgis.esri.co/image/rest/services/DEX/Dimensiones_Scaled/ImageServer"
};

let currentImageServiceURL = null;

// Mapeo de variables a bandas y sus pesos GLOBALES (ya normalizados)
// Basado en el array de pesos del ejemplo: índices 0-39 corresponden a bandas 1-40
const bandasConfig = {
    desarrollo: {
        'Tasa de Ocupación': { banda: 1, peso: 0.0375 },                         // índice 0
        'IPM - Pobreza Multidimensional': { banda: 2, peso: 0.025 },            // índice 1
        'Alfabetismo': { banda: 3, peso: 0.025 },                               // índice 2
        'Bajo peso al nacer': { banda: 4, peso: 0.0375 },                       // índice 3
        'Desnutrición aguda': { banda: 5, peso: 0.0075 },                       // índice 4
        'Nivel de Educación': { banda: 6, peso: 0.0175 },                       // índice 5
        'Acueducto y Alcantarillado': { banda: 7, peso: 0.0225 },               // índice 6
        'Energía Eléctrica': { banda: 8, peso: 0.0375 },                        // índice 7
        'Gas': { banda: 9, peso: 0.0075 },                                      // índice 8
        'Internet': { banda: 10, peso: 0.0075 },                                // índice 9
        'Amenaza por Deslizamiento de tierras': { banda: 11, peso: 0.02 },      // índice 10
        'Alertas por Amenazas Hidrológicas': { banda: 12, peso: 0.0125 },       // índice 11
        'Alertas por incendios Vegetales': { banda: 13, peso: 0.0175 }          // índice 12
    },
    gobernabilidad: {
        'Instituciones Educativas': { banda: 14, peso: 0.045 },                 // índice 13
        'Instituciones de Salud': { banda: 15, peso: 0.06 },                    // índice 14
        'Hoteles': { banda: 16, peso: 0.03 },                                   // índice 15
        'Desarrollo turístico (prestadores servicios formales)': { banda: 17, peso: 0.045 }, // índice 16
        'Censo Poblacional': { banda: 18, peso: 0.045 },                        // índice 17
        'Comunidades Negras': { banda: 19, peso: 0.03 },                        // índice 18
        'Reservas Indígenas': { banda: 20, peso: 0.03 },                        // índice 19
        'Áreas Protegidas': { banda: 21, peso: 0.015 }                          // índice 20
    },
    seguridad: {
        'Abigeato': { banda: 22, peso: 0.009 },                                 // índice 21
        'Delitos Sexuales': { banda: 23, peso: 0.036 },                         // índice 22
        'Estaciones de policia': { banda: 24, peso: 0.0225 },                   // índice 23
        'Extorsión y secuestro': { banda: 25, peso: 0.045 },                    // índice 24
        'Capturas en minería ilegal': { banda: 26, peso: 0.009 },               // índice 25
        'Grupos armados organizados': { banda: 27, peso: 0.0225 },              // índice 26
        'Incautación de armas de fuego': { banda: 28, peso: 0.0135 },           // índice 27
        'Incautación Base de Coca': { banda: 29, peso: 0.018 },                 // índice 28
        'Incautación Basuco': { banda: 30, peso: 0.009 },                       // índice 29
        'Incautación Cocaína': { banda: 31, peso: 0.018 },                      // índice 30
        'Minas Antipersona': { banda: 32, peso: 0.0135 },                       // índice 31
        'Minas Intervenidas': { banda: 33, peso: 0.0135 },                      // índice 32
        'Presencia de áreas base': { banda: 34, peso: 0.018 },                  // índice 33
        'Violencia terrorista (atentados)': { banda: 35, peso: 0.045 },         // índice 34
        'Migración irregular y tráfico de migrantes': { banda: 36, peso: 0.0225 }, // índice 35
        'Homicidios': { banda: 37, peso: 0.0675 },                              // índice 36
        'Homicidios por accidente de tránsito': { banda: 38, peso: 0.0225 },    // índice 37
        'Lesiones Personales': { banda: 39, peso: 0.0225 },                     // índice 38
        'Lesiones por accidentes de tránsito': { banda: 40, peso: 0.0225 }      // índice 39
    }
};

// Los pesos ya están normalizados globalmente en bandasConfig
// No necesitamos pesos adicionales por dimensión

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

    console.log(`[${type.toUpperCase()}] ${message}`);

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
    updateDateTime();
    setInterval(updateDateTime, 60000);

    showStatus('Sistema HORIZONTE 2.0 inicializado', 'info');

    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/ImageryLayer",
        "esri/layers/support/RasterFunction",
        "esri/renderers/RasterStretchRenderer",
        "esri/rest/support/AlgorithmicColorRamp",
        "esri/rest/support/MultipartColorRamp",
        "esri/Color"
    ], function(Map, MapView, ImageryLayer, RasterFunction, RasterStretchRenderer, AlgorithmicColorRamp, MultipartColorRamp, Color) {
        
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
                components: ["zoom", "compass", "attribution"]
            }
        });

        // Crear la capa de imagen única con sistema de respaldo
        let imageryLayer = null;

        // Función para crear capa con un servicio específico
        function createImageryLayer(serviceURL, isRetry = false) {
            return new Promise((resolve, reject) => {
                const layer = new ImageryLayer({
                    url: serviceURL,
                    title: "HORIZONTE - Análisis Multidimensional",
                    visible: false,
                    opacity: 0.8
                });

                // Intentar cargar la capa
                layer.load().then(() => {
                    currentImageServiceURL = serviceURL;
                    const serviceType = serviceURL === imageServiceURLs.primary ? "principal" : "respaldo";
                    
                    if (isRetry) {
                        showStatus(`Conectado al servicio de respaldo correctamente`, 'warning');
                        console.log(`🔄 Usando servicio de respaldo: ${serviceURL}`);
                    } else {
                        showStatus(`Servicio ${serviceType} conectado correctamente`, 'success');
                        console.log(`✅ Usando servicio ${serviceType}: ${serviceURL}`);
                    }
                    
                    resolve(layer);
                }).catch(error => {
                    console.error(`❌ Error al cargar servicio desde ${serviceURL}:`, error);
                    reject(error);
                });
            });
        }

        // Intentar cargar servicio principal, luego respaldo si falla
        async function initializeImageryLayer() {
            try {
                // Intentar servicio principal
                showStatus('Conectando al servicio principal...', 'info');
                imageryLayer = await createImageryLayer(imageServiceURLs.primary);
                
            } catch (primaryError) {
                console.warn("🔄 Servicio principal no disponible, intentando servicio de respaldo...");
                showStatus('Servicio principal no disponible, conectando al respaldo...', 'warning');
                
                try {
                    // Intentar servicio de respaldo
                    imageryLayer = await createImageryLayer(imageServiceURLs.fallback, true);
                    
                } catch (fallbackError) {
                    console.error("❌ Ambos servicios no están disponibles:", {
                        primary: primaryError,
                        fallback: fallbackError
                    });
                    showStatus('Error: Ningún servicio de imagen está disponible. Intente más tarde.', 'error');
                    throw new Error("Servicios de imagen no disponibles");
                }
            }

            // Agregar la capa al mapa una vez cargada exitosamente
            map.add(imageryLayer);
            return imageryLayer;
        }

        // Crear rampa de colores rojo → verde
        const hexSteps = [
            "#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b",
            "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"
        ];

        const ramps = hexSteps.slice(0, -1).map((c, i) =>
            new AlgorithmicColorRamp({
                fromColor: new Color(c),
                toColor: new Color(hexSteps[i + 1])
            })
        );

        const colorRampRG = new MultipartColorRamp({ colorRamps: ramps });

        // Función principal para aplicar la combinación ponderada
        function applyWeightedCombination() {
            // Verificar que la capa esté disponible
            if (!imageryLayer) {
                showStatus('Error: Servicio de imagen no disponible', 'error');
                return;
            }

            console.log("Aplicando combinación ponderada de bandas...");

            const selectedBands = [];
            let totalWeight = 0;

            // Recopilar bandas seleccionadas por dimensión
            ['seguridad', 'desarrollo', 'gobernabilidad'].forEach(dimensionId => {
                const variableCheckboxes = document.querySelectorAll(`.${dimensionId}-variable`);

                variableCheckboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                        const variableName = checkbox.nextElementSibling.textContent.trim();
                        const config = bandasConfig[dimensionId][variableName];
                        
                        if (config) {
                            // Usar directamente el peso global (ya normalizado)
                            selectedBands.push({
                                banda: config.banda,
                                peso: config.peso,
                                variable: variableName,
                                dimension: dimensionId
                            });
                            totalWeight += config.peso;
                        }
                    }
                });
            });

            // Si no hay bandas seleccionadas, ocultar la capa
            if (selectedBands.length === 0) {
                imageryLayer.visible = false;
                showStatus('Seleccione al menos una variable para visualizar', 'warning');
                return;
            }

            // Crear expresión BandArithmetic
            const expression = `(${selectedBands
                .map(s => `(B${s.banda}*${s.peso})`)
                .join(" + ")})/${totalWeight}`;

            console.log("🧮 Expresión BandArithmetic:", expression);
            console.log("📊 Bandas seleccionadas:", selectedBands.length);
            console.log("🌐 Servicio activo:", currentImageServiceURL);
            console.table(selectedBands);

            try {
                // Crear RasterFunction
                const rasterFn = new RasterFunction({
                    rasterFunction: "BandArithmetic",
                    rasterFunctionArguments: {
                        Method: 0,
                        BandIndexes: expression,
                        VariableName: "Raster"
                    },
                    outputPixelType: "F32"
                });

                // Aplicar función y renderer
                imageryLayer.rasterFunction = rasterFn;
                imageryLayer.renderer = new RasterStretchRenderer({
                    stretchType: "standard-deviation",
                    numberOfStandardDeviations: 3,
                    dynamicRangeAdjustment: true,
                    colorRamp: colorRampRG
                });

                imageryLayer.visible = true;
                imageryLayer.refresh();

                const serviceType = currentImageServiceURL === imageServiceURLs.primary ? "principal" : "respaldo";
                showStatus(`Visualizando combinación de ${selectedBands.length} variables (Servicio ${serviceType})`, 'success');
                
            } catch (error) {
                console.error("Error aplicando RasterFunction:", error);
                showStatus('Error al procesar la combinación de bandas', 'error');
            }
        }

        // Función para obtener información del servicio activo
        window.getServiceInfo = function() {
            const serviceType = currentImageServiceURL === imageServiceURLs.primary ? "Principal" : "Respaldo";
            const info = {
                serviceType: serviceType,
                url: currentImageServiceURL,
                status: imageryLayer ? "Conectado" : "Desconectado"
            };
            console.table(info);
            return info;
        };

        // Event listener para cambios en checkboxes
        document.addEventListener('calciteCheckboxChange', function(event) {
            if (event.target && (event.target.classList.contains('variable-checkbox') || event.target.classList.contains('dimension-checkbox'))) {
                console.log("Checkbox changed, updating visualization:", event.target.id);
                // Pequeño delay para asegurar que todos los checkboxes se actualicen
                setTimeout(applyWeightedCombination, 100);
            }
        });

        // Función para toggle de dimensiones (expuesta globalmente)
        window.toggleDimensionLayers = function(dimensionName, isChecked) {
            console.log(`Toggle dimension: ${dimensionName} = ${isChecked}`);
            // La lógica ya se maneja en el event listener de calciteCheckboxChange
        };

        // Manejador para el botón de reinicio
        document.getElementById('resetBtn').addEventListener('click', function() {
            showStatus('Reiniciando sistema...', 'warning');
            setTimeout(() => {
                location.reload();
            }, 1000);
        });

        // Inicialización completada
        view.when(async () => {
            try {
                // Inicializar la capa de imagen con sistema de respaldo
                await initializeImageryLayer();
                
                showStatus('Sistema HORIZONTE 2.0 operativo. Servicio de imagen cargado correctamente.', 'success');
                
                // Almacenar referencias globales
                window.horizonte = {
                    imageryLayer: imageryLayer,
                    applyWeightedCombination: applyWeightedCombination,
                    bandasConfig: bandasConfig,
                    currentServiceURL: currentImageServiceURL
                };
                
                // Disparar evento para indicar que el sistema está listo
                window.dispatchEvent(new CustomEvent('horizonte:systemReady'));
                
            } catch (error) {
                console.error("Error inicializando el sistema HORIZONTE:", error);
                showStatus('Error crítico al inicializar el sistema. Verifique la conexión de red.', 'error');
            }
        }).catch(error => {
            console.error("Error inicializando la vista del mapa:", error);
            showStatus('Error al inicializar la vista del mapa.', 'error');
        });
    });
});