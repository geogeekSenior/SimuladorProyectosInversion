/**
 * main.js - Cargador principal de módulos y componentes
 * Gestiona la inicialización secuencial del Simulador de Inversiones Estratégicas
 */

// Namespace global para la aplicación
window.HORIZONTE = window.HORIZONTE || {};

/**
 * Gestor de carga de módulos
 */
HORIZONTE.Loader = (function() {
    // Lista de módulos a cargar en orden
    const modules = [
        { path: 'js/config.js', critical: true },
        { path: 'js/utils.js', critical: true },
        { path: 'js/components/progress-stepper.js', critical: false },
        { path: 'js/components/map-scene.js', critical: false },
        { path: 'js/components/map-viewer.js', critical: false },
        { path: 'js/components/metrics-display.js', critical: false },
        { path: 'js/map.js', critical: false },
        { path: 'js/team.js', critical: false },
        { path: 'js/navigation.js', critical: false },
        { path: 'js/app.js', critical: true }
    ];
    
    // Estado del módulo
    const state = {
        modulesLoaded: [],
        modulesFailed: [],
        initialized: false
    };
    
    /**
     * Carga un script de forma dinámica
     * @param {string} src - Ruta del script a cargar
     * @returns {Promise} Promesa que se resuelve cuando el script está cargado
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar si el script ya está cargado
            if (document.querySelector(`script[src="${src}"]`)) {
                console.log(`Módulo ya cargado: ${src}`);
                resolve({ src, status: 'already-loaded' });
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Mantener el orden de carga
            
            script.onload = () => {
                console.log(`Módulo cargado: ${src}`);
                state.modulesLoaded.push(src);
                resolve({ src, status: 'loaded' });
            };
            
            script.onerror = () => {
                console.error(`Error al cargar el módulo: ${src}`);
                state.modulesFailed.push(src);
                reject({ src, status: 'error' });
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Carga los módulos en secuencia
     * @returns {Promise} Promesa que se resuelve cuando todos los módulos están cargados
     */
    async function loadModules() {
        try {
            for (const module of modules) {
                try {
                    await loadScript(module.path);
                } catch (error) {
                    // Si el módulo es crítico, propagar el error
                    if (module.critical) {
                        throw error;
                    }
                    
                    // Si no es crítico, log del error y continuar
                    console.warn(`Módulo no crítico falló al cargar: ${module.path}`);
                }
            }
            
            // Marcar como inicializado
            state.initialized = true;
            
            // Disparar evento de carga completa
            dispatchLoadedEvent();
            
            return {
                loaded: state.modulesLoaded,
                failed: state.modulesFailed,
                status: 'success'
            };
        } catch (error) {
            // Disparar evento de error
            dispatchErrorEvent(error);
            
            throw error;
        }
    }
    
    /**
     * Inicializa la aplicación
     */
    function initApp() {
        // Verificar que los componentes necesarios estén disponibles
        if (window.HORIZONTE.app && typeof window.HORIZONTE.app.init === 'function') {
            window.HORIZONTE.app.init();
        } else {
            console.error("Error: Componente app no disponible");
        }
    }
    
    /**
     * Despacha un evento indicando que todos los módulos están cargados
     */
    function dispatchLoadedEvent() {
        const loadedEvent = new CustomEvent('horizonte:loaded', {
            detail: {
                modules: state.modulesLoaded
            }
        });
        document.dispatchEvent(loadedEvent);
        
        // También despachar un evento genérico para la aplicación
        const readyEvent = new CustomEvent('horizonte:ready');
        document.dispatchEvent(readyEvent);
    }
    
    /**
     * Despacha un evento indicando un error en la carga de módulos
     * @param {Object} error - Objeto de error
     */
    function dispatchErrorEvent(error) {
        const errorEvent = new CustomEvent('horizonte:loadError', {
            detail: {
                error: error,
                modulesFailed: state.modulesFailed
            }
        });
        document.dispatchEvent(errorEvent);
    }
    
    /**
     * Verifica si un módulo está disponible
     * @param {string} modulePath - Ruta del módulo
     * @returns {boolean} True si el módulo está cargado
     */
    function isModuleLoaded(modulePath) {
        return state.modulesLoaded.includes(modulePath);
    }
    
    /**
     * Obtiene estadísticas de carga de módulos
     * @returns {Object} Estadísticas de carga
     */
    function getLoadingStats() {
        return {
            total: modules.length,
            loaded: state.modulesLoaded.length,
            failed: state.modulesFailed.length,
            pending: modules.length - state.modulesLoaded.length - state.modulesFailed.length,
            initialized: state.initialized
        };
    }
    
    // API pública
    return {
        loadModules,
        initApp,
        isModuleLoaded,
        getLoadingStats
    };
})();

