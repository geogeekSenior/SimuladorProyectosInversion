/**
 * navigator-blocker.js - Bloquea los botones de navegación durante el análisis geoespacial
 * Horizonte: Juego de Estrategia
 */

(function() {
    // Referencias a los elementos DOM
    let prevButton, nextButton, geoprocessButton;
    let isProcessing = false;
  
    // Función de inicialización
    function init() {
      // Obtener referencias a los botones
      prevButton = document.getElementById('prevStep');
      nextButton = document.getElementById('nextStep');
      geoprocessButton = document.getElementById('geoprocessButton');
  
      // Si no encontramos los botones de navegación, salir
      if (!prevButton && !nextButton) {
        console.warn('Botones de navegación no encontrados. El bloqueo de navegación no se activará.');
        return;
      }
  
      // IMPORTANTE: Bloquear navegación automáticamente al iniciar la página
      setProcessingState(true);
      console.log('Navegación bloqueada al inicio de la página');
  
      // Verificar la existencia del botón de geoproceso
      if (!geoprocessButton) {
        console.warn('Botón de geoproceso no encontrado. Se mantendrá el bloqueo hasta refrescar la página.');
        return;
      }
  
      // Añadir interceptor para el botón de geoproceso
      addGeoprocessButtonInterceptor();
  
      // Escuchar eventos de análisis
      setupAnalysisEventListeners();
  
      console.log('Sistema de bloqueo de navegación durante análisis inicializado');
    }
  
    // Añade interceptor al botón de geoproceso
    function addGeoprocessButtonInterceptor() {
      // Guardamos la referencia al manejador de eventos original
      const originalClickHandler = geoprocessButton.onclick;
  
      // Redefinimos el manejador de eventos
      geoprocessButton.onclick = function(event) {
        // Marcar como procesando y bloquear navegación
        setProcessingState(true);
  
        // Llamar al manejador original si existe
        if (typeof originalClickHandler === 'function') {
          originalClickHandler.call(this, event);
        }
      };
  
      console.log('Interceptor para botón de geoproceso instalado');
    }
  
    // Configura escuchadores de eventos para el análisis
    function setupAnalysisEventListeners() {
      // Evento personalizado cuando se muestra el modal de análisis
      document.addEventListener('geoproceso:modalOpen', function() {
        setProcessingState(true);
      });
  
      // Evento personalizado cuando se cierra el modal de análisis
      document.addEventListener('geoproceso:modalClose', function() {
        setProcessingState(false);
      });
  
      // Evento personalizado para el éxito del análisis
      document.addEventListener('geoproceso:success', function() {
        setProcessingState(false);
      });
  
      // Observar creación de modales para los casos donde no se disparan eventos personalizados
      observeModals();
    }
  
    // Configura un observador para detectar modales de análisis
    function observeModals() {
      // Crear un observador de mutaciones para detectar cuando se añaden/quitan modales
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList') {
            // Buscar si se ha añadido un modal de análisis
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1 && (
                  node.classList.contains('geoproceso-modal') || 
                  node.id && node.id.includes('analysis-modal')
              )) {
                setProcessingState(true);
              }
            });
  
            // Buscar si se ha quitado un modal de análisis
            mutation.removedNodes.forEach(function(node) {
              if (node.nodeType === 1 && (
                  node.classList.contains('geoproceso-modal') || 
                  node.id && node.id.includes('analysis-modal')
              )) {
                setProcessingState(false);
              }
            });
          }
        });
      });
  
      // Iniciar observación
      observer.observe(document.body, { childList: true });
    }
  
    // Establece el estado de procesamiento y actualiza la UI
    function setProcessingState(isActive) {
      isProcessing = isActive;
      
      console.log(`Estado de navegación: ${isActive ? 'BLOQUEADO' : 'DISPONIBLE'}`);
      
      // Forzar un registro de los botones para depuración
      console.log('Estado de botones:', {
        prevButton: prevButton ? 'encontrado' : 'no encontrado',
        nextButton: nextButton ? 'encontrado' : 'no encontrado'
      });
      
      // Verificar si los botones existen, y si no, buscarlos nuevamente
      if (!prevButton) prevButton = document.getElementById('prevStep');
      if (!nextButton) nextButton = document.getElementById('nextStep');
      
      // Actualizar estado de los botones de navegación de manera forzada
      if (prevButton) {
        if (isActive) {
          // Guardar el estado original como atributo de datos
          prevButton.setAttribute('data-original-disabled', prevButton.disabled ? 'true' : 'false');
          // Bloquear
          prevButton.disabled = true;
          prevButton.classList.add('nav-arrow-disabled');
        } else {
          // Desbloquear explícitamente (incluso si estaba bloqueado originalmente)
          prevButton.disabled = false;
          prevButton.classList.remove('nav-arrow-disabled');
          
          // Eliminar clase adicional que podría estar interfiriendo
          prevButton.classList.remove('disabled');
          
          console.log('Botón anterior habilitado forzosamente');
        }
      } else {
        console.warn('No se pudo encontrar el botón prevStep');
      }
      
      if (nextButton) {
        if (isActive) {
          // Guardar el estado original como atributo de datos
          nextButton.setAttribute('data-original-disabled', nextButton.disabled ? 'true' : 'false');
          // Bloquear
          nextButton.disabled = true;
          nextButton.classList.add('nav-arrow-disabled');
        } else {
          // Desbloquear explícitamente (incluso si estaba bloqueado originalmente)
          nextButton.disabled = false;
          nextButton.classList.remove('nav-arrow-disabled');
          
          // Eliminar clase adicional que podría estar interfiriendo
          nextButton.classList.remove('disabled');
          
          console.log('Botón siguiente habilitado forzosamente');
        }
      } else {
        console.warn('No se pudo encontrar el botón nextStep');
      }
  
      // Informar al usuario mediante un mensaje de estado
      if (isActive) {
        if (geoprocessButton && geoprocessButton.classList.contains('processing')) {
          mostrarMensajeEstado("Análisis en curso - Navegación bloqueada", "warning", 2000);
        } else {
          mostrarMensajeEstado("Navegación bloqueada - Ejecute el análisis para continuar", "info", 4000);
        }
      } else {
        mostrarMensajeEstado("Análisis completado - Navegación disponible", "success", 3000);
      }
  
      console.log(`Estado de navegación: ${isActive ? 'BLOQUEADO' : 'DISPONIBLE'}`);
    }
  
    // Muestra un mensaje de estado
    function mostrarMensajeEstado(mensaje, tipo, duracion = 3000) {
      // Usar el sistema de mensajes existente si está disponible
      if (window.HORIZONTE && HORIZONTE.app && HORIZONTE.app.mostrarMensajeEstado) {
        HORIZONTE.app.mostrarMensajeEstado(mensaje, tipo, duracion);
        return;
      }
      
      // Verificar si existe el elemento de mensaje de estado
      let statusMessage = document.getElementById('statusMessage');
      if (!statusMessage) {
        // Crear el elemento si no existe
        statusMessage = document.createElement('div');
        statusMessage.id = 'statusMessage';
        statusMessage.className = 'status-message';
        document.body.appendChild(statusMessage);
      }
      
      // Mostrar mensaje
      statusMessage.textContent = mensaje;
      statusMessage.className = `status-message status-${tipo}`;
      statusMessage.style.opacity = '1';
      statusMessage.style.transform = 'translateY(0)';
      
      // Ocultar después del tiempo indicado
      setTimeout(() => {
        statusMessage.style.opacity = '0';
        statusMessage.style.transform = 'translateY(20px)';
      }, duracion);
    }
  
    // Exponer funciones públicas
    window.navigatorBlocker = {
      init: init,
      isProcessing: () => isProcessing,
      blockNavigation: () => setProcessingState(true),
      unblockNavigation: () => {
        console.log('Llamada explícita a desbloqueo de navegación');
        setProcessingState(false);
        
        // HACK: Forzar desbloqueo directo de los botones como respaldo
        setTimeout(() => {
          const prevBtn = document.getElementById('prevStep');
          const nextBtn = document.getElementById('nextStep');
          
          if (prevBtn) {
            prevBtn.disabled = false;
            prevBtn.classList.remove('nav-arrow-disabled');
            prevBtn.style.pointerEvents = 'auto';
            prevBtn.style.opacity = '1';
            console.log('Desbloqueo forzado del botón anterior aplicado');
          }
          
          if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.classList.remove('nav-arrow-disabled');
            nextBtn.style.pointerEvents = 'auto';
            nextBtn.style.opacity = '1';
            console.log('Desbloqueo forzado del botón siguiente aplicado');
          }
        }, 500);
      }
    };
  
    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', init);
    
    // También intentar inicializar cuando la aplicación esté lista
    document.addEventListener('horizonte:appReady', init);
    
    // Como respaldo, intentar inicializar después de un tiempo
    setTimeout(init, 1000);
    
    // Comprobación adicional después de más tiempo por si acaso
    setTimeout(function() {
      // Si no se ha inicializado o los botones no están bloqueados, volver a intentar
      if (!isProcessing && (prevButton || nextButton)) {
        console.log('Comprobación secundaria - Forzando bloqueo de navegación');
        setProcessingState(true);
      }
    }, 3000);
  })();