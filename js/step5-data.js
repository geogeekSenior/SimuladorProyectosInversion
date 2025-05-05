/**
 * step3-data.js - Script para cargar datos dinámicos en la evaluación del Ciclo 1
 * Horizonte: Juego de Estrategia
 */

// Valores de línea base (valores iniciales antes de las intervenciones)
const baselineValues = {
    seguridad: 5.0226,    // Valores iniciales (divididos por 10 para escala correcta)
    desarrollo: 5.0734,
    gobernabilidad: 3.8899,
    total: 4.6388           // Total calculado como: (6.883*0.4 + 4.260*0.25 + 2.504*0.35)
};

// Configuración para evaluación de impacto
const impactConfig = {
    impactLevels: {
        bajo: { max: 3, color: "#AC1C1C", text: "BAJO" },
        medio: { min: 3, max: 6, color: "#C68D30", text: "MEDIO" },
        alto: { min: 6, color: "#3c6d3f", text: "ALTO" }
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
        base: 68,
        maximo: 85
    }
};

/**
 * Calcula la expectativa de vida basada en un índice de 0-100
 * @param {number} indice - Valor del índice (0-100)
 * @returns {number} - Expectativa de vida calculada
 */
function calcularExpectativaVida(indice) {
    const { base, maximo } = impactConfig.expectativaVida;
    return base + (maximo - base) * (indice / 100);
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
        // URL del servicio de proyectos
        const serviceUrl = "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/EquiposProyectos/FeatureServer/0/query";
        
        // URL completa con parámetros basada en el ejemplo proporcionado
        const url = `${serviceUrl}?where=team_code+%3D+%27${teamCode}%27+AND+ciclo+%3D+%27ciclo-2%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&defaultSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=xyFootprint&resultOffset=&resultRecordCount=&returnTrueCurves=false&returnCentroid=false&returnEnvelope=false&timeReferenceUnknownClient=false&maxRecordCountFactor=&sqlFormat=none&resultType=&datumTransformation=&lodType=geohash&lod=&lodSR=&cacheHint=false&f=pjson`;
        
        console.log("URL completa para consulta de proyectos:", url);
        
        // Realizar la consulta
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
        // URL del servicio de indicadores
        const serviceUrl = "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/EquiposIndicadores/FeatureServer/0/query";
        
        // URL completa con parámetros basada en el ejemplo proporcionado
        const url = `${serviceUrl}?where=team_code+%3D+%27${teamCode}%27+AND+ciclo+%3D+%27ciclo-2%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&defaultSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=mean_seguridad,mean_gobernabilidad,mean_desarrollo&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=xyFootprint&resultOffset=&resultRecordCount=&returnTrueCurves=false&returnCentroid=false&returnEnvelope=false&timeReferenceUnknownClient=false&maxRecordCountFactor=&sqlFormat=none&resultType=&datumTransformation=&lodType=geohash&lod=&lodSR=&cacheHint=false&f=pjson`;
        
        console.log("URL completa para consulta de indicadores:", url);
        
        // Realizar la consulta
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
            
            // Intentar cargar los estilos dinámicamente
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
        
        // Si no hay datos, informar al usuario y continuar con datos de prueba
        let totalProyectos, totalInversion;
        let valorSeguridad, valorDesarrollo, valorGobernabilidad;
        
        if (!proyectos || proyectos.length === 0 || !indicadores) {
            console.warn("No se encontraron datos del equipo en el servidor. Usando datos de demostración.");
            
            // DATOS DE DEMOSTRACIÓN - Solo usar cuando no hay datos reales
            totalProyectos = 3;
            totalInversion = 5280;
            
            // Valores de indicadores demostrativos que coinciden con la imagen
            valorSeguridad = 6.90;
            valorDesarrollo = 4.29;
            valorGobernabilidad = 2.52;
            
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
                    <td><span class="status-badge ${impacto.clase}">${proyecto.attributes.ubicacion}</span></td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            // USAR DATOS REALES DE LA CONSULTA
            totalProyectos = proyectos.length;
            totalInversion = proyectos.reduce((sum, proyecto) => sum + (proyecto.attributes.valorinversion || 0), 0);
            
            // Extraer valores directamente de la respuesta de la API
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
                // Obtener el impacto directamente del proyecto si está disponible,
                // o determinarlo basado en los atributos del proyecto
                let impactoClase = "status-medium";
                if (proyecto.attributes.impacto) {
                    if (proyecto.attributes.impacto.toLowerCase().includes("alta") || 
                        proyecto.attributes.impacto.toLowerCase().includes("óptima")) {
                        impactoClase = "status-active";
                    } else if (proyecto.attributes.impacto.toLowerCase().includes("baja")) {
                        impactoClase = "status-inactive";
                    }
                }
                
                // Determinar ubicación desde los atributos del proyecto
                const ubicacion = proyecto.attributes.ubicacion || 
                                 (proyecto.attributes.municipio ? proyecto.attributes.municipio : 
                                  impactConfig.municipios[(index % 8) + 1]);
                
                // Crear fila
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>OP-${(index + 1).toString().padStart(3, '0')}</td>
                    <td>${proyecto.attributes.proyecto}</td>
                    <td>${proyecto.attributes.valorinversion.toLocaleString()}</td>
                    <td><span class="status-badge ${impactoClase}">${ubicacion}</span></td>
                `;
                
                tableBody.appendChild(row);
            });
        }
        
        // Actualizar resumen de inversiones
        document.getElementById('operationsCount').textContent = totalProyectos;
        document.getElementById('investedResources').textContent = `${totalInversion.toLocaleString()}`;
        
        // CÁLCULOS CON DATOS REALES O DEMOS
        // Calcular mejoras porcentuales desde línea base
        const mejoraSeguridad = valorSeguridad - baselineValues.seguridad;
        const mejoraDesarrollo = valorDesarrollo - baselineValues.desarrollo;
        const mejoraGobernabilidad = valorGobernabilidad - baselineValues.gobernabilidad;
        
        // Calcular el total PEMSITIM con los pesos correctos
        const totalPemsitim = (valorSeguridad * 0.4) + (valorDesarrollo * 0.25) + (valorGobernabilidad * 0.35);
        const mejoraPemsitim = totalPemsitim - baselineValues.total;
        
        // Escala para visualización (factores de 10)
        const escalaVisual = 10;
        
        // Calcular expectativa de vida correcta
        const expectativaVida = calcularExpectativaVida(totalPemsitim * escalaVisual);
        const expectativaVidaBase = calcularExpectativaVida(baselineValues.total * escalaVisual);
        const mejoraExpectativaVida = expectativaVida - expectativaVidaBase;
        
        console.log("Cálculos realizados:", {
            mejoraSeguridad: mejoraSeguridad.toFixed(4),
            mejoraDesarrollo: mejoraDesarrollo.toFixed(4),
            mejoraGobernabilidad: mejoraGobernabilidad.toFixed(4),
            totalPemsitim: totalPemsitim.toFixed(4),
            expectativaVida: expectativaVida.toFixed(2),
            expectativaVidaBase: expectativaVidaBase.toFixed(2),
            mejoraExpectativaVida: mejoraExpectativaVida.toFixed(2)
        });
        
        // Actualizar valor de mejora de expectativa de vida global
        document.getElementById('pemsitimIncrease').textContent = `+${mejoraExpectativaVida.toFixed(2)} años`;
        
        // Actualizar barras de impacto por dimensión
        // Seguridad
        document.getElementById('seguridad-bar').style.width = `${valorSeguridad * escalaVisual}%`;
        document.getElementById('seguridad-improvement').style.width = `${mejoraSeguridad * escalaVisual}%`;
        document.getElementById('seguridad-value').textContent = `${(valorSeguridad * escalaVisual).toFixed(2)}%`;
        document.getElementById('seguridad-increase').textContent = `+${(mejoraSeguridad * escalaVisual).toFixed(2)}%`;
        
        // Desarrollo
        document.getElementById('desarrollo-bar').style.width = `${valorDesarrollo * escalaVisual}%`;
        document.getElementById('desarrollo-improvement').style.width = `${mejoraDesarrollo * escalaVisual}%`;
        document.getElementById('desarrollo-value').textContent = `${(valorDesarrollo * escalaVisual).toFixed(2)}%`;
        document.getElementById('desarrollo-increase').textContent = `+${(mejoraDesarrollo * escalaVisual).toFixed(2)}%`;
        
        // Gobernabilidad
        document.getElementById('gobernabilidad-bar').style.width = `${valorGobernabilidad * escalaVisual}%`;
        document.getElementById('gobernabilidad-improvement').style.width = `${mejoraGobernabilidad * escalaVisual}%`;
        document.getElementById('gobernabilidad-value').textContent = `${(valorGobernabilidad * escalaVisual).toFixed(2)}%`;
        document.getElementById('gobernabilidad-increase').textContent = `+${(mejoraGobernabilidad * escalaVisual).toFixed(2)}%`;
        
        // Expectativa de vida total
        document.getElementById('total-bar').style.width = `${totalPemsitim * escalaVisual}%`;
        document.getElementById('total-improvement').style.width = `${mejoraPemsitim * escalaVisual}%`;
        document.getElementById('total-value').textContent = `${expectativaVida.toFixed(2)} años`;
        document.getElementById('total-increase').textContent = `+${mejoraExpectativaVida.toFixed(2)} años`;
        
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
        
        // Mostrar mensaje en la interfaz
        document.getElementById('operationsTableBody').innerHTML = '<tr><td colspan="4" class="text-center">Error en la consulta. Ver consola para detalles.</td></tr>';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM cargado - Inicializando step3-data.js");
    
    // Iniciar con una animación de carga
    setTimeout(() => {
        // Inicializar la interfaz con datos reales
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