/**
 * step3-data.js - Script para cargar datos dinámicos en la evaluación del Ciclo 1
 * Horizonte: Juego de Estrategia
 */

// Valores de línea base (valores iniciales antes de las intervenciones)
const baselineValues = {
    seguridad: 6.88,    // Valores ajustados a la escala de los datos reales
    desarrollo: 4.26,
    gobernabilidad: 2.504,
    total: 4.87
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
    }
};

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
        const url = `${serviceUrl}?where=team_code+%3D+%27${teamCode}%27+AND+ciclo+%3D+%27ciclo-1%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&defaultSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=xyFootprint&resultOffset=&resultRecordCount=&returnTrueCurves=false&returnCentroid=false&returnEnvelope=false&timeReferenceUnknownClient=false&maxRecordCountFactor=&sqlFormat=none&resultType=&datumTransformation=&lodType=geohash&lod=&lodSR=&cacheHint=false&f=pjson`;
        
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
        const url = `${serviceUrl}?where=team_code+%3D+%27${teamCode}%27+AND+ciclo+%3D+%27ciclo-1%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&defaultSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=mean_seguridad,mean_gobernabilidad,mean_desarrollo&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=xyFootprint&resultOffset=&resultRecordCount=&returnTrueCurves=false&returnCentroid=false&returnEnvelope=false&timeReferenceUnknownClient=false&maxRecordCountFactor=&sqlFormat=none&resultType=&datumTransformation=&lodType=geohash&lod=&lodSR=&cacheHint=false&f=pjson`;
        
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
 * Inicializa la interfaz con los datos obtenidos
 */
async function initializeInterface() {
    try {
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
        
        // Si no hay datos, mostrar mensaje y terminar
        if (!proyectos || proyectos.length === 0) {
            document.getElementById('operationsTableBody').innerHTML = '<tr><td colspan="5" class="text-center">No se encontraron proyectos para el Ciclo 1</td></tr>';
            return;
        }
        
        // Calcular estadísticas de proyectos
        const totalProyectos = proyectos.length;
        const totalInversion = proyectos.reduce((sum, proyecto) => sum + (proyecto.attributes.valorinversion || 0), 0);
        
        // Actualizar resumen de inversiones
        document.getElementById('operationsCount').textContent = totalProyectos;
        document.getElementById('investedResources').textContent = `$${totalInversion.toLocaleString()}`;
        
        // Obtener valores de indicadores
        const valorSeguridad = indicadores ? indicadores.mean_seguridad : 0;
        const valorDesarrollo = indicadores ? indicadores.mean_desarrollo : 0;
        const valorGobernabilidad = indicadores ? indicadores.mean_gobernabilidad : 0;
        
        // Calcular mejoras porcentuales desde línea base
        const mejoraSeguridad = valorSeguridad - baselineValues.seguridad;
        const mejoraDesarrollo = valorDesarrollo - baselineValues.desarrollo;
        const mejoraGobernabilidad = valorGobernabilidad - baselineValues.gobernabilidad;
        
        // Calcular el total PEMSITIM
        const totalPemsitim = (valorSeguridad * 0.4) + (valorGobernabilidad * 0.35) + (valorDesarrollo * 0.25);
        const mejoraPemsitim = baselineValues.total - totalPemsitim;

        // Convertir a escala porcentual para visualización (multiplicar por 10 para mostrar en barras)
        const escalaVisual = 10;
        
        // Actualizar valor de mejora PEMSITIM global
        document.getElementById('pemsitimIncrease').textContent = `+${(mejoraPemsitim * escalaVisual).toFixed(1)}%`;
        
        
        // Actualizar barras de impacto por dimensión
        document.getElementById('seguridad-bar').style.width = `${valorSeguridad * escalaVisual}%`;
        document.getElementById('seguridad-improvement').style.width = `${mejoraSeguridad * escalaVisual}%`;
        document.getElementById('seguridad-value').textContent = `${(valorSeguridad * escalaVisual).toFixed(1)}%`;
        document.getElementById('seguridad-increase').textContent = `+${(mejoraSeguridad * escalaVisual).toFixed(1)}%`;
        
        document.getElementById('desarrollo-bar').style.width = `${valorDesarrollo * escalaVisual}%`;
        document.getElementById('desarrollo-improvement').style.width = `${mejoraDesarrollo * escalaVisual}%`;
        document.getElementById('desarrollo-value').textContent = `${(valorDesarrollo * escalaVisual).toFixed(1)}%`;
        document.getElementById('desarrollo-increase').textContent = `+${(mejoraDesarrollo * escalaVisual).toFixed(1)}%`;
        
        document.getElementById('gobernabilidad-bar').style.width = `${valorGobernabilidad * escalaVisual}%`;
        document.getElementById('gobernabilidad-improvement').style.width = `${mejoraGobernabilidad * escalaVisual}%`;
        document.getElementById('gobernabilidad-value').textContent = `${(valorGobernabilidad * escalaVisual).toFixed(1)}%`;
        document.getElementById('gobernabilidad-increase').textContent = `+${(mejoraGobernabilidad * escalaVisual).toFixed(1)}%`;
        
        document.getElementById('total-bar').style.width = `${totalPemsitim * escalaVisual}%`;
        document.getElementById('total-improvement').style.width = `${mejoraPemsitim * escalaVisual}%`;
        document.getElementById('total-value').textContent = `${(totalPemsitim * escalaVisual).toFixed(1)}%`;
        document.getElementById('total-increase').textContent = `+${(mejoraPemsitim * escalaVisual).toFixed(1)}%`;
        
        // Poblar tabla de proyectos
        const tableBody = document.getElementById('operationsTableBody');
        tableBody.innerHTML = '';
        
        proyectos.forEach((proyecto, index) => {
            // Determinar municipio basado en un algoritmo simple para demo
            const municipioId = (index % 8) + 1;
            const municipio = impactConfig.municipios[municipioId] || "Desconocido";
            
            // Determinar nivel de impacto basado en la valoración
            const impactoValor = 4 + Math.random() * 4; // Valor entre 4 y 8 para demo
            const impacto = getImpactLevel(impactoValor);
            
            // Crear fila
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>OP-${(index + 1).toString().padStart(3, '0')}</td>
            <td>${proyecto.attributes.proyecto}</td>
            <td>$${proyecto.attributes.valorinversion.toLocaleString()}</td>
            <td><span class="status-badge ${impacto.clase}">${proyecto.attributes.ubicacion || 'No especificado'}</span></td>
        `;
            
            tableBody.appendChild(row);
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
        
        // Mostrar mensaje en la interfaz
        document.getElementById('operationsTableBody').innerHTML = '<tr><td colspan="5" class="text-center">Error en la consulta. Ver consola para detalles.</td></tr>';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM cargado - Inicializando step3-data.js");
    
    // Actualizar fecha del reporte
    const reportDateElement = document.getElementById('reportDate');
    if (reportDateElement) {
        reportDateElement.textContent = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
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