/**
 * app.js - Controlador principal para el Simulador de Inversiones Estratégicas
 * Coordina la interacción entre los diferentes módulos y componentes
 */

// Módulo principal de la aplicación
(function() {
    // Verificar que el namespace HORIZONTE existe
    if (!window.HORIZONTE) window.HORIZONTE = {};
    
    // Crear el módulo app
    HORIZONTE.app = {};
    
    // Configuración de la aplicación
    const config = {
        presupuestoInicial: 10000,
        timeoutMensaje: 3000,
        textos: {
            proyectoTitle: "OPERACIÓN",
            presupuestoTitle: "RECURSOS ESTRATÉGICOS",
            ubicacionesTitle: "PUNTOS DE DESPLIEGUE",
            selectLocationTitle: "SELECCIONAR PUNTO TÁCTICO",
            lowBudgetWarning: "RECURSOS INSUFICIENTES",
            alreadySelectedWarning: "DESPLEGADO EN TERRENO",
            selectionGuide: "Seleccione una operación de la lista para desplegar en el terreno"
        }
    };
    
    // Estado de la aplicación
    const state = {
        presupuestoDisponible: config.presupuestoInicial,
        proyectosSeleccionados: [],
        proyectosUsados: new Set(),        // Set de IDs de proyectos ya utilizados
        proyectosNombresUsados: new Set(), // Set de nombres de proyectos ya utilizados
        modalOpen: false,
        loading: true,
        initialized: false
    };
    
    /**
     * Inicializa la aplicación
     */
    function init() {
        if (state.initialized) return;
        
        // Registrar escuchadores de eventos
        setupEventListeners();
        
        // Actualizar visualización inicial del presupuesto
        actualizarPresupuesto();
        
        // Inicializar componentes si están disponibles
        initializeComponents();
        
        // Marcar como inicializado
        state.initialized = true;
        
        console.log("Aplicación inicializada correctamente");
    }
    
    /**
     * Configura los escuchadores de eventos
     */
    function setupEventListeners() {

        document.addEventListener('horizonte:mapSceneStatus', function(event) {
            if (event.detail.status === 'operational') {
            // Ocultar el indicador de carga cuando los datos están cargados
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            }
        });
        // Escuchar cuando la escena 3D esté lista
        document.addEventListener('horizonte:mapSceneReady', handleMapSceneReady);
        
        // Escuchar cuando las métricas estén listas
        document.addEventListener('horizonte:metricsReady', handleMetricsReady);
        
        // Escuchar cuando el visualizador del mapa esté listo
        document.addEventListener('horizonte:mapViewerReady', handleMapViewerReady);
        
        // Escuchar actualizaciones de estado de la escena
        document.addEventListener('horizonte:mapSceneStatus', handleMapSceneStatus);
        
        // Escuchar cuando se seleccione un proyecto desde la UI
        document.addEventListener('click', handleProjectClick);
    }
    
    /**
     * Inicializa los componentes de la aplicación
     */
    function initializeComponents() {
        // Inicializar escena 3D si es necesario
        if (document.getElementById('viewDiv') && HORIZONTE.mapScene && !HORIZONTE.mapScene.isInitialized()) {
            HORIZONTE.mapScene.init('viewDiv');
        }
        
        // Inicializar visualizador de mapa si es necesario
        if (document.getElementById('arcgisMap') && HORIZONTE.mapViewer && !HORIZONTE.mapViewer.isInitialized()) {
            HORIZONTE.mapViewer.init('arcgisMap');
        }
        
        // Inicializar métricas si el módulo está disponible
        if (HORIZONTE.metricsDisplay) {
            HORIZONTE.metricsDisplay.init();
        }
    }
    
    /**
     * Maneja el evento de clic en proyectos
     * @param {Event} event - Evento de clic
     */
    function handleProjectClick(event) {
        const projectItem = event.target.closest('.project-item');
        if (!projectItem) return;
        
        // Verificar si el proyecto está deshabilitado
        if (projectItem.classList.contains('disabled') || projectItem.hasAttribute('disabled')) {
            // Verificar si ya está usado
            if (projectItem.dataset.usado === 'true') {
                mostrarMensajeEstado(`Operación ${projectItem.querySelector('h3').textContent} ya desplegada`, "warning");
            } else {
                mostrarMensajeEstado(`Recursos insuficientes para esta operación`, "error");
            }
            return;
        }
        
        // Obtener ID y nombre del proyecto
        const proyectoId = parseInt(projectItem.dataset.id);
        const proyectoNombre = projectItem.dataset.nombre;
        
        // Buscar el proyecto completo
        if (HORIZONTE.mapScene && HORIZONTE.mapScene.getProyectos) {
            const proyectos = HORIZONTE.mapScene.getProyectos();
            const proyecto = proyectos.find(p => p.attributes.objectid === proyectoId);
            
            if (proyecto) {
                mostrarUbicacionesProyecto(proyecto);
            } else {
                console.error(`Proyecto con ID ${proyectoId} no encontrado`);
            }
        }
    }
    
    /**
     * Muestra las ubicaciones disponibles para un proyecto
     * @param {Object} proyecto - Proyecto seleccionado
     */
    function mostrarUbicacionesProyecto(proyecto) {
        if (!HORIZONTE.mapScene) return;
        
        HORIZONTE.mapScene.mostrarUbicacionesProyecto(proyecto)
            .then(result => {
                // Crear controles para selección de ubicación
                crearControlesSeleccion(result.ubicaciones, result.nombreProyecto);
            })
            .catch(error => {
                if (error.code === 'PROYECTO_USADO') {
                    mostrarMensajeEstado(`Operación ${proyecto.attributes.proyecto} ya desplegada`, "warning");
                } else if (error.code === 'NO_UBICACIONES') {
                    mostrarMensajeEstado(`No hay ubicaciones disponibles para ${proyecto.attributes.proyecto}`, "error");
                } else {
                    console.error("Error al mostrar ubicaciones:", error);
                    mostrarMensajeEstado("Error al cargar ubicaciones", "error");
                }
            });
    }
    
    /**
     * Crea controles para selección de ubicaciones
     * @param {Array} ubicacionesProyecto - Lista de ubicaciones disponibles
     * @param {string} nombreProyecto - Nombre del proyecto
     */
    function crearControlesSeleccion(ubicacionesProyecto, nombreProyecto) {
        // Eliminar panel existente si lo hay
        const existingPanel = document.getElementById('locationSelectionPanel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        // Actualizar estado
        state.modalOpen = true;
        
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
        header.textContent = config.textos.selectLocationTitle;
        selectionPanel.appendChild(header);
        
        // Información de la operación
        const operationInfo = document.createElement('div');
        operationInfo.className = 'operation-info';
        operationInfo.innerHTML = `<strong>${nombreProyecto}</strong>`;
        operationInfo.style.marginBottom = '15px';
        operationInfo.style.padding = '8px';
        operationInfo.style.backgroundColor = 'rgba(0, 48, 116, 0.2)';
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
        if (mapContainer) {
            mapContainer.appendChild(selectionPanel);
        } else {
            // Si no hay mapContainer, añadir al viewDiv
            const viewDiv = document.getElementById('viewDiv');
            if (viewDiv) {
                viewDiv.parentNode.appendChild(selectionPanel);
            }
        }
    }
    
    /**
     * Selecciona una ubicación para un proyecto
     * @param {number} objectId - ID del objeto a seleccionar
     * @param {Array} ubicacionesProyecto - Lista de ubicaciones disponibles
     * @param {string} nombreProyecto - Nombre del proyecto
     */
    function seleccionarUbicacion(objectId, ubicacionesProyecto, nombreProyecto) {
        if (!HORIZONTE.mapScene) {
            cerrarModal();
            return;
        }
        
        // Buscar el proyecto seleccionado
        const proyectoSeleccionado = ubicacionesProyecto.find(
            p => p.attributes.objectid === objectId
        );
        
        // Verificación adicional de presupuesto antes de llamar a la función
        if (proyectoSeleccionado && proyectoSeleccionado.attributes.valorinversion > state.presupuestoDisponible) {
            // No hay presupuesto suficiente
            mostrarMensajeEstado(`${config.textos.lowBudgetWarning}: $${proyectoSeleccionado.attributes.valorinversion.toLocaleString()} requeridos`, "error");
            return;
        }
        
        HORIZONTE.mapScene.seleccionarUbicacion(objectId, ubicacionesProyecto, nombreProyecto)
            .then(result => {
                // Cerrar el modal
                cerrarModal();
                
                // Calcular nuevo presupuesto
                const valorInversion = result.proyecto.valorinversion;
                
                // Actualizar presupuesto (CENTRALIZADO AQUÍ)
                actualizarPresupuestoGlobal(state.presupuestoDisponible - valorInversion);
                
                // Deshabilitar elementos de la lista con el mismo nombre
                const projectDivs = document.querySelectorAll(`.project-item[data-nombre="${nombreProyecto.toLowerCase()}"]`);
                projectDivs.forEach(div => {
                    div.classList.add('disabled');
                    div.setAttribute('disabled', 'true');
                    div.dataset.usado = 'true';
                });
                
                // Mostrar mensaje de éxito
                mostrarMensajeEstado(`Operación ${nombreProyecto} desplegada con éxito`, "success");
                
                // Añadir a proyectos seleccionados
                state.proyectosSeleccionados.push({
                    proyecto: nombreProyecto,
                    valor: valorInversion,
                    id: result.proyecto.objectid
                });
                
                // Disparar evento de proyecto seleccionado
                document.dispatchEvent(new CustomEvent('horizonte:proyectoSeleccionado', {
                    detail: {
                        proyecto: result.proyecto,
                        nombreProyecto,
                        punto: result.punto
                    }
                }));
            })
            .catch(error => {
                if (error.code === 'PRESUPUESTO_INSUFICIENTE') {
                    mostrarMensajeEstado(`${config.textos.lowBudgetWarning}: $${error.valorInversion} requeridos`, "error");
                } else {
                    console.error("Error al seleccionar ubicación:", error);
                    mostrarMensajeEstado("Error al desplegar operación", "error");
                }
                
                // No cerrar el modal en caso de error para permitir seleccionar otra ubicación
            });
    }
    
    /**
     * Cierra el panel de selección de ubicaciones
     */
    function cerrarModal() {
        if (!state.modalOpen) return;
        
        state.modalOpen = false;
        
        // Limpiar capa de opciones de ubicación si está disponible
        if (HORIZONTE.mapScene && HORIZONTE.mapScene.clearLocationOptions) {
            HORIZONTE.mapScene.clearLocationOptions();
        }
        
        // Eliminar panel de selección
        const selectionPanel = document.getElementById('locationSelectionPanel');
        if (selectionPanel) {
            selectionPanel.remove();
        }
        
        // Mostrar mensaje de operación cancelada
        mostrarMensajeEstado("Operación de despliegue cancelada", "warning", 2000);
    }
    
    /**
     * Actualiza el presupuesto global y sincroniza todos los componentes
     * @param {number} nuevoPresupuesto - Nuevo valor del presupuesto
     */
    function actualizarPresupuestoGlobal(nuevoPresupuesto) {
        // NUEVA FUNCIÓN: Centraliza la actualización del presupuesto
        console.log(`Actualizando presupuesto: ${state.presupuestoDisponible} -> ${nuevoPresupuesto}`);
        
        // Actualizar el estado interno de este módulo
        state.presupuestoDisponible = nuevoPresupuesto;
        
        // Actualizar visualización
        actualizarPresupuesto();
        
        // Sincronizar con el módulo de métricas si está disponible
        if (HORIZONTE.metricsDisplay) {
            HORIZONTE.metricsDisplay.actualizarPresupuesto(nuevoPresupuesto);
        }
        
        // Disparar evento para que otros módulos puedan reaccionar
        document.dispatchEvent(new CustomEvent('horizonte:presupuestoActualizado', {
            detail: {
                presupuesto: nuevoPresupuesto,
                presupuestoInicial: config.presupuestoInicial
            }
        }));
    }
    
        /**
         * Actualiza la visualización del presupuesto
         */
        function actualizarPresupuesto() {
            // Actualizar con el componente de métricas si está disponible
            if (HORIZONTE.metricsDisplay && HORIZONTE.metricsDisplay.isInitialized()) {
                HORIZONTE.metricsDisplay.actualizarPresupuesto(state.presupuestoDisponible);
                return;
            }
            
            // Actualización manual si el componente de métricas no está disponible
            const presupuestoElement = document.getElementById('presupuestoTotal');
            const presupuestoBar = document.getElementById('presupuestoBar');
            
            if (!presupuestoElement || !presupuestoBar) return;
            
            // Formatear para visualización militar
            presupuestoElement.textContent = `${config.textos.presupuestoTitle}: $${state.presupuestoDisponible.toLocaleString()}`;
            
            // Calcular porcentaje de recursos utilizados
            const presupuestoUsado = config.presupuestoInicial - state.presupuestoDisponible;
            const porcentajeUsado = (presupuestoUsado / config.presupuestoInicial) * 100;
            
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
    
    /**
     * Muestra un mensaje de estado temporal
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de mensaje (success, warning, error)
     * @param {number} duracion - Duración en milisegundos
     */
    function mostrarMensajeEstado(mensaje, tipo, duracion = config.timeoutMensaje) {
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
    
    /**
     * Maneja el evento de la escena 3D lista
     * @param {CustomEvent} event - Evento con datos
     */
    function handleMapSceneReady(event) {
        console.log("Escena 3D lista:", event.detail.containerId);
        
        // Mostrar mensaje informativo
        const mapInstructions = document.getElementById('map-instructions');
        if (mapInstructions) {
            mapInstructions.textContent = config.textos.selectionGuide;
        }
        
        // Marcar como no cargando
        state.loading = false;
        
        // Notificar que la aplicación está lista
        document.dispatchEvent(new CustomEvent('horizonte:appReady'));
        
        // Mostrar mensaje de bienvenida
        mostrarMensajeEstado("Centro de comando operativo inicializado", "success");
    }
    
    /**
     * Maneja el evento de métricas listas
     */
    function handleMetricsReady() {
        console.log("Métricas listas");
        
        // Sincronizar presupuesto
        if (HORIZONTE.metricsDisplay) {
            HORIZONTE.metricsDisplay.actualizarPresupuesto(state.presupuestoDisponible);
        }
    }
    
    /**
     * Maneja el evento del visualizador de mapa listo
     * @param {CustomEvent} event - Evento con datos
     */
    function handleMapViewerReady(event) {
        console.log("Mapa listo:", event.detail.mapId);
    }
    
    /**
     * Maneja los cambios de estado de la escena 3D
     * @param {CustomEvent} event - Evento con datos de estado
     */
    function handleMapSceneStatus(event) {
        console.log("Estado de escena:", event.detail.message, event.detail.status);
        
        // Actualizar indicador de carga si corresponde
        if (event.detail.status === 'loading') {
            state.loading = true;
        } else if (event.detail.status === 'operational' || event.detail.status === 'error') {
            state.loading = false;
        }
    }
    
    /**
     * Renderiza la lista de proyectos
     * @param {Array} proyectos - Lista de proyectos a renderizar
     */
    function renderizarProyectos(proyectos) {
        console.log("Función renderizarProyectos iniciada con", proyectos.length, "proyectos");
        
        const projectListDiv = document.getElementById('projectList');
        if (!projectListDiv) {
            console.error("Error: No se encontró el elemento con ID 'projectList'. Verifica tu HTML.");
            return;
        }
        
        console.log("Elemento projectList encontrado, limpiando contenido anterior");
        projectListDiv.innerHTML = '';
        
        // Verificar si hay proyectos para renderizar
        if (proyectos.length === 0) {
            console.warn("No hay proyectos para mostrar");
            projectListDiv.innerHTML = '<div class="empty-message">No hay operaciones disponibles</div>';
            return;
        }
        
        try {
            // Agrupar proyectos por nombre para evitar duplicados en la lista
            const proyectosPorNombre = {};
            proyectos.forEach(proyecto => {
                if (!proyecto.attributes || !proyecto.attributes.proyecto) {
                    console.warn("Proyecto sin atributos o sin nombre:", proyecto);
                    return;
                }
                
                const nombreProyecto = proyecto.attributes.proyecto.toLowerCase();
                if (!proyectosPorNombre[nombreProyecto]) {
                    proyectosPorNombre[nombreProyecto] = [];
                }
                proyectosPorNombre[nombreProyecto].push(proyecto);
            });
            
            console.log("Proyectos agrupados por nombre:", Object.keys(proyectosPorNombre).length, "grupos");
            
            // Renderizar cada grupo de proyectos
            Object.entries(proyectosPorNombre).forEach(([nombreProyecto, proyectosGrupo]) => {
                const proyecto = proyectosGrupo[0];
                
                // Crear elemento de proyecto con estilo militar
                const projectDiv = document.createElement('div');
                projectDiv.className = 'project-item';
                
                // Verificar disponibilidad del proyecto
                const proyectosDisponibles = proyectosGrupo.filter(
                    p => !state.proyectosUsados.has(p.attributes.objectid) && 
                        p.attributes.valorinversion <= state.presupuestoDisponible
                );
                
                // Buscar el proyecto con menor costo de este grupo
                const proyectoMasBarato = proyectosGrupo.reduce((min, p) => 
                    (p.attributes.valorinversion < min.attributes.valorinversion) ? p : min, 
                    proyectosGrupo[0]
                );
                
                const superaPresupuesto = proyectoMasBarato.attributes.valorinversion > state.presupuestoDisponible || proyectosDisponibles.length === 0;
                const yaUtilizado = state.proyectosNombresUsados.has(nombreProyecto);
                
                // Marcar como deshabilitado si corresponde
                if (superaPresupuesto || yaUtilizado) {
                    projectDiv.classList.add('disabled');
                    projectDiv.setAttribute('disabled', 'true');
                }
                
                // Obtener textos de la configuración
                const textos = HORIZONTE.config && HORIZONTE.config.textos 
                    ? HORIZONTE.config.textos 
                    : {
                        alreadySelectedWarning: "DESPLEGADO EN TERRENO",
                        lowBudgetWarning: "RECURSOS INSUFICIENTES"
                    };
                
                // Contenido militar para el proyecto
                projectDiv.innerHTML = `
                    <h3>${proyecto.attributes.proyecto}</h3>
                    <div class="project-details">
                        <span class="project-cost">Recursos: $${proyectoMasBarato.attributes.valorinversion.toLocaleString()}</span>
                        <span class="project-status">
                            ${yaUtilizado ? `<span class="excede-presupuesto">${textos.alreadySelectedWarning}</span>` : ''}
                            ${superaPresupuesto && !yaUtilizado ? `<span class="excede-presupuesto">${textos.lowBudgetWarning}</span>` : ''}
                        </span>
                    </div>
                `;
                
                // Manejador de eventos para click
                const handleProyectoClick = (event) => {
                    console.log("Click en proyecto:", nombreProyecto);
                    
                    // No permitir seleccionar si ya está utilizado o no hay presupuesto
                    if (proyectosDisponibles.length === 0 || yaUtilizado) {
                        console.log("Proyecto no disponible:", {
                            proyectosDisponibles: proyectosDisponibles.length,
                            yaUtilizado: yaUtilizado
                        });
                        
                        if (yaUtilizado) {
                            mostrarMensajeEstado(`Operación ${proyecto.attributes.proyecto} ya desplegada`, "warning");
                        } else if (superaPresupuesto) {
                            mostrarMensajeEstado(`Recursos insuficientes para ${proyecto.attributes.proyecto}`, "error");
                        }
                        return;
                    }
                    
                    // Si hay ubicaciones disponibles, mostrarlas
                    if (proyectosDisponibles.length >= 1) {
                        console.log("Mostrando ubicaciones para proyecto:", nombreProyecto);
                        
                        if (HORIZONTE.mapScene && HORIZONTE.mapScene.mostrarUbicacionesProyecto) {
                            HORIZONTE.mapScene.mostrarUbicacionesProyecto(proyecto).catch(error => {
                                console.error("Error al mostrar ubicaciones:", error);
                                if (error.code === 'PROYECTO_USADO') {
                                    mostrarMensajeEstado(`Operación ${proyecto.attributes.proyecto} ya desplegada`, "warning");
                                } else if (error.code === 'NO_UBICACIONES') {
                                    mostrarMensajeEstado(`No hay ubicaciones disponibles para ${proyecto.attributes.proyecto}`, "error");
                                } else {
                                    mostrarMensajeEstado("Error al cargar ubicaciones", "error");
                                }
                            });
                        } else {
                            console.error("La función mostrarUbicacionesProyecto no está disponible");
                            mostrarMensajeEstado("Error: Función no disponible", "error");
                        }
                    }
                };
                
                // Agregar event listener y atributos de datos
                projectDiv.addEventListener('click', handleProyectoClick);
                projectDiv.setAttribute('data-id', proyecto.attributes.objectid);
                projectDiv.setAttribute('data-nombre', nombreProyecto);
                projectDiv.setAttribute('data-valor', proyectoMasBarato.attributes.valorinversion);
                
                // Si ya está utilizado, marcar como tal
                if (yaUtilizado) {
                    projectDiv.dataset.usado = 'true';
                }
                
                // Añadir al contenedor
                projectListDiv.appendChild(projectDiv);
                
                console.log("Proyecto agregado a la lista:", nombreProyecto);
            });
            
            console.log("Renderizado de proyectos completado");
        } catch (error) {
            console.error("Error al renderizar proyectos:", error);
            projectListDiv.innerHTML = '<div class="error-message">Error al cargar operaciones</div>';
        }
    }
    
    /**
     * Obtiene los proyectos seleccionados
     * @returns {Array} Lista de proyectos seleccionados
     */
    function getProyectosSeleccionados() {
        return state.proyectosSeleccionados;
    }
    
    // Exponer funciones públicas
    HORIZONTE.app = {
        init,
        presupuestoInicial: config.presupuestoInicial,
        get presupuestoDisponible() { return state.presupuestoDisponible; }, // Getter para acceso actual
        actualizarPresupuesto,
        actualizarPresupuestoGlobal, // Nueva función centralizada
        mostrarMensajeEstado,
        renderizarProyectos,
        crearControlesSeleccion,
        seleccionarUbicacion,
        cerrarModal,
        mostrarUbicacionesProyecto,
        getProyectosSeleccionados
    };
    })(); // <-- Estos paréntesis son importantes para invocar inmediatamente la función