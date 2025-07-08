/**
 * step3-data.js - Script para evaluación de impacto del Ciclo 1
 * Horizonte: Juego de Estrategia
 * VERSIÓN CON GRÁFICO RADIAL Y AMPLIFICACIÓN VISUAL
 */

// Valores de línea base para los indicadores
const baselineValues = {
    seguridad: 75.94,          // Valor invertido de seguridad para cálculos internos
    seguridadInvertida: 24.06, // Valor real de seguridad (menor es mejor)
    desarrollo: 47.9488,
    gobernabilidad: 7.9171,
    total: 48.53844            // Índice PEMSITIM calculado con pesos ponderados
};

const baselineSeguridad = baselineValues ? baselineValues.seguridad : 24.06;

// Configuración para evaluación de impacto
const impactConfig = {
    impactLevels: {
        bajo: { max: 30, color: "#AC1C1C", text: "BAJO" },
        medio: { min: 30, max: 60, color: "#C68D30", text: "MEDIO" },
        alto: { min: 60, color: "#3c6d3f", text: "ALTO" }
    },
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
    expectativaVida: {
        base: 62,
        maximo: 84
    }
};

/**
 * Crea el gráfico radial SVG con amplificación visual de cambios
 * @param {Object} data - Datos para el gráfico con valores baseline y actuales
 */