// Iniciar la carga cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando carga de módulos...");
    
    HORIZONTE.Loader.loadModules()
        .then(result => {
            console.log("Carga de módulos completada:", result);
            // Inicializar la aplicación después de un breve retraso
            setTimeout(() => {
                HORIZONTE.Loader.initApp();
                
                // Inicializar el sistema de consulta de puntos
                initPuntosConsultaSystem();
            }, 500);
        })
        .catch(error => {
            console.error("Error crítico en la carga de módulos:", error);
            
            // Mostrar mensaje de error
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = "Error al cargar componentes del sistema. Por favor, recargue la página.";
            errorMsg.style.position = 'fixed';
            errorMsg.style.top = '50%';
            errorMsg.style.left = '50%';
            errorMsg.style.transform = 'translate(-50%, -50%)';
            errorMsg.style.backgroundColor = 'rgba(172, 28, 28, 0.9)';
            errorMsg.style.color = 'white';
            errorMsg.style.padding = '20px';
            errorMsg.style.borderRadius = '4px';
            errorMsg.style.zIndex = '9999';
            document.body.appendChild(errorMsg);
        });
});

/**
 * Obtiene la información actualizada del equipo
 * @returns {Object} Información del equipo o valores por defecto
 */
function getUpdatedTeamInfo() {
    // Intentar primero obtener la información desde HORIZONTE.team
    if (HORIZONTE.team && HORIZONTE.team.isInitialized()) {
        return {
            name: HORIZONTE.team.getTeamName(),
            code: HORIZONTE.team.getTeamCode()
        };
    }
    
    // Si no está disponible, intentar obtenerla de sessionStorage
    try {
        const teamInfoStr = sessionStorage.getItem('teamInfo');
        if (teamInfoStr) {
            const teamInfo = JSON.parse(teamInfoStr);
            return {
                name: teamInfo.name,
                code: teamInfo.code
            };
        }
    } catch (error) {
        console.warn('Error al obtener información del equipo desde sessionStorage:', error);
    }
    
    // Valor por defecto si no se encuentra en ningún lado
    return { 
        name: "Sin equipo", 
        code: "0000-000000" 
    };
}

/**
 * Inicializa el sistema para consultar puntos seleccionados desde consola
 */
