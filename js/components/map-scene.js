/**
 * map-scene.js - Componente para visualización de escenas 3D en ArcGIS
 * Gestiona la escena principal para el Simulador de Inversiones Estratégicas
 */

// Módulo para escenas 3D de ArcGIS
(function() {
    // Verificar que el namespace HORIZONTE existe
    if (!window.HORIZONTE) window.HORIZONTE = {};
    
    // Estado del módulo
    const state = {
        webscene: null,
        view: null,
        userPointsLayer: null,
        locationOptionsLayer: null,
        proyectos: [],
        proyectosUsados: new Set(),
        proyectosNombresUsados: new Set(),
        initialized: false,
        containerId: null,
        clickHandle: null
    };
    
    /**
     * Inicializa la escena 3D
     * @param {string} container - ID del contenedor donde se renderizará la escena
     */
    function init(container) {
        if (state.initialized) return;
        
        state.containerId = container;
        
        // Cargar los módulos necesarios de la API de ArcGIS
        require([
            "esri/WebScene",
            "esri/views/SceneView",
            "esri/layers/FeatureLayer",
            "esri/layers/GraphicsLayer",
            "esri/widgets/LayerList",
            "esri/widgets/Expand",
            "esri/Graphic",
            "esri/geometry/Point"
        ], function(
            WebScene, 
            SceneView, 
            FeatureLayer, 
            GraphicsLayer,
            LayerList,
            Expand,
            Graphic, 
            Point
        ) {
            // Obtener configuración del módulo config
            const config = HORIZONTE.config ? HORIZONTE.config.mapScene : {
                portal: {
                    url: "https://geospatialcenter.bd.esri.com/portal",
                    websceneId: "1daba696f1cf45718f70fdf08e1ebb6d"
                },
                camera: {
                    position: {
                        longitude: -73.498537,  
                        latitude: 8.409386,
                        z: 200000
                    },
                    heading: 0,
                    tilt: 50
                }
            };
            
            // Cargar la escena web desde ArcGIS Enterprise con el ID proporcionado
            state.webscene = new WebScene({
                portalItem: {
                    id: config.portal.websceneId,
                    portal: {
                        url: config.portal.url
                    }
                }
            });
            
            // Configuración de la vista 3D con estilo militar
            state.view = new SceneView({
                container: container,
                map: state.webscene,
                camera: config.camera,
                environment: {
                    lighting: {
                        directShadowsEnabled: true,
                        ambientOcclusionEnabled: true
                    },
                    atmosphere: {
                        quality: "high"
                    }
                },
                ui: {
                    components: ["attribution"]
                },
                popup: {
                    dockEnabled: true,
                    dockOptions: {
                        position: "top-right",
                        breakpoint: false
                    }
                }
            });
            
            state.view.popupEnabled = true;
            
            // Capa para puntos de usuario - Proyectos seleccionados
            state.userPointsLayer = new GraphicsLayer({
                title: "Puntos de Despliegue Táctico"
            });
            
            // Cuando la escena esté cargada, añadir la capa de puntos de usuario
            state.webscene.when(() => {
                state.webscene.add(state.userPointsLayer);
                
                // Añadir widget de lista de capas
                const layerList = new LayerList({
                    view: state.view,
                    listItemCreatedFunction: function(event) {
                        const item = event.item;
                        if (item.layer.type !== "group") {
                            item.panel = {
                                content: "legend",
                                open: false
                            };
                        }
                    }
                });
                
                // Crear un widget expandible para la lista de capas
                const layerListExpand = new Expand({
                    view: state.view,
                    content: layerList,
                    expandIconClass: "esri-icon-layers",
                    expanded: false,
                    group: "top-right",
                    expandTooltip: "Capas"
                });
                
                // Añadir el widget a la esquina superior derecha
                state.view.ui.add(layerListExpand, "top-right");
                
                // Cargar datos de proyectos
                loadProyectos()
                    .then(() => {
                        // Notificar que la escena está lista
                        dispatchReadyEvent();
                        
                        // Marcar como inicializado
                        state.initialized = true;
                    })
                    .catch((error) => {
                        console.error("Error al cargar proyectos:", error);
                        
                        // Notificar error
                        dispatchErrorEvent("Error al cargar datos de proyectos");
                    });
            });
        });
    }
    
    /**
     * Carga los datos de proyectos desde el servicio web
     * @returns {Promise} Promesa que se resuelve cuando los datos están cargados
     */
    function loadProyectos() {
        return new Promise((resolve, reject) => {
            // URL del servicio de proyectos desde la configuración o valor predeterminado
            const serviceUrl = HORIZONTE.config && HORIZONTE.config.services 
                ? HORIZONTE.config.services.proyectosLayer 
                : "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/ProyectosR/FeatureServer/0";
            
            console.log("Iniciando carga de proyectos desde:", serviceUrl);
            
            // Notificar estado de carga
            dispatchStatusEvent("Cargando datos de proyectos", "loading");
            
            require(["esri/layers/FeatureLayer"], function(FeatureLayer) {
                // Capa de proyectos desde servicio web
                const proyectosLayer = new FeatureLayer({
                    url: serviceUrl
                });
                
                console.log("FeatureLayer creada, ejecutando consulta...");
                
                // Consultar todos los proyectos
                proyectosLayer.queryFeatures({
                    where: "1=1",
                    outFields: ["*"],
                    returnGeometry: true
                }).then(function(results) {
                    console.log("Consulta exitosa. Detalles de la respuesta:", {
                        totalFeatures: results.features.length,
                        features: results.features,
                        geometryType: results.geometryType,
                        fields: results.fields
                    });
                    
                    if (results.features.length > 0) {
                        console.log("Ejemplo del primer proyecto:", {
                            attributes: results.features[0].attributes,
                            geometry: results.features[0].geometry
                        });
                    } else {
                        console.warn("La consulta devolvió 0 proyectos. Verifica que la URL es correcta y tiene datos.");
                    }
                    
                    // Guardar proyectos
                    state.proyectos = results.features.map(feature => ({
                        attributes: normalizarAtributos(feature.attributes),
                        geometry: feature.geometry
                    }));
                    
                    console.log("Proyectos procesados y guardados:", state.proyectos.length);
                    
                    // Notificar carga completa
                    dispatchStatusEvent("Datos de proyectos cargados", "operational");
                    
                    // Si existe la función renderizarProyectos, llamarla automáticamente
                    if (HORIZONTE.app && HORIZONTE.app.renderizarProyectos) {
                        console.log("Llamando a renderizarProyectos automáticamente");
                        HORIZONTE.app.renderizarProyectos(state.proyectos);
                    } else {
                        console.warn("La función renderizarProyectos no está disponible en HORIZONTE.app");
                    }
                    
                    resolve(state.proyectos);
                }).catch(function(error) {
                    console.error("Error al cargar proyectos:", error);
                    
                    // Notificar error
                    dispatchStatusEvent("Error al cargar datos de proyectos", "error");
                    
                    reject(error);
                });
            });
        });
    }
    
    /**
     * Normaliza los atributos para que todas las claves estén en minúsculas
     * @param {Object} attributes - Atributos a normalizar
     * @returns {Object} Atributos normalizados
     */
    function normalizarAtributos(attributes) {
        return Object.entries(attributes).reduce((acc, [key, value]) => {
            acc[key.toLowerCase()] = value;
            return acc;
        }, {});
    }
    
    /**
     * Muestra las ubicaciones disponibles para un proyecto
     * @param {Object} proyecto - Proyecto seleccionado
     * @returns {Promise} Promesa que se resuelve cuando las ubicaciones están listas
     */
    function mostrarUbicacionesProyecto(proyecto) {
        return new Promise((resolve, reject) => {
            try {
                // Si el nombre del proyecto ya está usado, no hacer nada
                const nombreProyecto = proyecto.attributes.proyecto.toLowerCase();
                if (state.proyectosNombresUsados.has(nombreProyecto)) {
                    reject({
                        code: 'PROYECTO_USADO',
                        message: `Operación ${proyecto.attributes.proyecto} ya desplegada`
                    });
                    return;
                }
                
                // Obtener el presupuesto disponible desde la aplicación principal
                const presupuestoDisponible = HORIZONTE.app && typeof HORIZONTE.app.presupuestoDisponible !== 'undefined' 
                    ? HORIZONTE.app.presupuestoDisponible 
                    : 10000;
                
                console.log(`Verificando disponibilidad para proyecto ${nombreProyecto} con presupuesto ${presupuestoDisponible}`);
                
                // Filtrar ubicaciones disponibles (no usadas y dentro del presupuesto)
                const ubicacionesProyecto = state.proyectos.filter(
                    p => p.attributes.proyecto.toLowerCase() === nombreProyecto &&
                        !state.proyectosUsados.has(p.attributes.objectid) &&
                        p.attributes.valorinversion <= presupuestoDisponible
                );
                
                console.log(`Ubicaciones disponibles para ${nombreProyecto}: ${ubicacionesProyecto.length}`);
                
                // Si no hay ubicaciones disponibles, mostrar mensaje
                if (ubicacionesProyecto.length === 0) {
                    reject({
                        code: 'NO_UBICACIONES',
                        message: `No hay ubicaciones disponibles para ${proyecto.attributes.proyecto}`
                    });
                    return;
                }
                
                // Limpiar capa de ubicaciones anterior si existe
                if (state.locationOptionsLayer) {
                    state.webscene.remove(state.locationOptionsLayer);
                    state.locationOptionsLayer = null;
                }
                
                // Desactivar manejador de clics anterior si existe
                if (state.clickHandle) {
                    state.clickHandle.remove();
                    state.clickHandle = null;
                }
                
                // Crear nueva capa para opciones de ubicación
                require(["esri/layers/GraphicsLayer", "esri/Graphic", "esri/geometry/Point"], 
                    function(GraphicsLayer, Graphic, Point) {
                        
                    // Crear capa para mostrar opciones de ubicación
                    state.locationOptionsLayer = new GraphicsLayer({
                        title: "Puntos de Despliegue Disponibles"
                    });
                    state.webscene.add(state.locationOptionsLayer);
                    
                    // Obtener la simbología de la configuración o usar un valor predeterminado
                    const locationSymbol = HORIZONTE.config && HORIZONTE.config.mapScene && HORIZONTE.config.mapScene.symbols
                        ? HORIZONTE.config.mapScene.symbols.locationOption
                        : {
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
                        };
                    
                    // Crear gráficos para cada ubicación
                    ubicacionesProyecto.forEach((ubicacion, index) => {
                        const punto = new Point({
                            longitude: ubicacion.geometry.longitude,
                            latitude: ubicacion.geometry.latitude
                        });
                        
                        const puntoGraphic = new Graphic({
                            geometry: punto,
                            symbol: locationSymbol,
                            attributes: ubicacion.attributes,
                            popupTemplate: {
                                title: `${ubicacion.attributes.proyecto} - Punto ${index + 1}`,
                                content: [
                                    {
                                        type: "text",
                                        text: `
                                            <div style="padding: 10px; font-family: 'Courier New', monospace;">
                                                <h3 style="color: #d0d3d4; border-bottom: 1px solid #d0d3d4; padding-bottom: 5px;">${ubicacion.attributes.proyecto}</h3>
                                                <p><strong>ID:</strong> ${ubicacion.attributes.objectid}</p>
                                                <p><strong>Recursos requeridos:</strong> $${ubicacion.attributes.valorinversion.toLocaleString()}</p>
                                            </div>
                                        `
                                    }
                                ]
                            }
                        });
                        
                        state.locationOptionsLayer.add(puntoGraphic);
                    });
                    
                    // Animación de la cámara para centrar en las ubicaciones
                    state.view.goTo({ 
                        target: state.locationOptionsLayer.graphics,
                        tilt: 60,
                        zoom: 10
                    }, {
                        duration: 1500,
                        easing: "out-expo"
                    }).catch(error => {
                        console.warn("Error al mover la cámara:", error);
                    });
                    
                    // Añadir manejador de eventos para clicks en el mapa
                    state.clickHandle = state.view.on('click', function(event) {
                        state.view.hitTest(event).then(function(response) {
                            if (response.results.length > 0) {
                                const graphic = response.results[0].graphic;
                                
                                if (graphic.layer === state.locationOptionsLayer) {
                                    try {
                                        // Verificar si el método popup.open existe
                                        if (state.view.popup && typeof state.view.popup.open === 'function') {
                                            state.view.popup.open({
                                                features: [graphic],
                                                location: event.mapPoint
                                            });
                                        } else {
                                            // Alternativa si el método popup.open no está disponible
                                            console.log("Punto seleccionado:", graphic.attributes);
                                            // Mostrar un mensaje al usuario
                                            if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                                                HORIZONTE.utils.showStatusMessage(
                                                    `Seleccionado: ${graphic.attributes.proyecto} (ID: ${graphic.attributes.objectid})`, 
                                                    "info"
                                                );
                                            }
                                        }
                                    } catch (error) {
                                        console.warn("No se pudo abrir el popup:", error);
                                        // Mostrar un mensaje alternativo
                                        if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                                            HORIZONTE.utils.showStatusMessage(
                                                `Seleccionado: ${graphic.attributes.proyecto} (ID: ${graphic.attributes.objectid})`, 
                                                "info"
                                            );
                                        }
                                    }
                                }
                            }
                        }).catch(error => {
                            console.warn("Error en hitTest:", error);
                        });
                    });
                    
                    // Resolver con las ubicaciones y el nombre del proyecto
                    resolve({
                        ubicaciones: ubicacionesProyecto,
                        nombreProyecto: proyecto.attributes.proyecto
                    });
                });
            } catch (error) {
                console.error("Error inesperado en mostrarUbicacionesProyecto:", error);
                reject({
                    code: 'ERROR_INESPERADO',
                    message: "Ocurrió un error inesperado al mostrar ubicaciones",
                    error: error
                });
            }
        });
    }
    
    /**
     * Selecciona una ubicación específica para un proyecto
     * @param {number} objectId - ID del objeto a seleccionar
     * @param {Array} ubicacionesProyecto - Lista de ubicaciones disponibles
     * @param {string} nombreProyecto - Nombre del proyecto
     * @returns {Promise} Promesa que se resuelve cuando la ubicación es seleccionada
     */
    function seleccionarUbicacion(objectId, ubicacionesProyecto, nombreProyecto) {
        return new Promise((resolve, reject) => {
            const proyectoSeleccionado = ubicacionesProyecto.find(
                p => p.attributes.objectid === objectId
            );
            
            if (!proyectoSeleccionado) {
                reject({
                    code: 'UBICACION_NO_ENCONTRADA',
                    message: "Error: Ubicación no encontrada"
                });
                return;
            }
            
            // Obtener el presupuesto disponible desde la aplicación principal
            const presupuestoDisponible = HORIZONTE.app && typeof HORIZONTE.app.presupuestoDisponible !== 'undefined'
                ? HORIZONTE.app.presupuestoDisponible 
                : 10000;
            
            // Verificar presupuesto - importante doble verificación
            const valorInversion = proyectoSeleccionado.attributes.valorinversion;
            if (valorInversion > presupuestoDisponible) {
                console.log(`Presupuesto insuficiente: ${valorInversion} > ${presupuestoDisponible}`);
                reject({
                    code: 'PRESUPUESTO_INSUFICIENTE',
                    message: "Recursos insuficientes para esta operación",
                    valorInversion: valorInversion
                });
                return;
            }
            
            // Coordenadas del punto
            const coordenadas = {
                longitude: proyectoSeleccionado.geometry.longitude,
                latitude: proyectoSeleccionado.geometry.latitude
            };
            
            // Crear punto en el mapa
            crearPuntoProyecto(proyectoSeleccionado.attributes, coordenadas)
                .then(puntoCreado => {
                    // Limpiar capa de opciones de ubicación
                    clearLocationOptions();
                    
                    // Añadir el ID y nombre del proyecto a los sets de usados
                    state.proyectosUsados.add(proyectoSeleccionado.attributes.objectid);
                    state.proyectosNombresUsados.add(nombreProyecto.toLowerCase());
                    
                    // Resolver con el punto creado y detalles del proyecto
                    resolve({
                        punto: puntoCreado,
                        proyecto: proyectoSeleccionado.attributes
                    });
                })
                .catch(error => {
                    console.error("Error al crear punto:", error);
                    reject({
                        code: 'ERROR_CREAR_PUNTO',
                        message: "Error al crear punto en el mapa"
                    });
                });
        });
    }
    
    /**
     * Crea un punto de proyecto en el mapa
     * @param {Object} proyecto - Datos del proyecto
     * @param {Object} coordenadas - Coordenadas del punto {longitude, latitude}
     * @returns {Promise} Promesa que se resuelve con el punto creado
     */
    function crearPuntoProyecto(proyecto, coordenadas) {
        return new Promise((resolve, reject) => {
            try {
                require(["esri/Graphic", "esri/geometry/Point"], function(Graphic, Point) {
                    // Validar datos necesarios
                    if (!proyecto.objectid || 
                        !coordenadas?.longitude || 
                        !coordenadas?.latitude || 
                        state.proyectosUsados.has(proyecto.objectid)) {
                        reject(new Error("Datos de proyecto inválidos"));
                        return;
                    }
                    
                    // Obtener la simbología de la configuración o usar un valor predeterminado
                    const pointSymbol = HORIZONTE.config && HORIZONTE.config.mapScene && HORIZONTE.config.mapScene.symbols
                        ? HORIZONTE.config.mapScene.symbols.userPoint
                        : {
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
                        };
                    
                    // Crear punto en el mapa
                    const punto = new Point({
                        longitude: coordenadas.longitude,
                        latitude: coordenadas.latitude
                    });
                    
                    // Crear gráfico con estilo militar
                    const puntoGraphic = new Graphic({
                        geometry: punto,
                        symbol: pointSymbol,
                        attributes: proyecto,
                        popupTemplate: {
                            title: `OPERACIÓN: ${proyecto.proyecto}`,
                            content: [
                                {
                                    type: "text",
                                    text: `
                                        <div style="padding: 12px; font-family: 'Courier New', monospace; border-left: 4px solid #d0d3d4;">
                                            <h3 style="color: #d0d3d4; border-bottom: 1px solid #d0d3d4; padding-bottom: 8px; margin-bottom: 10px;">
                                                ${proyecto.proyecto}
                                            </h3>
                                            <p style="margin-bottom: 8px;"><strong>ID:</strong> ${proyecto.objectid}</p>
                                            <p style="margin-bottom: 8px;"><strong>Recursos asignados:</strong> $${proyecto.valorinversion.toLocaleString()}</p>
                                        </div>
                                    `
                                }
                            ]
                        }
                    });
                    
                    // Añadir a la capa
                    state.userPointsLayer.add(puntoGraphic);
                    
                    // Animar la cámara al punto
                    state.view.goTo({ 
                        target: puntoGraphic, 
                        zoom: 12,
                        tilt: 65 
                    }, {
                        duration: 1500,
                        easing: "out-expo"
                    }).catch(console.error);
                    
                    // Resolver con el punto creado
                    resolve(puntoGraphic);
                });
            } catch (error) {
                console.error("Error al crear punto de proyecto:", error);
                reject(error);
            }
        });
    }
    
    /**
     * Limpia la capa de opciones de ubicación
     */
    function clearLocationOptions() {
        if (state.locationOptionsLayer) {
            state.webscene.remove(state.locationOptionsLayer);
            state.locationOptionsLayer = null;
        }
        
        if (state.clickHandle) {
            state.clickHandle.remove();
            state.clickHandle = null;
        }
    }
    
    /**
     * Despacha un evento indicando que la escena está lista
     */
    function dispatchReadyEvent() {
        const readyEvent = new CustomEvent('horizonte:mapSceneReady', {
            detail: {
                containerId: state.containerId
            }
        });
        document.dispatchEvent(readyEvent);
    }
    
    /**
     * Despacha un evento indicando un error en la escena
     * @param {string} message - Mensaje de error
     */
    function dispatchErrorEvent(message) {
        const errorEvent = new CustomEvent('horizonte:mapSceneError', {
            detail: {
                message: message
            }
        });
        document.dispatchEvent(errorEvent);
    }
    
    /**
     * Despacha un evento indicando un cambio de estado en la escena
     * @param {string} message - Mensaje de estado
     * @param {string} status - Estado ('loading', 'operational', 'error')
     */
    function dispatchStatusEvent(message, status) {
        const statusEvent = new CustomEvent('horizonte:mapSceneStatus', {
            detail: {
                message: message,
                status: status
            }
        });
        document.dispatchEvent(statusEvent);
    }
    
    /**
     * Obtiene los proyectos cargados
     * @returns {Array} Lista de proyectos
     */
    function getProyectos() {
        return state.proyectos;
    }
    
    /**
     * Verifica si el módulo está inicializado
     * @returns {boolean} True si está inicializado
     */
    function isInitialized() {
        return state.initialized;
    }
    
    // Exponer API pública
    HORIZONTE.mapScene = {
        init,
        getProyectos,
        mostrarUbicacionesProyecto,
        seleccionarUbicacion,
        clearLocationOptions,
        isInitialized
    };
})();