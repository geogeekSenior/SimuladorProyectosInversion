/**
 * utils.js - Utilidades centralizadas para la aplicación
 * Horizonte: Juego de Estrategia
 */

// Verificar que el namespace HORIZONTE existe
if (!window.HORIZONTE) window.HORIZONTE = {};

/**
 * Clase FeatureSet optimizada para gestionar conjuntos de features
 */
class FeatureSet {
  constructor() {
    this.features = [];
    this.allAttributes = [];
    this.teamInfo = this.getTeamInfo(); // Obtener información del equipo al inicializar
  }

  /**
   * Obtiene la información del equipo desde sessionStorage
   * @returns {Object} - Información del equipo o valores predeterminados
   */
  getTeamInfo() {
    try {
      const teamInfo = sessionStorage.getItem('teamInfo');
      if (teamInfo) {
        return JSON.parse(teamInfo);
      }
    } catch (error) {
      console.warn('Error al obtener información del equipo:', error);
    }
    return { name: "Sin equipo", code: "0000-000000", createdAt: new Date().toISOString() };
  }

  /**
   * Añade un feature al conjunto con información del equipo
   * @param {Object} graphic - Feature a añadir
   * @returns {FeatureSet} - Este objeto para encadenamiento
   */
  agregarFeature(graphic) {
    // Asegurarse de que el gráfico tenga un objeto attributes
    if (!graphic.attributes) {
      graphic.attributes = {};
    }
    
    // Añadir información del equipo a los atributos del gráfico
    graphic.attributes.teamName = this.teamInfo.name;
    graphic.attributes.teamCode = this.teamInfo.code;
    graphic.attributes.sessionTimestamp = this.teamInfo.createdAt;
    
    this.features.push(graphic);
    return this;  // Para encadenamiento de métodos
  }

  /**
   * Establece todos los atributos disponibles
   * @param {Array} attributes - Lista de atributos
   * @returns {FeatureSet} - Este objeto para encadenamiento
   */
  setAllAttributes(attributes) {
    this.allAttributes = attributes;
    return this;  // Para encadenamiento de métodos
  }
  
  /**
   * Obtiene todos los atributos de los features
   * @returns {Array} Lista de atributos
   */
  obtenerAtributos() {
    return this.features.map(feature => feature.attributes);
  }
  
  /**
   * Obtiene todas las geometrías de los features
   * @returns {Array} Lista de geometrías simplificadas
   */
  obtenerGeometrias() {
    return this.features.map(feature => {
      if (!feature.geometry) return null;
      
      const { type, longitude, latitude, z } = feature.geometry;
      return {
        type,
        objectid: feature.attributes.objectid,
        longitude,
        latitude,
        z
      };
    }).filter(geo => geo !== null);  // Filtrar valores nulos
  }
  
  /**
   * Método optimizado para filtrar por atributo
   * @param {string} nombreAtributo - Nombre del atributo a filtrar
   * @param {any} valor - Valor a buscar
   * @returns {Array} Features filtrados
   */
  filtrarPorAtributo(nombreAtributo, valor) {
    return this.features
      .filter(feature => feature.attributes[nombreAtributo] === valor)
      .map(feature => ({
        atributos: feature.attributes,
        geometria: feature.geometry ? {
          longitude: feature.geometry.longitude,
          latitude: feature.geometry.latitude
        } : null
      }));
  }
  
  /**
   * Método para filtrar features por equipo
   * @param {string} teamCode - Código del equipo a filtrar
   * @returns {Array} Features filtrados por equipo
   */
  filtrarPorEquipo(teamCode) {
    return this.filtrarPorAtributo('teamCode', teamCode);
  }
  
  /**
   * Genera un resumen de los features
   * @returns {Object} Resumen de features
   */
  generarResumen() {
    const totalFeatures = this.features.length;
    const atributos = this.obtenerAtributos();
    
    // Intentar calcular valores más útiles si hay valorinversion
    let totalInversion = 0;
    try {
      totalInversion = atributos.reduce((sum, attr) => {
        return sum + (attr.valorinversion || 0);
      }, 0);
    } catch (error) {
      console.warn("No se pudo calcular inversión total:", error);
    }
    
    return {
      totalFeatures,
      totalInversion,
      tieneGeometria: this.features.some(f => !!f.geometry),
      equipo: this.teamInfo
    };
  }
}

