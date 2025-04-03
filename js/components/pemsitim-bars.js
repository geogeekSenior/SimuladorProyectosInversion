/**
 * pemsitim-bars.js - Funcionalidad para barras de progreso PEMSITIM
 * Horizonte: Juego de Estrategia
 */

// Módulo para barras PEMSITIM
HORIZONTE.pemsitimBars = (function() {
    /**
     * Anima las barras de progreso basadas en sus data-value
     */
    function animateBars() {
        const bars = document.querySelectorAll('.bar-inner');
        
        bars.forEach(bar => {
            // Obtener el valor del atributo data-value
            const value = parseFloat(bar.getAttribute('data-value'));
            
            if (!isNaN(value)) {
                // Asignar clase según el valor
                const container = bar.closest('.dimension-bar-container');
                if (value < 30) {
                    container.classList.add('level-low');
                } else if (value < 60) {
                    container.classList.add('level-medium');
                } else {
                    container.classList.add('level-high');
                }
                
                // Animar la barra después de un breve retraso
                setTimeout(() => {
                    bar.style.width = `${value}%`;
                }, 300);
            }
        });
    }
    
    /**
     * Actualiza los valores de las barras con nuevos datos
     * @param {Object} data - Objeto con los nuevos valores
     */
    function updateValues(data) {
        if (!data) return;
        
        Object.entries(data).forEach(([key, value]) => {
            // Buscar la barra correspondiente
            const bar = document.querySelector(`.dimension-bar-container .bar-label:contains("${key}")`);
            if (bar) {
                const container = bar.closest('.dimension-bar-container');
                const barInner = container.querySelector('.bar-inner');
                const barValue = container.querySelector('.bar-value');
                
                // Actualizar valores
                barInner.setAttribute('data-value', value);
                barValue.textContent = `${value}%`;
                
                // Resetear clases
                container.classList.remove('level-low', 'level-medium', 'level-high');
                
                // Asignar nueva clase
                if (value < 30) {
                    container.classList.add('level-low');
                } else if (value < 60) {
                    container.classList.add('level-medium');
                } else {
                    container.classList.add('level-high');
                }
                
                // Animar
                barInner.style.width = `${value}%`;
            }
        });
    }
    
    // API pública
    return {
        animateBars,
        updateValues
    };
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Ejecutar con un pequeño retraso para asegurar que todo está cargado
    setTimeout(HORIZONTE.pemsitimBars.animateBars, 500);
});