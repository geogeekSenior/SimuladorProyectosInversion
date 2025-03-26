/**
 * ProgressBar - Sistema de navegación con temática militar
 * Optimizado para el Simulador de Inversiones de Proyectos Estratégicos
 */
class ProgressBar {
    constructor(totalSteps) {
        this.totalSteps = totalSteps;
        this.currentStep = this.determineCurrentStep();
        this.prevButton = document.getElementById('prevStep');
        this.nextButton = document.getElementById('nextStep');
        this.progressStepper = document.querySelector('progress-stepper');

        this.setupNavigation();
    }

    /**
     * Determina el paso actual basado en la URL actual
     * @returns {number} El número de paso actual
     */
    determineCurrentStep() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('step1.html')) return 1;
        if (currentPath.includes('index.html')) return 2;
        if (currentPath.includes('step3.html')) return 3;
        return 2; // Valor predeterminado
    }

    /**
     * Configura la navegación y los manejadores de eventos
     */
    setupNavigation() {
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => this.goToPreviousStep());
            this.prevButton.setAttribute('title', 'Paso anterior');
        }

        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => this.goToNextStep());
            this.nextButton.setAttribute('title', 'Siguiente paso');
        }

        if (this.progressStepper) {
            this.progressStepper.setAttribute('current-step', this.currentStep);
        }

        this.updateNavigationButtons();
        
        // Atajos de teclado para mejorar accesibilidad
        document.addEventListener('keydown', (event) => {
            // No procesar atajos si se está escribiendo en un input
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Flecha izquierda para ir al paso anterior
            if (event.key === 'ArrowLeft' && !this.prevButton.disabled) {
                this.goToPreviousStep();
                event.preventDefault();
            }
            
            // Flecha derecha para ir al siguiente paso
            if (event.key === 'ArrowRight' && !this.nextButton.disabled) {
                this.goToNextStep();
                event.preventDefault();
            }
        });
    }

    /**
     * Navega al siguiente paso
     */
    goToNextStep() {
        if (this.currentStep < this.totalSteps) {
            // Añadir efecto visual antes de navegar
            this.nextButton.classList.add('nav-button-active');
            
            // Mostrar mensaje de transición
            this.showStatusMessage("AVANZANDO A SIGUIENTE FASE", "success");
            
            setTimeout(() => {
                this.navigateToStep(this.currentStep + 1);
            }, 800); // Tiempo mayor para mejor experiencia visual
        }
    }

    /**
     * Navega al paso anterior
     */
    goToPreviousStep() {
        if (this.currentStep > 1) {
            // Añadir efecto visual antes de navegar
            this.prevButton.classList.add('nav-button-active');
            
            // Mostrar mensaje de transición
            this.showStatusMessage("RETORNANDO A FASE PREVIA", "warning");
            
            setTimeout(() => {
                this.navigateToStep(this.currentStep - 1);
            }, 800);
        }
    }

    /**
     * Muestra un mensaje de estado temporal
     * @param {string} mensaje - El mensaje a mostrar
     * @param {string} tipo - El tipo de mensaje (success, warning, error)
     */
    showStatusMessage(mensaje, tipo) {
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
        }, 2000);
    }

    /**
     * Navega a un paso específico
     * @param {number} step - El número de paso al que navegar
     */
    navigateToStep(step) {
        const stepFiles = {
            1: 'step1.html',
            2: 'index.html',
            3: 'step3.html'
        };

        // Guardar datos actuales si es necesario
        this.saveCurrentState();

        // Mostrar feedback visual de carga
        document.body.classList.add('page-transitioning');

        const targetFile = stepFiles[step];
        if (targetFile) {
            // Usar sessionStorage para guardar el estado actual
            sessionStorage.setItem('lastStep', this.currentStep);
            
            window.location.href = targetFile;
        }
    }

    /**
     * Guarda el estado actual antes de navegar
     * En una aplicación real, guardaría más datos del estado
     */
    saveCurrentState() {
        // Guardar información básica
        const basicInfo = {
            currentStep: this.currentStep,
            timestamp: new Date().toISOString()
        };
        
        // En un caso real, aquí se guardarían los datos de proyectos seleccionados
        sessionStorage.setItem('navigationState', JSON.stringify(basicInfo));
    }

    /**
     * Actualiza el estado visual de los botones de navegación
     */
    updateNavigationButtons() {
        if (this.prevButton) {
            this.prevButton.disabled = this.currentStep === 1;
            if (this.currentStep === 1) {
                this.prevButton.classList.add('nav-arrow-disabled');
            } else {
                this.prevButton.classList.remove('nav-arrow-disabled');
            }
        }

        if (this.nextButton) {
            this.nextButton.disabled = this.currentStep === this.totalSteps;
            if (this.currentStep === this.totalSteps) {
                this.nextButton.classList.add('nav-arrow-disabled');
            } else {
                this.nextButton.classList.remove('nav-arrow-disabled');
            }
        }
    }
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Crear la instancia del ProgressBar
    const progressBar = new ProgressBar(3);
    
    // Añadir una animación de entrada a la página
    document.body.classList.add('page-loaded');
    
    // Inicializar componentes adicionales
    initializeComponents();
});

/**
 * Inicializa componentes adicionales de la página
 */
function initializeComponents() {
    // Efecto inicial para la barra de presupuesto
    const presupuestoBar = document.getElementById('presupuestoBar');
    if (presupuestoBar) {
        // Comenzar en 0 y animar hasta la posición inicial
        presupuestoBar.style.width = '0%';
        setTimeout(() => {
            presupuestoBar.style.width = '100%';
            presupuestoBar.style.transition = 'width 1.5s ease-out';
        }, 300);
    }
}

/**
 * Detecta preferencia de esquema de color del sistema
 * y ajusta el tema en consecuencia
 */
function detectColorScheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Ejecutar al cargar y añadir listener para cambios
detectColorScheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectColorScheme);