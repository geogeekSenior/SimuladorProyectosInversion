/**
 * metrics-display.js - Componente para visualización de métricas y presupuesto
 * Gestiona la presentación visual de recursos en el Simulador de Inversiones
 */

// Módulo para visualización de métricas
(function() {
    // Verificar que el namespace HORIZONTE existe
    if (!window.HORIZONTE) window.HORIZONTE = {};
    
    // Estado del módulo
    const state = {
        presupuestoInicial: 10000,
        presupuestoDisponible: 10000,
        initialized: false,
        elementos: {
            presupuestoTotal: null,
            presupuestoBar: null
        },
        proyectosSeleccionados: []
    };
    
    /**
     * Inicializa el módulo de métricas
     */
    function init() {
        if (state.initialized) return;
        
        // Obtener configuración del módulo config
        if (HORIZONTE.config && HORIZONTE.config.app) {
            state.presupuestoInicial = HORIZONTE.config.app.presupuestoInicial;
            state.presupuestoDisponible = HORIZONTE.config.app.presupuestoInicial;
        }
        
        // Inicializar referencias a elementos
        state.elementos.presupuestoTotal = document.getElementById('presupuestoTotal');
        state.elementos.presupuestoBar = document.getElementById('presupuestoBar');
        
        // Configurar escuchadores de eventos
        setupEventListeners();
        
        // Sincronizar con el presupuesto de la aplicación principal si está disponible
        if (HORIZONTE.app && HORIZONTE.app.presupuestoDisponible !== undefined) {
            state.presupuestoDisponible = HORIZONTE.app.presupuestoDisponible;
        }
        
        // Actualizar visualización inicial
        actualizarPresupuesto(state.presupuestoDisponible);
        
        // Marcar como inicializado
        state.initialized = true;
        
        // Notificar que las métricas están listas
        dispatchReadyEvent();
    }
    
    /**
     * Configura los escuchadores de eventos
     */
    function setupEventListeners() {
        // Escuchar cuando se selecciona un proyecto
        document.addEventListener('horizonte:proyectoSeleccionado', handleProyectoSeleccionado);
        
        // NUEVO: Escuchar actualizaciones del presupuesto global
        document.addEventListener('horizonte:presupuestoActualizado', handlePresupuestoActualizado);
    }
    
    /**
     * Maneja el evento de proyecto seleccionado
     * @param {CustomEvent} event - Evento con datos del proyecto
     */
    function handleProyectoSeleccionado(event) {
        // Añadir a la lista de proyectos seleccionados
        state.proyectosSeleccionados.push({
            proyecto: event.detail.nombreProyecto,
            valor: event.detail.proyecto.valorinversion,
            id: event.detail.proyecto.objectid
        });
        
        // NOTA: Ya no actualizamos el presupuesto aquí, eso lo maneja app.js centralizado
    }
    
    /**
     * NUEVO: Maneja el evento de actualización de presupuesto global
     * @param {CustomEvent} event - Evento con datos del presupuesto
     */
    function handlePresupuestoActualizado(event) {
        // Actualizar presupuesto disponible con el valor recibido
        actualizarPresupuesto(event.detail.presupuesto);
    }
    
    /**
     * Actualiza la visualización del presupuesto
     * @param {number} presupuesto - Presupuesto disponible
     */
    function actualizarPresupuesto(presupuesto) {
        // Actualizar valor del estado interno
        state.presupuestoDisponible = presupuesto;
        
        // Verificar que los elementos existen
        if (!state.elementos.presupuestoTotal || !state.elementos.presupuestoBar) {
            // Intentar obtener las referencias de nuevo
            state.elementos.presupuestoTotal = document.getElementById('presupuestoTotal');
            state.elementos.presupuestoBar = document.getElementById('presupuestoBar');
            
            // Si siguen sin existir, salir
            if (!state.elementos.presupuestoTotal || !state.elementos.presupuestoBar) {
                return;
            }
        }
        
        // Obtener textos desde la configuración
        const textos = HORIZONTE.config && HORIZONTE.config.textos 
            ? HORIZONTE.config.textos 
            : { budgetTitle: "RECURSOS ESTRATÉGICOS" };
        
        // Formatear para visualización militar
        state.elementos.presupuestoTotal.textContent = `${textos.budgetTitle}: ${state.presupuestoDisponible.toLocaleString()}`;
        
        // Calcular porcentaje de recursos utilizados
        const presupuestoUsado = state.presupuestoInicial - state.presupuestoDisponible;
        const porcentajeUsado = (presupuestoUsado / state.presupuestoInicial) * 100;
        
        // Obtener umbrales de advertencia desde la configuración
        const metrics = HORIZONTE.config && HORIZONTE.config.metrics 
            ? HORIZONTE.config.metrics 
            : { umbralAdvertencia: 60, umbralCritico: 80 };
        
        // Actualizar barra de progreso con animación
        state.elementos.presupuestoBar.style.width = `${porcentajeUsado}%`;
        
        // Cambiar el color según el nivel de recursos
        if (porcentajeUsado > metrics.umbralCritico) {
            state.elementos.presupuestoBar.style.backgroundColor = 'var(--error-color)';
            state.elementos.presupuestoBar.style.backgroundImage = 'linear-gradient(45deg, var(--error-color) 25%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.2) 50%, var(--error-color) 50%, var(--error-color) 75%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0.2))';
            state.elementos.presupuestoBar.style.backgroundSize = '10px 10px';
        } else if (porcentajeUsado > metrics.umbralAdvertencia) {
            state.elementos.presupuestoBar.style.backgroundColor = 'var(--warning-color)';
            state.elementos.presupuestoBar.style.backgroundImage = 'linear-gradient(45deg, var(--warning-color) 25%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.2) 50%, var(--warning-color) 50%, var(--warning-color) 75%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0.2))';
            state.elementos.presupuestoBar.style.backgroundSize = '10px 10px';
        } else {
            state.elementos.presupuestoBar.style.backgroundColor = 'var(--success-color)';
            state.elementos.presupuestoBar.style.backgroundImage = 'linear-gradient(45deg, var(--success-color) 25%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.2) 50%, var(--success-color) 50%, var(--success-color) 75%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0.2))';
            state.elementos.presupuestoBar.style.backgroundSize = '10px 10px';
        }
    }
    
    /**
     * Obtiene el resumen de proyectos seleccionados
     * @returns {Object} Resumen con estadísticas
     */
    function getProyectosResumen() {
        // Calcular estadísticas
        const totalInvertido = state.proyectosSeleccionados.reduce((sum, p) => sum + p.valor, 0);
        const porcentajeUtilizado = (totalInvertido / state.presupuestoInicial) * 100;
        
        return {
            proyectos: state.proyectosSeleccionados,
            total: state.proyectosSeleccionados.length,
            totalInvertido: totalInvertido,
            presupuestoRestante: state.presupuestoDisponible,
            porcentajeUtilizado: porcentajeUtilizado.toFixed(2)
        };
    }
    
    /**
     * Sincroniza el presupuesto con el módulo principal
     */
    function sincronizarConAppPrincipal() {
        if (HORIZONTE.app && typeof HORIZONTE.app.presupuestoDisponible !== 'undefined') {
            const presupuestoApp = HORIZONTE.app.presupuestoDisponible;
            if (presupuestoApp !== state.presupuestoDisponible) {
                // Actualizar presupuesto si es diferente
                actualizarPresupuesto(presupuestoApp);
            }
        }
    }
    
    /**
     * Despacha un evento indicando que las métricas están listas
     */
    function dispatchReadyEvent() {
        const readyEvent = new CustomEvent('horizonte:metricsReady');
        document.dispatchEvent(readyEvent);
    }
    
    /**
     * Verifica si el módulo está inicializado
     * @returns {boolean} True si está inicializado
     */
    function isInitialized() {
        return state.initialized;
    }
    
    // Exponer API pública
    HORIZONTE.metricsDisplay = {
        init,
        actualizarPresupuesto,
        getProyectosResumen,
        sincronizarConAppPrincipal,
        isInitialized
    };
})();