function initPuntosConsultaSystem() {
    // Crear instancia global de FeatureSet si no existe
    if (window.FeatureSet && !window.miFeatureSet) {
        window.miFeatureSet = new FeatureSet();
        
        // Configurar event listeners para mantener actualizado el FeatureSet
        // Cuando se seleccione un punto, añadirlo al FeatureSet
        document.addEventListener('horizonte:proyectoSeleccionado', function(event) {
            if (window.miFeatureSet && event.detail && event.detail.punto) {
                // Obtener información ACTUAL del equipo (corregido)
                const teamInfo = getUpdatedTeamInfo();
                
                // Asegurarse de que el punto tenga atributos
                if (!event.detail.punto.attributes) {
                    event.detail.punto.attributes = {};
                }
                
                // Añadir información del equipo a los atributos del punto
                event.detail.punto.attributes.teamName = teamInfo.name;
                event.detail.punto.attributes.teamCode = teamInfo.code;
                
                // Actualizar la información del equipo en el FeatureSet también
                window.miFeatureSet.teamInfo = {
                    name: teamInfo.name,
                    code: teamInfo.code,
                    createdAt: window.miFeatureSet.teamInfo ? window.miFeatureSet.teamInfo.createdAt : new Date().toISOString()
                };
                
                // Añadir el punto al FeatureSet
                window.miFeatureSet.agregarFeature(event.detail.punto);
                console.log('Punto añadido a miFeatureSet con info de equipo actualizada:', 
                            event.detail.proyecto.objectid, 
                            'Equipo:', teamInfo.name, 
                            'Código:', teamInfo.code);
            }
        });
        
        // Agregar métodos a la consola global si no están disponibles
        if (!window.HORIZONTE.consola) {
            window.HORIZONTE.consola = {
                // Método abreviado para mostrar puntos en consola
                verPuntos: function() {
                    const puntos = {
                        geometrias: window.miFeatureSet.obtenerGeometrias(),
                        atributos: window.miFeatureSet.obtenerAtributos()
                    };
                    console.log(JSON.stringify(puntos, null, 2));
                    return "Puntos mostrados en consola";
                },
                
                // Método para imprimir solo geometrías
                verGeometrias: function() {
                    console.log(JSON.stringify(window.miFeatureSet.obtenerGeometrias(), null, 2));
                    return "Geometrías mostradas en consola";
                },
                
                // Método para imprimir solo atributos
                verAtributos: function() {
                    console.log(JSON.stringify(window.miFeatureSet.obtenerAtributos(), null, 2));
                    return "Atributos mostrados en consola";
                },
                
                // Método para filtrar por atributo
                filtrarPor: function(atributo, valor) {
                    const resultados = window.miFeatureSet.filtrarPorAtributo(atributo, valor);
                    console.log(JSON.stringify(resultados, null, 2));
                    return `Resultados filtrados por ${atributo}=${valor}`;
                },
                
                // Método para mostrar resumen
                resumen: function() {
                    const resumen = {
                        totalPuntos: window.miFeatureSet.features.length,
                        puntosSeleccionados: window.miFeatureSet.obtenerGeometrias().length,
                        equipo: getUpdatedTeamInfo() // Usar la función para obtener info actualizada
                    };
                    
                    // Añadir información de presupuesto si está disponible
                    if (window.resourceManager) {
                        resumen.presupuestoInicial = window.resourceManager.initialBudget;
                        resumen.presupuestoActual = window.resourceManager.availableBudget;
                        resumen.presupuestoUsado = window.resourceManager.initialBudget - window.resourceManager.availableBudget;
                        resumen.porcentajeUtilizado = ((resumen.presupuestoUsado / resumen.presupuestoInicial) * 100).toFixed(2) + '%';
                    }
                    
                    console.log(JSON.stringify(resumen, null, 2));
                    return "Resumen mostrado en consola";
                },
                
                // Ayuda para mostrar comandos disponibles
                ayuda: function() {
                    console.log("Comandos disponibles en HORIZONTE.consola:");
                    console.log("- verPuntos(): Muestra todos los puntos seleccionados");
                    console.log("- verGeometrias(): Muestra solo las geometrías");
                    console.log("- verAtributos(): Muestra solo los atributos");
                    console.log("- filtrarPor(atributo, valor): Filtra puntos por atributo");
                    console.log("- resumen(): Muestra un resumen de puntos y presupuesto");
                    return "Ayuda mostrada en consola";
                }
            };
        }
        
        // Notificar en consola que el sistema está listo
        console.log("%c[HORIZONTE] Sistema de consulta de puntos inicializado", "color:#517f35; font-weight:bold;");
        console.log("%cPuede usar HORIZONTE.consola.ayuda() para ver comandos disponibles", "color:#517f35;");
    }
    
    // Actualizar la información del equipo cada vez que cambie
    document.addEventListener('horizonte:teamUpdated', function(event) {
        if (window.miFeatureSet) {
            // Actualizar la información del equipo en el FeatureSet
            const teamInfo = getUpdatedTeamInfo();
            window.miFeatureSet.teamInfo = {
                name: teamInfo.name,
                code: teamInfo.code,
                createdAt: window.miFeatureSet.teamInfo ? window.miFeatureSet.teamInfo.createdAt : new Date().toISOString()
            };
            console.log('Información del equipo actualizada en miFeatureSet:', teamInfo);
        }
    });
}

