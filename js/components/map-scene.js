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
            
            // Cuando la escena esté cargada, añadir las capas y widgets
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

                // --- INICIO: CÓDIGO PARA LEYENDA HTML FIJA ---
                console.log("Creando leyenda HTML personalizada fija.");
                // 1. Definir el contenido HTML de la leyenda 
                const leyendaHtml = `<div style="padding: 10px; background-color: rgba(0, 0, 0, 0.7); color: white; font-family: sans-serif; font-size: 12px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                    <div class="leyenda-item" style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="
                            display: inline-block; 
                            width: 0; 
                            height: 0; 
                            border-left: 8px solid transparent; 
                            border-right: 8px solid transparent; 
                            border-bottom: 14px solid rgb(191, 155, 48); /* Amarillo/Oro */
                            margin-right: 8px; 
                            flex-shrink: 0; 
                        "></span>
                        <span>Puntos de Despliegue Disponibles (Seleccionable)</span>
                    </div>
                    <div class="leyenda-item" style="display: flex; align-items: center;">
                        <span style="
                            display: inline-block; 
                            width: 14px; 
                            height: 14px; 
                            background-color: rgb(0, 48, 116); /* Azul */
                            border-radius: 50%; 
                            border: 1.5px solid rgb(191, 155, 48); /* Contorno Amarillo/Oro */
                            margin-right: 8px; 
                            flex-shrink: 0; 
                        "></span>
                        <span>Puntos de Despliegue Táctico (Proyecto Elegido)</span>
                    </div>
                </div>`; // <-- Usar backticks para strings multilínea

                const style = document.createElement('style');               style.textContent = `
                    .leyenda-item span {
                        font-family: var(--font-monospace);
                        font-size: var(--font-size-md);
                    }
                `;
                document.head.appendChild(style);
                
                // 2. Crear un nodo DOM para la leyenda 
                const leyendaNode = document.createElement("div"); 
                leyendaNode.innerHTML = leyendaHtml; 
                console.log("Nodo DOM para leyenda HTML creado.");
                // 3. Añadir el nodo HTML directamente a la UI (sin Expand) 
                state.view.ui.add(leyendaNode, "bottom-left"); // Añade el DIV directamente a la esquina inferior izquierda 
                console.log("Leyenda HTML fija añadida a la UI.");
                // --- FIN: CÓDIGO PARA LEYENDA HTML FIJA ---
                
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
                require(["esri/layers/GraphicsLayer", "esri/Graphic", "esri/geometry/Point", "esri/symbols/TextSymbol"], 
                    function(GraphicsLayer, Graphic, Point, TextSymbol) {
                        
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
                        
                        // Añadir atributo para el número de punto
                        ubicacion.attributes.numeroPunto = index + 1;
                        
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
                                                <p><strong>Punto:</strong> ${index + 1}</p>
                                                <p><strong>Recursos requeridos:</strong> $${ubicacion.attributes.valorinversion.toLocaleString()}</p>
                                            </div>
                                        `
                                    }
                                ]
                            }
                        });
                        
                        // Añadir el punto a la capa
                        state.locationOptionsLayer.add(puntoGraphic);
                        
                        // Crear etiqueta con el número de punto (SE MANTIENE PARA PUNTOS DISPONIBLES)
                        const etiquetaSimbol = {
                            type: "text",
                            color: [255, 255, 255],
                            halo: {
                                color: [0, 0, 0, 0.7],
                                size: 1
                            },
                            text: `PUNTO ${index + 1}`,
                            font: {
                                size: 12,
                                family: "Courier New",
                                weight: "bold"
                            }
                        };
                        
                        // Crear un punto ligeramente desplazado hacia arriba para la etiqueta
                        const puntoEtiqueta = new Point({
                            longitude: ubicacion.geometry.longitude,
                            latitude: ubicacion.geometry.latitude,
                            z: 25 // Desplazar la etiqueta hacia arriba
                        });
                        
                        // Crear gráfico para la etiqueta
                        const etiquetaGraphic = new Graphic({
                            geometry: puntoEtiqueta,
                            symbol: etiquetaSimbol,
                            attributes: {
                                id: `label-${ubicacion.attributes.objectid}`,
                                numeroPunto: index + 1
                            }
                        });
                        
                        // Añadir la etiqueta a la capa
                        state.locationOptionsLayer.add(etiquetaGraphic);
                    });
                    
                    // Animación de la cámara para centrar en las ubicaciones
                    state.view.goTo({ 
                        target: state.locationOptionsLayer.graphics,
                        tilt: 30,
                        zoom: 9.3
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
                                            // Mostrar popup solo para los puntos, no para las etiquetas
                                            if (graphic.attributes && graphic.attributes.objectid) {
                                                state.view.popup.open({
                                                    features: [graphic],
                                                    location: event.mapPoint
                                                });
                                            }
                                        } else {
                                            // Alternativa si el método popup.open no está disponible
                                            console.log("Punto seleccionado:", graphic.attributes);
                                            // Mostrar un mensaje al usuario
                                            if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                                                HORIZONTE.utils.showStatusMessage(
                                                    `Seleccionado: ${graphic.attributes.proyecto} (Punto: ${graphic.attributes.numeroPunto})`, 
                                                    "info"
                                                );
                                            }
                                        }
                                    } catch (error) {
                                        console.warn("No se pudo abrir el popup:", error);
                                        // Mostrar un mensaje alternativo
                                        if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                                            HORIZONTE.utils.showStatusMessage(
                                                `Seleccionado: ${graphic.attributes.proyecto || 'Punto'} (ID: ${graphic.attributes.objectid || graphic.attributes.numeroPunto})`, 
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
     * Crea un punto de proyecto en el mapa (SIN ETIQUETA)
     * @param {Object} proyecto - Datos del proyecto
     * @param {Object} coordenadas - Coordenadas del punto {longitude, latitude}
     * @returns {Promise} Promesa que se resuelve con el punto creado
     */
    function crearPuntoProyecto(proyecto, coordenadas) {
        return new Promise((resolve, reject) => {
            try {
                require(["esri/Graphic", "esri/geometry/Point", "esri/symbols/TextSymbol"], function(Graphic, Point, TextSymbol) {
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
                    
                    // Determinar el número de punto (basado en cuántos proyectos de este tipo ya están usados)
                    const numeroPunto = proyecto.numeropunto || 
                                       (state.userPointsLayer.graphics.filter(g => 
                                         g.attributes.proyecto && 
                                         g.attributes.proyecto.toLowerCase() === proyecto.proyecto.toLowerCase()
                                       ).length + 1);
                    
                    // Asegurar que el proyecto tiene el número de punto
                    proyecto.numeroPunto = numeroPunto;
                    
                    // Crear gráfico con estilo militar
                    const puntoGraphic = new Graphic({
                        geometry: punto,
                        symbol: pointSymbol,
                        attributes: proyecto,
                        popupTemplate: {
                            title: `OPERACIÓN: ${proyecto.proyecto} - PUNTO ${numeroPunto}`,
                            content: [
                                {
                                    type: "text",
                                    text: `
                                        <div style="padding: 12px; font-family: 'Courier New', monospace; border-left: 4px solid #d0d3d4;">
                                            <h3 style="color: #d0d3d4; border-bottom: 1px solid #d0d3d4; padding-bottom: 8px; margin-bottom: 10px;">
                                                ${proyecto.proyecto}
                                            </h3>
                                            <p style="margin-bottom: 8px;"><strong>ID:</strong> ${proyecto.objectid}</p>
                                            <p style="margin-bottom: 8px;"><strong>Punto:</strong> ${numeroPunto}</p>
                                            <p style="margin-bottom: 8px;"><strong>Recursos asignados:</strong> $${proyecto.valorinversion.toLocaleString()}</p>
                                        </div>
                                    `
                                }
                            ]
                        }
                    });
                    
                    // Añadir a la capa
                    state.userPointsLayer.add(puntoGraphic);
                    
                    // --- INICIO: CÓDIGO DE ETIQUETA ELIMINADO ---
                    // // Crear etiqueta con el número de punto 
                    // const etiquetaSimbol = {
                    //     type: "text",
                    //     color: [255, 255, 255],
                    //     halo: {
                    //         color: [0, 0, 0, 0.7],
                    //         size: 1.5
                    //     },
                    //     text: `PUNTO ${numeroPunto}`,
                    //     font: {
                    //         size: 12,
                    //         family: "Courier New",
                    //         weight: "bold"
                    //     }
                    // };
                    
                    // // Crear un punto ligeramente desplazado hacia arriba para la etiqueta
                    // const puntoEtiqueta = new Point({
                    //     longitude: coordenadas.longitude,
                    //     latitude: coordenadas.latitude,
                    //     z: 25 // Desplazar la etiqueta hacia arriba
                    // });
                    
                    // // Crear gráfico para la etiqueta
                    // const etiquetaGraphic = new Graphic({
                    //     geometry: puntoEtiqueta,
                    //     symbol: etiquetaSimbol,
                    //     attributes: {
                    //         id: `label-${proyecto.objectid}`,
                    //         numeroPunto: numeroPunto,
                    //         proyecto: proyecto.proyecto
                    //     }
                    // });
                    
                    // // Añadir la etiqueta a la capa
                    // state.userPointsLayer.add(etiquetaGraphic);
                    // --- FIN: CÓDIGO DE ETIQUETA ELIMINADO ---
                    
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