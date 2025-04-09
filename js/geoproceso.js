/**
 * geoproceso.js - Utilizando submitJob para procesamiento asíncrono
 * Horizonte: Juego de Estrategia
 */

// Variable para controlar si ya se ejecutó el proceso
let procesoEjecutado = false;

// Agregar el botón de geoprocesamiento a la interfaz
function agregarBotonGeoproceso() {
  // Verificar si ya existe el botón
  if (document.getElementById('geoprocessButton')) return;
  
  // Crear el botón con estilo militar
  const geoprocessButton = document.createElement('button');
  geoprocessButton.id = 'geoprocessButton';
  geoprocessButton.className = 'military-button';
  geoprocessButton.innerHTML = '<span class="geo-icon">📊</span> EJECUTAR ANÁLISIS';
  
  // Agregar eventos
  geoprocessButton.addEventListener('click', ejecutarGeoproceso);
  
  // Verificar si el proceso ya fue ejecutado (recuperar de sessionStorage)
  if (sessionStorage.getItem('ciclo1_procesado') === 'true') {
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
  
  console.log('Botón de geoproceso agregado');
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
    sessionStorage.setItem('ciclo1_procesado', 'true');
    
    // Deshabilitar el botón visualmente
    const boton = document.getElementById('geoprocessButton');
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
    
    // URL del servicio de geoprocesamiento
    const gpUrl = 'https://arcgis.esri.co/server/rest/services/geoprocessing/SuitabilityModelCiclo1/GPServer/Script';
    
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
    const boton = document.getElementById('geoprocessButton');
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
    
    // Cargar módulos necesarios para geoprocesamiento asíncrono
    require([
      "esri/rest/geoprocessor", 
      "esri/rest/support/JobInfo"
    ], function(geoprocessor, JobInfo) {
      // Mostrar mensaje
      mostrarMensajeEstado('Enviando trabajo al servidor...', 'info');
      actualizarModalAnalisis(modalId, 'progress', 'Enviando trabajo al servidor...', 30);
      
      // Usar submitJob en lugar de execute
      geoprocessor.submitJob(url, params)
        .then(function(jobInfo) {
          console.log('Trabajo enviado exitosamente, JobID:', jobInfo.jobId);
          mostrarMensajeEstado('Trabajo enviado, ID: ' + jobInfo.jobId, 'info');
          actualizarModalAnalisis(modalId, 'progress', 'Trabajo enviado, procesando...', 40);
          
          // Monitorear el estado del trabajo
          monitorizarTrabajo(url, jobInfo.jobId, modalId);
        })
        .catch(function(error) {
          console.error('Error al enviar trabajo:', error);
          mostrarMensajeEstado('Error al enviar trabajo: ' + (error.message || 'Error desconocido'), 'error');
          actualizarModalAnalisis(modalId, 'error', 'Error al enviar trabajo: ' + (error.message || 'Error desconocido'));
          
          // Mantener el botón deshabilitado a pesar del error
          const boton = document.getElementById('geoprocessButton');
          if (boton) {
            boton.disabled = true;
            boton.classList.add('disabled');
            boton.classList.remove('processing');
            boton.title = 'Análisis ya ejecutado';
          }
          
          reject(error);
        });
    });
  });
}

