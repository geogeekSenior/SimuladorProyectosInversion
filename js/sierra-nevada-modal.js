/**
 * Modal Informativo para Pantalla Inicial - Sierra Nevada
 * 
 * Este código crea un modal informativo que aparece automáticamente
 * al cargar el step1.html, presentando información sobre la Sierra Nevada
 * de Santa Marta y la situación de esperanza de vida de sus comunidades.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Crear el modal solo si estamos en step1.html
    if (window.location.pathname.includes('step1.html')) {
        crearModalSierraNevada();
    }
});

/**
 * Crea y muestra el modal informativo de la Sierra Nevada
 */
function crearModalSierraNevada() {
    // Verificar si ya existe el modal
    if (document.getElementById('sierraModal')) return;
    
    // Crear el HTML del modal con la estructura simplificada pero texto completo
    const modalHTML = `
        <div id="sierraModal" class="team-modal">
            <div class="team-modal-content sierra-modal-content">
                <div class="team-modal-header">
                    <h2>Sierra Nevada de Santa Marta: Un Tesoro en Crisis</h2>
                    <div class="team-modal-subtitle"> </div>
                </div>
                <div class="team-modal-body">
                    <div class="sierra-content">
                        <p class="sierra-text">
                        La Sierra Nevada de Santa Marta, ecosistema de importancia para Colombia, enfrenta una profunda crisis multidimensional que amenaza la vida y el bienestar de sus habitantes. Este imponente macizo montañoso, cuyas cumbres superan los 5.700 metros de altitud, alberga una biodiversidad excepcional y constituye el territorio vital para las comunidades que habitan esta región emblemática.                        </p>
                        
                        <div class="sierra-warning">
                            <p class="sierra-text">
                                <strong>ALERTA CRÍTICA:</strong> Las comunidades de la Sierra Nevada presentan una esperanza de vida de 72.04 años, significativamente inferior al promedio nacional. Los indicadores muestran:
                            </p>
                            <ul>
                                <li>Seguridad: 24.06% (Incremento de violencia y presencia de Minas AntiPersona)</li>
                                <li>Desarrollo: 47.94% (Desnutrición infantil crítica del 12%)</li>
                                <li>Gobernabilidad: 7.91% (Deterioro institucional severa)</li>
                            </ul>
                            <p class="sierra-text">
                                <strong>Sin intervención inmediata, la esperanza de vida podría reducirse entre 1.5 y 2 años en los próximos 18 meses.</strong>
                            </p>
                        </div>
                        
                        <div class="life-expectancy-comparison">

                            <div class="life-bar-container">
                                <div class="life-bar-label">SIERRA NEVADA (Esperanza de Vida - ACTUAL)</div>
                                <div class="life-bar-outer">
                                    <div class="life-bar-inner sierra"></div>
                                </div>
                                <div class="life-bar-value">72.04 años</div>
                            </div>
                       
                        </div>
                        
                       
                    </div>
                </div>
                <div class="team-modal-footer">
                    <button id="sierraStartMission" class="military-button">ASUMIR RETO</button>
                </div>
            </div>
        </div>
    `;
    
    // Estilos específicos para este modal
    const modalStyles = `
        <style>
            .sierra-modal-content {
                max-width: 600px;
                /* Ajuste para que ocupe el 80% del alto de la pantalla */
                height: 80vh;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
            }
            
            /* Ajuste para permitir scroll en caso necesario pero ocupar el 80% de altura */
            .team-modal-body {
                flex: 1;
                overflow-y: auto;
            }
            
            .sierra-content {
                font-family: var(--font-primary);
                color: var(--text-color);
            }
            
            .sierra-text {
                line-height: 1.6;
                margin-bottom: 20px;
                font-size: 14px;
                color: var(--text-color);
            }
            
            .sierra-warning {
                background-color: rgba(26, 34, 40, 0.7);
                border-left: 4px solid var(--warning-color);
                padding: 15px;
                margin: 15px 0;
            }
            
            .life-expectancy-comparison {
                background-color: rgba(0, 0, 0, 0.2);
                padding: 15px;
                border-radius: 4px;
                margin: 20px 0;
                border: 1px solid var(--primary-color-dark);
            }
            
            .life-bar-container {
                margin-bottom: 15px;
            }
            
            .life-bar-label {
                font-family: var(--font-monospace);
                font-weight: var(--font-weight-semibold);
                margin-bottom: 5px;
                color: var(--text-color);
            }
            
            .life-bar-outer {
                height: 20px;
                background-color: rgba(0, 0, 0, 0.3);
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 5px;
                border: 1px solid var(--primary-color-dark);
            }
            
            .life-bar-inner {
                height: 100%;
                width: 0;
                transition: width 1.5s ease-out;
            }
            
            .life-bar-inner.national {
                background-color: #517f35;
                background-image: repeating-linear-gradient(
                    -45deg,
                    #517f35,
                    #517f35 10px,
                    #3a5d94 10px,
                    #3a5d94 20px
                );
            }
            
            .life-bar-inner.sierra {
                background-color: #a78838;
                background-image: repeating-linear-gradient(
                    -45deg,
                    #a78838,
                    #a78838 10px,
                    #8a6c20 10px,
                    #8a6c20 20px
                );
            }
            
            .life-bar-value {
                font-family: var(--font-monospace);
                font-size: 12px;
                color: var(--text-color);
                text-align: right;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            #sierraModal {
                animation: fadeIn 0.5s ease-out;
            }
            
            @media (max-width: 768px) {
                .sierra-text {
                    font-size: 13px;
                }
                
                /* Mantener proporción en móviles */
                .sierra-modal-content {
                    height: 80vh;
                    max-height: 80vh;
                }
            }
        </style>
    `;
    
    // Añadir los estilos al documento
    document.head.insertAdjacentHTML('beforeend', modalStyles);
    
    // Añadir el modal al body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar el modal con una pequeña animación
    setTimeout(() => {
        const modal = document.getElementById('sierraModal');
        modal.style.display = 'flex';
        
        // Animar las barras después de un breve retraso
        setTimeout(() => {
            const nationalBar = document.querySelector('.life-bar-inner.national');
            const sierraBar = document.querySelector('.life-bar-inner.sierra');
            
            if (nationalBar) nationalBar.style.width = '100%';
            if (sierraBar) sierraBar.style.width = '78%';
        }, 300);
    }, 500);
    
    // Configurar el botón para cerrar el modal e iniciar la misión
    document.getElementById('sierraStartMission').addEventListener('click', (e) => {
        // Prevenir comportamiento por defecto que podría causar scroll
        e.preventDefault();
        
        // Asegurarnos de que la página se mantiene en la parte superior
        window.scrollTo(0, 0);
        
        const modal = document.getElementById('sierraModal');
        modal.style.opacity = '0';
        
        // Usar transition para una salida suave
        modal.style.transition = 'opacity 0.3s ease-in-out';
        
        // Remover el modal después de la animación
        setTimeout(() => {
            modal.style.display = 'none';
            
            // Si existe un botón para proceder, simular un clic en él
            const proceedButton = document.getElementById('proceed-button');
            if (proceedButton) {
                // Hacemos focus y destacamos el botón antes de activarlo
                proceedButton.focus();
                proceedButton.classList.add('pulse');
            }
            
            // Garantizar que la página permanezca en la parte superior
            window.scrollTo(0, 0);
        }, 300);
    });
}