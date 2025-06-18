/**
 * multidimensional-analysis.js - Análisis Multidimensional con Panel Lateral Mejorado
 * Sistema mejorado con estilo militar consistente y funcionalidad simplificada
 * HORIZONTE: Juego de Estrategia
 */

// Namespace para análisis multidimensional
if (!window.HORIZONTE) window.HORIZONTE = {};

HORIZONTE.multidimensionalAnalysis = (function() {
    // URLs del servicio de imagen (principal y respaldo)
    const imageServiceURLs = {
        primary: {
            url: "https://geocntr-imagery.bd.esri.com/server/rest/services/Colombia/Dimensiones_Scaled/ImageServer",
            name: "Servicio Principal - Colombia Dimensiones",
            type: "primary"
        },
        fallback: {
            url: "https://arcgis.esri.co/image/rest/services/DEX/Dimensiones_Scaled/ImageServer", 
            name: "Servicio Respaldo - DEX Dimensiones",
            type: "fallback"
        }
    };

    let currentImageService = null;
    let imageryLayer = null;
    let sceneView = null;
    let initialized = false;
    let arcgisModules = null;
    let serviceBandsConfig = null;
    let sidePanel = null;
    let isCollapsed = true; // Iniciar colapsado

let bandasConfig = {
desarrollo: {
        'Tasa de Ocupación': { banda: 1, peso: 0.0125 },                         // índice 0
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

    /**
     * Inicializa el sistema de análisis multidimensional
     * @param {Object} view - Vista de la escena 3D
     */
    function init(view) {
        if (initialized) {
            console.log("✅ Análisis multidimensional ya inicializado");
            return;
        }
        
        sceneView = view;
        console.log("🚀 Inicializando análisis multidimensional con panel lateral mejorado...");
        
        // Crear UI primero
        setupSidePanel();
        
        // Cargar módulos de ArcGIS
        loadArcGISModules()
            .then(() => {
                console.log("✅ Módulos de ArcGIS cargados exitosamente");
                return createImageryLayer();
            })
            .then(() => {
                console.log("✅ Capa de imagen creada exitosamente");
                return loadServiceBandsConfig();
            })
            .then(() => {
                initialized = true;
                
                // Exponer configuración globalmente
                window.horizonte = {
                    ...window.horizonte,
                    imageryLayer: imageryLayer,
                    applyWeightedCombination: applyWeightedCombination,
                    bandasConfig: bandasConfig,
                    currentServiceURL: currentImageService?.url,
                    arcgisModules: arcgisModules
                };
                
                showStatus('Panel de análisis multidimensional disponible', 'success');
                document.dispatchEvent(new CustomEvent('horizonte:multidimensionalReady'));
            })
            .catch(error => {
                console.error("❌ Error en inicialización:", error);
                initialized = true;
                showStatus('Panel de análisis disponible en modo básico', 'warning');
            });
    }

    /**
     * Cargar módulos de ArcGIS
     */
    function loadArcGISModules() {
        return new Promise((resolve, reject) => {
            if (typeof require === 'undefined') {
                reject(new Error("require() no disponible"));
                return;
            }
            
            const moduleList = [
                "esri/layers/ImageryLayer",
                "esri/layers/support/RasterFunction", 
                "esri/renderers/RasterStretchRenderer",
                "esri/rest/support/AlgorithmicColorRamp",
                "esri/rest/support/MultipartColorRamp",
                "esri/Color"
            ];
            
            require(moduleList, function(
                ImageryLayer, RasterFunction, RasterStretchRenderer,
                AlgorithmicColorRamp, MultipartColorRamp, Color
            ) {
                arcgisModules = {
                    ImageryLayer, RasterFunction, RasterStretchRenderer,
                    AlgorithmicColorRamp, MultipartColorRamp, Color
                };
                
                setupColorRamp();
                resolve(arcgisModules);
            }, reject);
        });
    }

    /**
     * Configurar rampa de colores
     */
    function setupColorRamp() {
        const { AlgorithmicColorRamp, MultipartColorRamp, Color } = arcgisModules;
        
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

        window.horizonte = window.horizonte || {};
        window.horizonte.colorRamp = new MultipartColorRamp({ colorRamps: ramps });
    }

    /**
     * Crear capa de imagen con sistema de respaldo
     */
    function createImageryLayer() {
        return new Promise(async (resolve, reject) => {
            const { ImageryLayer } = arcgisModules;
            
            try {
                console.log("🔄 Probando servicio principal...");
                imageryLayer = await tryCreateLayer(ImageryLayer, imageServiceURLs.primary.url);
                currentImageService = imageServiceURLs.primary;
                console.log("✅ Servicio principal conectado");
                
            } catch (primaryError) {
                console.warn("⚠️ Servicio principal falló, probando respaldo...");
                
                try {
                    imageryLayer = await tryCreateLayer(ImageryLayer, imageServiceURLs.fallback.url);
                    currentImageService = imageServiceURLs.fallback;
                    console.log("✅ Servicio de respaldo conectado");
                    
                } catch (fallbackError) {
                    console.error("❌ Ambos servicios fallaron");
                    reject(new Error("Ningún servicio de imagen disponible"));
                    return;
                }
            }
            
            if (sceneView && sceneView.map) {
                sceneView.map.add(imageryLayer);
                console.log("✅ Capa añadida al mapa");
            }
            
            resolve(imageryLayer);
        });
    }

    /**
     * Intentar crear capa desde una URL específica
     */
    function tryCreateLayer(ImageryLayer, url) {
        return new Promise((resolve, reject) => {
            const layer = new ImageryLayer({
                url: url,
                title: "HORIZONTE - Análisis Multidimensional",
                visible: false,
                opacity: 0.75,
                blendMode: "multiply"
            });
            
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout al cargar capa desde ${url}`));
            }, 10000);
            
            layer.load()
                .then(() => {
                    clearTimeout(timeoutId);
                    resolve(layer);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    }

    /**
     * Cargar configuración de bandas desde el servicio
     */
    function loadServiceBandsConfig() {
        return new Promise((resolve) => {
            if (!imageryLayer) {
                resolve();
                return;
            }

            imageryLayer.when(() => {
                try {
                    const serviceInfo = imageryLayer.serviceDescription || imageryLayer.rasterInfo;
                    
                    if (serviceInfo && serviceInfo.bandCount) {
                        serviceBandsConfig = {
                            totalBands: serviceInfo.bandCount || 40,
                            configSource: 'service',
                            loadedAt: new Date().toISOString()
                        };
                        
                        console.log("✅ Configuración de bandas del servicio:", serviceBandsConfig);
                    }
                    
                    resolve();
                } catch (error) {
                    console.warn("⚠️ No se pudo obtener configuración del servicio:", error);
                    resolve();
                }
            }).catch(() => resolve());
        });
    }

    /**
     * Configurar panel lateral
     */
    function setupSidePanel() {
        console.log("🎛️ Configurando panel lateral militar...");
        
        // Crear estructura del panel lateral
        sidePanel = createSidePanel();
        
        // Añadir al contenedor principal
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.insertBefore(sidePanel, appContainer.firstChild);
            console.log("✅ Panel lateral añadido");
        }

        setupEventListeners();
    }

    /**
     * Crear panel lateral con estilo militar
     */
    function createSidePanel() {
        const panel = document.createElement('div');
        panel.id = 'multidimensionalSidePanel';
        panel.className = 'multidimensional-side-panel';
        
        // Estilos del panel - Tema militar consistente
        panel.style.cssText = `
            position: fixed;
            left: 0;
            top: 150px;
            bottom: 30px;
            width: 350px;
            background-color: rgba(0, 20, 48, 0.95);
            border: 1px solid var(--primary-color);
            border-left: none;
            backdrop-filter: blur(8px);
            z-index: 1000;
            transition: transform 0.3s ease;
            transform: translateX(-350px);
            display: flex;
            flex-direction: column;
            box-shadow: 2px 0 10px rgba(0,0,0,0.5);
        `;

        panel.innerHTML = `
            <!-- Toggle Button -->
            <div class="panel-toggle-btn" style="
                position: absolute;
                right: -40px;
                top: 20px;
                width: 40px;
                height: 40px;
                background-color: var(--primary-color);
                border: 1px solid var(--primary-color-light);
                border-left: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-color);
                font-family: var(--font-monospace);
                font-size: 16px;
                transition: all 0.3s ease;
            " id="toggleMultidimensionalPanel" title="Análisis Multidimensional">
                📊
            </div>

            <!-- Panel Header -->
            <div class="panel-header" style="
                padding: var(--spacing-md);
                border-bottom: 1px solid var(--primary-color-dark);
                background-color: rgba(13, 34, 66, 0.8);
            ">
                <h3 style="
                    color: var(--text-color);
                    margin: 0;
                    font-family: var(--font-monospace);
                    font-size: var(--font-size-md);
                    text-transform: uppercase;
                    letter-spacing: var(--letter-spacing-wide);
                    font-weight: var(--font-weight-semibold);
                ">
                    ANÁLISIS MULTIDIMENSIONAL
                </h3>
            </div>

            <!-- Panel Content -->
            <div class="panel-content" style="
                flex: 1;
                overflow-y: auto;
                padding: var(--spacing-sm);
            ">
                ${createDimensionControls()}
            </div>
        `;

        return panel;
    }

    /**
     * Crear controles por dimensión - Estilo militar simplificado
     */
    function createDimensionControls() {
        let html = '';
        
        const dimensionInfo = {
            seguridad: { 
                color: 'var(--error-color)', 
                icon: '🔒', 
                name: 'SEGURIDAD'
            },
            desarrollo: { 
                color: 'var(--success-color)', 
                icon: '📈', 
                name: 'DESARROLLO'
            },
            gobernabilidad: { 
                color: 'var(--primary-color)', 
                icon: '🏛️', 
                name: 'GOBERNABILIDAD'
            }
        };
        
        Object.entries(bandasConfig).forEach(([dimensionId, variables]) => {
            const info = dimensionInfo[dimensionId];
            
            html += `
                <div class="dimension-group" style="
                    margin-bottom: var(--spacing-md);
                    background-color: rgba(26, 58, 110, 0.2);
                    border: 1px solid var(--primary-color-dark);
                    border-radius: var(--border-radius-sm);
                ">
                    <!-- Dimension Header -->
                    <div class="dimension-header" style="
                        background-color: ${info.color};
                        padding: var(--spacing-sm) var(--spacing-md);
                        border-bottom: 1px solid var(--primary-color-dark);
                    ">
                        <label style="
                            display: flex;
                            align-items: center;
                            color: var(--text-color);
                            font-family: var(--font-monospace);
                            font-size: var(--font-size-sm);
                            font-weight: var(--font-weight-semibold);
                            cursor: pointer;
                            text-transform: uppercase;
                            letter-spacing: var(--letter-spacing-tight);
                        ">
                            <input type="checkbox" id="${dimensionId}-all" class="dimension-checkbox" style="
                                margin-right: var(--spacing-sm);
                                width: 14px;
                                height: 14px;
                                accent-color: var(--text-color);
                            ">
                            <span style="margin-right: var(--spacing-xs);">${info.icon}</span>
                            ${info.name}
                            <span style="
                                margin-left: auto;
                                background-color: rgba(0,0,0,0.3);
                                padding: 2px 6px;
                                border-radius: 2px;
                                font-size: var(--font-size-xs);
                            ">${Object.keys(variables).length}</span>
                        </label>
                    </div>
                    
                    <!-- Variables List -->
                    <div class="variables-list" style="
                        max-height: 200px;
                        overflow-y: auto;
                        padding: var(--spacing-xs);
                    ">
            `;
            
            Object.keys(variables).forEach((variableName) => {
                html += `
                    <label style="
                        display: flex;
                        align-items: flex-start;
                        margin-bottom: var(--spacing-xs);
                        padding: var(--spacing-xs);
                        background-color: rgba(0,0,0,0.1);
                        border-radius: var(--border-radius-sm);
                        color: var(--text-color);
                        font-size: var(--font-size-xs);
                        line-height: 1.3;
                        font-family: var(--font-primary);
                        cursor: pointer;
                        transition: background-color 0.2s ease;
                        border: 1px solid transparent;
                    " onmouseover="this.style.backgroundColor='rgba(26, 58, 110, 0.3)'; this.style.borderColor='var(--primary-color)';" 
                       onmouseout="this.style.backgroundColor='rgba(0,0,0,0.1)'; this.style.borderColor='transparent';">
                        
                        <input type="checkbox" class="${dimensionId}-variable variable-checkbox" style="
                            margin-right: var(--spacing-sm);
                            width: 12px;
                            height: 12px;
                            flex-shrink: 0;
                            accent-color: var(--primary-color);
                            margin-top: 2px;
                        ">
                        
                        <span class="variable-name" style="
                            flex: 1;
                            font-weight: var(--font-weight-medium);
                            color: var(--text-color);
                        ">${variableName}</span>
                    </label>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    /**
     * Configurar event listeners
     */
    function setupEventListeners() {
        // Configurar el botón toggle directamente
        const toggleButton = document.getElementById('toggleMultidimensionalPanel');
        if (toggleButton) {
            toggleButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                togglePanel();
            });
        }

        // Checkboxes de dimensión
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('dimension-checkbox')) {
                const dimensionId = e.target.id.replace('-all', '');
                const variableCheckboxes = document.querySelectorAll(`.${dimensionId}-variable`);
                
                variableCheckboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
                
                // Auto-aplicar análisis
                setTimeout(applyWeightedCombination, 100);
            }
            
            if (e.target.classList.contains('variable-checkbox')) {
                updateDimensionCheckbox(e.target);
                // Auto-aplicar análisis
                setTimeout(applyWeightedCombination, 100);
            }
        });

        // Event listener de respaldo para el toggle
        document.addEventListener('click', (e) => {
            if (e.target.id === 'toggleMultidimensionalPanel' || e.target.closest('#toggleMultidimensionalPanel')) {
                e.preventDefault();
                e.stopPropagation();
                togglePanel();
            }
        });

        // Teclas de acceso rápido
        document.addEventListener('keydown', (e) => {
            // Alt + M para toggle del panel
            if (e.altKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                togglePanel();
            }
        });
    }

    /**
     * Toggle del panel lateral
     */
    function togglePanel() {
        isCollapsed = !isCollapsed;
        const panel = document.getElementById('multidimensionalSidePanel');
        const toggleBtn = document.getElementById('toggleMultidimensionalPanel');
        
        if (isCollapsed) {
            panel.style.transform = 'translateX(-350px)';
            toggleBtn.innerHTML = '📊';
            toggleBtn.title = 'Abrir Análisis Multidimensional';
        } else {
            panel.style.transform = 'translateX(0)';
            toggleBtn.innerHTML = '◀';
            toggleBtn.title = 'Cerrar Análisis Multidimensional';
        }
    }

    /**
     * Aplicar combinación ponderada de bandas
     */
    function applyWeightedCombination() {
        if (!imageryLayer || !arcgisModules) {
            return;
        }
        
        const selectedBandsMap = new Map();
        let totalWeight = 0;

        ['seguridad', 'desarrollo', 'gobernabilidad'].forEach(dimensionId => {
            const variableCheckboxes = document.querySelectorAll(`.${dimensionId}-variable:checked`);
            
            variableCheckboxes.forEach(checkbox => {
                const label = checkbox.closest('label');
                const variableName = label ? label.querySelector('.variable-name')?.textContent?.trim() : null;
                
                if (!variableName) return;
                
                const config = bandasConfig[dimensionId][variableName];
                
                if (config) {
                    const bandKey = `B${config.banda}`;
                    
                    if (!selectedBandsMap.has(bandKey)) {
                        selectedBandsMap.set(bandKey, {
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

        const selectedBands = Array.from(selectedBandsMap.values());

        if (selectedBands.length === 0) {
            imageryLayer.visible = false;
            return;
        }

        if (selectedBands.length > 40) {
            showStatus('Error: Demasiadas variables seleccionadas', 'error');
            return;
        }

        const expression = `(${selectedBands
            .map(s => `(B${s.banda}*${s.peso})`)
            .join(" + ")})/${totalWeight}`;

        try {
            const { RasterFunction, RasterStretchRenderer } = arcgisModules;
            
            const rasterFn = new RasterFunction({
                rasterFunction: "BandArithmetic",
                rasterFunctionArguments: {
                    Method: 0,
                    BandIndexes: expression,
                    VariableName: "Raster"
                },
                outputPixelType: "F32"
            });

            imageryLayer.rasterFunction = rasterFn;

            if (window.horizonte && window.horizonte.colorRamp) {
                imageryLayer.renderer = new RasterStretchRenderer({
                    stretchType: "standard-deviation",
                    numberOfStandardDeviations: 3,
                    dynamicRangeAdjustment: true,
                    colorRamp: window.horizonte.colorRamp
                });
            }

            imageryLayer.visible = true;
            imageryLayer.refresh();

            showStatus(`Análisis aplicado: ${selectedBands.length} variables`, 'success');
            
            document.dispatchEvent(new CustomEvent('horizonte:analysisApplied'));
            
        } catch (error) {
            console.error("Error aplicando análisis:", error);
            showStatus('Error al procesar análisis', 'error');
        }
    }

    /**
     * Actualizar estado del checkbox de dimensión
     */
    function updateDimensionCheckbox(variableCheckbox) {
        const dimensionId = Array.from(variableCheckbox.classList)
            .find(cls => cls.endsWith('-variable'))
            .replace('-variable', '');
            
        const allVarCheckboxes = document.querySelectorAll(`.${dimensionId}-variable`);
        const checkedVarCheckboxes = Array.from(allVarCheckboxes).filter(cb => cb.checked);
        const dimensionCheckbox = document.getElementById(`${dimensionId}-all`);
        
        if (!dimensionCheckbox) return;

        if (checkedVarCheckboxes.length === 0) {
            dimensionCheckbox.checked = false;
            dimensionCheckbox.indeterminate = false;
        } else if (checkedVarCheckboxes.length === allVarCheckboxes.length) {
            dimensionCheckbox.checked = true;
            dimensionCheckbox.indeterminate = false;
        } else {
            dimensionCheckbox.indeterminate = true;
        }
    }

    /**
     * Mostrar mensaje de estado
     */
    function showStatus(message, type = 'info') {
        if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
            HORIZONTE.utils.showStatusMessage(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Obtener información del servicio activo
     */
    function getServiceInfo() {
        return {
            service: currentImageService || null,
            status: imageryLayer ? "Conectado" : "Desconectado",
            bands: serviceBandsConfig ? `${serviceBandsConfig.totalBands} bandas disponibles` : "40 bandas (configuración por defecto)",
            initialized: initialized
        };
    }

    // API pública
    return {
        init,
        applyWeightedCombination,
        getServiceInfo,
        togglePanel,
        isInitialized: () => initialized
    };
})();

// Añadir estilos CSS adicionales para el tema militar
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        /* Estilos para el panel multidimensional - Tema militar */
        .multidimensional-side-panel::-webkit-scrollbar {
            width: 6px;
        }
        
        .multidimensional-side-panel::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.2);
        }
        
        .multidimensional-side-panel::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 3px;
        }
        
        .multidimensional-side-panel::-webkit-scrollbar-thumb:hover {
            background: var(--primary-color-light);
        }
        
        .panel-toggle-btn:hover {
            background-color: var(--primary-color-light) !important;
            transform: translateX(2px);
        }
        
        /* Mejorar legibilidad de las variables */
        .variable-name {
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        
        /* Animación suave para los checkboxes */
        input[type="checkbox"] {
            transition: all 0.2s ease;
        }
        
        input[type="checkbox"]:checked {
            transform: scale(1.1);
        }
        
        /* Estados hover mejorados */
        .dimension-header:hover {
            background-color: var(--primary-color-light) !important;
        }
    `;
    document.head.appendChild(style);
});