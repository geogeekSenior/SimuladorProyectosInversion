/**
 * navigation.js - Sistema de navegación y progresión
 * Horizonte: Juego de Estrategia
 */

// Módulo de navegación
HORIZONTE.navigation = (function() {
    // Configuración del módulo
    const config = {
        totalSteps: 5,
        stepFiles: {
            1: 'step1.html',
            2: 'index.html',
            3: 'step3.html',
            4: 'step4.html',
            5: 'step5.html'
        },
        transitionDuration: 800
    };
    
    // Estado del módulo
    let state = {
        currentStep: 1,
        prevButton: null,
        nextButton: null,
        progressStepper: null
    };
    
    // Inicializar el módulo
    function init() {
        state.currentStep = determineCurrentStep();
        state.prevButton = document.getElementById('prevStep');
        state.nextButton = document.getElementById('nextStep');
        state.progressStepper = document.querySelector('progress-stepper');
        
        setupNavigation();
    }
    
    // Determinar el paso actual basado en la URL
    function determineCurrentStep() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('step1.html')) return 1;
        if (currentPath.includes('index.html')) return 2;
        if (currentPath.includes('step3.html')) return 3;
        if (currentPath.includes('step4.html')) return 4;
        if (currentPath.includes('step5.html')) return 5;
        return 2; // Valor predeterminado
    }
    
    // Configurar la navegación y los listeners
    function setupNavigation() {
        if (state.prevButton) {
            state.prevButton.addEventListener('click', goToPreviousStep);
            state.prevButton.setAttribute('title', 'Paso anterior');
        }

        if (state.nextButton) {
            state.nextButton.addEventListener('click', goToNextStep);
            state.nextButton.setAttribute('title', 'Siguiente paso');
        }

        if (state.progressStepper) {
            state.progressStepper.setAttribute('current-step', state.currentStep);
        }

        updateNavigationButtons();
        
        // Atajos de teclado para mejorar accesibilidad
        document.addEventListener('keydown', handleKeyboardNavigation);
    }
    
    // Manejar navegación por teclado
    function handleKeyboardNavigation(event) {
        // No procesar atajos si se está escribiendo en un input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Flecha izquierda para ir al paso anterior
        if (event.key === 'ArrowLeft' && state.prevButton && !state.prevButton.disabled) {
            goToPreviousStep();
            event.preventDefault();
        }
        
        // Flecha derecha para ir al siguiente paso
        if (event.key === 'ArrowRight' && state.nextButton && !state.nextButton.disabled) {
            goToNextStep();
            event.preventDefault();
        }
    }
    
    // Ir al paso anterior
    function goToPreviousStep() {
        if (state.currentStep > 1) {
            // Añadir efecto visual antes de navegar
            state.prevButton.classList.add('nav-button-active');
            
            // Mostrar mensaje de transición
            if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                HORIZONTE.utils.showStatusMessage("RETORNANDO A FASE PREVIA", "warning");
            }
            
            setTimeout(() => {
                navigateToStep(state.currentStep - 1);
            }, config.transitionDuration);
        }
    }
    
    // Ir al siguiente paso
    function goToNextStep() {
        if (state.currentStep < config.totalSteps) {
            // Añadir efecto visual antes de navegar
            state.nextButton.classList.add('nav-button-active');
            
            // Mostrar mensaje de transición
            if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                HORIZONTE.utils.showStatusMessage("AVANZANDO A SIGUIENTE FASE", "success");
            }
            
            setTimeout(() => {
                navigateToStep(state.currentStep + 1);
            }, config.transitionDuration);
        }
    }
    
    // Navegar a un paso específico
    function navigateToStep(step) {
        // Guardar datos actuales si es necesario
        saveCurrentState();

        // Mostrar feedback visual de carga
        document.body.classList.add('page-transitioning');

        const targetFile = config.stepFiles[step];
        if (targetFile) {
            // Usar sessionStorage para guardar el estado actual
            sessionStorage.setItem('lastStep', state.currentStep);
            
            window.location.href = targetFile;
        }
    }
    
    // Guardar el estado actual antes de navegar
    function saveCurrentState() {
        // Guardar información básica
        const basicInfo = {
            currentStep: state.currentStep,
            timestamp: new Date().toISOString()
        };
        
        // En un caso real, aquí se guardarían los datos de proyectos seleccionados
        if (HORIZONTE.utils && HORIZONTE.utils.saveToSession) {
            HORIZONTE.utils.saveToSession('navigationState', basicInfo);
        }
        
        // Disparar evento para que otros módulos puedan guardar su estado
        const saveEvent = new CustomEvent('horizonte:saveState', {
            detail: { step: state.currentStep }
        });
        document.dispatchEvent(saveEvent);
    }
    
    // Actualizar el estado visual de los botones de navegación
    function updateNavigationButtons() {
        if (state.prevButton) {
            state.prevButton.disabled = state.currentStep === 1;
            if (state.currentStep === 1) {
                state.prevButton.classList.add('nav-arrow-disabled');
            } else {
                state.prevButton.classList.remove('nav-arrow-disabled');
            }
        }

        if (state.nextButton) {
            state.nextButton.disabled = state.currentStep === config.totalSteps;
            if (state.currentStep === config.totalSteps) {
                state.nextButton.classList.add('nav-arrow-disabled');
            } else {
                state.nextButton.classList.remove('nav-arrow-disabled');
            }
        }
    }
    
    // API pública del módulo
    return {
        init,
        navigateToStep,
        getCurrentStep: () => state.currentStep,
        getTotalSteps: () => config.totalSteps
    };
})();

// Inicialización cuando el DOM está listo
document.addEventListener('horizonte:ready', function() {
    HORIZONTE.navigation.init();
    
    // Añadir una animación de entrada a la página
    document.body.classList.add('page-loaded');
});