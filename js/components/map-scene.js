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
                    url: "https://arcgis.esri.co/portal",
                    websceneId: "6930d0a7f14640b89a3fdd33f83949a4"
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
                        <span>Puntos de Proyectos Disponibles (Seleccionable)</span>
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
                        <span>Puntos de Proyectos Elegidos (Proyecto Elegido)</span>
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
                // Cargar datos de proyectos
                loadProyectos()
                    .then(() => {
                        // Inicializar análisis multidimensional si está disponible
                        if (HORIZONTE.multidimensionalAnalysis) {
                            console.log("Inicializando análisis multidimensional en escena 3D...");
                            HORIZONTE.multidimensionalAnalysis.init(state.view);
                        } else {
                            console.warn("Módulo de análisis multidimensional no disponible");
                        }
                        
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
            const nombreProyecto = proyecto.attributes.proyecto.toLowerCase();

            let proyectoEnUso = false;
            if (HORIZONTE.app && HORIZONTE.app.getProyectosSeleccionados) {
                const proyectosSeleccionados = HORIZONTE.app.getProyectosSeleccionados();
                proyectoEnUso = proyectosSeleccionados.some(p =>
                    p.proyecto.toLowerCase() === nombreProyecto
                );
            }

            if (state.proyectosNombresUsados.has(nombreProyecto) && !proyectoEnUso) {
                state.proyectosNombresUsados.delete(nombreProyecto);
            }

            if (proyectoEnUso) {
                reject({
                    code: 'PROYECTO_USADO',
                    message: `Operación ${proyecto.attributes.proyecto} ya desplegada`
                });
                return;
            }

            const presupuestoDisponible = HORIZONTE.app?.presupuestoDisponible ?? 10000;

            const ubicacionesProyecto = state.proyectos.filter(
                p => p.attributes.proyecto.toLowerCase() === nombreProyecto &&
                    !state.proyectosUsados.has(p.attributes.objectid) &&
                    p.attributes.valorinversion <= presupuestoDisponible
            );

            if (ubicacionesProyecto.length === 0) {
                reject({
                    code: 'NO_UBICACIONES',
                    message: `No hay ubicaciones disponibles para ${proyecto.attributes.proyecto}`
                });
                return;
            }

            if (state.locationOptionsLayer) {
                state.webscene.remove(state.locationOptionsLayer);
                state.locationOptionsLayer = null;
            }

            if (state.clickHandle) {
                state.clickHandle.remove();
                state.clickHandle = null;
            }

            require(["esri/layers/GraphicsLayer", "esri/Graphic", "esri/geometry/Point"], function(GraphicsLayer, Graphic, Point) {
                state.locationOptionsLayer = new GraphicsLayer({ title: "Puntos de Despliegue Disponibles" });
                state.webscene.add(state.locationOptionsLayer);

                ubicacionesProyecto.forEach((ubicacion, index) => {
                    const punto = new Point({
                        longitude: ubicacion.geometry.longitude,
                        latitude: ubicacion.geometry.latitude
                    });

                    ubicacion.attributes.numeroPunto = index + 1;

                    const symbol = {
                        type: "point-3d",
                        symbolLayers: [
                            {
                                type: "icon",
                                size: 32,
                                resource: { primitive: "triangle" },
                                material: { color: [191, 155, 48, 0.9] },
                                outline: {
                                    color: [0, 0, 0, 0.7],
                                    size: 1
                                }
                            },
{
    type: "text",
    text: `${index + 1}`,
    material: { color: [255, 255, 255] },
    font: {
        family: "Arial",
        size: 10,
        weight: "bold"
    },
    verticalAlignment: "top",     // El texto se alinea por la parte superior
    horizontalAlignment: "center",
    halo: {
        color: [0, 0, 0],
        size: 1
    },
    anchor: "bottom"              // Se ancla desde abajo => mueve el texto hacia abajo visualmente
}

                        ]
                    };

                    const puntoGraphic = new Graphic({
                        geometry: punto,
                        symbol,
                        attributes: ubicacion.attributes,
                        popupTemplate: {
                            title: `${ubicacion.attributes.proyecto} - Punto ${index + 1}`,
                            content: `
                                <div style="padding: 10px; font-family: 'Courier New', monospace;">
                                    <h3 style="color: #d0d3d4; border-bottom: 1px solid #d0d3d4; padding-bottom: 5px;">Descripción</h3>
                                    <p><strong></strong> ${ubicacion.attributes.descripcion}</p>
                                    <p><strong>Punto:</strong> ${index + 1}</p>
                                    <p><strong>Recursos requeridos:</strong> $${ubicacion.attributes.valorinversion.toLocaleString()}</p>
                                </div>
                            `
                        }
                    });

                    state.locationOptionsLayer.add(puntoGraphic);
                });

                state.view.goTo({
                    target: state.locationOptionsLayer.graphics,
                    tilt: 30,
                    zoom: 9.3
                }, {
                    duration: 1500,
                    easing: "out-expo"
                }).catch(console.warn);

                state.clickHandle = state.view.on('click', function(event) {
                    state.view.hitTest(event).then(function(response) {
                        const graphic = response.results?.[0]?.graphic;
                        if (graphic?.layer === state.locationOptionsLayer && graphic.attributes?.objectid) {
                            state.view.popup.open({
                                features: [graphic],
                                location: event.mapPoint
                            });
                        }
                    }).catch(console.warn);
                });

                resolve({ ubicaciones: ubicacionesProyecto, nombreProyecto: proyecto.attributes.proyecto });
            });
        } catch (error) {
            console.error("Error inesperado:", error);
            reject({
                code: 'ERROR_INESPERADO',
                message: "Ocurrió un error inesperado al mostrar ubicaciones",
                error
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
                                                Descripción
                                            </h3>
                                            <p style="margin-bottom: 8px;"><strong></strong> ${proyecto.descripcion}</p>
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
    /**
    * Elimina un punto de proyecto del mapa
    * @param {number} proyectoId - ID del proyecto a eliminar
    * @returns {boolean} True si se eliminó correctamente
    */
    function eliminarPuntoProyecto(proyectoId) {
        if (!state.userPointsLayer) {
            console.error("Capa de puntos no inicializada");
            return false;
        }
        
        try {
            // Buscar y eliminar el gráfico correspondiente al proyectoId
            const puntosEliminar = state.userPointsLayer.graphics.filter(graphic => 
                graphic.attributes && graphic.attributes.objectid === proyectoId
            );
            
            if (puntosEliminar.length === 0) {
                console.warn(`No se encontró punto para el proyecto ID ${proyectoId}`);
                return false;
            }
            
            // Eliminar todos los gráficos que coincidan (punto y posibles etiquetas)
            puntosEliminar.forEach(punto => {
                state.userPointsLayer.remove(punto);
            });
            
            // Buscar y eliminar etiquetas asociadas
            const etiquetasEliminar = state.userPointsLayer.graphics.filter(graphic => 
                graphic.attributes && 
                graphic.attributes.id && 
                graphic.attributes.id.includes(`label-${proyectoId}`)
            );
            
            etiquetasEliminar.forEach(etiqueta => {
                state.userPointsLayer.remove(etiqueta);
            });
            
            // Eliminar del conjunto de proyectos usados
            state.proyectosUsados.delete(proyectoId);
            
            console.log(`Punto del proyecto ID ${proyectoId} eliminado del mapa`);
            return true;
        } catch (error) {
            console.error("Error al eliminar punto del proyecto:", error);
            return false;
        }
    }
    /**
     * Obtiene la vista de la escena 3D
     * @returns {Object} Vista de la escena
     */
    function getView() {
        return state.view;
    }
        
    // Exponer API pública
    HORIZONTE.mapScene = {
        init,
        getProyectos,
        mostrarUbicacionesProyecto,
        seleccionarUbicacion,
        clearLocationOptions,
        isInitialized,
        eliminarPuntoProyecto,
        getView
    };
})();