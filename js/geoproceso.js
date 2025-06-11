/**
 * geoproceso.js - Utilizando submitJob para procesamiento asíncrono
 * Horizonte: Juego de Estrategia - Versión unificada para ambos ciclos
 */

// Función principal para crear y configurar el componente de geoproceso
function createGeoprocessor(config) {
  // Valores por defecto que serán sobrescritos por el config
  const defaults = {
    cycleNumber: 1,
    processingUrl: "https://arcgis.esri.co/server/rest/services/geoprocessing/SuitabilityModelCiclo1/GPServer/Script",
    buttonId: 'geoprocessButton',
    storageKey: 'ciclo1_procesado',
    nextPageUrl: 'step3.html'
  };

  // Combinar configuración con valores por defecto
  const options = { ...defaults, ...config };

  // Variable para controlar si ya se ejecutó el proceso
  let procesoEjecutado = false;

  // Agregar el botón de geoprocesamiento a la interfaz
  function agregarBotonGeoproceso() {
    // Verificar si ya existe el botón
    if (document.getElementById(options.buttonId)) return;
    
    // Crear el botón con estilo militar
    const geoprocessButton = document.createElement('button');
    geoprocessButton.id = options.buttonId;
    geoprocessButton.className = 'military-button';
    geoprocessButton.innerHTML = '<span class="geo-icon">📊</span>GENERAR INFORME';
    
    // MODIFICADO: Agregar evento para mostrar modal de confirmación
    geoprocessButton.addEventListener('click', mostrarModalConfirmacion);
    
    // Verificar si el proceso ya fue ejecutado (recuperar de sessionStorage)
    if (sessionStorage.getItem(options.storageKey) === 'true') {
      procesoEjecutado = true;
      geoprocessButton.disabled = true;
      geoprocessButton.classList.add('disabled');
      geoprocessButton.title = 'Análisis ya ejecutado';
    }
    
    // Agregar al contenedor del mapa o al documento
    const contenedores = [
      document.getElementById('mapContainer'),
      document.getElementById('viewDiv'),
      document.getElementById('app-container')
    ];
    
    let contenedor = null;
    for (const c of contenedores) {
      if (c) {
        contenedor = c;
        break;
      }
    }
    
    if (contenedor) {
      contenedor.appendChild(geoprocessButton);
    } else {
      document.body.appendChild(geoprocessButton);
    }
    
    console.log(`Botón de geoproceso ciclo ${options.cycleNumber} agregado`);
  }

  // NUEVO: Función para mostrar modal de confirmación
  function mostrarModalConfirmacion() {
    // Verificar si ya se ejecutó el proceso
    if (procesoEjecutado) {
      mostrarMensajeEstado('Este análisis ya ha sido ejecutado', 'warning');
      return;
    }

    // Verificar disponibilidad del FeatureSet
    if (!window.miFeatureSet) {
      mostrarMensajeEstado('ERROR: No hay puntos seleccionados para analizar', 'error');
      return;
    }

    // Obtener información de los puntos seleccionados
    const geometrias = window.miFeatureSet.obtenerGeometrias();
    const atributos = window.miFeatureSet.obtenerAtributos();
    
    if (!geometrias || geometrias.length === 0 || !atributos || atributos.length === 0) {
      mostrarMensajeEstado('No hay puntos seleccionados para analizar', 'warning');
      return;
    }

    // Crear modal de confirmación
    const modalContainer = document.createElement('div');
    modalContainer.className = 'geoproceso-modal';
    modalContainer.id = 'confirmacion-modal';
    
    // Calcular información para mostrar
    const numProyectos = atributos.length;
    const costoTotal = atributos.reduce((sum, attr) => sum + (attr.COSTOS || 0), 0);
    
    // Contenido del modal
    modalContainer.innerHTML = `
      <div class="geoproceso-modal-content confirmacion-modal">
        <div class="geoproceso-header">
          <h2>CONFIRMACIÓN DE ANÁLISIS</h2>
          <button class="geoproceso-close" onclick="cerrarModalConfirmacion()">&times;</button>
        </div>
        <div class="geoproceso-body">
          <div class="confirmacion-icon">⚠️</div>
          <div class="confirmacion-mensaje">
            <h3 style="color: white;">  ¿Está seguro de enviar los programas?</h3>
            <p>Una vez iniciado el análisis, no podrá realizar cambios en la selección de proyectos.</p>
            
            <div class="confirmacion-detalles">
              <div class="detalle-item">
                <span class="detalle-label">PROYECTOS SELECCIONADOS:</span>
                <span class="detalle-valor">${numProyectos}</span>
            </div>

  
          </div>
        </div>
        <div class="geoproceso-footer confirmacion-footer">
          <button class="military-button secondary" onclick="cerrarModalConfirmacion()">CANCELAR</button>
          <button class="military-button primary" onclick="confirmarYEjecutarGeoproceso()">CONFIRMAR</button>
        </div>
      </div>
    `;
    
    // Añadir al documento
    document.body.appendChild(modalContainer);
    
    // Hacer que las funciones estén disponibles globalmente
    window.cerrarModalConfirmacion = cerrarModalConfirmacion;
    window.confirmarYEjecutarGeoproceso = confirmarYEjecutarGeoproceso;
  }

  // NUEVO: Función para cerrar modal de confirmación
  function cerrarModalConfirmacion() {
    const modal = document.getElementById('confirmacion-modal');
    if (modal) {
      modal.classList.add('geoproceso-modal-closing');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  // NUEVO: Función para confirmar y ejecutar
  function confirmarYEjecutarGeoproceso() {
    cerrarModalConfirmacion();
    // Esperar un poco antes de ejecutar para que se vea la transición
    setTimeout(() => {
      ejecutarGeoproceso();
    }, 350);
  }

  // Ejecutar el geoproceso con los puntos seleccionados
  async function ejecutarGeoproceso() {
    // Verificar si ya se ejecutó el proceso
    if (procesoEjecutado) {
      mostrarMensajeEstado('Este análisis ya ha sido ejecutado', 'warning');
      return;
    }
    
    try {
      // Marcar como ejecutado al inicio para prevenir múltiples clicks
      procesoEjecutado = true;
      sessionStorage.setItem(options.storageKey, 'true');
      
      // Deshabilitar el botón visualmente
      const boton = document.getElementById(options.buttonId);
      if (boton) {
        boton.disabled = true;
        boton.classList.add('disabled');
        boton.classList.add('processing');
      }
      
      // Abrir modal de análisis
      const modalId = abrirModalAnalisis();
      
      // Verificar disponibilidad del FeatureSet
      if (!window.miFeatureSet) {
        mostrarMensajeEstado('ERROR: No hay puntos seleccionados para analizar', 'error');
        actualizarModalAnalisis(modalId, 'error', 'No hay puntos seleccionados para analizar');
        if (boton) boton.classList.remove('processing');
        return;
      }
      
      // Obtener geometrías y atributos
      const geometrias = window.miFeatureSet.obtenerGeometrias();
      const atributos = window.miFeatureSet.obtenerAtributos();
      
      if (!geometrias || geometrias.length === 0 || !atributos || atributos.length === 0) {
        mostrarMensajeEstado('No hay puntos seleccionados para analizar', 'warning');
        actualizarModalAnalisis(modalId, 'error', 'No hay puntos seleccionados para analizar');
        if (boton) boton.classList.remove('processing');
        return;
      }
      
      console.log('Puntos para análisis:', atributos.length);
      actualizarModalAnalisis(modalId, 'progress', `Preparando análisis para ${atributos.length} puntos...`, 10);
      
      // URL del servicio de geoprocesamiento (desde la configuración)
      const gpUrl = options.processingUrl;
      
      // Formatear ambos como cadenas JSON con saltos de línea para el servicio
      const geometriasStr = JSON.stringify(geometrias, null, 2);
      const atributosStr = JSON.stringify(atributos, null, 2);
      
      // Imprimir los datos para depuración
      console.log("Datos para el geoproceso (con saltos de línea):");
      console.log("geometrias_json:", geometriasStr);
      console.log("atributos_json:", atributosStr);
      
      // Preparar parámetros con los nombres EXACTOS del servicio
      const params = {
        geometrias_json: geometriasStr,
        atributos_json: atributosStr
      };
      
      // Ejecutar geoproceso asíncrono usando submitJob
      mostrarMensajeEstado('Enviando trabajo al servidor...', 'info');
      actualizarModalAnalisis(modalId, 'progress', 'Enviando trabajo al servidor...', 20);
      
      // Procesar el trabajo de forma asíncrona
      await procesarTrabajoAsincrono(gpUrl, params, modalId);
      
    } catch (error) {
      console.error('Error al ejecutar geoproceso:', error);
      mostrarMensajeEstado('Error al ejecutar el análisis: ' + (error.message || 'Error desconocido'), 'error');
      actualizarModalAnalisis(null, 'error', 'Error al ejecutar el análisis: ' + (error.message || 'Error desconocido'));
      
      // Mantener el botón deshabilitado a pesar del error
      const boton = document.getElementById(options.buttonId);
      if (boton) {
        boton.disabled = true;
        boton.classList.add('disabled');
        boton.classList.remove('processing');
        boton.title = 'Análisis ya ejecutado';
      }
    }
  }

  // Procesar el trabajo de forma asíncrona
  async function procesarTrabajoAsincrono(url, params, modalId) {
    return new Promise((resolve, reject) => {
      // Verificar si los módulos están cargados
      if (!window.require) {
        actualizarModalAnalisis(modalId, 'error', 'API de ArcGIS no disponible');
        reject(new Error('API de ArcGIS no disponible'));
        return;
      }
      
      // Cargar módulos necesarios
      require([
        "esri/tasks/Geoprocessor"
      ], function(Geoprocessor) {
        try {
          const gp = new Geoprocessor(url);
          
          // Configuración del trabajo
          const jobParams = {
            geometrias_json: params.geometrias_json,
            atributos_json: params.atributos_json
          };
          
          console.log('Enviando trabajo con parámetros:', jobParams);
          actualizarModalAnalisis(modalId, 'progress', 'Trabajo enviado, esperando respuesta...', 30);
          
          // Enviar trabajo
          gp.submitJob(jobParams).then((jobInfo) => {
            console.log('Trabajo enviado. ID:', jobInfo.jobId);
            actualizarModalAnalisis(modalId, 'progress', `Trabajo ID: ${jobInfo.jobId}`, 40);
            
            // Monitorear el progreso del trabajo
            monitorearTrabajo(gp, jobInfo, modalId, resolve, reject);
            
          }).catch((error) => {
            console.error('Error al enviar trabajo:', error);
            actualizarModalAnalisis(modalId, 'error', 'Error al enviar trabajo: ' + error.message);
            reject(error);
          });
          
        } catch (error) {
          console.error('Error al crear Geoprocessor:', error);
          actualizarModalAnalisis(modalId, 'error', 'Error al crear procesador: ' + error.message);
          reject(error);
        }
      });
    });
  }

  // Monitorear el progreso del trabajo
  function monitorearTrabajo(gp, jobInfo, modalId, resolve, reject) {
    let progress = 40;
    const checkInterval = 2000; // Verificar cada 2 segundos
    
    const checkStatus = () => {
      gp.checkJobStatus(jobInfo.jobId).then((updatedJobInfo) => {
        console.log('Estado del trabajo:', updatedJobInfo.jobStatus);
        
        // Actualizar progreso
        progress = Math.min(progress + 10, 90);
        const statusMessage = traducirEstadoTrabajo(updatedJobInfo.jobStatus);
        actualizarModalAnalisis(modalId, 'progress', `${statusMessage} (${progress}%)`, progress);
        
        switch (updatedJobInfo.jobStatus) {
          case 'job-succeeded':
            // Trabajo completado exitosamente
            console.log('Trabajo completado exitosamente');
            actualizarModalAnalisis(modalId, 'progress', 'Procesamiento completado', 100);
            
            // Cerrar modal después de un breve retraso
            setTimeout(() => {
              cerrarModalAnalisis(modalId);
              mostrarMensajeExito(updatedJobInfo.jobId, updatedJobInfo);
            }, 1000);
            
            resolve(updatedJobInfo);
            break;
            
          case 'job-failed':
          case 'job-cancelled':
            // Trabajo falló o fue cancelado
            console.error('El trabajo falló:', updatedJobInfo);
            actualizarModalAnalisis(modalId, 'error', `Trabajo ${updatedJobInfo.jobStatus}: ${updatedJobInfo.messages}`);
            reject(new Error(`Trabajo ${updatedJobInfo.jobStatus}`));
            break;
            
          default:
            // Continuar monitoreando
            setTimeout(checkStatus, checkInterval);
        }
        
      }).catch((error) => {
        console.error('Error al verificar estado:', error);
        actualizarModalAnalisis(modalId, 'error', 'Error al verificar estado: ' + error.message);
        reject(error);
      });
    };
    
    // Iniciar monitoreo
    checkStatus();
  }

  // Traducir estados del trabajo
  function traducirEstadoTrabajo(jobStatus) {
    switch (jobStatus) {
      case 'job-submitted': return 'Trabajo enviado';
      case 'job-executing': return 'Procesando análisis';
      case 'job-waiting': return 'En cola de espera';
      case 'job-succeeded': return 'Análisis completado';
      case 'job-failed': return 'Error en el análisis';
      case 'job-timed-out': return 'Tiempo agotado';
      default: return jobStatus;
    }
  }

  // Mostrar mensaje de éxito cuando el trabajo se completa
  function mostrarMensajeExito(jobId, jobInfo) {
    // Crear modal para mostrar el éxito
    const modalContainer = document.createElement('div');
    modalContainer.className = 'geoproceso-modal';
    
    // Contenido del modal
    const modalContent = document.createElement('div');
    modalContent.className = 'geoproceso-modal-content';
    
    // Header
    const header = document.createElement('div');
    header.className = 'geoproceso-header';
    header.innerHTML = `
      <h2>PROCESAMIENTO COMPLETADO</h2>
      <button class="geoproceso-close" title="Cerrar">&times;</button>
    `;
    
    // Body
    const body = document.createElement('div');
    body.className = 'geoproceso-body';
    
    // Ícono de éxito
    const successIcon = document.createElement('div');
    successIcon.className = 'success-icon';
    successIcon.innerHTML = '✓';
    body.appendChild(successIcon);
    
    // Mensaje
    const message = document.createElement('div');
    message.className = 'success-message';
    message.innerHTML = `
      <p>El procesamiento se ha completado correctamente.</p>
      <p>ID del trabajo: <strong>${jobId}</strong></p>
      <p>Los resultados del análisis han sido procesados en el servidor.</p>
    `;
    body.appendChild(message);
    
    // Footer
    const footer = document.createElement('div');
    footer.className = 'geoproceso-footer';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'military-button';
    closeButton.textContent = 'CERRAR';
    footer.appendChild(closeButton);
    
    // Armar el modal
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalContent.appendChild(footer);
    modalContainer.appendChild(modalContent);
    
    // Eventos
    const closeBtn = modalContainer.querySelector('.geoproceso-close');
    closeBtn.addEventListener('click', () => {
      modalContainer.classList.add('geoproceso-modal-closing');
      setTimeout(() => {
        modalContainer.remove();
        
        // CAMBIO: Disparar evento personalizado para indicar que se cerró el modal de éxito
        document.dispatchEvent(new CustomEvent('geoproceso:modalClose', {
          detail: { result: 'success', jobId: jobId }
        }));
      }, 300);
    });
    
    closeButton.addEventListener('click', () => {
      modalContainer.classList.add('geoproceso-modal-closing');
      setTimeout(() => {
        modalContainer.remove();
        
        // CAMBIO: Disparar evento personalizado para indicar que se cerró el modal de éxito
        document.dispatchEvent(new CustomEvent('geoproceso:modalClose', {
          detail: { result: 'success', jobId: jobId }
        }));
      }, 300);
    });
    
    // Añadir al documento
    document.body.appendChild(modalContainer);
    
    // CAMBIO: Disparar evento personalizado para indicar que se mostró el mensaje de éxito
    // Este evento se dispara inmediatamente para desbloquear la navegación
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('geoproceso:success', {
        detail: { jobId: jobId }
      }));
      
      // Adicionalmente, asegurarnos de que los botones se desbloqueen
      if (window.navigatorBlocker && typeof window.navigatorBlocker.unblockNavigation === 'function') {
        window.navigatorBlocker.unblockNavigation();
      }
    }, 500);
  }

  // Abrir modal de análisis
  function abrirModalAnalisis() {
    // Crear ID único para el modal
    const modalId = 'analysis-modal-' + Date.now();
    
    // Crear modal
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'geoproceso-modal';
    
    // Contenido del modal
    modal.innerHTML = `
      <div class="geoproceso-modal-content">
        <div class="geoproceso-header">
          <h2>PROCESAMIENTO ANALÍTICO</h2>
          <button class="geoproceso-close" title="Cerrar">&times;</button>
        </div>
        <div class="geoproceso-body">
          <div class="analysis-spinner"></div>
          <div class="analysis-status">Iniciando análisis...</div>
          <div class="analysis-progress">
            <div class="analysis-progress-bar" style="width: 5%;"></div>
          </div>
        </div>
      </div>
    `;
    
    // Añadir manejador para cerrar
    modal.querySelector('.geoproceso-close').addEventListener('click', () => {
      cerrarModalAnalisis(modalId);
      
      // El botón debe mantenerse deshabilitado incluso si se cierra el modal
      const boton = document.getElementById(options.buttonId);
      if (boton) {
        boton.disabled = true;
        boton.classList.add('disabled');
        boton.classList.remove('processing');
        boton.title = 'Análisis ya ejecutado';
      }
    });
    
    // Añadir al documento
    document.body.appendChild(modal);
    
    return modalId;
  }

  // Actualizar modal de análisis
  function actualizarModalAnalisis(modalId, tipo, mensaje, progreso = null) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const statusElement = modal.querySelector('.analysis-status');
    const progressBar = modal.querySelector('.analysis-progress-bar');
    
    if (statusElement) {
      statusElement.textContent = mensaje;
      statusElement.className = `analysis-status ${tipo}`;
    }
    
    if (progressBar && progreso !== null) {
      progressBar.style.width = `${progreso}%`;
      
      // Cambiar color según el tipo
      if (tipo === 'error') {
        progressBar.style.backgroundColor = 'var(--error-color)';
      } else if (progreso === 100) {
        progressBar.style.backgroundColor = 'var(--success-color)';
      }
    }
  }

  // Cerrar modal de análisis
  function cerrarModalAnalisis(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('geoproceso-modal-closing');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  // Mostrar mensaje de estado
  function mostrarMensajeEstado(mensaje, tipo = 'info') {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    
    // Si existe la función de utilidad para mostrar mensajes
    if (window.HORIZONTE && HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
      HORIZONTE.utils.showStatusMessage(mensaje, tipo);
    }
  }

  // Añadir estilos para botones deshabilitados
  function addDisabledButtonStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      #${options.buttonId}.disabled {
        background-color: #3a4a5a !important; 
        cursor: not-allowed !important;
        opacity: 0.7 !important;
        pointer-events: none !important;
      }
      
      #${options.buttonId}.disabled::after {
        content: " (COMPLETADO)";
        font-size: 0.8em;
      }
    `;
    document.head.appendChild(styleElement);
  }

  // Función de inicialización
  function init() {
    console.log(`Inicializando componente de geoproceso para ciclo ${options.cycleNumber}...`);
    
    // Añadir estilos para botones deshabilitados
    addDisabledButtonStyles();
    
    // Cargar estilos CSS si no existen
    if (!document.getElementById('geoproceso-styles')) {
      const linkElem = document.createElement('link');
      linkElem.id = 'geoproceso-styles';
      linkElem.rel = 'stylesheet';
      linkElem.href = 'css/geoproceso.css';
      document.head.appendChild(linkElem);
    }
    
    agregarBotonGeoproceso();
  }

  // Retorna el API público
  return {
    init,
    ejecutarGeoproceso,
    mostrarMensajeEstado
  };
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Determinar el ciclo actual basado en la URL o un atributo data
  // Por defecto es ciclo 1
  let cycleNumber = 1;
  let processingUrl = "https://arcgis.esri.co/server/rest/services/geoprocessing/SuitabilityModelCiclo1/GPServer/CICLO1";
  let storageKey = "ciclo1_procesado";
  
  // Detectar ciclo basado en la URL
  if (window.location.pathname.includes('step4.html') || window.location.pathname.includes('step5.html')) {
    cycleNumber = 2;
    processingUrl = "https://arcgis.esri.co/server/rest/services/geoprocessing/SuitabilityModelCiclo2/GPServer/CICLO2";
    storageKey = "ciclo2_procesado";
  }
  
  // También se puede obtener el ciclo desde un atributo data en algún elemento HTML
  const cycleElement = document.querySelector('[data-cycle]');
  if (cycleElement) {
    cycleNumber = parseInt(cycleElement.dataset.cycle, 10) || cycleNumber;
  }
  
  // Crear el procesador para el ciclo correspondiente
  const geoprocessor = createGeoprocessor({
    cycleNumber,
    processingUrl,
    storageKey,
    buttonId: 'geoprocessButton'
  });
  
  // Inicializar
  geoprocessor.init();
  
  // Exponer para uso global si es necesario
  window.geoprocessor = geoprocessor;
});