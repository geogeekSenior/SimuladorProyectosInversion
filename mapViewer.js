/**
 * mapViewer.js - Componente para visualización de mapas ArcGIS Enterprise
 * Integración para el Simulador de Inversiones de Proyectos Estratégicos
 */

// Configuración global
const mapConfig = {
    // Configuración para portal de ArcGIS Enterprise o ArcGIS Online
    portalUrl: "https://geospatialcenter.bd.esri.com/portal", // URL del portal 
    webmapId: "134c4e3a955b437084dc3ecce59f0dcd", // ID del WebMap a cargar
    
    // Configuraciones visuales
    viewOptions: {
        zoom: 8,
        center: [-73.198537, 10.809386], 


        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        ui: { components: ["attribution"] },
        constraints: { minZoom: 4, maxZoom: 18 }
    },
    
    // Configuración de widgets
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

// Función para inicializar el mapa
function initializeArcGISMap() {
    // Verificar si el contenedor del mapa existe
    const mapContainer = document.getElementById('arcgisMap');
    if (!mapContainer) {
        console.error("No se encontró el contenedor del mapa 'arcgisMap'");
        return;
    }
    
    // Actualizar indicador de estado
    const statusIndicator = document.querySelector('.map-status-indicator');
    if (statusIndicator) {
        statusIndicator.textContent = "CARGANDO API...";
        statusIndicator.classList.add('map-status-loading');
    }
    
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
    };
    
    // Añadir hoja de estilos
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://js.arcgis.com/4.32/esri/themes/dark/main.css';
    document.head.appendChild(link);
    
    // Añadir script
    document.head.appendChild(script);
}

// Cargar el mapa con la API de ArcGIS
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
        
        // Configurar portal de ArcGIS Enterprise si es necesario
        if (mapConfig.portalUrl) {
            esriConfig.portalUrl = mapConfig.portalUrl;
        }
        
        // Crear instancia del WebMap con el ID proporcionado
        const webmap = new WebMap({
            portalItem: {
                id: mapConfig.webmapId
            }
        });

        // Crear vista del mapa
        const view = new MapView({
            container: "arcgisMap",
            map: webmap,
            ...mapConfig.viewOptions
        });

        // Mostrar mensaje de carga
        view.when(function() {
            // Actualizar indicador de estado
            if (statusIndicator) {
                statusIndicator.textContent = "OPERATIVO";
                statusIndicator.classList.remove('map-status-loading');
                statusIndicator.classList.add('map-status-operational');
            }
            
            // Añadir widgets configurados
            addWidgets(view);
            
            console.log("Vista del mapa inicializada correctamente");
        }, function(error) {
            console.error("Error al inicializar el mapa:", error);
            
            // Mostrar error en el indicador de estado
            if (statusIndicator) {
                statusIndicator.textContent = "ERROR";
                statusIndicator.classList.remove('map-status-loading');
                statusIndicator.classList.add('map-status-error');
            }
        });

        // Exponer la vista del mapa al ámbito global
        window.mapView = view;
        
        // Añadir widgets al mapa
        function addWidgets(view) {
            // Añadir widgets configurados
            if (mapConfig.widgets.legend.enabled) {
                const legend = new Legend({ view: view });
                view.ui.add(legend, mapConfig.widgets.legend.position);
            }
            
            if (mapConfig.widgets.layerList.enabled) {
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
                view.ui.add(layerList, mapConfig.widgets.layerList.position);
            }
            
            if (mapConfig.widgets.search.enabled) {
                const searchWidget = new Search({ view: view });
                view.ui.add(searchWidget, mapConfig.widgets.search.position);
            }
            
            if (mapConfig.widgets.scaleBar.enabled) {
                const scaleBar = new ScaleBar({
                    view: view,
                    unit: "dual"
                });
                view.ui.add(scaleBar, mapConfig.widgets.scaleBar.position);
            }
            
            if (mapConfig.widgets.basemapToggle.enabled) {
                const basemapToggle = new BasemapToggle({
                    view: view,
                    nextBasemap: mapConfig.widgets.basemapToggle.nextBasemap
                });
                view.ui.add(basemapToggle, mapConfig.widgets.basemapToggle.position);
            }
        }
    });
}

// Iniciar cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function() {
    // Iniciar después de un breve retraso para asegurar que el DOM esté listo
    setTimeout(() => {
        if (document.getElementById('arcgisMap')) {
            initializeArcGISMap();
        }
    }, 500);
});

// Exponer funciones al ámbito global
window.arcgisMap = {
    initialize: initializeArcGISMap,
    loadMap: function(webmapId) {
        // Actualizar ID y reinicializar
        if (webmapId) mapConfig.webmapId = webmapId;
        if (document.getElementById('arcgisMap')) {
            initializeArcGISMap();
        }
    }
};