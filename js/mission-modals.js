/**
 * mission-modals.js - Modales de objetivos para cada fase del juego
 * Horizonte: Juego de Estrategia
 */

// Estilos específicos adicionales solo para los modales de misión
const missionSpecificStyles = `
<style id="mission-modal-styles">
    /* Ajustes generales del modal */
    .team-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
    }
    
    /* Contenido del modal */
    .sierra-modal-content {
        max-width: 700px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }
    
    /* Asegurar que el footer esté siempre visible */
    .team-modal-footer {
        background-color: var(--panel-bg-color);
        border-top: 1px solid var(--primary-color-dark);
        padding: 15px;
        margin-top: auto;
        position: sticky;
        bottom: 0;
        width: 100%;
        box-shadow: 0 -4px 10px rgba(0,0,0,0.3);
    }
    
    /* Estado inicial para animación */
    .mission-bar {
        width: 0%;
    }

    /* Caja de información clave */
    .mission-key-info {
        background-color: rgba(26, 58, 110, 0.2);
        border-left: 4px solid var(--primary-color);
        padding: 15px;
        margin: 15px 0;
        border-radius: var(--border-radius-sm);
    }
    
    .mission-key-info p {
        margin-bottom: 8px;
        font-family: var(--font-monospace);
        font-size: var(--font-size-sm);
    }
    
    .mission-key-info p:last-child {
        margin-bottom: 0;
    }
    
    .mission-key-info strong {
        color: var(--primary-color);
    }
    
    /* Título y distintivo del ciclo */
    .mission-stats-title {
        font-family: var(--font-monospace);
        font-size: var(--font-size-md);
        color: var(--text-color);
        margin: 15px 0 10px 0;
        letter-spacing: var(--letter-spacing-wide);
        position: relative;
        padding-left: 15px;
        font-weight: var(--font-weight-bold);
    }
    
    .mission-stats-title::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 100%;
        background-color: var(--primary-color);
    }
    
    /* Distintivos de ciclo */
    .ciclo1-badge {
        display: inline-block;
        background-color: var(--primary-color);
        color: var(--text-color);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: var(--font-size-xs);
        margin-left: 8px;
        vertical-align: middle;
    }
    
    .ciclo2-badge {
        display: inline-block;
        background-color: var(--accent-color);
        color: var(--panel-bg-color);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: var(--font-size-xs);
        margin-left: 8px;
        vertical-align: middle;
    }
</style>
`;

document.addEventListener('DOMContentLoaded', function() {
    // Inyectar estilos específicos de misión si no están presentes
    if (!document.getElementById('mission-modal-styles')) {
        document.head.insertAdjacentHTML('beforeend', missionSpecificStyles);
    }

    const currentPath = window.location.pathname;
    
    if (currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
        crearModalCiclo1();
    } else if (currentPath.includes('step4.html')) {
        crearModalCiclo2();
    }
});

/**
 * Crea y muestra el modal de objetivos para el Ciclo 1
 */
