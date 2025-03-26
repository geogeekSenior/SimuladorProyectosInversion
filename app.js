require([
    "esri/Map",
    "esri/views/SceneView",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/geometry/Point"
  ], function(
    Map, 
    SceneView, 
    FeatureLayer, 
    GraphicsLayer, 
    Graphic, 
    Point
  ) {
    // Configuración de la aplicación
    const config = {
        initialCamera: {
            position: {
                longitude: -74.5795,
                latitude: 4.4326,
                z: 150000  // Mayor altura para mejor vista estratégica
            },
            heading: 0,
            tilt: 55      // Ángulo militar más pronunciado
        },
        budget: 10000,
        militaryLabels: {
            projectTitle: "OPERACIÓN",
            budgetTitle: "RECURSOS ESTRATÉGICOS",
            locationsTitle: "PUNTOS DE DESPLIEGUE",
            selectLocationTitle: "SELECCIONAR PUNTO TÁCTICO",
            lowBudgetWarning: "RECURSOS INSUFICIENTES",
            alreadySelectedWarning: "DESPLEGADO EN TERRENO"
        }
    };
  
    // Clase FeatureSet optimizada
    class FeatureSet {
        constructor() {
            this.features = [];
            this.allAttributes = [];
        }
  
        agregarFeature(graphic) {
            this.features.push(graphic);
            return this;  // Para encadenamiento de métodos
        }
  
        setAllAttributes(attributes) {
            this.allAttributes = attributes;
            return this;  // Para encadenamiento de métodos
        }
        
        // Método para obtener todos los atributos de los features
        obtenerAtributos() {
            return this.features.map(feature => feature.attributes);
        }
        
        // Método para obtener todas las geometrías de los features
        obtenerGeometrias() {
            return this.features.map(feature => {
                if (!feature.geometry) return null;
                
                const { type, longitude, latitude, z } = feature.geometry;
                return {
                    type,
                    objectid: feature.attributes.objectid,
                    longitude,
                    latitude,
                    z
                };
            }).filter(geo => geo !== null);  // Filtrar valores nulos
        }
        
        // Método optimizado para filtrar por atributo
        filtrarPorAtributo(nombreAtributo, valor) {
            return this.features
                .filter(feature => feature.attributes[nombreAtributo] === valor)
                .map(feature => ({
                    atributos: feature.attributes,
                    geometria: feature.geometry ? {
                        longitude: feature.geometry.longitude,
                        latitude: feature.geometry.latitude
                    } : null
                }));
        }
    }
  
    // Estado de la aplicación - Modelo de datos centralizado
    const appState = {
        proyectos: [],
        puntosProyectos: [],
        detallesPuntos: [],
        proyectosUsados: new Set(),        // Set de IDs de proyectos ya utilizados
        proyectosNombresUsados: new Set(), // Set de nombres de proyectos ya utilizados
        presupuestoDisponible: config.budget,
        presupuestoInicial: config.budget, // Para cálculo de porcentajes
        miFeatureSet: new FeatureSet(),
        locationOptionsLayer: null,
        clickHandle: null,
        modalOpen: false,
        loading: true,                     // Estado de carga
        eventHandlers: []                  // Almacena manejadores de eventos para limpieza
    };
  
    // Creación del mapa con estilo militar
    const map = new Map({
        basemap: "satellite",
        ground: "world-elevation"
    });
  
    // Configuración de la vista 3D con estilo militar
    const view = new SceneView({
        container: "viewDiv",
        map: map,
        camera: config.initialCamera,
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
            components: []
        }
    });
  
    view.popupEnabled = true;
  
    // Capa para puntos de usuario - Proyectos seleccionados
    const userPointsLayer = new GraphicsLayer({
        title: "Puntos de Despliegue Táctico"
    });
  
    map.add(userPointsLayer);
  
    // Función para normalizar atributos (en minúsculas)
    function normalizarAtributos(attributes) {
        return Object.entries(attributes).reduce((acc, [key, value]) => {
            acc[key.toLowerCase()] = value;
            return acc;
        }, {});
    }
  
    // Actualizar visualización del presupuesto
    function actualizarPresupuesto() {
        const presupuestoElement = document.getElementById('presupuestoTotal');
        const presupuestoBar = document.getElementById('presupuestoBar');
        
        if (!presupuestoElement || !presupuestoBar) return;
        
        // Formatear para visualización militar
        presupuestoElement.textContent = `${config.militaryLabels.budgetTitle}: $${appState.presupuestoDisponible.toLocaleString()}`;
        
        // Calcular porcentaje de recursos utilizados
        const presupuestoUsado = config.budget - appState.presupuestoDisponible;
        const porcentajeUsado = (presupuestoUsado / config.budget) * 100;
        
        // Actualizar barra de progreso con animación
        presupuestoBar.style.width = `${porcentajeUsado}%`;
        
        // Cambiar el color según el nivel de recursos
        if (porcentajeUsado > 80) {
            presupuestoBar.style.backgroundColor = 'var(--error-color)';
            presupuestoBar.style.backgroundImage = 'linear-gradient(45deg, var(--error-color) 25%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.2) 50%, var(--error-color) 50%, var(--error-color) 75%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0.2))';
            presupuestoBar.style.backgroundSize = '10px 10px';
        } else if (porcentajeUsado > 60) {
            presupuestoBar.style.backgroundColor = 'var(--warning-color)';
            presupuestoBar.style.backgroundImage = 'linear-gradient(45deg, var(--warning-color) 25%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.2) 50%, var(--warning-color) 50%, var(--warning-color) 75%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0.2))';
            presupuestoBar.style.backgroundSize = '10px 10px';
        } else {
            presupuestoBar.style.backgroundColor = 'var(--success-color)';
            presupuestoBar.style.backgroundImage = 'linear-gradient(45deg, var(--success-color) 25%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.2) 50%, var(--success-color) 50%, var(--success-color) 75%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0.2))';
            presupuestoBar.style.backgroundSize = '10px 10px';
        }
    }

    // Función para cerrar el panel de selección
    function cerrarModal() {
        if (!appState.modalOpen) return;
        
        appState.modalOpen = false;
        
        // Limpiar capa de opciones de ubicación
        if (appState.locationOptionsLayer) {
            map.remove(appState.locationOptionsLayer);
            appState.locationOptionsLayer = null;
        }
        
        // Remover manejador de eventos
        if (appState.clickHandle) {
            appState.clickHandle.remove();
            appState.clickHandle = null;
        }
        
        // Eliminar panel de selección
        const selectionPanel = document.getElementById('locationSelectionPanel');
        if (selectionPanel) {
            selectionPanel.remove();
        }
        
        // Mostrar mensaje de operación cancelada
        mostrarMensajeEstado("Operación de despliegue cancelada", "warning", 2000);
    }

    // Función para mostrar mensajes de estado
    function mostrarMensajeEstado(mensaje, tipo, duracion = 3000) {
        const statusMessage = document.getElementById('statusMessage');
        if (!statusMessage) return;
        
        statusMessage.textContent = mensaje;
        statusMessage.className = 'status-message';
        statusMessage.classList.add(`status-${tipo}`);
        statusMessage.style.opacity = '1';
        statusMessage.style.transform = 'translateY(0)';
        
        setTimeout(() => {
            statusMessage.style.opacity = '0';
            statusMessage.style.transform = 'translateY(20px)';
        }, duracion);
    }

    // Crear controles para selección de ubicaciones
    function crearControlesSeleccion(ubicacionesProyecto, nombreProyecto) {
        const existingPanel = document.getElementById('locationSelectionPanel');
        if (existingPanel) {
            existingPanel.remove();
        }

        appState.modalOpen = true;

        // Crear panel con estilo militar
        const selectionPanel = document.createElement('div');
        selectionPanel.id = 'locationSelectionPanel';
        selectionPanel.className = 'esri-widget location-selection-panel';
        selectionPanel.style.position = 'absolute';
        selectionPanel.style.top = '80px';
        selectionPanel.style.left = '15px';
        selectionPanel.style.zIndex = '10';
        selectionPanel.style.maxHeight = '350px';
        selectionPanel.style.overflowY = 'auto';
        selectionPanel.style.width = '320px';

        // Título con estilo militar
        const header = document.createElement('h3');
        header.textContent = config.militaryLabels.selectLocationTitle;
        selectionPanel.appendChild(header);

        // Información de la operación
        const operationInfo = document.createElement('div');
        operationInfo.className = 'operation-info';
        operationInfo.innerHTML = `<strong>${nombreProyecto}</strong>`;
        operationInfo.style.marginBottom = '15px';
        operationInfo.style.padding = '8px';
        operationInfo.style.backgroundColor = 'rgba(81, 127, 53, 0.2)';
        operationInfo.style.borderLeft = '4px solid var(--primary-color)';
        selectionPanel.appendChild(operationInfo);

        // Crear botones para cada ubicación
        ubicacionesProyecto.forEach((ubicacion, index) => {
            const button = document.createElement('button');
            button.className = 'esri-button location-button';
            button.textContent = `Coordenada ${index + 1}: ID ${ubicacion.attributes.objectid}`;
            button.style.marginBottom = '8px';
            
            // Añadir información de inversión
            const infoSpan = document.createElement('span');
            infoSpan.style.display = 'block';
            infoSpan.style.fontSize = '12px';
            infoSpan.style.opacity = '0.8';
            infoSpan.textContent = `Recursos: $${ubicacion.attributes.valorinversion.toLocaleString()}`;
            button.appendChild(infoSpan);
            
            // Evento click
            button.addEventListener('click', () => {
                seleccionarUbicacion(ubicacion.attributes.objectid, ubicacionesProyecto, nombreProyecto);
            });
            
            selectionPanel.appendChild(button);
        });

        // Botón para cancelar
        const cancelButton = document.createElement('button');
        cancelButton.className = 'esri-button location-button-cancel';
        cancelButton.textContent = 'CANCELAR OPERACIÓN';
        cancelButton.style.marginTop = '10px';
        
        cancelButton.addEventListener('click', cerrarModal);
        
        selectionPanel.appendChild(cancelButton);

        // Añadir al contenedor del mapa
        const mapContainer = document.getElementById('mapContainer');
        mapContainer.appendChild(selectionPanel);
    }

    // Función para seleccionar una ubicación
    function seleccionarUbicacion(objectId, ubicacionesProyecto, nombreProyecto) {
        const proyectoSeleccionado = ubicacionesProyecto.find(
            p => p.attributes.objectid === objectId
        );

        if (!proyectoSeleccionado) {
            mostrarMensajeEstado("Error: Ubicación no encontrada", "error");
            return;
        }

        // Cerrar el modal
        cerrarModal();

        const proyectoAttr = proyectoSeleccionado.attributes;
        const coordenadas = {
            longitude: proyectoSeleccionado.geometry.longitude,
            latitude: proyectoSeleccionado.geometry.latitude
        };
        
        // Verificar presupuesto
        if (proyectoAttr.valorinversion > appState.presupuestoDisponible) {
            mostrarMensajeEstado(`${config.militaryLabels.lowBudgetWarning}: $${proyectoAttr.valorinversion.toLocaleString()} requeridos`, "error");
            return;
        }
        
        // Crear punto en el mapa
        const puntoCreado = crearPuntoProyecto(proyectoAttr, coordenadas);
        if (puntoCreado) {
            // Actualizar presupuesto
            appState.presupuestoDisponible -= proyectoAttr.valorinversion;
            actualizarPresupuesto();
            
            // Añadir el nombre del proyecto al set de nombres usados
            appState.proyectosNombresUsados.add(nombreProyecto.toLowerCase());
            
            // Mostrar mensaje de éxito
            mostrarMensajeEstado(`Operación ${nombreProyecto} desplegada con éxito`, "success");
            
            // Deshabilitar TODOS los elementos de la lista con el mismo nombre
            const projectDivs = document.querySelectorAll(`.project-item[data-nombre="${nombreProyecto.toLowerCase()}"]`);
            projectDivs.forEach(div => {
                div.classList.add('disabled');
                div.setAttribute('disabled', 'true');
            });
        }
    }
  
    // Función para mostrar ubicaciones de proyecto
    function mostrarUbicacionesProyecto(proyecto) {
        // Si el nombre del proyecto ya está usado, no hacer nada
        const nombreProyecto = proyecto.attributes.proyecto.toLowerCase();
        if (appState.proyectosNombresUsados.has(nombreProyecto)) {
            mostrarMensajeEstado(`Operación ${proyecto.attributes.proyecto} ya desplegada`, "warning");
            return;
        }

        // Filtrar ubicaciones disponibles (no usadas y dentro del presupuesto)
        const ubicacionesProyecto = appState.proyectos.filter(
            p => p.attributes.proyecto.toLowerCase() === nombreProyecto &&
                 !appState.proyectosUsados.has(p.attributes.objectid) &&
                 p.attributes.valorinversion <= appState.presupuestoDisponible
        );

        // Si no hay ubicaciones disponibles, mostrar mensaje
        if (ubicacionesProyecto.length === 0) {
            mostrarMensajeEstado(`No hay ubicaciones disponibles para ${proyecto.attributes.proyecto}`, "error");
            return;
        }

        // Crear capa para mostrar opciones de ubicación
        appState.locationOptionsLayer = new GraphicsLayer({
            title: config.militaryLabels.locationsTitle
        });
        map.add(appState.locationOptionsLayer);

        // Crear gráficos para cada ubicación
        ubicacionesProyecto.forEach((ubicacion, index) => {
            const punto = new Point({
                longitude: ubicacion.geometry.longitude,
                latitude: ubicacion.geometry.latitude
            });

            const puntoGraphic = new Graphic({
                geometry: punto,
                symbol: {
                    type: "point-3d",
                    symbolLayers: [{
                        type: "icon",
                        size: 24,
                        resource: { primitive: "triangle" },
                        material: { color: [194, 179, 24, 0.9] },
                        outline: {
                            color: [0, 0, 0, 0.7],
                            size: 1
                        }
                    }]
                },
                attributes: ubicacion.attributes,
                popupTemplate: {
                    title: `${ubicacion.attributes.proyecto} - Punto ${index + 1}`,
                    content: [
                        {
                            type: "text",
                            text: `
                                <div style="padding: 10px; font-family: 'Courier New', monospace;">
                                    <h3 style="color: #517f35; border-bottom: 1px solid #517f35; padding-bottom: 5px;">${ubicacion.attributes.proyecto}</h3>
                                    <p><strong>ID:</strong> ${ubicacion.attributes.objectid}</p>
                                    <p><strong>Recursos requeridos:</strong> $${ubicacion.attributes.valorinversion.toLocaleString()}</p>
                                </div>
                            `
                        }
                    ]
                }
            });

            appState.locationOptionsLayer.add(puntoGraphic);
        });

        // Animación de la cámara para centrar en las ubicaciones
        view.goTo({ 
            target: appState.locationOptionsLayer.graphics,
            tilt: 60,  // Ángulo militar más inclinado
            zoom: 10   // Acercar más para mejor visualización
        }, {
            duration: 1500,
            easing: "out-expo"
        }).catch(console.error);

        // Añadir manejador de eventos para clicks en el mapa
        appState.clickHandle = view.on('click', function(event) {
            view.hitTest(event).then(function(response) {
                if (response.results.length > 0) {
                    const graphic = response.results[0].graphic;
                    
                    if (graphic.layer === appState.locationOptionsLayer) {
                        view.popup.open({
                            features: [graphic],
                            location: event.mapPoint
                        });
                    }
                }
            });
        });

        // Crear controles para selección de ubicación
        crearControlesSeleccion(ubicacionesProyecto, proyecto.attributes.proyecto);
    }
  
    // Función para crear un punto de proyecto en el mapa
    function crearPuntoProyecto(proyecto, coordenadas) {
        const proyectoNormalizado = normalizarAtributos(proyecto);
  
        // Validar datos necesarios
        if (!proyectoNormalizado.objectid || 
            !coordenadas?.longitude || 
            !coordenadas?.latitude || 
            appState.proyectosUsados.has(proyectoNormalizado.objectid)) {
            return null;
        }
  
        try {
            // Crear punto en el mapa
            const punto = new Point({
                longitude: coordenadas.longitude,
                latitude: coordenadas.latitude
            });
  
            // Crear gráfico con estilo militar
            const puntoGraphic = new Graphic({
                geometry: punto,
                symbol: {
                    type: "point-3d",
                    symbolLayers: [{
                        type: "icon",
                        size: 28,
                        resource: { primitive: "circle" },
                        material: { color: [60, 109, 63, 0.9] },
                        outline: {
                            color: [30, 54, 31, 0.9],
                            size: 1.5
                        }
                    }]
                },
                attributes: proyectoNormalizado,
                popupTemplate: {
                    title: `${config.militaryLabels.projectTitle}: ${proyectoNormalizado.proyecto}`,
                    content: [
                        {
                            type: "text",
                            text: `
                                <div style="padding: 12px; font-family: 'Courier New', monospace; border-left: 4px solid #517f35;">
                                    <h3 style="color: #517f35; border-bottom: 1px solid #517f35; padding-bottom: 8px; margin-bottom: 10px;">
                                        ${proyectoNormalizado.proyecto}
                                    </h3>
                                    <p style="margin-bottom: 8px;"><strong>ID:</strong> ${proyectoNormalizado.objectid}</p>
                                    <p style="margin-bottom: 8px;"><strong>Recursos asignados:</strong> $${proyectoNormalizado.valorinversion.toLocaleString()}</p>
                                </div>
                            `
                        }
                    ]
                }
            });
  
            // Añadir a la capa
            userPointsLayer.add(puntoGraphic);
  
            // Guardar detalles del punto
            const detallePunto = {
                id: proyectoNormalizado.objectid,
                nombre: proyectoNormalizado.proyecto,
                coordenadas: {
                    longitud: coordenadas.longitude,
                    latitud: coordenadas.latitude
                },
                valorInversion: proyectoNormalizado.valorinversion,
                atributos: proyectoNormalizado
            };
  
            // Actualizar estado de la aplicación
            appState.miFeatureSet.agregarFeature(puntoGraphic);
            appState.puntosProyectos.push(puntoGraphic);
            appState.detallesPuntos.push(detallePunto);
            appState.proyectosUsados.add(proyectoNormalizado.objectid);
  
            // Animar la cámara al punto
            view.goTo({ 
                target: puntoGraphic, 
                zoom: 12,
                tilt: 65 
            }, {
                duration: 1500,
                easing: "out-expo"
            }).catch(console.error);
  
            return puntoGraphic;
        } catch (error) {
            console.error("Error al crear punto de proyecto:", error);
            mostrarMensajeEstado("Error al desplegar la operación", "error");
            return null;
        }
    }
  
    // Capa de proyectos desde servicio web
    const proyectosLayer = new FeatureLayer({
        url: "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/ProyectosPesos/FeatureServer/0"
    });
  
    // Función para renderizar la lista de proyectos
    function renderizarProyectos(proyectos) {
        const projectListDiv = document.getElementById('projectList');
        if (!projectListDiv) return;
        
        projectListDiv.innerHTML = '';
  
        // Agrupar proyectos por nombre para evitar duplicados en la lista
        const proyectosPorNombre = {};
        proyectos.forEach(proyecto => {
            const nombreProyecto = proyecto.attributes.proyecto.toLowerCase();
            if (!proyectosPorNombre[nombreProyecto]) {
                proyectosPorNombre[nombreProyecto] = [];
            }
            proyectosPorNombre[nombreProyecto].push(proyecto);
        });
  
        // Renderizar cada grupo de proyectos
        Object.entries(proyectosPorNombre).forEach(([nombreProyecto, proyectosGrupo]) => {
            const proyecto = proyectosGrupo[0];
            
            // Crear elemento de proyecto con estilo militar
            const projectDiv = document.createElement('div');
            projectDiv.className = 'project-item';
            
            // Verificar disponibilidad del proyecto
            const proyectosDisponibles = proyectosGrupo.filter(
                p => !appState.proyectosUsados.has(p.attributes.objectid) && 
                     p.attributes.valorinversion <= appState.presupuestoDisponible
            );
            
            const superaPresupuesto = proyectosDisponibles.length === 0;
            const yaUtilizado = appState.proyectosNombresUsados.has(nombreProyecto);
            
            // Marcar como deshabilitado si corresponde
            if (superaPresupuesto || yaUtilizado) {
                projectDiv.classList.add('disabled');
                projectDiv.setAttribute('disabled', 'true');
            }
  
            // Contenido militar para el proyecto
            projectDiv.innerHTML = `
                <h3>${proyecto.attributes.proyecto}</h3>
                <div class="project-details">
                    <span class="project-cost">Recursos: $${proyecto.attributes.valorinversion.toLocaleString()}</span>
                    <span class="project-status">
                        ${yaUtilizado ? `<span class="excede-presupuesto">${config.militaryLabels.alreadySelectedWarning}</span>` : ''}
                        ${superaPresupuesto && !yaUtilizado ? `<span class="excede-presupuesto">${config.militaryLabels.lowBudgetWarning}</span>` : ''}
                    </span>
                </div>
            `;
  
            // Manejador de eventos para click
            const handleProyectoClick = () => {
                // No permitir seleccionar si ya está utilizado o no hay presupuesto
                if (proyectosDisponibles.length === 0 || yaUtilizado) {
                    if (yaUtilizado) {
                        mostrarMensajeEstado(`Operación ${proyecto.attributes.proyecto} ya desplegada`, "warning");
                    } else if (superaPresupuesto) {
                        mostrarMensajeEstado(`Recursos insuficientes para ${proyecto.attributes.proyecto}`, "error");
                    }
                    return;
                }
  
                if (proyectosDisponibles.length >= 1) {
                    mostrarUbicacionesProyecto(proyecto);
                }
            };
  
            projectDiv.addEventListener('click', handleProyectoClick);
            projectDiv.setAttribute('data-id', proyecto.attributes.objectid);
            projectDiv.setAttribute('data-nombre', nombreProyecto);
            projectListDiv.appendChild(projectDiv);
        });
    }
  
    // Cargar datos de proyectos
    proyectosLayer.queryFeatures({
        where: "1=1",
        outFields: ["*"],
        returnGeometry: true
    }).then(function(results) {
        // Guardar atributos normalizados
        appState.miFeatureSet.setAllAttributes(
            results.features.map(feature => normalizarAtributos(feature.attributes))
        );
  
        // Guardar proyectos
        appState.proyectos = results.features.map(feature => ({
            attributes: normalizarAtributos(feature.attributes),
            geometry: feature.geometry
        }));
  
        // Ocultar indicador de carga
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
  
        // Renderizar proyectos y actualizar presupuesto
        renderizarProyectos(appState.proyectos);
        actualizarPresupuesto();
        
        // Exponer el featureSet para uso externo si es necesario
        window.miFeatureSet = appState.miFeatureSet;
        
        // Mostrar instrucciones
        const mapInstructions = document.getElementById('map-instructions');
        if (mapInstructions) {
            mapInstructions.textContent = "Seleccione una operación de la lista para desplegar en el terreno";
            mapInstructions.style.fontSize = "13px";
        }
        
        // Mostrar mensaje de bienvenida
        mostrarMensajeEstado("Centro de comando operativo inicializado", "success");
        
        // Marcar como cargado
        appState.loading = false;
  
    }).catch(function(error) {
        console.error("Error al cargar proyectos:", error);
        
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.innerHTML = '<span style="color: var(--error-color);">Error al cargar operaciones</span>';
        }
        
        mostrarMensajeEstado("Error al cargar datos de operaciones", "error");
    });
    
    // Exponer funciones al ámbito global si es necesario
    window.app = {
        actualizarPresupuesto,
        cerrarModal,
        renderizarProyectos
    };
});