// Actualizar fecha actual
document.addEventListener('horizonte:ready', () => {
    // Actualizar fecha en el footer si está disponible
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const now = new Date();
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        const dateStr = now.toLocaleString('es-ES', options).replace(',', ' / ');
        currentDateElement.textContent = dateStr;
    }
    
    // Inicializar controles específicos de página
    initPageSpecificControls();
});

/**
 * Inicializa controles específicos para cada página
 */
function initPageSpecificControls() {
    // Botón para proceder al paso siguiente en step1.html
    const proceedButton = document.getElementById('proceed-button');
    if (proceedButton) {
    proceedButton.addEventListener('click', function(event) {
        // Prevenir comportamiento por defecto
        event.preventDefault();
        event.stopPropagation();
        
        // Abrir en nueva pestaña
        window.open('index.html', '_blank');
        
        // Mostrar confirmación
        if (window.HORIZONTE && HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
            HORIZONTE.utils.showStatusMessage("Abriendo Ciclo 1 en nueva pestaña...", "success", 2000);
        }
        
        // Retornar false para prevenir cualquier otra acción
        return false;
    });
}
    
    // Botón para continuar al ciclo 2 en step3.html
    const restartButtonStep3 = document.getElementById('restart-button');
    if (restartButtonStep3 && window.location.pathname.includes('step3.html')) {
        restartButtonStep3.addEventListener('click', function() {
            window.location.href = 'step4.html';
        });
    }
    
    // Botón para reiniciar completamente en step5.html
    const restartButtonStep5 = document.getElementById('restart-button');
    if (restartButtonStep5 && window.location.pathname.includes('step5.html')) {
        restartButtonStep5.addEventListener('click', function() {
            window.location.href = 'step1.html';
        });
    }
    
    // Animación de barras de dimensiones
    setTimeout(() => {
        // Animar barras de dimensiones en step1.html y step3.html
        const dimensionBars = document.querySelectorAll('.bar-inner');
        if (dimensionBars.length > 0) {
            dimensionBars.forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = width;
                }, 300);
            });
            
            // Animar mejoras en step3.html y step5.html
            setTimeout(() => {
                const improvementBars = document.querySelectorAll('.bar-improvement');
                if (improvementBars.length > 0) {
                    improvementBars.forEach(bar => {
                        const width = bar.style.width;
                        bar.style.width = '0%';
                        setTimeout(() => {
                            bar.style.width = width;
                        }, 100);
                    });
                }
                
                // Animar barras de impacto de proyectos en step3.html y step5.html
                setTimeout(() => {
                    const impactBars = document.querySelectorAll('.impact-bar');
                    if (impactBars.length > 0) {
                        impactBars.forEach(bar => {
                            const width = bar.style.width;
                            bar.style.width = '0%';
                            setTimeout(() => {
                                bar.style.width = width;
                            }, 100);
                        });
                    }
                }, 1000);
            }, 1000);
        }
    }, 500);
}

// Asegurarse de que la información del equipo esté disponible y actualizada
// Añadir un verificador periódico para mantener actualizados los datos del equipo
setInterval(() => {
    if (window.miFeatureSet) {
        const currentTeamInfo = getUpdatedTeamInfo();
        const featureSetTeamInfo = window.miFeatureSet.teamInfo || {};
        
        // Si la información del equipo ha cambiado, actualizarla en el FeatureSet
        if (currentTeamInfo.code !== featureSetTeamInfo.code || 
            currentTeamInfo.name !== featureSetTeamInfo.name) {
            window.miFeatureSet.teamInfo = {
                name: currentTeamInfo.name,
                code: currentTeamInfo.code,
                createdAt: featureSetTeamInfo.createdAt || new Date().toISOString()
            };
            console.log('Información del equipo actualizada periódicamente:', currentTeamInfo);
        }
    }
}, 2000); // Verificar cada 2 segundos