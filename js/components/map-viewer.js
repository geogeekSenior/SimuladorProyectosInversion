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
            "esri/widgets/Search",
            "esri/widgets/ScaleBar",
            "esri/widgets/BasemapToggle",
            "esri/config"
        ], function(
            WebMap,
            MapView,
            Legend,
            LayerList,
            Search,
            ScaleBar,
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
                webmapId: "134c4e3a955b437084dc3ecce59f0dcd",
                viewOptions: {
                    zoom: 8,
                    center: [-73.198537, 10.809386],
                    padding: { top: 0, right: 0, bottom: 0, left: 0 },
                    ui: { components: ["attribution"] },
                    constraints: { minZoom: 4, maxZoom: 18 }
                },
                widgets: {
                    legend: { enabled: false, position: "bottom-left" },
                    layerList: { enabled: true, position: "top-right" },
                    search: { enabled: false, position: "top-left" },
                    scaleBar: { enabled: false, position: "bottom-right" },
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
                
                // Añadir widgets configurados
                addWidgets(state.view, config.widgets);
                
                // Notificar que el mapa está listo
                dispatchReadyEvent();
                
                // Marcar como inicializado
                state.initialized = true;
                
                console.log("Vista del mapa inicializada correctamente");
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
     * Añade widgets configurados al mapa
     * @param {MapView} view - Vista del mapa
     * @param {Object} widgetsConfig - Configuración de widgets
     */
    function addWidgets(view, widgetsConfig) {
        require([
            "esri/widgets/Legend",
            "esri/widgets/LayerList",
            "esri/widgets/Search",
            "esri/widgets/ScaleBar",
            "esri/widgets/BasemapToggle"
        ], function(
            Legend,
            LayerList,
            Search,
            ScaleBar,
            BasemapToggle
        ) {
            // Añadir widget de leyenda
            if (widgetsConfig.legend && widgetsConfig.legend.enabled) {
                const legend = new Legend({ view: view });
                view.ui.add(legend, widgetsConfig.legend.position);
            }
            
            // Añadir widget de lista de capas
            if (widgetsConfig.layerList && widgetsConfig.layerList.enabled) {
                const layerList = new LayerList({
                    view: view,
                    listItemCreatedFunction: function(event) {
                        const item = event.item;
                        if (item.layer.type != "group") {
                            item.panel = {
                                content: "legend",
                                open: false
                            };
                        }
                    }
                });
                view.ui.add(layerList, widgetsConfig.layerList.position);
            }
            
            // Añadir widget de búsqueda
            if (widgetsConfig.search && widgetsConfig.search.enabled) {
                const searchWidget = new Search({ view: view });
                view.ui.add(searchWidget, widgetsConfig.search.position);
            }
            
            // Añadir widget de escala
            if (widgetsConfig.scaleBar && widgetsConfig.scaleBar.enabled) {
                const scaleBar = new ScaleBar({
                    view: view,
                    unit: "dual"
                });
                view.ui.add(scaleBar, widgetsConfig.scaleBar.position);
            }
            
            // Añadir widget de cambio de mapa base
            if (widgetsConfig.basemapToggle && widgetsConfig.basemapToggle.enabled) {
                const basemapToggle = new BasemapToggle({
                    view: view,
                    nextBasemap: widgetsConfig.basemapToggle.nextBasemap
                });
                view.ui.add(basemapToggle, widgetsConfig.basemapToggle.position);
            }
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
        isInitialized
    };
})();