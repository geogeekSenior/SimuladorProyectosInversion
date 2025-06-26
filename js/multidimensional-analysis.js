/**
 * multidimensional-analysis.js - Análisis Multidimensional con Panel Lateral Mejorado
 * Sistema mejorado con tooltips descriptivos y simbología dinámica de raster
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
    let isCollapsed = true;

    // Configuración de variables con información descriptiva y escala
    const variablesInfo = {
    seguridad: {
        'Homicidios': {
            banda: 37, peso: 0.0675,
            tooltip: "Un gran número de personas víctimas de homicidio se asocia con condiciones de peligro en una región, mientras que un número bajo se asocia a una zona tranquila y segura.",
            escalaInvertida: false
        },
        'Estaciones de policía': {
            banda: 24, peso: 0.0225,
            tooltip: "Más estaciones de policía en la región se asocian con mayor presencia institucional, mientras que menos unidades reducen la capacidad de respuesta.",
            escalaInvertida: true
        },
        'Casos de extorsión y secuestro': {
            banda: 25, peso: 0.045,
            tooltip: "Una alta cantidad de casos documentados incrementa el riesgo para comunidades y empresas, mientras que una baja incidencia favorece la estabilidad y la seguridad.",
            escalaInvertida: false
        },
        'Casos relacionados con delitos sexuales': {
            banda: 23, peso: 0.036,
            tooltip: "Una alta cantidad de delitos sexuales registrados refleja entornos inseguros, mientras que una baja ocurrencia sugiere condiciones de mayor seguridad.",
            escalaInvertida: false
        },
        'Presencia de minas antipersona por Ha': {
            banda: 32, peso: 0.0135,
            tooltip: "Una gran extensión de hectáreas con presencia de minas representa un alto riesgo humanitario, mientras que una menor área sugiere condiciones de mayor seguridad territorial.",
            escalaInvertida: false
        },
        'Homicidios ocurridos por accidentes de tránsito': {
            banda: 38, peso: 0.0225,
            tooltip: "Un gran número de casos registrados se asocian a deficiencias en la infraestructura y en las medidas de prevención, mientras que un número reducido sugiere una movilidad más segura y condiciones más favorables.",
            escalaInvertida: false
        },
        'Casos relacionados con lesiones personales': {
            banda: 39, peso: 0.0225,
            tooltip: "Un alto número de casos de lesiones personales se relaciona con entornos comunitarios difíciles, mientras que un número bajo indica mayor tranquilidad social.",
            escalaInvertida: false
        },
        'Casos relacionados con lesiones por accidentes de tránsito': {
            banda: 40, peso: 0.0225,
            tooltip: "Muchos casos de lesiones por accidentes de tránsito reflejan escenarios de riesgo para la población, mientras que pocos casos sugieren condiciones más seguras y controladas.",
            escalaInvertida: false
        },
        'Incautaciones de cocaína': {
            banda: 31, peso: 0.018,
            tooltip: "Muchos kilogramos de cocaína incautados se asocian con presencia significativa de economías ilegales, mientras que incautaciones bajas indican menor presión criminal en el territorio.",
            escalaInvertida: false
        },
        'Incautaciones de base de coca': {
            banda: 29, peso: 0.018,
            tooltip: "Muchos kilogramos de base de coca indican presencia representativa de economías ilegales, mientras que incautaciones bajas se asocian a mayor control de las estructuras criminales en la región.",
            escalaInvertida: false
        },
        'Incautaciones de basuco': {
            banda: 30, peso: 0.009,
            tooltip: "Incautaciones altas de kilogramos de basuco se relacionan con microtráfico extendido, mientras que incautaciones bajas se asocian a mayor control de economías criminales en la zona.",
            escalaInvertida: false
        },
        'Incautaciones de armas de fuego': {
            banda: 28, peso: 0.0135,
            tooltip: "Mayores incautaciones de armas de fuego se asocian con un mayor nivel de riesgo para la población, mientras que una menor cantidad sugiere menor circulación ilegal en la zona.",
            escalaInvertida: false
        },
        'Minas antipersona intervenidas': {
            banda: 33, peso: 0.0135,
            tooltip: "Un alto número de minas retiradas representa una recuperación efectiva del territorio, mientras que una baja intervención deja un riesgo latente para la población.",
            escalaInvertida: true
        },
        'Capturas relacionadas con actividades en minería ilegal': {
            banda: 26, peso: 0.009,
            tooltip: "Un alto número de personas capturadas revela presencia activa de economías extractivas ilegales, mientras que un número reducido sugiere menor actividad ilícita en la zona.",
            escalaInvertida: false
        },
        'Índice GAO – guerrilla': {
            banda: 27, peso: 0.0225,
            tooltip: "Un índice alto expresa una fuerte influencia de grupos armados ilegales en el territorio, mientras que un índice bajo sugiere una presencia reducida de estos grupos.",
            escalaInvertida: false
        },
        'Índice – ejército (áreas base)': {
            banda: 34, peso: 0.018,
            tooltip: "Un índice alto indica presencia institucional y control territorial, mientras que un índice bajo refleja capacidades limitadas de actuación estatal en la zona.",
            escalaInvertida: true
        },
        'Casos de abigeato': {
            banda: 22, peso: 0.009,
            tooltip: "Una alta incidencia de hurtos afecta la economía rural y deteriora la confianza en el territorio, mientras que una baja ocurrencia refleja un entorno seguro para las actividades agropecuarias.",
            escalaInvertida: false
        },
        'Migración irregular y trafico de migrantes': {
            banda: 36, peso: 0.0225,
            tooltip: "Un flujo alto de personas en situación migratoria irregular ejerce mayor presión sobre el sistema territorial y proveedor de servicios esenciales, mientras que un flujo bajo facilita la gestión institucional.",
            escalaInvertida: false
        },
        'Atentados terroristas': {
            banda: 35, peso: 0.045,
            tooltip: "Una alta cantidad de atentados representa una amenaza directa a la vida y a las condiciones para la inversión, mientras que una baja ocurrencia indica un contexto más estable y seguro.",
            escalaInvertida: false
        }
    },

    desarrollo: {
        'Asistencia escolar': {
            banda: 6, peso: 0.0175,
            tooltip: "Una alta asistencia escolar refleja compromiso social con las nuevas generaciones, mientras que una baja asistencia indica la presencia de barreras de acceso a la educación en el territorio.",
            escalaInvertida: true
        },
        'Alfabetismo': {
            banda: 3, peso: 0.025,
            tooltip: "Un mayor nivel de alfabetismo fortalece el capital humano y favorece el éxito de los proyectos, mientras que un nivel bajo limita la adopción tecnológica y reduce el crecimiento social y económico de la población.",
            escalaInvertida: true
        },
        'Viviendas con acueducto y alcantarillado': {
            banda: 7, peso: 0.0225,
            tooltip: "Un mayor número de viviendas con acceso a acueducto y alcantarillado mejora la salud pública y el entorno habitacional, mientras que una baja cobertura implica riesgo sanitario y mayores costos para la población.",
            escalaInvertida: true
        },
        'Viviendas con energía eléctrica': {
            banda: 8, peso: 0.0375,
            tooltip: "Un suministro eléctrico confiable impulsa la productividad y mejora la calidad de vida, mientras que la carencia o intermitencia del servicio limita el desarrollo económico del territorio.",
            escalaInvertida: true
        },
        'Viviendas con gas domiciliario': {
            banda: 9, peso: 0.0075,
            tooltip: "La cobertura de gas domiciliario aporta una fuente de energía limpia y reduce los riesgos en el entorno doméstico, mientras que su ausencia incrementa la vulnerabilidad energética del territorio.",
            escalaInvertida: true
        },
        'Viviendas con acceso a internet': {
            banda: 10, peso: 0.0075,
            tooltip: "Una buena conectividad a internet mejora el acceso a educación, servicios y oportunidades productivas, mientras que una conectividad deficiente limita la inclusión digital y el desarrollo local.",
            escalaInvertida: true
        },
        'Amenaza por deslizamiento de tierras': {
            banda: 11, peso: 0.02,
            tooltip: "Una alta frecuencia de alertas geológicas se asocia con mayor riesgo físico y mayores costos de mitigación, mientras que una baja frecuencia sugiere condiciones de terreno más estables.",
            escalaInvertida: false
        },
        'Amenaza por fenomenos hidrologicos': {
            banda: 12, peso: 0.0125,
            tooltip: "Una alta recurrencia de inundaciones amenaza la infraestructura y la continuidad operativa, mientras que una baja recurrencia indica un riesgo hidrológico moderado.",
            escalaInvertida: false
        },
        'Amenaza de incendios en cobertura vegetal': {
            banda: 13, peso: 0.0175,
            tooltip: "Una alta cantidad de alertas por incendios forestales revela vulnerabilidad ambiental en el territorio, mientras que una baja ocurrencia sugiere ecosistemas menos propensos a incendios.",
            escalaInvertida: false
        },
        'Tasa de bajo peso al nacer': {
            banda: 4, peso: 0.0375,
            tooltip: "Una tasa elevada señala deficiencias nutricionales y riesgos para la salud infantil, mientras que una tasa baja denota condiciones sanitarias más favorables.",
            escalaInvertida: false
        },
        'Tasa de desnutrición aguda': {
            banda: 5, peso: 0.0075,
            tooltip: "Una alta tasa de desnutrición evidencia una situación crítica en materia de seguridad alimentaria, mientras que una baja tasa indica una población con mejores condiciones nutricionales.",
            escalaInvertida: false
        },
        'Tasa de desempleo': {
            banda: 1, peso: 0.0125,
            tooltip: "Una alta tasa de desempleo refleja fragilidad económica y menor capacidad de ingreso para la población, mientras que una baja tasa impulsa el desarrollo económico y aporta a la estabilidad territorial.",
            escalaInvertida: false
        },
        'Indice de pobreza multidimensional': {
            banda: 2, peso: 0.025,
            tooltip: "Un IPM alto revela múltiples carencias estructurales en el territorio, mientras que un IPM bajo evidencia mejores condiciones de bienestar y calidad de vida.",
            escalaInvertida: false
        }
    },

    gobernabilidad: {
        'Población total': {
            banda: 18, peso: 0.045,
            tooltip: "Una mayor población puede representar un entorno dinámico con mayor demanda de servicios y oferta laboral, mientras que una población muy baja puede limitar el desarrollo territorial y la viabilidad de inversiones.",
            escalaInvertida: true
        },
        'Instituciones educativas': {
            banda: 14, peso: 0.045,
            tooltip: "Una amplia oferta educativa fomenta el desarrollo del capital humano y fortalece la cohesión social, mientras que su escasez obstaculiza el desarrollo del territorio.",
            escalaInvertida: true
        },
        'Instituciones de salud': {
            banda: 15, peso: 0.06,
            tooltip: "Un mayor número de centros de salud mejoran el acceso para la población en temas médicos, mientras que una baja disponibilidad incrementa el riesgo por situaciones de salud no tratadas.",
            escalaInvertida: true
        },
        'Áreas protegidas': {
            banda: 21, peso: 0.015,
            tooltip: "Una mayor extensión de áreas protegidas contribuye a la preservación de ecosistemas vitales y fomenta el turismo sostenible, mientras que una baja cobertura incrementa el riesgo de degradación ambiental.",
            escalaInvertida: true
        },
        'Reservas indigenas': {
            banda: 20, peso: 0.03,
            tooltip: "La existencia de reservas indígenas respaldan la autonomía cultural y derechos territoriales, mientras que la ausencia de reservas en territorios en disputa se asocian a conflictos por la tierra.",
            escalaInvertida: true
        },
        'Territorios colectivos de comunidades negras': {
            banda: 19, peso: 0.03,
            tooltip: "La existencia de TCCN fortalecen los derechos colectivos y la gobernanza étnica, mientras que una baja protección territorial refleja un déficit en inclusión y reconocimiento institucional.",
            escalaInvertida: true
        },
        'Prestadores turísticos': {
            banda: 17, peso: 0.045,
            tooltip: "Una alta presencia de prestadores turísticos dinamiza la economía local y promueve el empleo, mientras que su escasez limita la diversificación y el crecimiento de la región.",
            escalaInvertida: true
        },
        'Hoteles': {
            banda: 16, peso: 0.03,
            tooltip: "La presencia de múltiples hoteles incrementa la capacidad de alojamiento y fortalece la confianza inversionista, mientras que una oferta limitada restringe el flujo turístico y las oportunidades de desarrollo.",
            escalaInvertida: true
        }
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
        console.log("🚀 Inicializando análisis multidimensional con tooltips y simbología dinámica...");
        
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
                    variablesInfo: variablesInfo,
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
                
                setupColorRamps();
                resolve(arcgisModules);
            }, reject);
        });
    }

    /**
     * Configurar las tres rampas de colores diferentes
     */
    function setupColorRamps() {
        const { AlgorithmicColorRamp, MultipartColorRamp, Color } = arcgisModules;
        
        // Rampa Rojo → Verde (para combinaciones mixtas)
        const hexStepsRG = [
            "#a50026", "#c43c39", "#d73027", "#e34f2e", "#f46d43", 
            "#fb8d59", "#fdae61", "#fec980", "#fee08b", "#c4d96b", 
            "#84bf5c", "#4fa34d", "#006837"
        ];

        const rampsRG = hexStepsRG.slice(0, -1).map((c, i) =>
            new AlgorithmicColorRamp({
                fromColor: new Color(c),
                toColor: new Color(hexStepsRG[i + 1])
            })
        );

        // Rampa Rojo → Amarillo (para variables negativas/desfavorables)
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

        // Rampa Amarillo → Verde (para variables positivas/favorables - escala invertida)
        const hexStepsYG = [
            "#fee08b", "#f1d56e", "#c4d96b", "#c4d96b", "#84bf5c", 
            "#66b255", "#4fa34d", "#388f45", "#217a3c", "#006837"
        ];

        const rampsYG = hexStepsYG.slice(0, -1).map((c, i) =>
            new AlgorithmicColorRamp({
                fromColor: new Color(c),
                toColor: new Color(hexStepsYG[i + 1])
            })
        );

        window.horizonte = window.horizonte || {};
        window.horizonte.colorRamps = {
            redGreen: new MultipartColorRamp({ colorRamps: rampsRG }),
            redYellow: new MultipartColorRamp({ colorRamps: rampsRY }),
            yellowGreen: new MultipartColorRamp({ colorRamps: rampsYG })
        };
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
        console.log("🎛️ Configurando panel lateral militar con tooltips...");
        
        // Crear estructura del panel lateral
        sidePanel = createSidePanel();
        
        // Añadir al contenedor principal
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.insertBefore(sidePanel, appContainer.firstChild);
            console.log("✅ Panel lateral añadido");
        }

        setupEventListeners();
        setupTooltips();
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
     * Crear controles por dimensión con tooltips
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
        
        Object.entries(variablesInfo).forEach(([dimensionId, variables]) => {
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
            
            Object.entries(variables).forEach(([variableName, config]) => {
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
                        
                        <div class="info-icon" 
                             data-tooltip="${config.tooltip}" 
                             data-dimension="${dimensionId}"
                             data-escala-invertida="${config.escalaInvertida}"
                             style="
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                width: 16px;
                                height: 16px;
                                margin-left: 6px;
                                font-size: 12px;
                                color: var(--primary-color);
                                background-color: rgba(81, 127, 53, 0.15);
                                border: 1px solid var(--primary-color);
                                border-radius: 50%;
                                cursor: help;
                                transition: all 0.2s ease;
                                flex-shrink: 0;
                             ">ℹ</div>
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
     * Configurar sistema de tooltips
     */
    function setupTooltips() {
        // Crear elementos del tooltip
        const tooltip = document.createElement('div');
        const tooltipArrow = document.createElement('div');
        
        tooltip.className = 'custom-tooltip';
        tooltipArrow.className = 'custom-tooltip-arrow';
        
        // Estilos del tooltip
        tooltip.style.cssText = `
            position: fixed;
            z-index: 10000;
            background-color: rgba(26, 34, 40, 0.98);
            color: var(--text-color);
            padding: 12px 14px;
            border-radius: 4px;
            border: 1px solid var(--primary-color);
            font-size: 12px;
            line-height: 1.4;
            width: 280px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
            pointer-events: none;
            text-align: left;
            font-weight: normal;
            backdrop-filter: blur(4px);
        `;

        tooltipArrow.style.cssText = `
            position: fixed;
            width: 0;
            height: 0;
            border: 6px solid transparent;
            border-right-color: var(--primary-color);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
            z-index: 9999;
            pointer-events: none;
        `;
        
        document.body.appendChild(tooltip);
        document.body.appendChild(tooltipArrow);
        
        // Event listeners para los iconos de información
        document.addEventListener('mouseenter', function(e) {
            if (e.target.classList.contains('info-icon')) {
                const rect = e.target.getBoundingClientRect();
                const tooltipText = e.target.getAttribute('data-tooltip');
                const dimension = e.target.getAttribute('data-dimension');
                const escalaInvertida = e.target.getAttribute('data-escala-invertida') === 'true';
                
                tooltip.innerHTML = createTooltipContent(tooltipText, dimension, escalaInvertida);
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'visible';
                
                // Calcular posición
                const tooltipRect = tooltip.getBoundingClientRect();
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                
                let left = rect.right + 10;
                let top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                
                // Verificar si se sale por la derecha
                if (left + tooltipRect.width > windowWidth - 20) {
                    left = rect.left - tooltipRect.width - 10;
                    tooltipArrow.style.borderRightColor = 'transparent';
                    tooltipArrow.style.borderLeftColor = 'var(--primary-color)';
                    tooltipArrow.style.left = (left + tooltipRect.width + 4) + 'px';
                } else {
                    tooltipArrow.style.borderLeftColor = 'transparent';
                    tooltipArrow.style.borderRightColor = 'var(--primary-color)';
                    tooltipArrow.style.left = (left - 6) + 'px';
                }
                
                // Verificar si se sale por abajo
                if (top + tooltipRect.height > windowHeight - 20) {
                    top = windowHeight - tooltipRect.height - 20;
                }
                
                // Verificar si se sale por arriba
                if (top < 20) {
                    top = 20;
                }
                
                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
                tooltipArrow.style.top = (rect.top + rect.height / 2 - 6) + 'px';
                
                // Mostrar con animación
                setTimeout(() => {
                    tooltip.style.opacity = '1';
                    tooltipArrow.style.opacity = '1';
                    tooltipArrow.style.visibility = 'visible';
                }, 10);
            }
        }, true);
        
        document.addEventListener('mouseleave', function(e) {
            if (e.target.classList.contains('info-icon')) {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
                tooltipArrow.style.opacity = '0';
                tooltipArrow.style.visibility = 'hidden';
            }
        }, true);
    }

    /**
     * Crear contenido del tooltip con barra de simbología
     */
    function createTooltipContent(text, dimension, escalaInvertida) {
        const isSecurityDimension = dimension === 'seguridad';
        
        // Determinar qué barra de color usar
        let barClass;
        let leftLabel, rightLabel, leftValue, rightValue;
        
        if (escalaInvertida) {
            // Variables con escala invertida SIEMPRE usan barra amarillo-verde
            barClass = 'development';
            leftLabel = 'BAJO';
            rightLabel = 'ALTO';
            leftValue = '(NEGATIVO)';
            rightValue = '(POSITIVO)';
        } else {
            // Variables normales usan la barra según su dimensión
            if (isSecurityDimension) {
                barClass = 'security';
                leftLabel = 'BAJO';
                rightLabel = 'ALTO';
                leftValue = '(POSITIVO)';
                rightValue = '(NEGATIVO)';
            } else {
                // Para desarrollo y gobernabilidad normales
                barClass = 'security'; // Usan barra rojo-amarillo
                leftLabel = 'BAJO';
                rightLabel = 'ALTO';
                leftValue = '(POSITIVO)';
                rightValue = '(NEGATIVO)';
            }
        }
        
        return `
            <div>${text}</div>
            <div class="tooltip-symbology" style="
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid rgba(81, 127, 53, 0.3);
            ">
                <div class="symbology-label" style="
                    font-size: 10px;
                    text-transform: uppercase;
                    color: var(--primary-color);
                    margin-bottom: 6px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                ">INTERPRETACIÓN DE VALORES</div>
                <div class="symbology-bar ${barClass}" style="
                    height: 20px;
                    border-radius: 3px;
                    position: relative;
                    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: ${barClass === 'security' ? 
                        'linear-gradient(to right, #fee08b, #fdae61, #f46d43, #d73027, #a50026)' : 
                        'linear-gradient(to right, #fee08b, #c4d96b, #84bf5c, #4fa34d, #006837)'};
                ">
                    <div class="symbology-indicator"></div>
                </div>
                <div class="symbology-labels" style="
                    display: flex;
                    justify-content: space-between;
                    margin-top: 4px;
                    font-size: 9px;
                    color: rgba(255, 255, 255, 0.6);
                ">
                    <span>${leftLabel} <small>${leftValue}</small></span>
                    <span>${rightLabel} <small>${rightValue}</small></span>
                </div>
            </div>
        `;
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
     * Aplicar combinación ponderada de bandas con simbología dinámica
     */
    function applyWeightedCombination() {
        if (!imageryLayer || !arcgisModules) {
            return;
        }
        
        const selectedBandsMap = new Map();
        let totalWeight = 0;
        let hasInvertedVariables = false;
        let hasNormalVariables = false;
        const dimensionsActive = new Set();

        ['seguridad', 'desarrollo', 'gobernabilidad'].forEach(dimensionId => {
            const variableCheckboxes = document.querySelectorAll(`.${dimensionId}-variable:checked`);
            
            variableCheckboxes.forEach(checkbox => {
                const label = checkbox.closest('label');
                const variableName = label ? label.querySelector('.variable-name')?.textContent?.trim() : null;
                
                if (!variableName) return;
                
                const config = variablesInfo[dimensionId][variableName];
                
                if (config) {
                    const bandKey = `B${config.banda}`;
                    
                    if (!selectedBandsMap.has(bandKey)) {
                        selectedBandsMap.set(bandKey, {
                            banda: config.banda,
                            peso: config.peso,
                            variable: variableName,
                            dimension: dimensionId,
                            escalaInvertida: config.escalaInvertida
                        });
                        totalWeight += config.peso;
                        dimensionsActive.add(dimensionId);
                        
                        // Analizar tipos de escala
                        if (config.escalaInvertida) {
                            hasInvertedVariables = true;
                        } else {
                            hasNormalVariables = true;
                        }
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

        // Determinar qué rampa de colores usar
        let selectedColorRamp;
        let rampDescription;
        
        if (dimensionsActive.size === 1) {
            // Solo una dimensión activa
            if (dimensionsActive.has('seguridad')) {
                if (hasInvertedVariables && !hasNormalVariables) {
                    selectedColorRamp = window.horizonte.colorRamps.yellowGreen;
                    rampDescription = "Amarillo → Verde (Variables de Seguridad Positivas)";
                } else {
                    selectedColorRamp = window.horizonte.colorRamps.redYellow;
                    rampDescription = "Rojo → Amarillo (Riesgo de Seguridad)";
                }
            } else {
                // Desarrollo o Gobernabilidad
                if (hasInvertedVariables && !hasNormalVariables) {
                    selectedColorRamp = window.horizonte.colorRamps.yellowGreen;
                    rampDescription = "Amarillo → Verde (Variables Positivas)";
                } else if (!hasInvertedVariables && hasNormalVariables) {
                    selectedColorRamp = window.horizonte.colorRamps.redYellow;
                    rampDescription = "Rojo → Amarillo (Variables Negativas)";
                } else {
                    selectedColorRamp = window.horizonte.colorRamps.redGreen;
                    rampDescription = "Rojo → Verde (Variables Mixtas)";
                }
            }
        } else {
            // Múltiples dimensiones
            if (hasInvertedVariables && hasNormalVariables) {
                selectedColorRamp = window.horizonte.colorRamps.redGreen;
                rampDescription = "Rojo → Verde (Análisis Multidimensional Mixto)";
            } else if (hasInvertedVariables && !hasNormalVariables) {
                selectedColorRamp = window.horizonte.colorRamps.yellowGreen;
                rampDescription = "Amarillo → Verde (Variables Positivas Multidimensionales)";
            } else {
                selectedColorRamp = window.horizonte.colorRamps.redYellow;
                rampDescription = "Rojo → Amarillo (Variables Negativas Multidimensionales)";
            }
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
            imageryLayer.renderer = new RasterStretchRenderer({
                stretchType: "standard-deviation",
                numberOfStandardDeviations: 3,
                dynamicRangeAdjustment: true,
                colorRamp: selectedColorRamp
            });

            imageryLayer.visible = true;
            imageryLayer.refresh();

            console.log("🎨 Análisis aplicado:", {
                variables: selectedBands.length,
                rampa: rampDescription,
                dimensiones: Array.from(dimensionsActive),
                invertidas: hasInvertedVariables,
                normales: hasNormalVariables
            });

            showStatus(`Análisis aplicado: ${selectedBands.length} variables - ${rampDescription}`, 'success');
            
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
            initialized: initialized,
            colorRamps: Object.keys(window.horizonte?.colorRamps || {})
        };
    }

    // API pública
    return {
        init,
        applyWeightedCombination,
        getServiceInfo,
        togglePanel,
        isInitialized: () => initialized,
        selectAllVariables: () => {
            const allCheckboxes = document.querySelectorAll('.variable-checkbox');
            allCheckboxes.forEach(cb => cb.checked = true);
            setTimeout(applyWeightedCombination, 100);
        }
    };
})();

// Añadir estilos CSS adicionales para el tema militar y tooltips
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
        
        /* Estilos para información tooltips */
        .info-icon:hover {
            background-color: var(--primary-color) !important;
            color: var(--text-color) !important;
            transform: scale(1.1);
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