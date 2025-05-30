/**
 * config.js - Configuración centralizada para la aplicación
 * Horizonte: Juego de Estrategia
 */

// Verificar que el namespace HORIZONTE existe
if (!window.HORIZONTE) window.HORIZONTE = {};

// Configuración global del sistema
HORIZONTE.config = {
    /**
     * Configuración general de la aplicación
     */
    app: {
        nombre: "HORIZONTE: JUEGO DE ESTRATEGIA",
        version: "1.0.0",
        presupuestoInicial: 10000,
        fechaActualizacion: "2025-03-28"
    },
    
    /**
     * Configuración de la escena 3D
     */
    mapScene: {
        // Configuración del portal de ArcGIS Enterprise
        portal: {
            url: "https://geospatialcenter.bd.esri.com/portal/",
            websceneId: "1daba696f1cf45718f70fdf08e1ebb6d"
        },
        
        // Cámara inicial para la vista 3D
        camera: {
            position: {
                longitude: -73.498537,  
                latitude: 8.409386,
                z: 200000
            },
            heading: 0,
            tilt: 50
        },
        
        // Simbología para puntos en el mapa
        symbols: {
            userPoint: {
                type: "point-3d",
                symbolLayers: [{
                    type: "icon",
                    size: 28,
                    resource: { primitive: "circle" },
                    material: { color: [0, 48, 116, 0.9] },
                    outline: {
                        color: [191, 155, 48, 0.9],
                        size: 1.5
                    }
                }]
            },
            locationOption: {
                type: "point-3d",
                symbolLayers: [{
                    type: "icon",
                    size: 24,
                    resource: { primitive: "triangle" },
                    material: { color: [191, 155, 48, 0.9] },
                    outline: {
                        color: [0, 0, 0, 0.7],
                        size: 1
                    }
                }]
            }
        }
    },
    
    /**
     * Configuración del mapa 2D
     */
    mapViewer: {
        // Configuración del portal y mapa base
        portalUrl: "https://geospatialcenter.bd.esri.com/portal",
        webmapId: "a70f6ac66fce4690b2341294e55ff087",
        
        // Opciones de visualización
        viewOptions: {
            zoom: 7.9,
            center: [-73.998537, 10.809386],
            padding: { top: 0, right: 0, bottom: 0, left: 0 },
            ui: { components: ["attribution"] },
            constraints: { minZoom: 4, maxZoom: 14 }
        },
        
        // Configuración de widgets
        widgets: {
            legend: { enabled: true, position: "bottom-left" },
            layerList: { enabled: true, position: "top-right" },
            search: { enabled: false, position: "top-left" },
            scaleBar: { enabled: false, position: "bottom-right" },
            basemapToggle: {
                enabled: true,
                position: "bottom-right",
                nextBasemap: "satellite"
            },
            home: {
                enabled: true,
                position: "top-left"
            }
        }
    },
    
    /**
     * URLs de servicios
     */
    services: {
        proyectosLayer: "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/ProyectosR/FeatureServer/0"
    },
    
    /**
     * Textos para la interfaz de usuario
     */
    textos: {
        projectTitle: "OPERACIÓN",
        budgetTitle: "RECURSOS ESTRATÉGICOS",
        locationsTitle: "PUNTOS DE DESPLIEGUE",
        selectLocationTitle: "SELECCIONAR PUNTO TÁCTICO",
        lowBudgetWarning: "RECURSOS INSUFICIENTES",
        alreadySelectedWarning: "DESPLEGADO EN TERRENO",
        selectionGuide: "Seleccione una operación de la lista para desplegar en el terreno",
        statusOperational: "Centro de comando operativo inicializado",
        errorLoadingProjects: "Error al cargar datos de operaciones",
        confirmMissionAbort: "¿Está seguro que desea abandonar la misión? Se perderá toda la información del equipo."
    },
    
    /**
     * Configuración de métricas y estadísticas
     */
    metrics: {
        umbralAdvertencia: 60, // Porcentaje para alerta amarilla
        umbralCritico: 80      // Porcentaje para alerta roja
    },
    
    /**
     * Gestión de errores
     */
    errorHandling: {
        // Tiempo de espera para operaciones asíncronas (ms)
        timeout: 30000,
        
        // Número máximo de reintentos
        maxRetries: 3,
        
        // Mensaje de error genérico
        defaultMessage: "Se ha producido un error en el sistema. Por favor, intente de nuevo.",
        
        // Errores específicos
        errorMessages: {
            loadFailed: "Error al cargar los datos. Verifique su conexión a internet.",
            mapFailed: "Error al inicializar el mapa. Intente recargar la página.",
            sessionExpired: "Su sesión ha expirado. Por favor, inicie sesión de nuevo."
        }
    },
    
    /**
     * Animaciones
     */
    animations: {
        // Duración de animaciones (ms)
        duration: {
            short: 300,
            normal: 500,
            long: 1000
        },
        
        // Tipo de easing
        easing: {
            default: "ease",
            mapMovement: "out-expo"
        }
    }
};

// Notificar que la configuración está cargada
document.dispatchEvent(new CustomEvent('horizonte:configLoaded'));