// Función para monitorizar el estado del trabajo usando esri/request
function monitorizarTrabajo(url, jobId, modalId) {
  let progreso = 40;
  const incremento = 10;
  
  const intervalo = setInterval(() => {
    require(["esri/request"], function(esriRequest) {
      const jobStatusUrl = `${url}/jobs/${jobId}?f=json`;
      esriRequest(jobStatusUrl, { responseType: "json" })
        .then(function(response) {
          const jobInfo = response.data;
          console.log('Estado del trabajo:', jobInfo.jobStatus);
          
          // Actualizar progreso gradualmente
          progreso = Math.min(90, progreso + incremento);
          
          // Actualizar mensaje de estado
          const estadoTexto = obtenerTextoEstado(jobInfo.jobStatus);
          mostrarMensajeEstado(`Procesando trabajo: ${estadoTexto}`, 'info');
          actualizarModalAnalisis(modalId, 'progress', `Procesando trabajo: ${estadoTexto}`, progreso);
          
          // Verificar si el trabajo ha finalizado (ya sea con "job-succeeded" o "esriJobSucceeded")
          if (jobInfo.jobStatus === 'job-succeeded' || jobInfo.jobStatus === 'esriJobSucceeded') {
            clearInterval(intervalo);
            mostrarMensajeEstado('Trabajo completado con éxito', 'success');
            
            // CAMBIO IMPORTANTE: Mostrar éxito directamente sin intentar obtener resultados
            console.log('Trabajo completado con éxito:', jobId);
            
            // Actualizar el modal finalmente
            actualizarModalAnalisis(modalId, 'success', 'Análisis completado con éxito', 100);
            
            // Cerrar modal después de 3 segundos
            setTimeout(() => {
              cerrarModalAnalisis(modalId);
              mostrarMensajeExito(jobId, jobInfo);
              
              // Asegurar que el botón quede deshabilitado permanentemente
              const boton = document.getElementById('geoprocessButton');
              if (boton) {
                boton.disabled = true;
                boton.classList.add('disabled');
                boton.classList.remove('processing');
                boton.title = 'Análisis ya ejecutado';
              }
            }, 3000);
            
          } else if (jobInfo.jobStatus === 'job-failed') {
            clearInterval(intervalo);
            console.error('El trabajo falló:', jobInfo);
            mostrarMensajeEstado('Trabajo fallido: ' + (jobInfo.messages ? jobInfo.messages[0].description : 'Error desconocido'), 'error');
            actualizarModalAnalisis(modalId, 'error', 'Trabajo fallido: ' + (jobInfo.messages ? jobInfo.messages[0].description : 'Error desconocido'));
            
            // Mantener el botón deshabilitado a pesar del error
            const boton = document.getElementById('geoprocessButton');
            if (boton) {
              boton.disabled = true;
              boton.classList.add('disabled');
              boton.classList.remove('processing');
              boton.title = 'Análisis ya ejecutado';
            }
          } else if (jobInfo.jobStatus === 'job-cancelled') {
            clearInterval(intervalo);
            mostrarMensajeEstado('Trabajo cancelado', 'warning');
            actualizarModalAnalisis(modalId, 'error', 'Trabajo cancelado');
            
            // Mantener el botón deshabilitado a pesar de la cancelación
            const boton = document.getElementById('geoprocessButton');
            if (boton) {
              boton.disabled = true;
              boton.classList.add('disabled');
              boton.classList.remove('processing');
              boton.title = 'Análisis ya ejecutado';
            }
          }
        })
        .catch(function(error) {
          console.error('Error al verificar estado:', error);
          clearInterval(intervalo);
          mostrarMensajeEstado('Error al verificar estado del trabajo', 'error');
          actualizarModalAnalisis(modalId, 'error', 'Error al verificar estado del trabajo');
          
          // Mantener el botón deshabilitado a pesar del error
          const boton = document.getElementById('geoprocessButton');
          if (boton) {
            boton.disabled = true;
            boton.classList.add('disabled');
            boton.classList.remove('processing');
            boton.title = 'Análisis ya ejecutado';
          }
        });
    });
  }, 2000);
}

// Función para transformar el estado a texto legible
function obtenerTextoEstado(jobStatus) {
  switch (jobStatus) {
    case 'job-new': return 'Iniciando';
    case 'job-submitted': return 'Enviado';
    case 'job-waiting': return 'En espera';
    case 'job-executing': return 'Ejecutando';
    case 'job-succeeded': return 'Completado';
    case 'esriJobSucceeded': return 'Completado';
    case 'job-failed': return 'Fallido';
    case 'job-cancelled': return 'Cancelado';
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
    const boton = document.getElementById('geoprocessButton');
    if (boton) {
      boton.disabled = true;
      boton.classList.add('disabled');
      boton.classList.remove('processing');
      boton.title = 'Análisis ya ejecutado';
    }
  });
  
  // Añadir al documento
  document.body.appendChild(modal);
  
  // CAMBIO: Disparar evento personalizado para indicar que se abrió el modal
  document.dispatchEvent(new CustomEvent('geoproceso:modalOpen', {
    detail: { modalId: modalId }
  }));
  
  return modalId;
}