function crearModalCiclo1() {
    // Verificar si ya existe el modal
    if (document.getElementById('misionModalCiclo1')) return;
    
    const modalHTML = `
        <div id="misionModalCiclo1" class="team-modal">
            <div class="team-modal-content sierra-modal-content">
                <div class="team-modal-header">
                    <h2>CICLO 1: CICLO DE INVERSIÓN 2030</h2>
                    <div class="team-modal-subtitle">Primer Ciclo Estratégico - Sierra Nevada
</div>
                </div>
                <div class="team-modal-body">
                    <div class="sierra-content">
                        <p class="sierra-text">
                            <strong>OBJETIVO DE LA MISIÓN:</strong> Seleccionar los programas más efectivos para mejorar las condiciones de vida en la Sierra Nevada dentro del presupuesto asignado de $10,000 recursos estrategicos.
                        </p>
                        
                        <div class="mission-stats">
                            <h3 class="mission-stats-title">ESTADO ACTUAL (2025)</h3>
                            <div class="dimension-bars">
                                <div class="dimension-bar-container">
                                    <div class="bar-label">Seguridad</div>
                                    <div class="bar-outer">
                                        <div class="bar-inner mission-bar" data-value="23.97"></div>
                                    </div>
                                    <div class="bar-value">23.97%</div>
                                </div>
                                <div class="dimension-bar-container">
                                    <div class="bar-label">Desarrollo</div>
                                    <div class="bar-outer">
                                        <div class="bar-inner mission-bar" data-value="44.33"></div>
                                    </div>
                                    <div class="bar-value">44.33%</div>
                                </div>
                                <div class="dimension-bar-container">
                                    <div class="bar-label">Gobernabilidad</div>
                                    <div class="bar-outer">
                                        <div class="bar-inner mission-bar" data-value="6.37"></div>
                                    </div>
                                    <div class="bar-value">6.37%</div>
                                </div>
                                <div class="dimension-bar-container total-index">
                                    <div class="bar-label">Esperanza de Vida</div>
                                    <div class="bar-outer">
                                        <div class="bar-inner mission-bar" data-value="72.04"></div>
                                    </div>
                                    <div class="bar-value">72.04 años</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="sierra-warning">
                            <strong>INSTRUCCIONES:</strong>
                            <p>1. Tenga en cuenta el presupuesto disponible antes de iniciar cualquier acción.</p>
                            <p>2. En el panel derecho, en la sección "PROGRAMAS DISPONIBLES", seleccione los programas que desea ejecutar.</p>
                            <p>3. Por cada programa seleccionado, deberá elegir una ubicación, la cual se habilitará automáticamente en el panel izquierdo. Cada operación impactará una o más dimensiones: Seguridad, Desarrollo y Gobernabilidad.</p>
                            <p>4. Podrá consultar los datos mostrados del Análisis Exploratorio de las dimensiones de Seguridad, Desarrollo y Gobernabilidad a través del panel de Análisis Multidimensional, ubicado en la parte superior derecha.</p>
                            <p>5. Recuerde: el equipo que logre el mayor incremento en la esperanza de vida ganará el reto.</p>
                            <p>6. Una vez esté seguro de sus decisiones, presione el botón "GENERAR INFORME" para evaluar los resultados finales.</p>
                                        </div>
                        
                        
                    </div>
                </div>
                <div class="team-modal-footer">
                    <button id="misionStartButtonCiclo1" class="military-button">INICIAR EVALUACIÓN DE PROGRAMAS 2030</button>
                </div>
            </div>
        </div>
    `;
    
    // Añadir el modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('misionModalCiclo1');
    
    // Mostrar el modal inmediatamente
    modal.style.display = 'flex';
    
    // Animar las barras después de un breve retraso
    setTimeout(() => {
        const barras = modal.querySelectorAll('.mission-bar');
        barras.forEach(barra => {
            const valor = barra.getAttribute('data-value');
            barra.style.width = `${valor}%`;
            
            const contenedor = barra.closest('.dimension-bar-container');
            if (contenedor) {
                if (parseFloat(valor) < 40) {
                    contenedor.classList.add('level-low');
                } else if (parseFloat(valor) < 60) {
                    contenedor.classList.add('level-medium');
                } else {
                    contenedor.classList.add('level-high');
                }
            }
        });
    }, 300);
    
    // Configurar el evento del botón
    document.getElementById('misionStartButtonCiclo1').addEventListener('click', () => {
        // Cerrar el modal con transición suave
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            
            // Mostrar mensaje instructivo
            if (window.HORIZONTE && HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                HORIZONTE.utils.showStatusMessage("Seleccione programas para mejorar Esperanza de vida", "info", 5000);
            }
        }, 300);
    });
}

/**
 * Crea y muestra el modal de objetivos para el Ciclo 2
 */
