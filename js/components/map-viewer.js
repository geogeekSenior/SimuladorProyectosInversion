/**
 * map-viewer.js - Componente para visualización de mapas 2D en ArcGIS
 * Para análisis exploratorio en el Simulador de Inversiones Estratégicas
 */

// Módulo para mapas 2D de ArcGIS
(function() {
    // Verificar que el namespace HORIZONTE existe
    if (!window.HORIZONTE) window.HORIZONTE = {};
    
    // Estado del módulo
    const state = {
        webmap: null,
        view: null,
        initialized: false,
        mapId: null
    };
    
    /**
     * Inicializa el visualizador de mapas
     * @param {string} container - ID del contenedor donde se renderizará el mapa
     */
    function init(container) {
        if (state.initialized) return;
        
        state.mapId = container;
        
        // Verificar si el contenedor existe
        const mapContainer = document.getElementById(container);
        if (!mapContainer) {
            console.error(`No se encontró el contenedor del mapa '${container}'`);
            return;
        }
        
        // Actualizar indicador de estado
        const statusIndicator = document.querySelector('.map-status-indicator');
        if (statusIndicator) {
            statusIndicator.textContent = "CARGANDO API...";
            statusIndicator.classList.add('map-status-loading');
        }
        
        // Verificar si require está disponible
        if (typeof require === 'undefined') {
            console.warn("API de ArcGIS no disponible. Cargando dinámicamente...");
            
            // Cargar la API de ArcGIS dinámicamente
            const script = document.createElement('script');
            script.src = "https://js.arcgis.com/4.32/";
            script.onload = function() {
                console.log("API de ArcGIS cargada correctamente");
                loadMap();
            };
            script.onerror = function(e) {
                console.error("Error al cargar la API de ArcGIS:", e);
                if (statusIndicator) {
                    statusIndicator.textContent = "ERROR DE CARGA";
                    statusIndicator.classList.remove('map-status-loading');
                    statusIndicator.classList.add('map-status-error');
                }
                
                // Notificar error
                dispatchErrorEvent("Error al cargar la API de ArcGIS");
            };
            
            // Añadir hoja de estilos
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://js.arcgis.com/4.32/esri/themes/dark/main.css';
            document.head.appendChild(link);
            
            // Añadir script
            document.head.appendChild(script);
        } else {
            // Si require ya está disponible, cargar el mapa directamente
            loadMap();
        }
    }
    
    /**
     * Cargar el mapa con la API de ArcGIS
     */
    function loadMap() {
        // Usar require de ArcGIS
        require([
            "esri/WebMap",
            "esri/views/MapView",
            "esri/widgets/Legend",
            "esri/widgets/LayerList",
            "esri/widgets/Home",
            "esri/widgets/BasemapToggle",
            "esri/config"
        ], function(
            WebMap,
            MapView,
            Legend,
            LayerList,
            Home,
            BasemapToggle,
            esriConfig
        ) {
            // Actualizar indicador de estado
            const statusIndicator = document.querySelector('.map-status-indicator');
            if (statusIndicator) {
                statusIndicator.textContent = "CARGANDO MAPA...";
            }
            
            // Obtener configuración del módulo config
            const config = HORIZONTE.config ? HORIZONTE.config.mapViewer : {
                portalUrl: "https://geospatialcenter.bd.esri.com/portal",
                webmapId: "a70f6ac66fce4690b2341294e55ff087",
                viewOptions: {
                    zoom: 8,
                    center: [-73.198537, 10.809386],
                    padding: { top: 0, right: 0, bottom: 0, left: 0 },
                    ui: { components: ["attribution"] },
                    constraints: { minZoom: 4, maxZoom: 18 }
                },
                widgets: {
                    legend: { enabled: true, position: "bottom-left" },
                    layerList: { enabled: true, position: "top-right" },
                    home: {
                        enabled: true,
                        position: "top-left"
                    },
                    basemapToggle: {
                        enabled: true,
                        position: "bottom-right",
                        nextBasemap: "satellite"
                    }
                }
            };
            
            // Configurar portal de ArcGIS Enterprise si es necesario
            if (config.portalUrl) {
                esriConfig.portalUrl = config.portalUrl;
            }
            
            // Crear instancia del WebMap con el ID proporcionado
            state.webmap = new WebMap({
                portalItem: {
                    id: config.webmapId
                }
            });
            
            // Crear vista del mapa
            state.view = new MapView({
                container: state.mapId,
                map: state.webmap,
                ...config.viewOptions
            });
            
            // Mostrar mensaje de carga
            state.view.when(function() {
                // Actualizar indicador de estado
                if (statusIndicator) {
                    statusIndicator.textContent = "OPERATIVO";
                    statusIndicator.classList.remove('map-status-loading');
                    statusIndicator.classList.add('map-status-operational');
                }
                
                console.log("Vista del mapa inicializada correctamente");
                
                // IMPORTANTE: Ahora añadimos los widgets directamente aquí en lugar de en una función separada
                
                // Añadir widget Home - Lo añadimos primero para asegurarnos de que aparezca
                if (config.widgets.home && config.widgets.home.enabled) {
                    try {
                        const homeWidget = new Home({
                            view: state.view
                        });
                        state.view.ui.add(homeWidget, config.widgets.home.position);
                        console.log("✅ Widget Home añadido en la posición:", config.widgets.home.position);
                    } catch (error) {
                        console.error("❌ Error al añadir widget Home:", error);
                    }
                }
                
                // Añadir widget de leyenda
                if (config.widgets.legend && config.widgets.legend.enabled) {
                    try {
                        const legend = new Legend({ 
                            view: state.view
                        });
                        state.view.ui.add(legend, config.widgets.legend.position);
                        console.log("✅ Widget Legend añadido en la posición:", config.widgets.legend.position);
                    } catch (error) {
                        console.error("❌ Error al añadir widget Legend:", error);
                    }
                }
                
                // Añadir widget de lista de capas
                if (config.widgets.layerList && config.widgets.layerList.enabled) {
                    try {
                        const layerList = new LayerList({
                            view: state.view,
                            listItemCreatedFunction: function(event) {
                                const item = event.item;
                                if (item.layer && item.layer.type != "group") {
                                    item.panel = {
                                        content: "legend",
                                        open: false
                                    };
                                }
                            }
                        });
                        state.view.ui.add(layerList, config.widgets.layerList.position);
                        console.log("✅ Widget LayerList añadido en la posición:", config.widgets.layerList.position);
                    } catch (error) {
                        console.error("❌ Error al añadir widget LayerList:", error);
                    }
                }
                
                // Añadir widget de cambio de mapa base
                if (config.widgets.basemapToggle && config.widgets.basemapToggle.enabled) {
                    try {
                        const basemapToggle = new BasemapToggle({
                            view: state.view,
                            nextBasemap: config.widgets.basemapToggle.nextBasemap
                        });
                        state.view.ui.add(basemapToggle, config.widgets.basemapToggle.position);
                        console.log("✅ Widget BasemapToggle añadido en la posición:", config.widgets.basemapToggle.position);
                    } catch (error) {
                        console.error("❌ Error al añadir widget BasemapToggle:", error);
                    }
                }
                
                // Notificar que el mapa está listo
                dispatchReadyEvent();
                
                // Marcar como inicializado
                state.initialized = true;
            }, function(error) {
                console.error("Error al inicializar el mapa:", error);
                
                // Mostrar error en el indicador de estado
                if (statusIndicator) {
                    statusIndicator.textContent = "ERROR";
                    statusIndicator.classList.remove('map-status-loading');
                    statusIndicator.classList.add('map-status-error');
                }
                
                // Notificar error
                dispatchErrorEvent("Error al inicializar el mapa");
            });
        });
    }
    
    /**
     * Cambia el mapa base
     * @param {string} basemapId - ID del mapa base a mostrar
     */
    function changeBasemap(basemapId) {
        if (!state.view || !state.initialized) return;
        
        state.view.map.basemap = basemapId;
        
        // Notificar cambio de mapa base
        dispatchStatusEvent("Mapa base actualizado", "operational");
    }
    
    /**
     * Centra el mapa en una ubicación específica
     * @param {Object} center - Coordenadas del centro {longitude, latitude}
     * @param {number} zoom - Nivel de zoom (opcional)
     */
    function centerAt(center, zoom) {
        if (!state.view || !state.initialized) return;
        
        const viewParams = {
            center: [center.longitude, center.latitude]
        };
        
        if (zoom) {
            viewParams.zoom = zoom;
        }
        
        state.view.goTo(viewParams, {
            duration: 1000,
            easing: "ease-out"
        });
    }
    
    /**
     * Actualiza la vista del mapa cuando cambia el tamaño del contenedor
     */
    function refreshView() {
        if (!state.view || !state.initialized) return;
        
        // Forzar una actualización del tamaño del mapa
        state.view.padding = { ...state.view.padding };
        
        console.log("Vista del mapa actualizada");
    }
    
    /**
     * Despacha un evento indicando que el mapa está listo
     */
    function dispatchReadyEvent() {
        const readyEvent = new CustomEvent('horizonte:mapViewerReady', {
            detail: {
                mapId: state.mapId
            }
        });
        document.dispatchEvent(readyEvent);
    }
    
    /**
     * Despacha un evento indicando un error en el mapa
     * @param {string} message - Mensaje de error
     */
    function dispatchErrorEvent(message) {
        const errorEvent = new CustomEvent('horizonte:mapViewerError', {
            detail: {
                message: message
            }
        });
        document.dispatchEvent(errorEvent);
    }
    
    /**
     * Despacha un evento indicando un cambio de estado en el mapa
     * @param {string} message - Mensaje de estado
     * @param {string} status - Estado ('loading', 'operational', 'error')
     */
    function dispatchStatusEvent(message, status) {
        const statusEvent = new CustomEvent('horizonte:mapViewerStatus', {
            detail: {
                message: message,
                status: status
            }
        });
        document.dispatchEvent(statusEvent);
    }
    
    /**
     * Verifica si el módulo está inicializado
     * @returns {boolean} True si está inicializado
     */
    function isInitialized() {
        return state.initialized;
    }
    
    // Exponer API pública
    HORIZONTE.mapViewer = {
        init,
        changeBasemap,
        centerAt,
        refreshView,
        isInitialized
    };
})();