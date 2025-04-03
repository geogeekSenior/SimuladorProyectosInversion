/**
 * tabs.js - Controla el sistema de pestañas y la funcionalidad de pantalla completa
 * Horizonte: Juego de Estrategia
 */

// Namespace global para módulo de pestañas
window.HORIZONTE = window.HORIZONTE || {};
HORIZONTE.tabs = {};

/**
 * Inicializa el sistema de pestañas
 */
HORIZONTE.tabs.init = function() {
    console.log('Inicializando sistema de pestañas...');
    
    // Obtener elementos DOM
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const fullscreenButtons = document.querySelectorAll('.fullscreen-button');
    
    // Configurar eventos para botones de pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Desactivar todas las pestañas
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activar la pestaña seleccionada
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Evento personalizado para notificar cambio de pestaña
            document.dispatchEvent(new CustomEvent('horizonte:tabChanged', {
                detail: { tabId: tabId }
            }));
            
            // Si es la pestaña de mapa y está operativa, actualizar la vista
            if (tabId === 'map-tab' && HORIZONTE.mapViewer && HORIZONTE.mapViewer.isInitialized()) {
                setTimeout(() => {
                    try {
                        // Intentar refrescar el mapa
                        if (HORIZONTE.mapViewer.refreshView) {
                            HORIZONTE.mapViewer.refreshView();
                        }
                    } catch (e) {
                        console.warn('No se pudo refrescar la vista del mapa:', e);
                    }
                }, 300);
            }
            
            // Si es la pestaña de álgebra, asegurarse de que el iframe esté cargado
            if (tabId === 'algebra-tab') {
                const algebraFrame = document.getElementById('algebraFrame');
                if (algebraFrame && (!algebraFrame.src || algebraFrame.src === 'about:blank')) {
                    algebraFrame.src = 'AlgebraDinamica/index.html';
                }
                
                // Esperar un momento y luego intentar que el iframe tome el foco
                setTimeout(() => {
                    try {
                        algebraFrame.contentWindow.focus();
                    } catch (e) {
                        console.warn('No se pudo enfocar el iframe de álgebra:', e);
                    }
                }, 500);
            }
        });
    });
    
    // Configurar eventos para botones de pantalla completa
    fullscreenButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            // Alternar clase de pantalla completa
            targetElement.classList.toggle('fullscreen');
            
            // Cambiar ícono según estado
            const icon = this.querySelector('.fullscreen-icon');
            if (targetElement.classList.contains('fullscreen')) {
                icon.textContent = '⛶'; // Ícono para salir de pantalla completa
                // Añadir evento para tecla Escape
                document.addEventListener('keydown', HORIZONTE.tabs.handleEscKey);
            } else {
                icon.textContent = '⛶'; // Ícono para entrar en pantalla completa
                document.removeEventListener('keydown', HORIZONTE.tabs.handleEscKey);
            }
            
            // Evento personalizado para notificar cambio de pantalla completa
            document.dispatchEvent(new CustomEvent('horizonte:fullscreenChanged', {
                detail: { 
                    tabId: targetId,
                    isFullscreen: targetElement.classList.contains('fullscreen')
                }
            }));
            
            // Si es la pestaña de mapa, actualizar la vista
            if (targetId === 'map-tab' && HORIZONTE.mapViewer && HORIZONTE.mapViewer.isInitialized()) {
                setTimeout(() => {
                    try {
                        // Intentar refrescar el mapa
                        if (HORIZONTE.mapViewer.refreshView) {
                            HORIZONTE.mapViewer.refreshView();
                        }
                    } catch (e) {
                        console.warn('No se pudo refrescar la vista del mapa:', e);
                    }
                }, 300);
            }
            
            // Si es la pestaña de álgebra, manejar el iframe
            if (targetId === 'algebra-tab') {
                const algebraFrame = document.getElementById('algebraFrame');
                if (algebraFrame) {
                    // Dar tiempo para que se ajuste el tamaño y luego enfocar
                    setTimeout(() => {
                        try {
                            // Intentar notificar al iframe del cambio de tamaño
                            if (algebraFrame.contentWindow && algebraFrame.contentWindow.postMessage) {
                                algebraFrame.contentWindow.postMessage(
                                    { type: 'resize', isFullscreen: targetElement.classList.contains('fullscreen') },
                                    '*'
                                );
                            }
                            
                            // Intentar que el iframe tome el foco
                            algebraFrame.contentWindow.focus();
                        } catch (e) {
                            console.warn('Error al interactuar con iframe:', e);
                        }
                    }, 500);
                }
            }
        });
    });
    
    console.log('Sistema de pestañas inicializado correctamente');
};

/**
 * Maneja la tecla Escape para salir del modo pantalla completa
 * @param {KeyboardEvent} event - Evento de teclado
 */
HORIZONTE.tabs.handleEscKey = function(event) {
    if (event.key === 'Escape') {
        const fullscreenElement = document.querySelector('.tab-content.fullscreen');
        if (fullscreenElement) {
            fullscreenElement.classList.remove('fullscreen');
            
            // Actualizar ícono del botón
            const button = document.querySelector(`.fullscreen-button[data-target="${fullscreenElement.id}"]`);
            if (button) {
                const icon = button.querySelector('.fullscreen-icon');
                icon.textContent = '⛶';
            }
            
            // Remover este manejador de eventos
            document.removeEventListener('keydown', HORIZONTE.tabs.handleEscKey);
            
            // Evento personalizado para notificar cambio de pantalla completa
            document.dispatchEvent(new CustomEvent('horizonte:fullscreenChanged', {
                detail: { 
                    tabId: fullscreenElement.id,
                    isFullscreen: false
                }
            }));
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Buscar sistema de pestañas en el documento
    if (document.querySelector('.tabs-container')) {
        HORIZONTE.tabs.init();
    }
});