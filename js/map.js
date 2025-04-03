/**
 * map.js - Integración de componentes de mapas
 * Sirve como puente entre los componentes map-scene.js y map-viewer.js
 */

// Módulo de integración de mapas
(function() {
    // Verificar que el namespace HORIZONTE existe
    if (!window.HORIZONTE) window.HORIZONTE = {};
    
    // Crear el módulo map
    HORIZONTE.map = {};
    
    // Estado del módulo
    const state = {
        activeMapType: null, // 'scene' o 'viewer'
        initialized: false
    };
    
    /**
     * Inicializa la integración de mapas
     */
    function init() {
        if (state.initialized) return;
        
        // Detectar qué tipo de mapa está activo en la página actual
        detectActiveMapType();
        
        // Registrar eventos
        setupEventListeners();
        
        // Marcar como inicializado
        state.initialized = true;
        
        console.log("Módulo de integración de mapas inicializado");
    }
    
    /**
     * Detecta qué tipo de mapa está activo en la página actual
     */
    function detectActiveMapType() {
        const sceneContainer = document.getElementById('viewDiv');
        const mapContainer = document.getElementById('arcgisMap');
        
        if (sceneContainer) {
            state.activeMapType = 'scene';
        } else if (mapContainer) {
            state.activeMapType = 'viewer';
        } else {
            state.activeMapType = null;
        }
        
        console.log(`Tipo de mapa activo: ${state.activeMapType}`);
    }
    
    /**
     * Configura los escuchadores de eventos
     */
    function setupEventListeners() {
        // Escuchar cuando la escena 3D esté lista
        document.addEventListener('horizonte:mapSceneReady', handleMapSceneReady);
        
        // Escuchar cuando el visualizador del mapa esté listo
        document.addEventListener('horizonte:mapViewerReady', handleMapViewerReady);
    }
    
    /**
     * Maneja el evento de escena 3D lista
     * @param {CustomEvent} event - Evento con datos
     */
    function handleMapSceneReady(event) {
        console.log("Evento de escena 3D lista recibido");
        
        // Disparar evento de mapa listo para el tipo activo
        document.dispatchEvent(new CustomEvent('horizonte:mapReady', {
            detail: {
                type: 'scene',
                containerId: event.detail.containerId
            }
        }));
    }
    
    /**
     * Maneja el evento del visualizador de mapa listo
     * @param {CustomEvent} event - Evento con datos
     */
    function handleMapViewerReady(event) {
        console.log("Evento de visualizador de mapa listo recibido");
        
        // Disparar evento de mapa listo para el tipo activo
        document.dispatchEvent(new CustomEvent('horizonte:mapReady', {
            detail: {
                type: 'viewer',
                mapId: event.detail.mapId
            }
        }));
    }
    
    /**
     * Obtiene el tipo de mapa activo
     * @returns {string|null} Tipo de mapa activo ('scene', 'viewer' o null)
     */
    function getActiveMapType() {
        return state.activeMapType;
    }
    
    // Exponer API pública
    HORIZONTE.map = {
        init,
        getActiveMapType
    };
})();

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar con un breve retraso
    setTimeout(() => {
        if (HORIZONTE && HORIZONTE.map) {
            HORIZONTE.map.init();
        }
    }, 500);
});