// Módulo de utilidades
HORIZONTE.utils = (function() {
    /**
     * Muestra un mensaje de estado temporal
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de mensaje ('success', 'warning', 'error', 'info')
     * @param {number} duration - Duración en milisegundos
     */
    function showStatusMessage(message, type = 'info', duration = 3000) {
        const statusMessage = document.getElementById('statusMessage');
        if (!statusMessage) {
            // Si no existe el elemento, crearlo
            const messageDiv = document.createElement('div');
            messageDiv.id = 'statusMessage';
            messageDiv.className = 'status-message';
            document.body.appendChild(messageDiv);
            
            setTimeout(() => {
                displayMessage(messageDiv, message, type, duration);
            }, 100);
            return;
        }
        
        displayMessage(statusMessage, message, type, duration);
    }
    
    /**
     * Función auxiliar para mostrar mensaje
     * @private
     * @param {HTMLElement} element - Elemento donde mostrar el mensaje
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de mensaje
     * @param {number} duration - Duración en milisegundos
     */
    function displayMessage(element, message, type, duration) {
        element.textContent = message;
        element.className = 'status-message';
        element.classList.add(`status-${type}`);
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        
        setTimeout(() => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
        }, duration);
    }
    
    /**
     * Formatea una fecha en estilo militar
     * @param {Date} date - Fecha a formatear (predeterminado: fecha actual)
     * @returns {string} Fecha formateada
     */
    function formatMilitaryDate(date = new Date()) {
        const options = { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        return date.toLocaleString('es-ES', options).replace(',', ' / ');
    }
    
    /**
     * Actualiza el elemento de fecha en el footer
     */
    function updateFooterDate() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = formatMilitaryDate();
        }
    }
    
    /**
     * Detecta la preferencia de esquema de color del sistema
     */
    function detectColorScheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    /**
     * Anima un elemento con una clase CSS
     * @param {HTMLElement} element - Elemento a animar
     * @param {string} animationClass - Clase CSS para la animación
     * @param {number} duration - Duración en milisegundos
     */
    function animateElement(element, animationClass, duration = 1000) {
        if (!element) return;
        
        element.classList.add(animationClass);
        
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    }
    
    /**
     * Guarda datos en sessionStorage
     * @param {string} key - Clave para los datos
     * @param {any} data - Datos a guardar
     * @returns {boolean} Éxito de la operación
     */
    function saveToSession(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error al guardar en sessionStorage:', error);
            return false;
        }
    }
    
    /**
     * Carga datos desde sessionStorage
     * @param {string} key - Clave de los datos
     * @returns {any} Datos cargados o null si no existen
     */
    function loadFromSession(key) {
        try {
            const data = sessionStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error al cargar desde sessionStorage:', error);
            return null;
        }
    }
    
    /**
     * Formatea un número con separador de miles
     * @param {number} number - Número a formatear
     * @param {number} decimals - Cantidad de decimales
     * @returns {string} Número formateado
     */
    function formatNumber(number, decimals = 0) {
        return Number(number).toLocaleString('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    /**
     * Formatea un valor como moneda
     * @param {number} number - Valor a formatear
     * @returns {string} Valor formateado como moneda
     */
    function formatCurrency(number) {
        return '$' + formatNumber(number);
    }
    
    /**
     * Formatea un valor como porcentaje
     * @param {number} number - Valor a formatear
     * @param {number} decimals - Cantidad de decimales
     * @returns {string} Valor formateado como porcentaje
     */
    function formatPercentage(number, decimals = 1) {
        return Number(number).toLocaleString('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }) + '%';
    }
    
    /**
     * Genera un ID único
     * @param {string} prefix - Prefijo para el ID
     * @returns {string} ID único
     */
    function generateUniqueId(prefix = '') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    /**
     * Normaliza un texto (quita acentos, convierte a minúsculas)
     * @param {string} text - Texto a normalizar
     * @returns {string} Texto normalizado
     */
    function normalizeText(text) {
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }
    
    /**
     * Trunca un texto si es demasiado largo
     * @param {string} text - Texto a truncar
     * @param {number} maxLength - Longitud máxima
     * @returns {string} Texto truncado
     */
    function truncateText(text, maxLength = 50) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    /**
     * Convierte valores RGB a formato hexadecimal
     * @param {number} r - Valor rojo (0-255)
     * @param {number} g - Valor verde (0-255)
     * @param {number} b - Valor azul (0-255)
     * @returns {string} Color en formato hexadecimal
     */
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    /**
     * Convierte color hexadecimal a formato RGBA
     * @param {string} hex - Color en formato hexadecimal
     * @param {number} alpha - Valor de transparencia (0-1)
     * @returns {string} Color en formato RGBA
     */
    function hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    /**
     * Valida si un email tiene formato correcto
     * @param {string} email - Email a validar
     * @returns {boolean} True si el email es válido
     */
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
    
    /**
     * Detecta si se está usando un dispositivo móvil
     * @returns {boolean} True si es un dispositivo móvil
     */
    function isMobileDevice() {
        return window.innerWidth <= 768;
    }
    
    /**
     * Obtiene un parámetro de la URL
     * @param {string} name - Nombre del parámetro
     * @returns {string} Valor del parámetro
     */
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
    
    /**
     * Debounce para funciones que se llaman frecuentemente
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Tiempo de espera en milisegundos
     * @returns {Function} Función con debounce
     */
    function debounce(func, wait = 300) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    /**
     * Muestra un elemento con animación
     * @param {HTMLElement} element - Elemento a mostrar
     * @param {string} displayType - Tipo de display (block, flex, etc.)
     */
    function showElement(element, displayType = 'block') {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.display = displayType;
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transition = 'opacity 0.3s ease';
        }, 10);
    }
    
    /**
     * Oculta un elemento con animación
     * @param {HTMLElement} element - Elemento a ocultar
     */
    function hideElement(element) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 300);
    }
    
    /**
     * Obtiene información detallada de los puntos desplegados
     * @param {boolean} prettyPrint - Si es true, formatea el JSON para mejor visualización
     * @returns {Object} Información de puntos seleccionados
     */
    function getPuntosSeleccionados(prettyPrint = true) {
      const puntos = {
        geometrias: [],
        atributos: [],
        resumen: {},
        equipo: {} // Nuevo campo para información del equipo
      };
      
      // Intentar obtener desde diferentes fuentes posibles
      try {
        // Agregar información del equipo
        if (HORIZONTE.team && HORIZONTE.team.isInitialized()) {
          puntos.equipo = {
            nombre: HORIZONTE.team.getTeamName(),
            codigo: HORIZONTE.team.getTeamCode()
          };
        } else {
          // Intentar obtenerlo de sessionStorage como respaldo
          try {
            const teamInfo = sessionStorage.getItem('teamInfo');
            if (teamInfo) {
              const parsedInfo = JSON.parse(teamInfo);
              puntos.equipo = {
                nombre: parsedInfo.name,
                codigo: parsedInfo.code,
                createdAt: parsedInfo.createdAt
              };
            }
          } catch (error) {
            console.warn("No se pudo recuperar información del equipo:", error);
            puntos.equipo = { nombre: "Sin equipo", codigo: "0000-000000" };
          }
        }
        
        // Verificar si existe miFeatureSet en window
        if (window.miFeatureSet) {
          puntos.geometrias = window.miFeatureSet.obtenerGeometrias();
          puntos.atributos = window.miFeatureSet.obtenerAtributos();
        } 
        // Verificar si existe en HORIZONTE.app
        else if (HORIZONTE.app && HORIZONTE.app.getProyectosSeleccionados) {
          const proyectos = HORIZONTE.app.getProyectosSeleccionados();
          puntos.atributos = proyectos;
          
          // Si está disponible map-scene, obtener geometrías
          if (HORIZONTE.mapScene && HORIZONTE.mapScene.getPuntosGeometria) {
            puntos.geometrias = HORIZONTE.mapScene.getPuntosGeometria();
          }
        }
        // Verificar recursos usados
        if (window.resourceManager) {
          const presupuestoInicial = window.resourceManager.initialBudget;
          const presupuestoActual = window.resourceManager.availableBudget;
          puntos.resumen = {
            total: puntos.atributos.length,
            presupuestoInicial,
            presupuestoActual,
            presupuestoUsado: presupuestoInicial - presupuestoActual,
            porcentajeUtilizado: ((presupuestoInicial - presupuestoActual) / presupuestoInicial * 100).toFixed(2) + '%'
          };
        }
      } catch (error) {
        console.error("Error al obtener puntos seleccionados:", error);
      }
      
      // Devolver formateado o no según parámetro
      return prettyPrint ? JSON.stringify(puntos, null, 2) : puntos;
    }
    
    // API pública
    return {
        showStatusMessage,
        formatMilitaryDate,
        updateFooterDate,
        detectColorScheme,
        animateElement,
        saveToSession,
        loadFromSession,
        formatNumber,
        formatCurrency,
        formatPercentage,
        generateUniqueId,
        normalizeText,
        truncateText,
        rgbToHex,
        hexToRgba,
        isValidEmail,
        isMobileDevice,
        getUrlParameter,
        debounce,
        showElement,
        hideElement,
        getPuntosSeleccionados
    };
})();

