/**
 * multidimensional-integration.js - Integración mejorada del análisis multidimensional con HORIZONTE
 * Maneja la coordinación entre el sistema principal y el nuevo panel lateral
 * Versión actualizada para el panel lateral
 */

(function() {
    // Variables de control de inicialización
    let integrationInitialized = false;
    let initializationAttempts = 0;
    const maxInitializationAttempts = 10;
    
    /**
     * Función principal de inicialización
     */
    function initializeIntegration() {
        if (integrationInitialized) {
            console.log("✅ Integración multidimensional ya inicializada");
            return;
        }

        console.log(`🔄 Intento de inicialización ${initializationAttempts + 1}/${maxInitializationAttempts}`);
        
        // Verificar prerrequisitos
        if (!checkPrerequisites()) {
            initializationAttempts++;
            if (initializationAttempts < maxInitializationAttempts) {
                setTimeout(initializeIntegration, 1000);
            } else {
                console.error("❌ No se pudieron cumplir los prerrequisitos después de múltiples intentos");
                showFallbackMessage();
            }
            return;
        }

        // Inicializar el sistema
        performInitialization();
    }

    /**
     * Verificar que todos los componentes necesarios estén disponibles
     */
    function checkPrerequisites() {
        const requirements = {
            'HORIZONTE namespace': !!window.HORIZONTE,
            'Análisis multidimensional': !!(HORIZONTE.multidimensionalAnalysis),
            'Escena del mapa': !!(HORIZONTE.mapScene),
            'Sistema de utilidades': !!(HORIZONTE.utils)
        };

        const missing = Object.entries(requirements)
            .filter(([name, available]) => !available)
            .map(([name]) => name);

        if (missing.length > 0) {
            console.warn(`🔍 Componentes faltantes:`, missing);
            return false;
        }

        return true;
    }

    /**
     * Realizar la inicialización completa
     */
    function performInitialization() {
        try {
            console.log("🚀 Iniciando integración del panel lateral multidimensional...");
            
            // Configurar listeners de eventos
            setupEventListeners();
            
            // Configurar integración con la escena 3D
            setupSceneIntegration();
            
            // Configurar integración con el sistema de recursos
            setupResourceIntegration();
            
            // Configurar panel lateral
            setupSidePanelIntegration();
            
            // Marcar como inicializado
            integrationInitialized = true;
            
            // Notificar éxito
            console.log("✅ Integración multidimensional completada exitosamente");
            
            // Mostrar mensaje de bienvenida
            setTimeout(() => {
                if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                    HORIZONTE.utils.showStatusMessage(
                        "Panel de análisis multidimensional disponible - Alt+M para abrir",
                        "success",
                        4000
                    );
                }
            }, 2000);
            
            // Disparar evento de integración completa
            document.dispatchEvent(new CustomEvent('horizonte:multidimensionalIntegrated', {
                detail: {
                    timestamp: new Date().toISOString(),
                    features: ['panel lateral', 'nombres de servicios', 'atajos de teclado']
                }
            }));
            
        } catch (error) {
            console.error("❌ Error durante la inicialización:", error);
            showErrorMessage(error);
        }
    }

    /**
     * Configurar listeners de eventos del sistema
     */
    function setupEventListeners() {
        console.log("🎧 Configurando listeners de eventos...");
        
        // Escuchar cuando el sistema esté listo
        document.addEventListener('horizonte:ready', function() {
            console.log("🌟 Sistema HORIZONTE listo");
            
            if (!integrationInitialized) {
                setTimeout(initializeIntegration, 500);
            }
        });
        
        // Escuchar cuando la escena del mapa esté lista
        document.addEventListener('horizonte:mapSceneReady', function(event) {
            console.log("🗺️ Escena 3D lista, inicializando análisis multidimensional...");
            
            setTimeout(() => {
                if (HORIZONTE.multidimensionalAnalysis && HORIZONTE.mapScene && HORIZONTE.mapScene.isInitialized()) {
                    if (!HORIZONTE.multidimensionalAnalysis.isInitialized()) {
                        console.log("🔧 Inicializando análisis multidimensional...");
                        const sceneView = getSceneViewFromMapScene();
                        
                        if (sceneView) {
                            HORIZONTE.multidimensionalAnalysis.init(sceneView);
                        } else {
                            console.warn("⚠️ No se pudo obtener la vista de la escena");
                        }
                    }
                }
            }, 1000);
        });
        
        // Escuchar eventos del análisis multidimensional
        document.addEventListener('horizonte:multidimensionalReady', function() {
            console.log("✅ Análisis multidimensional inicializado exitosamente");
            
            // Configurar funcionalidades adicionales
            setupAdvancedFeatures();
        });
        
        // Escuchar eventos de aplicación de análisis
        document.addEventListener('horizonte:analysisApplied', function(event) {
            console.log("🎯 Análisis aplicado");
            
            // Opcional: Integrar con otros sistemas
            integrateWithProjectSystem();
        });
        
        // Escuchar errores del análisis
        document.addEventListener('horizonte:multidimensionalError', function(event) {
            console.error("❌ Error en análisis multidimensional:", event.detail);
            handleAnalysisError(event.detail);
        });
    }

    /**
     * Configurar integración con la escena 3D
     */
    function setupSceneIntegration() {
        console.log("🎮 Configurando integración con escena 3D...");
        
        // Asegurar que el análisis se inicialice cuando la escena esté lista
        if (HORIZONTE.mapScene && HORIZONTE.mapScene.isInitialized()) {
            const sceneView = getSceneViewFromMapScene();
            if (sceneView && HORIZONTE.multidimensionalAnalysis && !HORIZONTE.multidimensionalAnalysis.isInitialized()) {
                HORIZONTE.multidimensionalAnalysis.init(sceneView);
            }
        }
    }

    /**
     * Configurar integración con el sistema de recursos
     */
    function setupResourceIntegration() {
        console.log("💰 Configurando integración con sistema de recursos...");
        
        // Escuchar cambios en el presupuesto que podrían afectar el análisis
        document.addEventListener('horizonte:presupuestoActualizado', function(event) {
            // El análisis multidimensional no depende directamente del presupuesto,
            // pero podríamos usar esta información para análisis avanzados
            console.log("💸 Presupuesto actualizado, análisis disponible");
        });
    }

    /**
     * Configurar integración específica del panel lateral
     */
    function setupSidePanelIntegration() {
        console.log("📋 Configurando integración del panel lateral...");
        
        // Configurar atajos de teclado mejorados
        setupEnhancedKeyboardShortcuts();
        
        // Configurar gestión de estado del panel
        setupPanelStateManagement();
        
        // Configurar integración con fullscreen
        setupFullscreenIntegration();
    }

    /**
     * Configurar atajos de teclado mejorados
     */
    function setupEnhancedKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Solo procesar si no estamos en un input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Alt + M = Toggle panel multidimensional
            if (e.altKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                if (HORIZONTE.multidimensionalAnalysis && HORIZONTE.multidimensionalAnalysis.togglePanel) {
                    HORIZONTE.multidimensionalAnalysis.togglePanel();
                }
            }
            
            // Alt + Shift + A = Aplicar análisis rápido (todas las variables)
            if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                if (HORIZONTE.multidimensionalAnalysis) {
                    HORIZONTE.multidimensionalAnalysis.selectAllVariables();
                }
            }
            
            // F1 = Mostrar ayuda del análisis
            if (e.key === 'F1') {
                e.preventDefault();
                showAnalysisHelp();
            }
        });
    }

    /**
     * Configurar gestión de estado del panel
     */
    function setupPanelStateManagement() {
        // Recordar el estado del panel entre sesiones
        try {
            const savedPanelState = sessionStorage.getItem('multidimensionalPanelState');
            if (savedPanelState === 'open') {
                // Abrir el panel después de un breve retraso
                setTimeout(() => {
                    if (HORIZONTE.multidimensionalAnalysis && HORIZONTE.multidimensionalAnalysis.togglePanel) {
                        const panel = document.getElementById('multidimensionalSidePanel');
                        if (panel && panel.style.transform !== 'translateX(0px)') {
                            HORIZONTE.multidimensionalAnalysis.togglePanel();
                        }
                    }
                }, 1500);
            }
        } catch (error) {
            console.warn("No se pudo recuperar el estado del panel:", error);
        }
        
        // Guardar el estado cuando cambie
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const panel = document.getElementById('multidimensionalSidePanel');
                    if (panel) {
                        const isOpen = panel.style.transform === 'translateX(0px)';
                        try {
                            sessionStorage.setItem('multidimensionalPanelState', isOpen ? 'open' : 'closed');
                        } catch (error) {
                            console.warn("No se pudo guardar el estado del panel:", error);
                        }
                    }
                }
            });
        });
        
        // Observar el panel cuando esté disponible
        const checkForPanel = setInterval(() => {
            const panel = document.getElementById('multidimensionalSidePanel');
            if (panel) {
                observer.observe(panel, { attributes: true, attributeFilter: ['style'] });
                clearInterval(checkForPanel);
            }
        }, 500);
    }

    /**
     * Configurar integración con fullscreen
     */
    function setupFullscreenIntegration() {
        // Escuchar cambios de fullscreen para ajustar el panel
        document.addEventListener('horizonte:fullscreenChanged', function(event) {
            const panel = document.getElementById('multidimensionalSidePanel');
            if (panel) {
                if (event.detail.isFullscreen) {
                    panel.style.zIndex = '2000'; // Aumentar z-index en fullscreen
                } else {
                    panel.style.zIndex = '1000'; // Restaurar z-index normal
                }
            }
        });
    }

    /**
     * Configurar funcionalidades avanzadas
     */
    function setupAdvancedFeatures() {
        console.log("⚡ Configurando funcionalidades avanzadas...");
        
        // Auto-análisis inteligente basado en proyectos seleccionados
        setupIntelligentAnalysis();
        
        // Integración con sistema de métricas
        setupMetricsIntegration();
        
        // Configurar presets de análisis
        setupAnalysisPresets();
    }

    /**
     * Configurar análisis inteligente
     */
    function setupIntelligentAnalysis() {
        // Escuchar cuando se seleccionen proyectos para sugerir análisis relevantes
        document.addEventListener('horizonte:proyectoSeleccionado', function(event) {
            if (event.detail && event.detail.proyecto) {
                // Podríamos analizar el tipo de proyecto y sugerir dimensiones relevantes
                console.log("🤖 Proyecto seleccionado, análisis inteligente disponible");
            }
        });
    }

    /**
     * Configurar integración con métricas
     */
    function setupMetricsIntegration() {
        // Integrar resultados del análisis con el sistema de métricas
        document.addEventListener('horizonte:analysisApplied', function() {
            if (HORIZONTE.metricsDisplay && HORIZONTE.metricsDisplay.isInitialized()) {
                console.log("📊 Integrando análisis con sistema de métricas");
                // Aquí podríamos añadir métricas específicas del análisis
            }
        });
    }

    /**
     * Configurar presets de análisis
     */
    function setupAnalysisPresets() {
        // Presets útiles para análisis rápidos
        window.analysisPresets = {
            seguridad: () => {
                const checkboxes = document.querySelectorAll('.seguridad-variable');
                checkboxes.forEach(cb => cb.checked = true);
                const dimensionCb = document.getElementById('seguridad-all');
                if (dimensionCb) dimensionCb.checked = true;
                setTimeout(() => HORIZONTE.multidimensionalAnalysis.applyWeightedCombination(), 100);
            },
            desarrollo: () => {
                const checkboxes = document.querySelectorAll('.desarrollo-variable');
                checkboxes.forEach(cb => cb.checked = true);
                const dimensionCb = document.getElementById('desarrollo-all');
                if (dimensionCb) dimensionCb.checked = true;
                setTimeout(() => HORIZONTE.multidimensionalAnalysis.applyWeightedCombination(), 100);
            },
            gobernabilidad: () => {
                const checkboxes = document.querySelectorAll('.gobernabilidad-variable');
                checkboxes.forEach(cb => cb.checked = true);
                const dimensionCb = document.getElementById('gobernabilidad-all');
                if (dimensionCb) dimensionCb.checked = true;
                setTimeout(() => HORIZONTE.multidimensionalAnalysis.applyWeightedCombination(), 100);
            }
        };
    }

    /**
     * Integrar con el sistema de proyectos
     */
    function integrateWithProjectSystem() {
        // Esta función se puede expandir para integrar el análisis con los proyectos seleccionados
        console.log("🔗 Integrando análisis con sistema de proyectos");
    }

    /**
     * Manejar errores del análisis
     */
    function handleAnalysisError(errorDetail) {
        console.error("Detalle del error:", errorDetail);
        
        if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
            HORIZONTE.utils.showStatusMessage(
                "Error en análisis multidimensional. Verifique la conexión de servicios.",
                "error",
                5000
            );
        }
    }

    /**
     * Mostrar ayuda del análisis
     */
    function showAnalysisHelp() {
        const helpMessage = `
        🎯 AYUDA DEL ANÁLISIS MULTIDIMENSIONAL:
        
        • Alt + M: Abrir/cerrar panel
        • Alt + Shift + A: Seleccionar todas las variables
        • F1: Mostrar esta ayuda
        • ESC: Cerrar panel
        
        📊 PRESETS DISPONIBLES EN CONSOLA:
        • analysisPresets.seguridad()
        • analysisPresets.desarrollo()
        • analysisPresets.gobernabilidad()
        `;
        
        console.log(helpMessage);
        
        if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
            HORIZONTE.utils.showStatusMessage(
                "Ayuda del análisis mostrada en consola - F12 para ver detalles",
                "info",
                4000
            );
        }
    }

    /**
     * Mostrar mensaje de fallback si la inicialización falla
     */
    function showFallbackMessage() {
        console.warn("⚠️ Inicialización del análisis multidimensional en modo limitado");
        
        if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
            HORIZONTE.utils.showStatusMessage(
                "Análisis multidimensional disponible en modo básico",
                "warning",
                4000
            );
        }
    }

    /**
     * Mostrar mensaje de error
     */
    function showErrorMessage(error) {
        if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
            HORIZONTE.utils.showStatusMessage(
                "Error al inicializar análisis multidimensional",
                "error",
                4000
            );
        }
    }

    /**
     * Obtener la vista de la escena desde el módulo map-scene
     */
    function getSceneViewFromMapScene() {
        // Si el map-scene expone la vista públicamente, usarla
        if (HORIZONTE.mapScene && typeof HORIZONTE.mapScene.getView === 'function') {
            return HORIZONTE.mapScene.getView();
        }
        
        // Buscar en el DOM
        const viewDiv = document.getElementById('viewDiv');
        if (viewDiv && viewDiv.__esri_view) {
            return viewDiv.__esri_view;
        }
        
        console.warn("⚠️ No se pudo obtener la vista de la escena 3D");
        return null;
    }

    /**
     * Funciones de utilidad para desarrolladores
     */
    window.multidimensionalUtils = {
        getServiceInfo: () => {
            if (HORIZONTE.multidimensionalAnalysis) {
                return HORIZONTE.multidimensionalAnalysis.getServiceInfo();
            }
            return null;
        },
        
        togglePanel: () => {
            if (HORIZONTE.multidimensionalAnalysis && HORIZONTE.multidimensionalAnalysis.togglePanel) {
                HORIZONTE.multidimensionalAnalysis.togglePanel();
            }
        },
        
        showHelp: showAnalysisHelp,
        
        getIntegrationStatus: () => ({
            initialized: integrationInitialized,
            attempts: initializationAttempts,
            timestamp: new Date().toISOString()
        })
    };

    // Iniciar el proceso de integración
    console.log("🔗 Módulo de integración multidimensional mejorado cargado");
    
    // Intentar inicialización inmediata si el DOM ya está listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeIntegration);
    } else {
        // DOM ya está cargado, inicializar inmediatamente
        setTimeout(initializeIntegration, 100);
    }

})();