/**
 * progress-stepper.js - Componente web personalizado para stepper de navegación
 * Proporciona una visualización de pasos en el Simulador de Inversiones Estratégicas
 */

/**
 * Clase ProgressStepper - Componente personalizado para visualizar pasos de navegación
 * @extends HTMLElement
 */
class ProgressStepper extends HTMLElement {
    /**
     * Constructor del componente
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    /**
     * Propiedades observadas para reaccionar a cambios
     * @returns {string[]} Lista de nombres de atributos a observar
     */
    static get observedAttributes() {
        return ['current-step', 'total-steps', 'steps'];
    }

    /**
     * Callback ejecutado al conectar el elemento al DOM
     */
    connectedCallback() {
        this.render();
    }

    /**
     * Callback ejecutado cuando cambia un atributo observado
     * @param {string} name - Nombre del atributo
     * @param {string} oldValue - Valor anterior
     * @param {string} newValue - Nuevo valor
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    /**
     * Renderiza el contenido del componente
     */
    render() {
        const currentStep = parseInt(this.getAttribute('current-step') || '1');
        const totalSteps = parseInt(this.getAttribute('total-steps') || '3');
        const stepsData = JSON.parse(this.getAttribute('steps') || '[]');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --primary-color: #517f35;
                    --primary-color-dark: #33502a;
                    --secondary-color: #33502a;
                    --text-color-active: #d0d3d4;
                    --text-color-inactive: #787D7D;
                    --completed-color: #3c6d3f;
                    font-family: 'Courier New', monospace;
                    display: block;
                }

                .progress-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    max-width: 1000px;
                    margin: 0 auto;
                    position: relative;
                    padding: 10px 20px;
                }

                .stepper {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    justify-content: space-between;
                }

                .stepper-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    flex: 1;
                    min-width: 140px;
                    padding: 0 15px;
                    min-height: 60px;
                }

                .stepper-item::before,
                .stepper-item::after {
                    content: '';
                    position: absolute;
                    top: 17px;
                    height: 2px;
                    background-color: var(--secondary-color);
                    z-index: 1;
                    transition: background-color 1s ease, transform 0.8s ease;
                }

                .stepper-item::before {
                    left: 0;
                    right: 50%;
                    transform: scaleX(0);
                    transform-origin: right;
                }

                .stepper-item::after {
                    left: 50%;
                    right: 0;
                    transform: scaleX(0);
                    transform-origin: left;
                }

                .stepper-item:first-child::before {
                    left: 50%;
                    display: none;
                }

                .stepper-item:last-child::after {
                    right: 50%;
                    display: none;
                }

                .stepper-item.completed::before {
                    background-color: var(--completed-color);
                    transform: scaleX(1);
                }

                .stepper-item.completed::after {
                    background-color: var(--completed-color);
                    transform: scaleX(1);
                }

                .stepper-item.active::before {
                    background-color: var(--completed-color);
                    transform: scaleX(1);
                }

                .stepper-icon-container {
                    position: relative;
                    z-index: 2;
                    margin-bottom: 8px;
                }

                .stepper-icon {
                    width: 35px;
                    height: 35px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--secondary-color);
                    color: var(--text-color-inactive);
                    position: relative;
                    transition: all 0.3s ease;
                    font-size: 16px;
                    font-weight: 600;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    border: 1px solid var(--secondary-color);
                }

                .pulse-animation {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 4px;
                    animation: pulse 2s infinite;
                    background-color: var(--primary-color);
                    opacity: 0;
                }

                @keyframes pulse {
                    0% {
                        transform: scale(0.8);
                        opacity: 0.7;
                    }
                    70% {
                        transform: scale(1.3);
                        opacity: 0;
                    }
                    100% {
                        transform: scale(0.8);
                        opacity: 0;
                    }
                }

                .stepper-item.completed .stepper-icon,
                .stepper-item.active .stepper-icon {
                    background-color: var(--primary-color);
                    box-shadow: 0 0 8px rgba(81, 127, 53, 0.5);
                    color: var(--text-color-active);
                    border-color: var(--primary-color);
                }

                .stepper-item.completed .stepper-icon {
                    background-color: var(--completed-color);
                }

                .stepper-item.active .stepper-icon {
                    transform: scale(1.1);
                }

                .stepper-label {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-color-inactive);
                    transition: color 0.3s ease, transform 0.3s ease;
                    text-align: center;
                    width: 100%;
                    white-space: normal;
                    word-wrap: break-word;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    line-height: 1.2;
                    min-height: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stepper-item.completed .stepper-label,
                .stepper-item.active .stepper-label {
                    color: var(--text-color-active);
                    font-weight: 600;
                    transform: translateY(-2px);
                }
                
                .stepper-check {
                    display: none;
                }
                
                .stepper-item.completed .stepper-check {
                    display: inline;
                    font-size: 14px;
                }
                
                .stepper-item.completed .stepper-number {
                    display: none;
                }
                
                /* Responsive styles */
                @media (max-width: 768px) {
                    .stepper-label {
                        font-size: 11px;
                        min-height: 22px;
                    }
                    
                    .stepper-icon {
                        width: 30px;
                        height: 30px;
                        font-size: 14px;
                    }
                    
                    .stepper-item {
                        min-width: 120px;
                        min-height: 50px;
                    }
                    
                    .progress-container {
                        padding: 8px 15px;
                    }
                }
            </style>
            
            <div class="progress-container">
                <div class="stepper">
                    ${stepsData.map((step, index) => `
                        <div class="stepper-item ${
                            index + 1 < currentStep ? 'completed' : 
                            index + 1 === currentStep ? 'active' : ''
                        }">
                            <div class="stepper-icon-container">
                                <div class="stepper-icon">
                                    <span class="stepper-number">${index + 1}</span>
                                    <span class="stepper-check">✓</span>
                                    ${index + 1 === currentStep ? '<div class="pulse-animation"></div>' : ''}
                                </div>
                            </div>
                            <div class="stepper-label">${step}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Definir el elemento si no ha sido definido previamente
if (!customElements.get('progress-stepper')) {
    customElements.define('progress-stepper', ProgressStepper);
}