// Exponer funciones para uso en consola
HORIZONTE.consola = {
  getPuntosSeleccionados: HORIZONTE.utils.getPuntosSeleccionados,
  verPuntos: function() {
    console.log(HORIZONTE.utils.getPuntosSeleccionados());
    return "Puntos mostrados en consola";
  },
  // Nuevas funciones específicas para equipo
  verPuntosPorEquipo: function(teamCode) {
    if (!window.miFeatureSet) {
      return "FeatureSet no inicializado";
    }
    const puntosFiltrados = window.miFeatureSet.filtrarPorEquipo(teamCode);
    console.log(JSON.stringify(puntosFiltrados, null, 2));
    return `Puntos del equipo ${teamCode} mostrados en consola`;
  },
  verEquipoActual: function() {
    const teamInfo = window.miFeatureSet ? window.miFeatureSet.teamInfo : null;
    if (!teamInfo) {
      const storedInfo = sessionStorage.getItem('teamInfo');
      if (storedInfo) {
        console.log(JSON.stringify(JSON.parse(storedInfo), null, 2));
        return "Información de equipo mostrada desde sessionStorage";
      }
      return "No hay información de equipo disponible";
    }
    console.log(JSON.stringify(teamInfo, null, 2));
    return "Información de equipo mostrada en consola";
  }
};