// Actualizar modal de análisis
function actualizarModalAnalisis(modalId, estado, mensaje, progreso) {
  if (!modalId) return;
  
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  const statusElem = modal.querySelector('.analysis-status');
  const progressBar = modal.querySelector('.analysis-progress-bar');
  const spinner = modal.querySelector('.analysis-spinner');
  
  if (statusElem) statusElem.textContent = mensaje || '';
  
  if (progressBar && typeof progreso !== 'undefined') {
    progressBar.style.width = `${progreso}%`;
  }
  
  // Actualizar estilos según el estado
  if (estado === 'error') {
    if (statusElem) statusElem.className = 'analysis-status analysis-error';
    if (progressBar) {
      progressBar.className = 'analysis-progress-bar analysis-error-bar';
      progressBar.style.width = '100%';
    }
    if (spinner) spinner.className = 'analysis-spinner analysis-error-spinner';
    
    // Añadir botón para cerrar si no existe
    if (!modal.querySelector('.geoproceso-footer')) {
      const footerDiv = document.createElement('div');
      footerDiv.className = 'geoproceso-footer';
      
      const closeButton = document.createElement('button');
      closeButton.className = 'military-button';
      closeButton.textContent = 'CERRAR';
      closeButton.addEventListener('click', () => {
        cerrarModalAnalisis(modalId);
        
        // El botón debe mantenerse deshabilitado incluso si hay error
        const boton = document.getElementById('geoprocessButton');
        if (boton) {
          boton.disabled = true;
          boton.classList.add('disabled');
          boton.classList.remove('processing');
          boton.title = 'Análisis ya ejecutado';
        }
      });
      
      footerDiv.appendChild(closeButton);
      modal.querySelector('.geoproceso-modal-content').appendChild(footerDiv);
    }
  } else if (estado === 'success') {
    if (statusElem) statusElem.className = 'analysis-status analysis-success';
    if (progressBar) {
      progressBar.className = 'analysis-progress-bar analysis-success-bar';
      progressBar.style.width = '100%';
    }
    if (spinner) spinner.className = 'analysis-spinner analysis-success-spinner';
  }
}

// Cerrar modal de análisis
function cerrarModalAnalisis(modalId) {
  if (!modalId) return;
  
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  // Animación de salida
  modal.classList.add('geoproceso-modal-closing');
  
  // Remover después de la animación
  setTimeout(() => {
    modal.remove();
    
    // CAMBIO: Disparar evento personalizado para indicar que se cerró el modal
    document.dispatchEvent(new CustomEvent('geoproceso:modalClose', {
      detail: { modalId: modalId }
    }));
  }, 300);
}

// Mostrar mensaje de estado (crea el contenedor si no existe)
function mostrarMensajeEstado(mensaje, tipo = 'info') {
  console.log(`[${tipo}] ${mensaje}`);
  
  // Si se tiene implementado HORIZONTE, se utiliza
  if (window.HORIZONTE && HORIZONTE.app && HORIZONTE.app.mostrarMensajeEstado) {
    HORIZONTE.app.mostrarMensajeEstado(mensaje, tipo);
    return;
  }
  
  // Si no existe el elemento, crearlo
  let statusMessage = document.getElementById('statusMessage');
  if (!statusMessage) {
    statusMessage = document.createElement('div');
    statusMessage.id = 'statusMessage';
    statusMessage.className = 'status-message';
    document.body.appendChild(statusMessage);
  }
  
  statusMessage.textContent = mensaje;
  statusMessage.className = `status-message status-${tipo}`;
  statusMessage.style.opacity = '1';
  statusMessage.style.transform = 'translateY(0)';
  
  // Desvanecer el mensaje después de 5 segundos
  setTimeout(() => {
    statusMessage.style.opacity = '0';
    statusMessage.style.transform = 'translateY(20px)';
  }, 5000);
}

// Añadir estilos CSS específicos para botones deshabilitados
function addDisabledButtonStyles() {
  // Verificar si ya existe el estilo
  if (document.getElementById('disabled-button-styles')) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = 'disabled-button-styles';
  styleElement.textContent = `
    #geoprocessButton.disabled {
      background-color: #3a4a5a !important; 
      cursor: not-allowed !important;
      opacity: 0.7 !important;
      pointer-events: none !important;
    }
    
    #geoprocessButton.disabled::after {
      content: " (COMPLETADO)";
      font-size: 0.8em;
    }
  `;
  document.head.appendChild(styleElement);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando componente de geoproceso...');
  
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
  
  // También intentar cuando la aplicación esté lista
  document.addEventListener('horizonte:appReady', agregarBotonGeoproceso);
  
  // Y cuando las capas estén cargadas
  document.addEventListener('horizonte:layersLoaded', agregarBotonGeoproceso);
  
  // Si ninguno de los anteriores funciona, intentar después de un tiempo
  setTimeout(agregarBotonGeoproceso, 2000);
});