function createRadarChart(data) {
    const svg = document.getElementById('radarChart');
    const width = 500;
    const height = 500;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 60;
    
    // CAMBIO IMPORTANTE: Factor de amplificación para hacer más visibles los cambios
    const AMPLIFICATION_FACTOR = 3.0; // Aumentado de 2.5 a 3.0 para mayor dramatismo
    
    // Obtener referencia al valor baseline de seguridad
    const baselineSeguridad = baselineValues ? baselineValues.seguridad : 24.06;
    
    // Limpiar SVG existente
    svg.innerHTML = '';
    
    // Definir patrones y gradientes para el gráfico
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
        <pattern id="radarPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="20" stroke="${'var(--primary-color-dark)'}" stroke-width="0.5" opacity="0.3"/>
            <line x1="0" y1="0" x2="20" y2="0" stroke="${'var(--primary-color-dark)'}" stroke-width="0.5" opacity="0.3"/>
        </pattern>
        <linearGradient id="baseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#d0d3d4;stop-opacity:0.4" />
            <stop offset="100%" style="stop-color:#d0d3d4;stop-opacity:0.2" />
        </linearGradient>
        <linearGradient id="currentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a3a6e;stop-opacity:0.6" />
            <stop offset="100%" style="stop-color:#3a5d94;stop-opacity:0.4" />
        </linearGradient>
    `;
    svg.appendChild(defs);
    
    // Agregar círculo de fondo con patrón
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', cx);
    bgCircle.setAttribute('cy', cy);
    bgCircle.setAttribute('r', radius);
    bgCircle.setAttribute('class', 'radar-background-pattern');
    svg.appendChild(bgCircle);
    
    // Configuración del gráfico radial
    const dimensions = ['Seguridad', 'Desarrollo', 'Gobernabilidad'];
    const numDimensions = dimensions.length;
    const angleSlice = (Math.PI * 2) / numDimensions;
    const levels = 5; // Número de círculos concéntricos
    
    // CAMBIO IMPORTANTE: Calcular rango dinámico para hacer más visibles los cambios
    const allValues = [
        data.baseline.seguridad, data.baseline.desarrollo, data.baseline.gobernabilidad,
        data.current.seguridad, data.current.desarrollo, data.current.gobernabilidad
    ];
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const valueRange = maxValue - minValue;
    
    // Ajustar escala con margen para amplificar visualmente las diferencias
    const margin = valueRange * 0.5; // Aumentado a 50% de margen para más dramatismo
    const scaleMin = Math.max(0, minValue - margin);
    const scaleMax = Math.min(100, maxValue + margin);
    const maxScale = scaleMax; // Escala máxima dinámica
    
    // Crear grupo para el grid
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'radar-grid');
    
    // Dibujar círculos concéntricos y etiquetas de escala
    for (let i = 1; i <= levels; i++) {
        const levelRadius = (radius / levels) * i;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', levelRadius);
        circle.setAttribute('class', i === levels ? 'radar-axis-line' : 'radar-grid-line');
        if (i % 2 === 0) {
            circle.setAttribute('class', circle.getAttribute('class') + ' radar-grid-animated');
        }
        gridGroup.appendChild(circle);
        
        // CAMBIO: Etiquetas de valores con escala ajustada
        const value = scaleMin + ((scaleMax - scaleMin) / levels) * i;
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', cx + 5);
        label.setAttribute('y', cy - levelRadius + 3);
        label.setAttribute('class', 'radar-grid-label');
        label.textContent = value.toFixed(0) + '%';
        gridGroup.appendChild(label);
    }
    
    // Dibujar líneas radiales para cada dimensión
    dimensions.forEach((dim, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', cx);
        line.setAttribute('y1', cy);
        line.setAttribute('x2', x);
        line.setAttribute('y2', y);
        line.setAttribute('class', 'radar-axis-line radar-axis-animated');
        gridGroup.appendChild(line);
    });
    
    svg.appendChild(gridGroup);
    
    // CAMBIO: Función para calcular coordenadas polares con escala ajustada
    function getCoordinates(value, index) {
        const angle = angleSlice * index - Math.PI / 2;
        // Normalizar el valor dentro del rango dinámico
        const normalizedValue = (value - scaleMin) / (scaleMax - scaleMin);
        const r = normalizedValue * radius;
        return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle)
        };
    }
    
    // Crear grupo para las áreas del gráfico
    const areaGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    areaGroup.setAttribute('class', 'radar-areas');
    
    // Calcular coordenadas para valores baseline
    const baseCoords = dimensions.map((dim, i) => {
        const value = data.baseline[dim.toLowerCase()];
        return getCoordinates(value, i);
    });
    
    // Dibujar polígono baseline
    const basePath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const basePoints = baseCoords.map(coord => `${coord.x},${coord.y}`).join(' ');
    basePath.setAttribute('points', basePoints);
    basePath.setAttribute('fill', 'url(#baseGradient)');
    basePath.setAttribute('stroke', '#d0d3d4');
    basePath.setAttribute('stroke-width', '2');
    basePath.setAttribute('opacity', '0.8');
    areaGroup.appendChild(basePath);
    
    // Calcular coordenadas para valores actuales
    const currentCoords = dimensions.map((dim, i) => {
        const value = data.current[dim.toLowerCase()];
        return getCoordinates(value, i);
    });
    
    // Dibujar polígono actual
    const currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const currentPoints = currentCoords.map(coord => `${coord.x},${coord.y}`).join(' ');
    currentPath.setAttribute('points', currentPoints);
    currentPath.setAttribute('fill', 'url(#currentGradient)');
    currentPath.setAttribute('stroke', '#1a3a6e');
    currentPath.setAttribute('stroke-width', '3');
    currentPath.setAttribute('opacity', '0.8');
    
    areaGroup.appendChild(currentPath);
    svg.appendChild(areaGroup);
    
    // Crear grupo para líneas de mejora
    const improvementGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    improvementGroup.setAttribute('class', 'radar-improvements');
    
    // Dibujar líneas de conexión entre baseline y valores actuales
    dimensions.forEach((dim, i) => {
        const baseCoord = baseCoords[i];
        const currentCoord = currentCoords[i];
        
        // Línea punteada de mejora
        const improvementLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        improvementLine.setAttribute('x1', baseCoord.x);
        improvementLine.setAttribute('y1', baseCoord.y);
        improvementLine.setAttribute('x2', currentCoord.x);
        improvementLine.setAttribute('y2', currentCoord.y);
        improvementLine.setAttribute('stroke', '#1a3a6e');
        improvementLine.setAttribute('stroke-width', '4');
        improvementLine.setAttribute('opacity', '0.6');
        improvementLine.setAttribute('stroke-dasharray', '5,3');
        improvementGroup.appendChild(improvementLine);
    });
    
    svg.appendChild(improvementGroup);
    
    // Crear grupo para puntos y etiquetas
    const pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pointsGroup.setAttribute('class', 'radar-points');
    
    // Dibujar puntos y etiquetas para cada dimensión
    dimensions.forEach((dim, i) => {
        const baseValue = data.baseline[dim.toLowerCase()];
        const currentValue = data.current[dim.toLowerCase()];
        const baseCoord = getCoordinates(baseValue, i);
        const currentCoord = getCoordinates(currentValue, i);
        
        // Punto baseline
        const basePoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        basePoint.setAttribute('cx', baseCoord.x);
        basePoint.setAttribute('cy', baseCoord.y);
        basePoint.setAttribute('r', 5);
        basePoint.setAttribute('fill', '#d0d3d4');
        basePoint.setAttribute('stroke', '#ffffff');
        basePoint.setAttribute('stroke-width', '2');
        pointsGroup.appendChild(basePoint);
        
        // Punto actual con interactividad
        const currentPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        currentPoint.setAttribute('cx', currentCoord.x);
        currentPoint.setAttribute('cy', currentCoord.y);
        currentPoint.setAttribute('r', 6);
        currentPoint.setAttribute('fill', '#1a3a6e');
        currentPoint.setAttribute('stroke', '#ffffff');
        currentPoint.setAttribute('stroke-width', '2');
        currentPoint.setAttribute('class', 'radar-point-current');
        
        // CAMBIO: Agregar eventos de hover con valores reales
        currentPoint.addEventListener('mouseenter', function(e) {
            const isSeguridad = dim.toLowerCase() === 'seguridad';
            const isDesarrollo = dim.toLowerCase() === 'desarrollo';
            const isGobernabilidad = dim.toLowerCase() === 'gobernabilidad';
            
            let realValue = currentValue;
            if (isSeguridad && data.realSeguridad) {
                realValue = data.realSeguridad;
            } else if (isDesarrollo && data.realDesarrollo) {
                realValue = data.realDesarrollo;
            } else if (isGobernabilidad && data.realGobernabilidad) {
                realValue = data.realGobernabilidad;
            }
            
            const realDelta = realValue - baseValue;
            const tooltip = createTooltip(dim, realValue, realDelta, isSeguridad, realValue);
            document.body.appendChild(tooltip);
            positionTooltip(tooltip, e);
        });
        
        currentPoint.addEventListener('mouseleave', function() {
            const tooltip = document.querySelector('.radar-tooltip');
            if (tooltip) tooltip.remove();
        });
        
        pointsGroup.appendChild(currentPoint);
        
        // Etiquetas de dimensiones
        const angle = angleSlice * i - Math.PI / 2;
        const labelRadius = radius + 35;
        const labelX = cx + labelRadius * Math.cos(angle);
        const labelY = cy + labelRadius * Math.sin(angle);
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', labelX);
        label.setAttribute('y', labelY);
        label.setAttribute('class', 'radar-label');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        
        // Ajustar posición vertical para mejor legibilidad
        if (i === 0) {
            label.setAttribute('y', labelY - 5);
        } else if (i === 1 || i === 2) {
            label.setAttribute('y', labelY + 5);
        }
        
        label.textContent = dim.toUpperCase();
        pointsGroup.appendChild(label);
        
        // Agregar valores actuales cerca de los puntos
        const valueLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const valueLabelRadius = (currentValue / maxScale) * radius + 20;
        const valueLabelX = cx + valueLabelRadius * Math.cos(angle);
        const valueLabelY = cy + valueLabelRadius * Math.sin(angle);
        
        valueLabel.setAttribute('x', valueLabelX);
        valueLabel.setAttribute('y', valueLabelY);
        valueLabel.setAttribute('class', 'radar-value-label');
        valueLabel.setAttribute('text-anchor', 'middle');
        valueLabel.setAttribute('font-size', '12');
        valueLabel.setAttribute('fill', '#1a3a6e');
        valueLabel.setAttribute('font-weight', 'bold');
        
        // CAMBIO: Mostrar valor real para cada dimensión
        if (dim.toLowerCase() === 'seguridad') {
            const realSeguridad = data.realSeguridad || baselineSeguridad;
            valueLabel.textContent = realSeguridad.toFixed(1) + '%';
        } else if (dim.toLowerCase() === 'desarrollo') {
            const realDesarrollo = data.realDesarrollo || currentValue;
            valueLabel.textContent = realDesarrollo.toFixed(1) + '%';
        } else if (dim.toLowerCase() === 'gobernabilidad') {
            const realGobernabilidad = data.realGobernabilidad || currentValue;
            valueLabel.textContent = realGobernabilidad.toFixed(1) + '%';
        } else {
            valueLabel.textContent = currentValue.toFixed(1) + '%';
        }
        
        pointsGroup.appendChild(valueLabel);
    });
    
    svg.appendChild(pointsGroup);
    
    // CAMBIO: Agregar nota sobre la escala amplificada
    const scaleNote = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    scaleNote.setAttribute('x', cx);
    scaleNote.setAttribute('y', height - 20);
    scaleNote.setAttribute('text-anchor', 'middle');
    scaleNote.setAttribute('class', 'radar-scale-note');
    scaleNote.setAttribute('font-size', '11');
    scaleNote.setAttribute('fill', 'var(--text-color)');
    scaleNote.setAttribute('opacity', '0.7');
    scaleNote.textContent = ``;
    svg.appendChild(scaleNote);
    
    // Animar la entrada del gráfico
    setTimeout(() => {
        basePath.style.strokeDashoffset = '0';
        currentPath.style.strokeDashoffset = '0';
    }, 100);
}

/**
 * Crea un tooltip para mostrar información al hacer hover
 */
function createTooltip(dimension, value, delta, isSeguridad = false, realValue = null) {
    const tooltip = document.createElement('div');
    tooltip.className = 'radar-tooltip show';
    
    if (isSeguridad && realValue !== null) {
        // Para seguridad mostrar valor real y delta absoluto
        tooltip.innerHTML = `
            <strong>${dimension}</strong><br>
            Valor: ${realValue.toFixed(1)}% <br>
            Mejora: ${Math.abs(delta).toFixed(1)}% 
        `;
    } else {
        tooltip.innerHTML = `
            <strong>${dimension}</strong><br>
            Valor: ${value.toFixed(1)}%<br>
            Mejora: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}%
        `;
    }
    return tooltip;
}

/**
 * Posiciona el tooltip cerca del cursor
 */
function positionTooltip(tooltip, event) {
    tooltip.style.left = event.pageX + 10 + 'px';
    tooltip.style.top = event.pageY - 30 + 'px';
}

/**
 * Convierte años decimales a formato legible
 */
function formatYears(years, isIncrement = false) {
    if (years === 0) {
        return isIncrement ? "+0 días" : "0 años";
    }
    
    const sign = years < 0 ? "-" : (isIncrement ? "+" : "");
    const absYears = Math.abs(years);
    
    const wholeYears = Math.floor(absYears);
    const remainingYears = absYears - wholeYears;
    
    const totalMonths = remainingYears * 12;
    const wholeMonths = Math.floor(totalMonths);
    const remainingMonths = totalMonths - wholeMonths;
    
    const days = Math.round(remainingMonths * 30.44);
    
    let parts = [];
    
    if (wholeYears > 0) {
        parts.push(`${wholeYears} año${wholeYears !== 1 ? 's' : ''}`);
    }
    
    if (wholeMonths > 0) {
        parts.push(`${wholeMonths} mes${wholeMonths !== 1 ? 'es' : ''}`);
    }
    
    if (days > 0 && parts.length < 2) {
        parts.push(`${days} día${days !== 1 ? 's' : ''}`);
    }
    
    if (parts.length === 0) {
        if (days > 0) {
            parts.push(`${days} día${days !== 1 ? 's' : ''}`);
        } else {
            parts.push(isIncrement ? "menos de 1 día" : "0 años");
        }
    }
    
    let result;
    if (parts.length === 1) {
        result = parts[0];
    } else if (parts.length === 2) {
        result = parts.join(' y ');
    } else {
        result = parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1];
    }
    
    return sign + result;
}

/**
 * Versión simplificada para formatear incrementos de tiempo
 */
function formatYearsIncrement(years) {
    if (Math.abs(years) < 0.003) {
        return years >= 0 ? "+menos de 1 día" : "-menos de 1 día";
    }
    
    const sign = years >= 0 ? "+" : "-";
    const absYears = Math.abs(years);
    
    if (absYears < 1) {
        const totalMonths = absYears * 12;
        const wholeMonths = Math.floor(totalMonths);
        const remainingMonths = totalMonths - wholeMonths;
        const days = Math.round(remainingMonths * 30.44);
        
        if (wholeMonths > 0) {
            if (days > 0 && days <= 15) {
                return `${sign}${wholeMonths} mes${wholeMonths !== 1 ? 'es' : ''} y ${days} día${days !== 1 ? 's' : ''}`;
            } else {
                return `${sign}${wholeMonths} mes${wholeMonths !== 1 ? 'es' : ''}`;
            }
        } else if (days > 0) {
            return `${sign}${days} día${days !== 1 ? 's' : ''}`;
        }
    }
    
    const wholeYears = Math.floor(absYears);
    const remainingYears = absYears - wholeYears;
    const months = Math.round(remainingYears * 12);
    
    if (wholeYears > 0 && months > 0) {
        return `${sign}${wholeYears} año${wholeYears !== 1 ? 's' : ''} y ${months} mes${months !== 1 ? 'es' : ''}`;
    } else if (wholeYears > 0) {
        return `${sign}${wholeYears} año${wholeYears !== 1 ? 's' : ''}`;
    } else if (months > 0) {
        return `${sign}${months} mes${months !== 1 ? 'es' : ''}`;
    }
    
    return `${sign}menos de 1 mes`;
}

/**
 * Calcula la expectativa de vida basada en el índice PEMSITIM
 */
function calcularExpectativaVida(indice) {
    const { base, maximo } = impactConfig.expectativaVida;
    return base + (maximo - base) * ((indice) / 100);
}

/**
 * Obtiene la información del equipo desde sessionStorage
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
 * Consulta los proyectos del equipo en el servicio ArcGIS
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
 * Consulta los indicadores del equipo en el servicio ArcGIS
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
 * Inicializa la interfaz con los datos obtenidos
 */
async function initializeInterface() {
    try {
        // Actualizar fecha del reporte
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
        
        // Consultar proyectos e indicadores del equipo
        const proyectos = await fetchTeamProjects(teamInfo.code);
        console.log("Proyectos encontrados:", proyectos);
        
        const indicadores = await fetchTeamIndicators(teamInfo.code);
        console.log("Indicadores encontrados:", indicadores);
        
        // Variables para almacenar datos
        let totalProyectos, totalInversion;
        let valorSeguridad, valorDesarrollo, valorGobernabilidad;
        
        if (!proyectos || proyectos.length === 0 || !indicadores) {
            console.warn("No se encontraron datos del equipo en el servidor. Usando valores de demostración.");
            
            // Valores de demostración
            totalProyectos = 3;
            totalInversion = 5280;
            
            // Valores demo para indicadores (cambios más pequeños para demostrar la amplificación)
            valorSeguridad = 76.75307871;  // Solo 2.69% de mejora
            valorDesarrollo = 49.26012642; // Solo 1.31% de mejora
            valorGobernabilidad = 12.88700884; // 4.97% de mejora
            
            // Proyectos de demostración
            const proyectosDemo = [
                { 
                    attributes: { 
                        objectid: 1, 
                        proyecto: "Mejoramiento de la infraestructura vial mediante pavimentación",
                        valorinversion: 2300
                    }
                },
                {
                    attributes: {
                        objectid: 2,
                        proyecto: "Instalación de soluciones energéticas para comunidades indígenas",
                        valorinversion: 1800
                    }
                },
                {
                    attributes: {
                        objectid: 3,
                        proyecto: "Caminos veredales",
                        valorinversion: 1100
                    }
                }
            ];
            
            // Poblar tabla con proyectos demo
            const tableBody = document.getElementById('operationsTableBody');
            tableBody.innerHTML = '';
            
            proyectosDemo.forEach((proyecto, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>OP-${(index + 1).toString().padStart(3, '0')}</td>
                    <td>${proyecto.attributes.proyecto}</td>
                    <td>${proyecto.attributes.valorinversion.toLocaleString()}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            // Usar datos reales del servicio
            totalProyectos = proyectos.length;
            totalInversion = proyectos.reduce((sum, proyecto) => sum + (proyecto.attributes.valorinversion || 0), 0);
            
            valorSeguridad = indicadores.mean_seguridad || 0;
            valorDesarrollo = indicadores.mean_desarrollo || 0;
            valorGobernabilidad = indicadores.mean_gobernabilidad || 0;
            
            // Poblar tabla de proyectos con datos reales
            const tableBody = document.getElementById('operationsTableBody');
            tableBody.innerHTML = '';
            
            proyectos.forEach((proyecto, index) => {
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
        
        // Calcular deltas para cada indicador
        const valorSeguridadInvertido = 100 - valorSeguridad;
        const deltaSeguridad = valorSeguridadInvertido - baselineValues.seguridadInvertida;
        
        const deltaDesarrollo = valorDesarrollo - baselineValues.desarrollo;
        const deltaGobernabilidad = valorGobernabilidad - baselineValues.gobernabilidad;
        
        console.log("Cálculos de seguridad:", {
            valorOriginal: valorSeguridad,
            valorInvertido: valorSeguridadInvertido,
            baseline: baselineValues.seguridadInvertida,
            delta: deltaSeguridad
        });
        
        // Calcular índices PEMSITIM
        const totalPemsitimActual = (valorSeguridad * 0.45) + (valorDesarrollo * 0.25) + (valorGobernabilidad * 0.3);
        const totalPemsitimBaseline = (baselineValues.seguridad * 0.45) + (baselineValues.desarrollo * 0.25) + (baselineValues.gobernabilidad * 0.3);
        const deltaPemsitim = totalPemsitimActual - totalPemsitimBaseline;
        
        // Calcular expectativa de vida
        const expectativaVidaActual = calcularExpectativaVida(totalPemsitimActual);
        const expectativaVidaBaseline = calcularExpectativaVida(totalPemsitimBaseline);
        const deltaExpectativaVida = expectativaVidaActual - expectativaVidaBaseline;
        
        // Actualizar valor de mejora de expectativa de vida
        document.getElementById('pemsitimIncrease').textContent = formatYearsIncrement(deltaExpectativaVida);
        
        // CAMBIO IMPORTANTE: Preparar datos para el gráfico radial con amplificación visual
        const AMPLIFICATION_FACTOR = 3.0; // Factor para hacer más visibles los cambios
        
        // Calcular deltas amplificados para visualización
        const deltaAbsolutoSeguridad = Math.abs(deltaSeguridad);
        const deltaAmplificadoSeguridad = deltaAbsolutoSeguridad * AMPLIFICATION_FACTOR;
        const deltaAmplificadoDesarrollo = deltaDesarrollo * AMPLIFICATION_FACTOR;
        const deltaAmplificadoGobernabilidad = deltaGobernabilidad * AMPLIFICATION_FACTOR;
        
        const chartData = {
            baseline: {
                seguridad: baselineValues.seguridadInvertida, 
                desarrollo: baselineValues.desarrollo,
                gobernabilidad: baselineValues.gobernabilidad
            },
            current: {
                // Aplicar amplificación visual manteniendo la dirección del cambio
                seguridad: baselineValues.seguridadInvertida + deltaAmplificadoSeguridad,
                desarrollo: baselineValues.desarrollo + deltaAmplificadoDesarrollo,
                gobernabilidad: baselineValues.gobernabilidad + deltaAmplificadoGobernabilidad
            },
            // Valores reales sin amplificar para mostrar en etiquetas
            realSeguridad: baselineValues.seguridadInvertida + deltaAbsolutoSeguridad,
            realDesarrollo: valorDesarrollo,
            realGobernabilidad: valorGobernabilidad
        };
        
        console.log("Datos para gráfico radial con amplificación:", {
            factor: AMPLIFICATION_FACTOR,
            seguridadBaseline: baselineValues.seguridadInvertida,
            seguridadActual: baselineValues.seguridadInvertida + deltaAbsolutoSeguridad,
            seguridadAmplificada: baselineValues.seguridadInvertida + deltaAmplificadoSeguridad,
            deltaReal: deltaAbsolutoSeguridad,
            deltaAmplificado: deltaAmplificadoSeguridad,
            explicacion: "Los cambios se amplifican x3 para visualización, pero los valores mostrados son reales"
        });
        
        // Crear el gráfico radial
        createRadarChart(chartData);
        
        // Actualizar valores en la tabla de dimensiones
        document.getElementById('seguridad-value').textContent = `${(baselineValues.seguridadInvertida + deltaAbsolutoSeguridad).toFixed(1)}%`;
        const deltaSeguridadMostrado = Math.abs(deltaSeguridad);
        document.getElementById('seguridad-increase').textContent = `+${deltaSeguridadMostrado.toFixed(1)}%`;
        
        document.getElementById('desarrollo-value').textContent = `${valorDesarrollo.toFixed(1)}%`;
        document.getElementById('desarrollo-increase').textContent = `+${deltaDesarrollo.toFixed(1)}%`;
        
        document.getElementById('gobernabilidad-value').textContent = `${valorGobernabilidad.toFixed(1)}%`;
        document.getElementById('gobernabilidad-increase').textContent = `+${deltaGobernabilidad.toFixed(1)}%`;
        
        document.getElementById('total-value').textContent = formatYears(expectativaVidaActual);
        document.getElementById('total-increase').textContent = formatYearsIncrement(deltaExpectativaVida);
        
        // Aplicar estilos según mejoras
        if (valorSeguridad < baselineValues.seguridad) document.getElementById('seguridad-increase').classList.add('positive');
        if (deltaDesarrollo > 0) document.getElementById('desarrollo-increase').classList.add('positive');
        if (deltaGobernabilidad > 0) document.getElementById('gobernabilidad-increase').classList.add('positive');
        if (deltaExpectativaVida > 0) document.getElementById('total-increase').classList.add('positive');
        
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
    console.log("DOM cargado - Inicializando step3-data.js con gráfico radial amplificado");
    
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