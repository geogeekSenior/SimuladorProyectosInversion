/**
 * fullscreen-manager.js - Gestor de pantalla completa para el app-container
 * Horizonte: Juego de Estrategia - VERSIÓN MEJORADA
 */

// Verificar que el namespace HORIZONTE existe
if (!window.HORIZONTE) window.HORIZONTE = {};

HORIZONTE.fullscreenManager = (function() {
    // Estado del módulo
    const state = {
        isFullscreen: false,
        appContainer: null,
        fullscreenButton: null,
        resourceContainer: null,
        presupuestoElement: null,
        originalParent: null,
        originalNextSibling: null,
        initialized: false
    };

    /**
     * Inicializa el gestor de pantalla completa
     */
    function init() {
        if (state.initialized) return;

        // Buscar el contenedor de la aplicación
        state.appContainer = document.getElementById('app-container');
        
        if (!state.appContainer) {
            console.warn('No se encontró el elemento app-container');
            return;
        }

        // Buscar el contenedor de recursos
        state.resourceContainer = document.querySelector('.resource-container');
        
        if (!state.resourceContainer) {
            console.warn('No se encontró el contenedor de recursos');
            return;
        }

        // Buscar el elemento de presupuesto
        state.presupuestoElement = document.getElementById('presupuestoTotal');
        
        if (!state.presupuestoElement) {
            console.warn('No se encontró el elemento de presupuesto');
            return;
        }

        // Crear botón de pantalla completa
        createFullscreenButton();
        
        // Configurar eventos
        setupEventListeners();
        
        // Marcar como inicializado
        state.initialized = true;
        
        console.log('Gestor de pantalla completa inicializado');
    }

    /**
     * Crea el botón de pantalla completa junto al elemento de recursos
     */
    function createFullscreenButton() {
        // Convertir el contenedor de recursos en un flexbox
        state.resourceContainer.style.display = 'flex';
        state.resourceContainer.style.alignItems = 'center';
        state.resourceContainer.style.justifyContent = 'space-between';
        state.resourceContainer.style.gap = '12px';

        // Crear un contenedor para el presupuesto y la barra
        const budgetContainer = document.createElement('div');
        budgetContainer.className = 'budget-container';
        budgetContainer.style.flex = '1';
        budgetContainer.style.minWidth = '0';

        // Mover el elemento de presupuesto al contenedor
        const resourceBar = state.resourceContainer.querySelector('.resource-bar-container');
        budgetContainer.appendChild(state.presupuestoElement);
        if (resourceBar) {
            budgetContainer.appendChild(resourceBar);
        }

        // Crear botón de pantalla completa
        state.fullscreenButton = document.createElement('button');
        state.fullscreenButton.id = 'app-fullscreen-button';
        state.fullscreenButton.className = 'app-fullscreen-button inline-button';
        state.fullscreenButton.innerHTML = '<span class="fullscreen-icon">⛶</span>';
        state.fullscreenButton.title = 'Activar/Desactivar pantalla completa';

        // Limpiar el contenedor y añadir los nuevos elementos
        state.resourceContainer.innerHTML = '';
        state.resourceContainer.appendChild(budgetContainer);
        state.resourceContainer.appendChild(state.fullscreenButton);
    }

    /**
     * Configura los event listeners
     */
    function setupEventListeners() {
        // Click en el botón
        state.fullscreenButton.addEventListener('click', toggleFullscreen);
        
        // Tecla Escape para salir de pantalla completa
        document.addEventListener('keydown', handleEscapeKey);
        
        // Detectar cambios en la API nativa de pantalla completa
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        // Redimensionar ventana cuando se activa/desactiva
        window.addEventListener('resize', handleWindowResize);
    }

    /**
     * Alterna el estado de pantalla completa
     */
    function toggleFullscreen() {
        if (state.isFullscreen) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    }

    /**
     * Entra en modo pantalla completa
     */
    function enterFullscreen() {
        if (state.isFullscreen) return;

        try {
            // Guardar posición original
            state.originalParent = state.appContainer.parentNode;
            state.originalNextSibling = state.appContainer.nextSibling;

            // Añadir clase de pantalla completa
            state.appContainer.classList.add('app-fullscreen');
            document.body.classList.add('app-fullscreen-active');
            
            // Actualizar estado
            state.isFullscreen = true;

            // Actualizar botón
            updateButtonState();

            // Notificar a otros componentes
            notifyFullscreenChange(true);

            // Usar la API nativa de pantalla completa si está disponible
            if (state.appContainer.requestFullscreen) {
                state.appContainer.requestFullscreen().catch(console.warn);
            } else if (state.appContainer.webkitRequestFullscreen) {
                state.appContainer.webkitRequestFullscreen();
            } else if (state.appContainer.mozRequestFullScreen) {
                state.appContainer.mozRequestFullScreen();
            } else if (state.appContainer.msRequestFullscreen) {
                state.appContainer.msRequestFullscreen();
            }

            // Mensaje de estado
            if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                HORIZONTE.utils.showStatusMessage("Modo pantalla completa activado - Presiona ESC para salir", "info", 3000);
            }

        } catch (error) {
            console.error('Error al entrar en pantalla completa:', error);
            // Revertir cambios si hay error
            exitFullscreen();
        }
    }

    /**
     * Sale del modo pantalla completa
     */
    function exitFullscreen() {
        if (!state.isFullscreen) return;

        try {
            // Remover clases
            state.appContainer.classList.remove('app-fullscreen');
            document.body.classList.remove('app-fullscreen-active');
            
            // Actualizar estado
            state.isFullscreen = false;

            // Actualizar botón
            updateButtonState();

            // Notificar a otros componentes
            notifyFullscreenChange(false);

            // Salir de la API nativa de pantalla completa
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(console.warn);
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }

            // Mensaje de estado
            if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                HORIZONTE.utils.showStatusMessage("Modo pantalla completa desactivado", "info", 2000);
            }

        } catch (error) {
            console.error('Error al salir de pantalla completa:', error);
        }
    }

    /**
     * Actualiza el estado visual del botón
     */
    function updateButtonState() {
        const icon = state.fullscreenButton.querySelector('.fullscreen-icon');
        
        if (state.isFullscreen) {
            icon.textContent = '⛶';
            state.fullscreenButton.classList.add('active');
            state.fullscreenButton.title = 'Salir de pantalla completa (ESC)';
        } else {
            icon.textContent = '⛶';
            state.fullscreenButton.classList.remove('active');
            state.fullscreenButton.title = 'Activar pantalla completa';
        }
    }

    /**
     * Maneja la tecla Escape
     */
    function handleEscapeKey(event) {
        if (event.key === 'Escape' && state.isFullscreen) {
            exitFullscreen();
        }
    }

    /**
     * Maneja cambios en la API nativa de pantalla completa
     */
    function handleFullscreenChange() {
        const isNativeFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );

        // Si la API nativa salió de pantalla completa, actualizar nuestro estado
        if (!isNativeFullscreen && state.isFullscreen) {
            // Solo actualizar el estado interno, no llamar exitFullscreen para evitar recursión
            state.appContainer.classList.remove('app-fullscreen');
            document.body.classList.remove('app-fullscreen-active');
            state.isFullscreen = false;
            updateButtonState();
            notifyFullscreenChange(false);
        }
    }

    /**
     * Maneja el redimensionamiento de ventana
     */
    function handleWindowResize() {
        if (state.isFullscreen) {
            // Forzar actualización del mapa si existe
            setTimeout(() => {
                if (HORIZONTE.mapScene && HORIZONTE.mapScene.view) {
                    try {
                        HORIZONTE.mapScene.view.container.classList.add('force-resize');
                        setTimeout(() => {
                            HORIZONTE.mapScene.view.container.classList.remove('force-resize');
                        }, 100);
                    } catch (error) {
                        console.warn('Error al redimensionar vista del mapa:', error);
                    }
                }
            }, 300);
        }
    }

    /**
     * Notifica a otros componentes sobre el cambio de pantalla completa
     */
    function notifyFullscreenChange(isFullscreen) {
        // Disparar evento personalizado
        const event = new CustomEvent('horizonte:fullscreenChanged', {
            detail: {
                isFullscreen: isFullscreen,
                container: 'app-container'
            }
        });
        document.dispatchEvent(event);

        // Notificar específicamente al mapa para que se reajuste
        if (HORIZONTE.mapScene && HORIZONTE.mapScene.view) {
            setTimeout(() => {
                try {
                    // Forzar redimensionamiento del mapa
                    HORIZONTE.mapScene.view.padding = { ...HORIZONTE.mapScene.view.padding };
                } catch (error) {
                    console.warn('Error al actualizar vista del mapa:', error);
                }
            }, 500);
        }
    }

    /**
     * Destruye el gestor (limpieza)
     */
    function destroy() {
        if (!state.initialized) return;

        // Salir de pantalla completa si está activa
        if (state.isFullscreen) {
            exitFullscreen();
        }

        // Remover event listeners
        document.removeEventListener('keydown', handleEscapeKey);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        window.removeEventListener('resize', handleWindowResize);

        // Restaurar estructura original del contenedor de recursos
        if (state.resourceContainer && state.presupuestoElement) {
            // Remover estilos aplicados
            state.resourceContainer.style.display = '';
            state.resourceContainer.style.alignItems = '';
            state.resourceContainer.style.justifyContent = '';
            state.resourceContainer.style.gap = '';

            // Restaurar contenido original
            const budgetContainer = state.resourceContainer.querySelector('.budget-container');
            if (budgetContainer) {
                const resourceBar = budgetContainer.querySelector('.resource-bar-container');
                
                // Limpiar y restaurar
                state.resourceContainer.innerHTML = '';
                state.resourceContainer.appendChild(state.presupuestoElement);
                if (resourceBar) {
                    state.resourceContainer.appendChild(resourceBar);
                }
            }
        }

        // Resetear estado
        state.initialized = false;
        state.isFullscreen = false;
        state.appContainer = null;
        state.resourceContainer = null;
        state.presupuestoElement = null;
        state.fullscreenButton = null;
    }

    /**
     * Verifica si está en pantalla completa
     * @returns {boolean}
     */
    function isFullscreen() {
        return state.isFullscreen;
    }

    // API pública
    return {
        init,
        toggleFullscreen,
        enterFullscreen,
        exitFullscreen,
        isFullscreen,
        destroy
    };
})();

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Pequeño retraso para asegurar que otros componentes estén listos
    setTimeout(() => {
        HORIZONTE.fullscreenManager.init();
    }, 1000);
});

// También inicializar cuando la aplicación esté lista
document.addEventListener('horizonte:ready', function() {
    if (!HORIZONTE.fullscreenManager.isFullscreen) {
        HORIZONTE.fullscreenManager.init();
    }
});