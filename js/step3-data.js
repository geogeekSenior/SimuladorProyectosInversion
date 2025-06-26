/**
 * step3-data.js - Script para cargar datos dinámicos en la evaluación del Ciclo 1
 * Horizonte: Juego de Estrategia
 * VERSIÓN CORREGIDA - Sin divisiones, valores tal como vienen de las fuentes
 */

// Valores de línea base (valores iniciales antes de las intervenciones) - TAL COMO ESTABAN ORIGINALMENTE
const baselineValues = {
    seguridad: 24.06,    // Valores iniciales tal como estaban
    desarrollo: 47.9488,
    gobernabilidad: 7.9171,
    total: 48.53844       // Total calculado original
};

// Configuración para evaluación de impacto
const impactConfig = {
    impactLevels: {
        bajo: { max: 30, color: "#AC1C1C", text: "BAJO" },
        medio: { min: 30, max: 60, color: "#C68D30", text: "MEDIO" },
        alto: { min: 60, color: "#3c6d3f", text: "ALTO" }
    },
    // Mapa de ubicación para mostrar en la tabla
    municipios: {
        1: "Quibdó",
        2: "Istmina",
        3: "Tadó",
        4: "Nuquí",
        5: "Bahía Solano",
        6: "Juradó",
        7: "Bojayá",
        8: "Carmen de Atrato"
    },
    // Configuración para cálculo de expectativa de vida
    expectativaVida: {
        base: 62,
        maximo: 84
    }
};

/**
 * Calcula la expectativa de vida basada en un índice de 0-100
 * @param {number} indice - Valor del índice (0-100)
 * @returns {number} - Expectativa de vida calculada
 */
function calcularExpectativaVida(indice) {
    const { base, maximo } = impactConfig.expectativaVida;
    return base + (maximo - base) * ((indice) / 100);
}

/**
 * Obtiene los datos del equipo desde sessionStorage
 * @returns {Object|null} Información del equipo o null si no existe
 */
function getTeamInfo() {
    try {
        const teamInfo = sessionStorage.getItem('teamInfo');
        return teamInfo ? JSON.parse(teamInfo) : null;
    } catch (error) {
        console.error('Error al obtener información del equipo:', error);
        return null;
    }
}

/**
 * Consulta proyectos del equipo para el ciclo 1
 * @param {string} teamCode - Código del equipo
 * @returns {Promise<Array>} Proyectos encontrados
 */