function crearModalCiclo2() {
    // Verificar si ya existe el modal
    if (document.getElementById('misionModalCiclo2')) return;

    const modalHTML = `
        <div id="misionModalCiclo2" class="team-modal">
            <div class="team-modal-content sierra-modal-content">
                <div class="team-modal-header">
                    <h2>CICLO 2: CICLO DE INVERSIÓN 2035</h2>
                    <div class="team-modal-subtitle">Segunda Ciclo Estratégica - Sierra Nevada</div>
                </div>
                <div class="team-modal-body">
                    <div class="sierra-content">
                        <p class="sierra-text">
                            <strong>OBJETIVO DE SEGUNDO CICLO:</strong> Seleccionar los programas más efectivos para mejorar la Esperanza de vida en la Sierra Nevada hacia 2035, partiendo del estado alcanzado en 2035 y con un presupuesto de $10,000 recursos estrategicos.
                        </p>
                        
                        <div class="mission-stats">
                            <h3 class="mission-stats-title">PROGRESO ACTUAL (2030)</h3>
                            <div class="dimension-bars">
                                <div class="dimension-bar-container">
                                    <div class="bar-label">Seguridad</div>
                                    <div class="bar-outer">
                                        <div class="bar-inner mission-bar" data-value="41.97"></div>
                                    </div>
                                    <div class="bar-value">41.97%</div>
                                </div>
                                <div class="dimension-bar-container">
                                    <div class="bar-label">Desarrollo</div>
                                    <div class="bar-outer">
                                        <div class="bar-inner mission-bar" data-value="62.33"></div>
                                    </div>
                                    <div class="bar-value">62.33%</div>
                                </div>
                                <div class="dimension-bar-container">
                                    <div class="bar-label">Gobernabilidad</div>
                                    <div class="bar-outer">
                                        <div class="bar-inner mission-bar" data-value="24.37"></div>
                                    </div>
                                    <div class="bar-value">24.37%</div>
                                </div>
                                <div class="dimension-bar-container total-index">
                                    <div class="bar-label">Esperanza de Vida</div>
                                    <div class="bar-outer">
                                        <div class="bar-inner mission-bar" data-value="75.10"></div>
                                    </div>
                                    <div class="bar-value">75.10 años</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="sierra-warning">
                            <strong>INSTRUCCIONES:</strong>
                            <p>1. Tenga en cuenta el presupuesto disponible antes de iniciar cualquier acción.</p>
                            <p>2. En el panel derecho, en la sección "PROGRAMAS DISPONIBLES", seleccione los programas que desea ejecutar.</p>
                            <p>3. Por cada programa seleccionado, deberá elegir una ubicación, la cual se habilitará automáticamente en el panel izquierdo. Cada operación impactará una o más dimensiones: Seguridad, Desarrollo y Gobernabilidad.</p>
                            <p>4. Podrá consultar los datos mostrados del Análisis Exploratorio de las dimensiones de Seguridad, Desarrollo y Gobernabilidad a través del panel de Análisis Multidimensional, ubicado en la parte superior derecha.</p>
                            <p>5. Recuerde: el equipo que logre el mayor incremento en la esperanza de vida ganará el reto.</p>
                            <p>6. Una vez esté seguro de sus decisiones, presione el botón "GENERAR INFORME" para evaluar los resultados finales.</p>
                        </div>
                        
               
                    </div>
                </div>
                <div class="team-modal-footer">
                    <button id="misionStartButtonCiclo2" class="military-button">INICIAR EVALUACIÓN DE PROGRAMAS 2035</button>
                </div>
            </div>
        </div>
    `;
    
    // Añadir el modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('misionModalCiclo2');
    
    // Mostrar el modal inmediatamente
    modal.style.display = 'flex';
    
    // Animar las barras después de un breve retraso
    setTimeout(() => {
        const barras = modal.querySelectorAll('.mission-bar');
        barras.forEach(barra => {
            const valor = barra.getAttribute('data-value');
            barra.style.width = `${valor}%`;
            
            const contenedor = barra.closest('.dimension-bar-container');
            if (contenedor) {
                if (parseFloat(valor) < 40) {
                    contenedor.classList.add('level-low');
                } else if (parseFloat(valor) < 70) {
                    contenedor.classList.add('level-medium');
                } else {
                    contenedor.classList.add('level-high');
                }
            }
        });
    }, 300);
    
    // Configurar el evento del botón
    document.getElementById('misionStartButtonCiclo2').addEventListener('click', () => {
        // Cerrar el modal con transición suave
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            
            // Mostrar mensaje instructivo
            if (window.HORIZONTE && HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                HORIZONTE.utils.showStatusMessage("Seleccione operaciones para el segundo ciclo", "info", 5000);
            }
        }, 300);
    });
}