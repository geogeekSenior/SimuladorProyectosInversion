/**
 * resources-manager.js - Gestión de recursos estratégicos
 * Implementa la lógica para gestionar los recursos disponibles
 * y actualizar el UI cuando cambian los valores
 */

class ResourceManager {
    constructor(initialBudget = 10000) {
      // Recursos iniciales
      this.initialBudget = initialBudget;
      this.availableBudget = initialBudget;
      
      // Referencias a elementos del DOM
      this.budgetText = document.getElementById('presupuestoTotal');
      this.budgetBar = document.getElementById('presupuestoBar');
      
      // Inicializar
      this.init();
    }
    
    /**
     * Inicializa el gestor de recursos
     */
    init() {
      // Cargar recursos guardados si existen
      this.loadSavedResources();
      
      // Actualizar visualización inicial
      this.updateBudgetDisplay();
      
      // Iniciar con una animación de la barra
      if (this.budgetBar) {
        this.budgetBar.style.width = '0%';
        setTimeout(() => {
          this.updateBudgetBar();
        }, 500);
      }
      
      console.log('Gestor de recursos inicializado:', this.availableBudget);
    }
    
    /**
     * Carga recursos guardados en sessionStorage
     */
    loadSavedResources() {
      const savedResources = sessionStorage.getItem('availableResources');
      if (savedResources) {
        this.availableBudget = parseInt(savedResources);
      }
    }
    
    /**
     * Guarda el estado actual de los recursos
     */
    saveResources() {
      sessionStorage.setItem('availableResources', this.availableBudget);
      console.log('Recursos guardados:', this.availableBudget);
    }
    
    /**
     * Actualiza el texto que muestra el presupuesto
     */
    updateBudgetDisplay() {
      if (this.budgetText) {
        this.budgetText.textContent = `RECURSOS : $${this.availableBudget.toLocaleString()}`;
      }
      
      this.updateBudgetBar();
    }
    
    /**
     * Actualiza la barra de presupuesto
     */
    updateBudgetBar() {
      if (!this.budgetBar) return;
      
      // Calcular porcentaje de recursos disponibles
      const percentage = (this.availableBudget / this.initialBudget) * 100;
      
      // Animación de la barra
      this.budgetBar.style.width = `${percentage}%`;
      
      // Actualizar clases según el nivel de recursos
      this.budgetBar.classList.remove('high', 'medium', 'low');
      
      if (percentage > 60) {
        this.budgetBar.classList.add('high');
      } else if (percentage > 30) {
        this.budgetBar.classList.add('medium');
      } else {
        this.budgetBar.classList.add('low');
      }
    }
    
    /**
     * Consume recursos y actualiza la visualización
     * @param {number} amount - Cantidad a consumir
     * @returns {boolean} - true si hay suficientes recursos, false si no
     */
    useResources(amount) {
      // Verificar si hay suficientes recursos
      if (amount > this.availableBudget) {
        console.warn('Recursos insuficientes', amount, this.availableBudget);
        this.showInsufficientResourcesMessage();
        return false;
      }
      
      // Restar recursos
      this.availableBudget -= amount;
      
      // Actualizar visualización
      this.updateBudgetDisplay();
      
      // Guardar estado
      this.saveResources();
      
      console.log(`Recursos consumidos: $${amount}. Restantes: $${this.availableBudget}`);
      return true;
    }
    
    /**
     * Añade recursos al presupuesto disponible
     * @param {number} amount - Cantidad a añadir
     */
    addResources(amount) {
      this.availableBudget += amount;
      
      // No superar el presupuesto inicial
      if (this.availableBudget > this.initialBudget) {
        this.availableBudget = this.initialBudget;
      }
      
      // Actualizar visualización
      this.updateBudgetDisplay();
      
      // Guardar estado
      this.saveResources();
      
      console.log(`Recursos añadidos: $${amount}. Total: $${this.availableBudget}`);
      return true;
    }
    
    /**
     * Restablece los recursos al valor inicial
     */
    resetResources() {
      this.availableBudget = this.initialBudget;
      this.updateBudgetDisplay();
      this.saveResources();
      console.log('Recursos restablecidos:', this.availableBudget);
    }
    
    /**
     * Muestra un mensaje de recursos insuficientes
     */
    showInsufficientResourcesMessage() {
      // Mostrar mensaje en la interfaz
      const statusMessage = document.getElementById('statusMessage');
      if (statusMessage) {
        statusMessage.textContent = "RECURSOS INSUFICIENTES";
        statusMessage.className = 'status-message status-error';
        statusMessage.style.opacity = '1';
        statusMessage.style.transform = 'translateY(0)';
        
        setTimeout(() => {
          statusMessage.style.opacity = '0';
          statusMessage.style.transform = 'translateY(20px)';
        }, 3000);
      }
    }
    
    /**
     * Verifica si un proyecto es asequible con los recursos actuales
     * @param {number} cost - Costo del proyecto
     * @returns {boolean} - true si es asequible, false si no
     */
    isAffordable(cost) {
      return cost <= this.availableBudget;
    }
    
    /**
     * Actualiza la visualización de asequibilidad en los proyectos
     */
    updateProjectsAffordability() {
      const projectItems = document.querySelectorAll('.project-item');
      
      projectItems.forEach(item => {
        // Extraer el costo del proyecto
        const costElement = item.querySelector('.project-cost');
        if (!costElement) return;
        
        const costText = costElement.textContent;
        const costMatch = costText.match(/\$([0-9,]+)/);
        
        if (costMatch) {
          const cost = parseInt(costMatch[1].replace(/,/g, ''));
          
          // Actualizar estado según asequibilidad
          if (!this.isAffordable(cost)) {
            item.classList.add('disabled');
            
            // Añadir mensaje si no existe
            let warningElement = item.querySelector('.excede-presupuesto');
            if (!warningElement) {
              const projectDetails = item.querySelector('.project-details');
              if (projectDetails) {
                const warningDiv = document.createElement('div');
                warningDiv.className = 'excede-presupuesto';
                warningDiv.textContent = 'RECURSOS INSUFICIENTES';
                projectDetails.appendChild(warningDiv);
              }
            }
          } else {
            item.classList.remove('disabled');
            
            // Eliminar mensaje si existe
            const warningElement = item.querySelector('.excede-presupuesto');
            if (warningElement) {
              warningElement.remove();
            }
          }
        }
      });
    }
  }
  
  // Iniciar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia global
    window.resourceManager = new ResourceManager(10000);
    
    // Actualizar asequibilidad de proyectos periódicamente
    setInterval(() => {
      if (window.resourceManager) {
        window.resourceManager.updateProjectsAffordability();
      }
    }, 1000);
    
    // Añadir eventos para botones relevantes
    const proceedButton = document.getElementById('proceed-button');
    if (proceedButton) {
      proceedButton.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
    
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      restartButton.addEventListener('click', () => {
        if (window.resourceManager) {
          window.resourceManager.resetResources();
        }
        window.location.href = 'step1.html';
      });
    }
  });