async function fetchTeamProjects(teamCode) {
    try {
        const serviceUrl = "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/EquiposProyectos/FeatureServer/0/query";
        const url = `${serviceUrl}?where=team_code+%3D+%27${teamCode}%27+AND+ciclo+%3D+%27ciclo-1%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&defaultSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=xyFootprint&resultOffset=&resultRecordCount=&returnTrueCurves=false&returnCentroid=false&returnEnvelope=false&timeReferenceUnknownClient=false&maxRecordCountFactor=&sqlFormat=none&resultType=&datumTransformation=&lodType=geohash&lod=&lodSR=&cacheHint=false&f=pjson`;
        
        console.log("URL completa para consulta de proyectos:", url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log("Respuesta del servicio de proyectos:", data);
        
        if (data.error) {
            throw new Error(`Error en la consulta: ${data.error.message}`);
        }
        
        return data.features || [];
    } catch (error) {
        console.error("Error al consultar proyectos:", error);
        throw error;
    }
}

/**
 * Consulta indicadores del equipo para el ciclo 1
 * @param {string} teamCode - Código del equipo
 * @returns {Promise<Object|null>} Indicadores encontrados o null
 */
async function fetchTeamIndicators(teamCode) {
    try {
        const serviceUrl = "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/EquiposIndicadores/FeatureServer/0/query";
        const url = `${serviceUrl}?where=team_code+%3D+%27${teamCode}%27+AND+ciclo+%3D+%27ciclo-1%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&defaultSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=mean_seguridad,mean_gobernabilidad,mean_desarrollo&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=xyFootprint&resultOffset=&resultRecordCount=&returnTrueCurves=false&returnCentroid=false&returnEnvelope=false&timeReferenceUnknownClient=false&maxRecordCountFactor=&sqlFormat=none&resultType=&datumTransformation=&lodType=geohash&lod=&lodSR=&cacheHint=false&f=pjson`;
        
        console.log("URL completa para consulta de indicadores:", url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log("Respuesta del servicio de indicadores:", data);
        
        if (data.error) {
            throw new Error(`Error en la consulta: ${data.error.message}`);
        }
        
        return data.features && data.features.length > 0 ? data.features[0].attributes : null;
    } catch (error) {
        console.error("Error al consultar indicadores:", error);
        throw error;
    }
}

/**
 * Determina el nivel de impacto basado en el valor
 * @param {number} value - Valor a evaluar
 * @returns {Object} - Información del nivel de impacto
 */
function getImpactLevel(value) {
    if (value >= impactConfig.impactLevels.alto.min) {
        return { clase: "status-active", texto: "ALTO" };
    } else if (value >= impactConfig.impactLevels.medio.min) {
        return { clase: "status-medium", texto: "MEDIO" };
    } else {
        return { clase: "status-inactive", texto: "BAJO" };
    }
}

/**
 * Verifica si un elemento existe en el DOM
 * @param {string} selector - Selector CSS para el elemento
 * @returns {boolean} - true si existe, false si no
 */
function elementoExiste(selector) {
    return document.querySelector(selector) !== null;
}

/**
 * Inicializa la interfaz con los datos obtenidos
 */
async function initializeInterface() {
    try {
        // VERIFICAR SI LOS ESTILOS DE PEMSITIM-BARS ESTÁN CARGADOS
        if (!elementoExiste('link[href*="pemsitim-bars.css"]')) {
            console.warn("Los estilos de pemsitim-bars.css no están cargados. Se cargarán dinámicamente.");
            
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = 'css/components/pemsitim-bars.css';
            document.head.appendChild(linkElement);
        }
        
        // Fecha del reporte
        document.getElementById('reportDate').textContent = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Obtener información del equipo
        const teamInfo = getTeamInfo();
        
        if (!teamInfo || !teamInfo.code) {
            throw new Error("No se encontró información del equipo");
        }
        
        console.log("Consultando datos para el equipo:", teamInfo.code);
        
        // Consultar proyectos del equipo
        const proyectos = await fetchTeamProjects(teamInfo.code);
        console.log("Proyectos encontrados:", proyectos);
        
        // Consultar indicadores del equipo
        const indicadores = await fetchTeamIndicators(teamInfo.code);
        console.log("Indicadores encontrados:", indicadores);
        
        // Variables para datos
        let totalProyectos, totalInversion;
        let valorSeguridad, valorDesarrollo, valorGobernabilidad;
        
        if (!proyectos || proyectos.length === 0 || !indicadores) {
            console.warn("No se encontraron datos del equipo en el servidor. Usando valores actuales de la tabla como ejemplo.");
            
            // VALORES ACTUALES SIMULADOS (basados en la tabla actual)
            // Estos representan los valores DESPUÉS de las intervenciones
            totalProyectos = 3;
            totalInversion = 5280;
            
            // VALORES ACTUALES SIN DIVIDIR (tal como vienen de la tabla)
            totalProyectos = 3;
            totalInversion = 5280;
            
            // Valores actuales tal como aparecen en la tabla (sin modificar)
            valorSeguridad = 26.75307871;    // Valor de la tabla tal como está
            valorDesarrollo = 49.26012642;   // Valor de la tabla tal como está 
            valorGobernabilidad = 12.88700884; // Valor de la tabla tal como está
            
            console.log("Usando valores de demostración (sin modificar):", {
                seguridadDemo: valorSeguridad,
                desarrolloDemo: valorDesarrollo,
                gobernabilidadDemo: valorGobernabilidad
            });
            
            // Proyectos de demo
            const proyectosDemo = [
                { 
                    attributes: { 
                        objectid: 1, 
                        proyecto: "Mejoramiento de la infraestructura vial mediante pavimentación",
                        valorinversion: 2300,
                        ubicacion: "Buena"
                    }
                },
                {
                    attributes: {
                        objectid: 2,
                        proyecto: "Instalación de soluciones energéticas para comunidades indígenas",
                        valorinversion: 1800,
                        ubicacion: "Buena"
                    }
                },
                {
                    attributes: {
                        objectid: 3,
                        proyecto: "Caminos veredales",
                        valorinversion: 1100,
                        ubicacion: "Óptima"
                    }
                }
            ];
            
            // Poblar tabla con proyectos demo
            const tableBody = document.getElementById('operationsTableBody');
            tableBody.innerHTML = '';
            
            proyectosDemo.forEach((proyecto, index) => {
                const row = document.createElement('tr');
                const impacto = proyecto.attributes.ubicacion === "Óptima" ? 
                    { clase: "status-active" } : { clase: "status-medium" };
                
                row.innerHTML = `
                    <td>OP-${(index + 1).toString().padStart(3, '0')}</td>
                    <td>${proyecto.attributes.proyecto}</td>
                    <td>${proyecto.attributes.valorinversion.toLocaleString()}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            // USAR DATOS REALES DE LA CONSULTA SIN DIVIDIR
            totalProyectos = proyectos.length;
            totalInversion = proyectos.reduce((sum, proyecto) => sum + (proyecto.attributes.valorinversion || 0), 0);
            
            // Extraer valores de la API en escala original (sin dividir)
            valorSeguridad = indicadores.mean_seguridad || 0;
            valorDesarrollo = indicadores.mean_desarrollo || 0;
            valorGobernabilidad = indicadores.mean_gobernabilidad || 0;
            
            console.log("Valores obtenidos del servidor:", {
                seguridad: valorSeguridad,
                desarrollo: valorDesarrollo,
                gobernabilidad: valorGobernabilidad
            });
            
            // Poblar tabla de proyectos con datos reales
            const tableBody = document.getElementById('operationsTableBody');
            tableBody.innerHTML = '';
            
            proyectos.forEach((proyecto, index) => {
                let impactoClase = "status-medium";
                if (proyecto.attributes.impacto) {
                    if (proyecto.attributes.impacto.toLowerCase().includes("alta") || 
                        proyecto.attributes.impacto.toLowerCase().includes("óptima")) {
                        impactoClase = "status-active";
                    } else if (proyecto.attributes.impacto.toLowerCase().includes("baja")) {
                        impactoClase = "status-inactive";
                    }
                }
                
                const ubicacion = proyecto.attributes.ubicacion || 
                                 (proyecto.attributes.municipio ? proyecto.attributes.municipio : 
                                  impactConfig.municipios[(index % 8) + 1]);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>OP-${(index + 1).toString().padStart(3, '0')}</td>
                    <td>${proyecto.attributes.proyecto}</td>
                    <td>${proyecto.attributes.valorinversion.toLocaleString()}</td>
                `;
                
                tableBody.appendChild(row);
            });
        }
        
        // Actualizar resumen de inversiones
        document.getElementById('operationsCount').textContent = totalProyectos;
        document.getElementById('investedResources').textContent = `${totalInversion.toLocaleString()}`;
        
        // CÁLCULOS DEL DELTA (MEJORA) - VALORES ACTUALES vs BASELINE  
        // IMPORTANTE: Todos los valores se usan tal como vienen, sin divisiones
        console.log("=== CÁLCULO DEL DELTA ===");
        console.log("Valores baseline:", baselineValues);
        console.log("Valores actuales (sin modificar):", {
            seguridad: valorSeguridad,
            desarrollo: valorDesarrollo,
            gobernabilidad: valorGobernabilidad
        });
        
        // Calcular mejoras (delta) desde línea base
        const deltaSeguridad = ((100-valorSeguridad) - baselineValues.seguridad)*-1;
        const deltaDesarrollo = valorDesarrollo - baselineValues.desarrollo;
        const deltaGobernabilidad = valorGobernabilidad - baselineValues.gobernabilidad;
        
        console.log("Deltas calculados:", {
            deltaSeguridad: deltaSeguridad.toFixed(4),
            deltaDesarrollo: deltaDesarrollo.toFixed(4),
            deltaGobernabilidad: deltaGobernabilidad.toFixed(4)
        });
        
        // Calcular el total PEMSITIM actual con los pesos correctos
        const totalPemsitimActual = (valorSeguridad * 0.45) + (valorDesarrollo * 0.25) + (valorGobernabilidad * 0.3);
        const deltaPemsitim = totalPemsitimActual - baselineValues.total;
        
        // Calcular expectativa de vida actual y baseline
        // Usar los valores tal como están para el cálculo
        const expectativaVidaActual = calcularExpectativaVida(totalPemsitimActual);
        const expectativaVidaBaseline = calcularExpectativaVida(baselineValues.total);
        const deltaExpectativaVida = expectativaVidaActual - expectativaVidaBaseline;
        
        console.log("Cálculos finales:", {
            totalPemsitimActual: totalPemsitimActual.toFixed(4),
            deltaPemsitim: deltaPemsitim.toFixed(4),
            expectativaVidaActual: expectativaVidaActual.toFixed(2),
            expectativaVidaBaseline: expectativaVidaBaseline.toFixed(2),
            deltaExpectativaVida: deltaExpectativaVida.toFixed(2),
            "--- Valores para visualización ---": "---",
            seguridadVisual: valorSeguridad.toFixed(1) + "%",
            desarrolloVisual: valorDesarrollo.toFixed(1) + "%",
            gobernabilidadVisual: valorGobernabilidad.toFixed(1) + "%",
            "--- Deltas ---": "---",
            deltaSeguridadVisual: deltaSeguridad.toFixed(1) + "%",
            deltaDesarrolloVisual: deltaDesarrollo.toFixed(1) + "%", 
            deltaGobernabilidadVisual: deltaGobernabilidad.toFixed(1) + "%"
        });
        
        // Actualizar valor de mejora de expectativa de vida global
        document.getElementById('pemsitimIncrease').textContent = `+${deltaExpectativaVida.toFixed(2)} años`;
        
        // Actualizar barras de impacto por dimensión
        // Usar valores directamente como porcentajes (sin factores de conversión)
        
        // Seguridad TENER CUIDADO CON SEGURIDAD VALUE ACTUALIZAR Y VERIFICAR EN CASO DE CAMBIOS!!!!
        document.getElementById('seguridad-bar').style.width = `${Math.min(100, valorSeguridad)}%`;
        document.getElementById('seguridad-improvement').style.width = `${Math.max(0, deltaSeguridad)}%`;
        document.getElementById('seguridad-value').textContent = `${(24.06+deltaSeguridad).toFixed(1)}%`;
        document.getElementById('seguridad-increase').textContent = `+${deltaSeguridad.toFixed(1)}%`;
        
        // Desarrollo
        document.getElementById('desarrollo-bar').style.width = `${Math.min(100, valorDesarrollo)}%`;
        document.getElementById('desarrollo-improvement').style.width = `${Math.max(0, deltaDesarrollo)}%`;
        document.getElementById('desarrollo-value').textContent = `${valorDesarrollo.toFixed(1)}%`;
        document.getElementById('desarrollo-increase').textContent = `+${deltaDesarrollo.toFixed(1)}%`;
        
        // Gobernabilidad
        document.getElementById('gobernabilidad-bar').style.width = `${Math.min(100, valorGobernabilidad)}%`;
        document.getElementById('gobernabilidad-improvement').style.width = `${Math.max(0, deltaGobernabilidad)}%`;
        document.getElementById('gobernabilidad-value').textContent = `${valorGobernabilidad.toFixed(1)}%`;
        document.getElementById('gobernabilidad-increase').textContent = `+${deltaGobernabilidad.toFixed(1)}%`;
        
        // Expectativa de vida total - CON INCREMENTO VISUAL EXAGERADO
        const porcentajeVidaActual = (expectativaVidaActual / impactConfig.expectativaVida.maximo) * 100;
        const porcentajeDeltaVida = (deltaExpectativaVida / impactConfig.expectativaVida.maximo) * 100;
        
        // Factor de exageración visual solo para el incremento de expectativa de vida
        const factorExageracion = 10; // Hacer el incremento 3.5 veces más visible
        const incrementoVisualExagerado = porcentajeDeltaVida * factorExageracion;
        
        document.getElementById('total-bar').style.width = `${Math.min(100, porcentajeVidaActual)}%`;
        document.getElementById('total-improvement').style.width = `${Math.min(25, Math.max(0, incrementoVisualExagerado))}%`; // Limitar a 25% máximo
        document.getElementById('total-value').textContent = `${expectativaVidaActual.toFixed(1)} años`;
        document.getElementById('total-increase').textContent = `+${deltaExpectativaVida.toFixed(1)} años`;
        
        console.log("Visualización expectativa de vida:", {
            porcentajeReal: porcentajeDeltaVida.toFixed(2) + "%",
            porcentajeExagerado: incrementoVisualExagerado.toFixed(2) + "%",
            factorUsado: factorExageracion
        });
        
        // Mostrar mensaje de éxito
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = "Datos cargados correctamente";
            statusMessage.className = "status-message status-success";
            statusMessage.style.opacity = "1";
            statusMessage.style.transform = "translateY(0)";
            
            setTimeout(() => {
                statusMessage.style.opacity = "0";
                statusMessage.style.transform = "translateY(20px)";
            }, 3000);
        }
        
    } catch (error) {
        console.error("Error al inicializar la interfaz:", error);
        
        // Mostrar mensaje de error
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = "Error al cargar datos: " + error.message;
            statusMessage.className = "status-message status-error";
            statusMessage.style.opacity = "1";
            statusMessage.style.transform = "translateY(0)";
            
            setTimeout(() => {
                statusMessage.style.opacity = "0";
                statusMessage.style.transform = "translateY(20px)";
            }, 5000);
        }
        
        document.getElementById('operationsTableBody').innerHTML = '<tr><td colspan="3" class="text-center">Error en la consulta. Ver consola para detalles.</td></tr>';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM cargado - Inicializando step3-data.js");
    
    setTimeout(() => {
        initializeInterface()
            .catch(error => {
                console.error("Error en la inicialización:", error);
            });
    }, 1000);
    
    // Configurar botón de nuevo ciclo
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
        restartButton.addEventListener('click', function() {
            window.location.href = 'step4.html';
        });
    }
});