// Exponer la clase para uso global
window.FeatureSet = FeatureSet;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Actualizar fecha en el footer
    HORIZONTE.utils.updateFooterDate();
    
    // Detectar esquema de color
    HORIZONTE.utils.detectColorScheme();
    
    // Escuchar cambios en el esquema de color
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', HORIZONTE.utils.detectColorScheme);
    
    // Crear instancia global de FeatureSet para acceso desde consola
    window.miFeatureSet = new FeatureSet();
    
    // Cuando se seleccione un punto, añadirlo al FeatureSet
    document.addEventListener('horizonte:proyectoSeleccionado', function(event) {
      if (window.miFeatureSet && event.detail && event.detail.punto) {
        // Obtener información del equipo actual si está disponible
        let teamInfo = window.miFeatureSet.teamInfo;
        
        // Validar o actualizar la información del equipo directamente desde HORIZONTE.team
        if (HORIZONTE.team && HORIZONTE.team.isInitialized()) {
          teamInfo = {
            name: HORIZONTE.team.getTeamName(),
            code: HORIZONTE.team.getTeamCode(),
            createdAt: window.miFeatureSet.teamInfo.createdAt // Mantener timestamp original
          };
          // Actualizar el teamInfo en el FeatureSet
          window.miFeatureSet.teamInfo = teamInfo;
        }
        
        // Asegurarse de que el punto tenga atributos
        if (!event.detail.punto.attributes) {
          event.detail.punto.attributes = {};
        }
        
        // Añadir información del equipo a los atributos del punto antes de agregarlo
        event.detail.punto.attributes.teamName = teamInfo.name;
        event.detail.punto.attributes.teamCode = teamInfo.code;
        event.detail.punto.attributes.sessionTimestamp = teamInfo.createdAt;
        
        // Añadir el punto al FeatureSet
        window.miFeatureSet.agregarFeature(event.detail.punto);
        console.log('Punto añadido a miFeatureSet:', 
          event.detail.proyecto.objectid, 
          'Equipo:', teamInfo.name, 
          'Código:', teamInfo.code);
      }
    });
});