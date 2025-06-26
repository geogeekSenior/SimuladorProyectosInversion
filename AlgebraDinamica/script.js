/**
 * script.js - Lógica principal para HORIZONTE 2.0
 * Simulador de Inversiones Estratégicas - Con RasterFunction y servicio único
 * Versión con rampa de colores diferenciada para Seguridad y variables con escala invertida
 */

// URLs del servicio de imagen (principal y respaldo)
const imageServiceURLs = {
    primary: "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Dimensiones_Scaled/ImageServer",
    fallback: "https://arcgis.esri.co/image/rest/services/DEX/Dimensiones_Scaled/ImageServer"
};

let currentImageServiceURL = null;

// Mapeo de variables a bandas y sus pesos GLOBALES (ya normalizados)
// Basado en el array de pesos del ejemplo: índices 0-39 corresponden a bandas 1-40
// Mapeo de variables a bandas y sus pesos GLOBALES (ya normalizados)
const bandasConfig = {
    desarrollo: {
        'Tasa de desempleo':                         { banda: 1,  peso: 0.0125 },
        'Indice de pobreza multidimensional':        { banda: 2,  peso: 0.025  },
        'Alfabetismo':                               { banda: 3,  peso: 0.025  },
        'Tasa de bajo peso al nacer':                { banda: 4,  peso: 0.0375 },
        'Tasa de desnutrición aguda':                { banda: 5,  peso: 0.0075 },
        'Asistencia escolar':                        { banda: 6,  peso: 0.0175 },
        'Viviendas con acueducto y alcantarillado':  { banda: 7,  peso: 0.0225 },
        'Viviendas con energía eléctrica':           { banda: 8,  peso: 0.0375 },
        'Viviendas con gas domiciliario':            { banda: 9,  peso: 0.0075 },
        'Viviendas con acceso a internet':           { banda: 10, peso: 0.0075 },
        'Amenaza por deslizamiento de tierras':      { banda: 11, peso: 0.02   },
        'Amenaza por fenomenos hidrologicos':        { banda: 12, peso: 0.0125 },
        'Amenaza de incendios en cobertura vegetal': { banda: 13, peso: 0.0175 }
    },

    gobernabilidad: {
        'Instituciones educativas':                              { banda: 14, peso: 0.045 },
        'Instituciones de salud':                                { banda: 15, peso: 0.06  },
        'Hoteles':                                               { banda: 16, peso: 0.03  },
        'Prestadores turísticos':                                { banda: 17, peso: 0.045 },
        'Población total':                                       { banda: 18, peso: 0.045 },
        'Territorios colectivos de comunidades negras':          { banda: 19, peso: 0.03  },
        'Reservas indigenas':                                    { banda: 20, peso: 0.03  },
        'Áreas protegidas':                                      { banda: 21, peso: 0.015 }
    },

    seguridad: {
        'Casos de abigeato':                                           { banda: 22, peso: 0.009  },
        'Casos relacionados con delitos sexuales':                     { banda: 23, peso: 0.036  },
        'Estaciones de policía':                                       { banda: 24, peso: 0.0225 },
        'Casos de extorsión y secuestro':                              { banda: 25, peso: 0.045  },
        'Capturas relacionadas con actividades en minería ilegal':     { banda: 26, peso: 0.009  },
        'Índice GAO – guerrilla':                                      { banda: 27, peso: 0.0225 },
        'Incautaciones de armas de fuego':                             { banda: 28, peso: 0.0135 },
        'Incautaciones de base de coca':                               { banda: 29, peso: 0.018  },
        'Incautaciones de basuco':                                     { banda: 30, peso: 0.009  },
        'Incautaciones de cocaína':                                    { banda: 31, peso: 0.018  },
        'Presencia de minas antipersona por Ha':                       { banda: 32, peso: 0.0135 },
        'Minas antipersona intervenidas':                              { banda: 33, peso: 0.0135 },
        'Índice – ejército (áreas base)':                          { banda: 34, peso: 0.018  },
        'Atentados terroristas':                                       { banda: 35, peso: 0.045  },
        'Migración irregular y trafico de migrantes':                  { banda: 36, peso: 0.0225 },
        'Homicidios':                                                 { banda: 37, peso: 0.0675 },
        'Homicidios ocurridos por accidentes de tránsito':             { banda: 38, peso: 0.0225 },
        'Casos relacionados con lesiones personales':                  { banda: 39, peso: 0.0225 },
        'Casos relacionados con lesiones por accidentes de tránsito':  { banda: 40, peso: 0.0225 }
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

        // Crear rampa de colores rojo → verde (para combinaciones mixtas)
        // Con centro más amarillo-naranja
        const hexStepsRG = [
    "#a50026", // rojo oscuro
    "#c43c39", // rojo medio
    "#d73027", // rojo intenso
    "#e34f2e", // rojo anaranjado
    "#f46d43", // naranja fuerte
    "#fb8d59", // naranja claro
    "#fdae61", // durazno
    "#fec980", // amarillo anaranjado
    "#fee08b", // amarillo pálido
    "#c4d96b", // amarillo verdoso
    "#84bf5c", // verde medio
    "#4fa34d", // verde oscuro medio
    "#006837"  // verde profundo
];

        const rampsRG = hexStepsRG.slice(0, -1).map((c, i) =>
            new AlgorithmicColorRamp({
                fromColor: new Color(c),
                toColor: new Color(hexStepsRG[i + 1])
            })
        );

        const colorRampRG = new MultipartColorRamp({ colorRamps: rampsRG });

        // Crear rampa de colores rojo → amarillo (para variables negativas/desfavorables)
        const hexStepsRY = [
            "#a50026", "#c43c39", "#d73027", "#e34f2e", "#f46d43",
            "#fb8d59", "#fdae61", "#fec980", "#fee08b", "#fee08b"
        ];

        const rampsRY = hexStepsRY.slice(0, -1).map((c, i) =>
            new AlgorithmicColorRamp({
                fromColor: new Color(c),
                toColor: new Color(hexStepsRY[i + 1])
            })
        );

        const colorRampRY = new MultipartColorRamp({ colorRamps: rampsRY });

        // Crear rampa de colores amarillo → verde (para variables positivas/favorables - escala invertida)
        const hexStepsYG =  [
    "#fee08b", // amarillo pálido
    "#f1d56e", // amarillo dorado
    "#c4d96b", // amarillo verdoso (puente hacia verde)
    "#c4d96b", // verde lima
    "#84bf5c", // verde medio
    "#66b255", // verde más saturado
    "#4fa34d", // verde oscuro medio
    "#388f45", // verde selva
    "#217a3c", // verde intenso
    "#006837"  // verde oscuro profundo
];


        const rampsYG = hexStepsYG.slice(0, -1).map((c, i) =>
            new AlgorithmicColorRamp({
                fromColor: new Color(c),
                toColor: new Color(hexStepsYG[i + 1])
            })
        );

        const colorRampYG = new MultipartColorRamp({ colorRamps: rampsYG });



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
            const dimensionsActive = new Set();

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
                            dimensionsActive.add(dimensionId);
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

            // NOTA: Con la arquitectura actual de una sola capa y RasterFunction,
            // no es posible aplicar diferentes rampas de color a diferentes bandas
            // dentro de la misma operación. Para lograr ese efecto se necesitaría:
            // 1. Múltiples ImageryLayers (una por dimensión) con blend modes
            // 2. O usar un enfoque RGB composite donde cada dimensión = un canal
            
            // Por ahora, usamos rampas diferenciadas según el tipo de variables seleccionadas:
            // - Amarillo → Verde: Variables donde "más es mejor" (escala invertida)
            // - Rojo → Amarillo: Variables donde "más es peor" (escala normal)
            // - Rojo → Verde: Mezcla de ambos tipos de variables

            // Analizar si hay variables con escala invertida seleccionadas
            let hasInvertedVariables = false;
            let hasNormalVariables = false;
            
            selectedBands.forEach(band => {
                // Buscar el checkbox correspondiente para obtener su ID exacto
                const checkboxes = document.querySelectorAll(`.${band.dimension}-variable`);
                let variableId = null;
                
                checkboxes.forEach(checkbox => {
                    const labelText = checkbox.nextElementSibling?.textContent.trim();
                    if (labelText === band.variable) {
                        variableId = checkbox.id;
                    }
                });
                
                if (variableId && window.variableScaleConfig && window.variableScaleConfig.tieneEscalaInvertida(variableId)) {
                    hasInvertedVariables = true;
                } else {
                    hasNormalVariables = true;
                }
            });

            // Determinar qué rampa de colores usar basado en las dimensiones activas y tipos de escala
            let selectedColorRamp;
            let rampDescription;
            
            if (dimensionsActive.size === 1) {
                // Solo una dimensión activa
                if (dimensionsActive.has('seguridad')) {
                    // Para seguridad, verificar si todas las variables son invertidas
                    if (hasInvertedVariables && !hasNormalVariables) {
                        selectedColorRamp = colorRampYG;
                        rampDescription = "Amarillo → Verde (Variables de Seguridad Positivas)";
                    } else {
                        selectedColorRamp = colorRampRY;
                        rampDescription = "Rojo → Amarillo (Seguridad)";
                    }
                } else {
                    // Desarrollo o Gobernabilidad
                    if (hasInvertedVariables && !hasNormalVariables) {
                        selectedColorRamp = colorRampYG;
                        rampDescription = "Amarillo → Verde (Variables Positivas)";
                    } else if (!hasInvertedVariables && hasNormalVariables) {
                        selectedColorRamp = colorRampRY;
                        rampDescription = "Rojo → Amarillo (Variables Negativas)";
                    } else {
                        // Mezcla de variables - usar rampa completa
                        selectedColorRamp = colorRampRG;
                        rampDescription = "Rojo → Verde (Variables Mixtas)";
                    }
                }
            } else {
                // Múltiples dimensiones
                if (hasInvertedVariables && hasNormalVariables) {
                    // Mezcla de tipos - usar rampa completa
                    selectedColorRamp = colorRampRG;
                    rampDescription = "Rojo → Verde (Análisis Multidimensional Mixto)";
                } else if (hasInvertedVariables && !hasNormalVariables) {
                    // Solo variables invertidas
                    selectedColorRamp = colorRampYG;
                    rampDescription = "Amarillo → Verde (Variables Positivas Multidimensionales)";
                } else {
                    // Solo variables normales
                    selectedColorRamp = colorRampRY;
                    rampDescription = "Rojo → Amarillo (Variables Negativas Multidimensionales)";
                }
            }

            // Crear expresión BandArithmetic
            const expression = `(${selectedBands
                .map(s => `(B${s.banda}*${s.peso})`)
                .join(" + ")})/${totalWeight}`;

            console.log("🧮 Expresión BandArithmetic:", expression);
            console.log("📊 Bandas seleccionadas:", selectedBands.length);
            console.log("🎨 Rampa de colores:", rampDescription);
            console.log("📐 Dimensiones activas:", Array.from(dimensionsActive).join(", "));
            console.log("🔄 Variables invertidas:", hasInvertedVariables ? "Sí" : "No");
            console.log("📉 Variables normales:", hasNormalVariables ? "Sí" : "No");
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

                // Aplicar función y renderer con la rampa de colores apropiada
                imageryLayer.rasterFunction = rasterFn;
                imageryLayer.renderer = new RasterStretchRenderer({
                    stretchType: "standard-deviation",
                    numberOfStandardDeviations: 3,
                    dynamicRangeAdjustment: true,
                    colorRamp: selectedColorRamp
                });

                imageryLayer.visible = true;
                imageryLayer.refresh();

                const serviceType = currentImageServiceURL === imageServiceURLs.primary ? "principal" : "respaldo";
                let visualizationType = "";
                
                if (dimensionsActive.size === 1) {
                    if (dimensionsActive.has('seguridad')) {
                        if (hasInvertedVariables && !hasNormalVariables) {
                            visualizationType = " (Factores Positivos de Seguridad)";
                        } else {
                            visualizationType = " (Riesgo de Seguridad)";
                        }
                    } else if (dimensionsActive.has('desarrollo')) {
                        if (hasInvertedVariables && !hasNormalVariables) {
                            visualizationType = " (Fortalezas de Desarrollo)";
                        } else if (!hasInvertedVariables && hasNormalVariables) {
                            visualizationType = " (Vulnerabilidades de Desarrollo)";
                        } else {
                            visualizationType = " (Condiciones Mixtas de Desarrollo)";
                        }
                    } else if (dimensionsActive.has('gobernabilidad')) {
                        if (hasInvertedVariables && !hasNormalVariables) {
                            visualizationType = " (Capacidad Institucional)";
                        } else if (!hasInvertedVariables && hasNormalVariables) {
                            visualizationType = " (Déficit Institucional)";
                        } else {
                            visualizationType = " (Análisis Institucional Mixto)";
                        }
                    }
                } else {
                    if (hasInvertedVariables && !hasNormalVariables) {
                        visualizationType = " (Factores Favorables)";
                    } else if (!hasInvertedVariables && hasNormalVariables) {
                        visualizationType = " (Factores Desfavorables)";
                    } else {
                        visualizationType = " (Análisis Integral)";
                    }
                }
                
                showStatus(`Visualizando combinación de ${selectedBands.length} variables (Servicio ${serviceType})${visualizationType}`, 'success');
                
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