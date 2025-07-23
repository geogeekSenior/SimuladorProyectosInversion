/**
 * step1-data.js - Script para mostrar el gráfico radial en Step 1 con valores base
 * Horizonte: Juego de Estrategia
 */

// Valores de línea base para los indicadores (los mismos del Step 1)
const baselineValues = {
    seguridad: 24.06,      // Valor real de seguridad (menor es mejor)
    desarrollo: 47.94,     // Redondeado de 47.9488
    gobernabilidad: 7.91   // Redondeado de 7.9171
};

/**
 * Crea el gráfico radial SVG con solo valores base
 * @param {Object} data - Datos para el gráfico con valores baseline
 */
function createRadarChart(data) {
    const svg = document.getElementById('radarChart');
    if (!svg) {
        console.error('No se encontró el elemento SVG con id "radarChart"');
        return;
    }
    
    const width = 500;
    const height = 500;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 60;
    
    // Limpiar SVG existente
    svg.innerHTML = '';
    
    // Definir patrones y gradientes para el gráfico
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
        <pattern id="radarPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="20" stroke="#1a3a6e" stroke-width="0.5" opacity="0.3"/>
            <line x1="0" y1="0" x2="20" y2="0" stroke="#1a3a6e" stroke-width="0.5" opacity="0.3"/>
        </pattern>
        <linearGradient id="baseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#d0d3d4;stop-opacity:0.4" />
            <stop offset="100%" style="stop-color:#d0d3d4;stop-opacity:0.2" />
        </linearGradient>
    `;
    svg.appendChild(defs);
    
    // Agregar círculo de fondo con patrón
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', cx);
    bgCircle.setAttribute('cy', cy);
    bgCircle.setAttribute('r', radius);
    bgCircle.setAttribute('fill', 'url(#radarPattern)');
    bgCircle.setAttribute('opacity', '0.1');
    svg.appendChild(bgCircle);
    
    // Configuración del gráfico radial
    const dimensions = ['Seguridad', 'Desarrollo', 'Gobernabilidad'];
    const numDimensions = dimensions.length;
    const angleSlice = (Math.PI * 2) / numDimensions;
    const levels = 5; // Número de círculos concéntricos
    const maxScale = 60; // Valor máximo de la escala (60%)
    
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
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#1a3a6e');
        circle.setAttribute('stroke-width', i === levels ? '2' : '1');
        circle.setAttribute('opacity', i === levels ? '0.5' : '0.3');
        gridGroup.appendChild(circle);
        
        // Etiquetas de valores con escala máxima de 60%
        const value = (maxScale / levels) * i;
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', cx + 5);
        label.setAttribute('y', cy - levelRadius + 3);
        label.setAttribute('class', 'radar-grid-label');
        label.setAttribute('fill', '#78abda');
        label.setAttribute('font-size', '11');
        label.setAttribute('font-family', 'monospace');
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
        line.setAttribute('stroke', '#1a3a6e');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('opacity', '0.5');
        gridGroup.appendChild(line);
    });
    
    svg.appendChild(gridGroup);
    
    // Función para calcular coordenadas polares con escala máxima de 60%
    function getCoordinates(value, index) {
        const angle = angleSlice * index - Math.PI / 2;
        const normalizedValue = Math.min(value / maxScale, 1); // Normalizar con máximo de 60%
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
    const basePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const basePathData = baseCoords.map((coord, i) => 
        `${i === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`
    ).join(' ') + ' Z';
    basePath.setAttribute('d', basePathData);
    basePath.setAttribute('fill', 'url(#baseGradient)');
    basePath.setAttribute('stroke', '#d0d3d4');
    basePath.setAttribute('stroke-width', '2');
    basePath.setAttribute('opacity', '0.6');
    areaGroup.appendChild(basePath);
    
    svg.appendChild(areaGroup);
    
    // Crear grupo para puntos y etiquetas
    const pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pointsGroup.setAttribute('class', 'radar-points');
    
    // Dibujar puntos y etiquetas para cada dimensión
    dimensions.forEach((dim, i) => {
        const value = data.baseline[dim.toLowerCase()];
        const coord = getCoordinates(value, i);
        
        // Punto
        const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        point.setAttribute('cx', coord.x);
        point.setAttribute('cy', coord.y);
        point.setAttribute('r', 5);
        point.setAttribute('fill', '#d0d3d4');
        point.setAttribute('stroke', '#ffffff');
        point.setAttribute('stroke-width', '2');
        pointsGroup.appendChild(point);
        
        // Etiqueta de dimensión
        const labelAngle = angleSlice * i - Math.PI / 2;
        const labelRadius = radius + 30;
        const labelX = cx + labelRadius * Math.cos(labelAngle);
        const labelY = cy + labelRadius * Math.sin(labelAngle);
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', labelX);
        label.setAttribute('y', labelY);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        label.setAttribute('fill', '#ffffff');
        label.setAttribute('font-size', '14');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('font-family', 'monospace');
        label.textContent = dim.toUpperCase();
        pointsGroup.appendChild(label);
        
        // Valor de la dimensión
        const valueLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueLabel.setAttribute('x', labelX);
        valueLabel.setAttribute('y', labelY + 18);
        valueLabel.setAttribute('text-anchor', 'middle');
        valueLabel.setAttribute('fill', '#78abda');
        valueLabel.setAttribute('font-size', '12');
        valueLabel.setAttribute('font-weight', 'bold');
        valueLabel.setAttribute('font-family', 'monospace');
        valueLabel.textContent = value.toFixed(1) + '%';
        pointsGroup.appendChild(valueLabel);
    });
    
    svg.appendChild(pointsGroup);
    
    // Agregar título al gráfico
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', cx);
    title.setAttribute('y', 25);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', '#ffffff');
    title.setAttribute('font-size', '16');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('font-family', 'monospace');
    svg.appendChild(title);
    
    // Agregar subtítulo con información de escala
    const subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subtitle.setAttribute('x', cx);
    subtitle.setAttribute('y', 45);
    subtitle.setAttribute('text-anchor', 'middle');
    subtitle.setAttribute('fill', '#78abda');
    subtitle.setAttribute('font-size', '12');
    subtitle.setAttribute('font-family', 'monospace');
    svg.appendChild(subtitle);
}

/**
 * Inicializa el gráfico radial cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando gráfico radial en Step 1...');
    
    // Preparar datos para el gráfico (solo valores base)
    const chartData = {
        baseline: {
            seguridad: baselineValues.seguridad,
            desarrollo: baselineValues.desarrollo,
            gobernabilidad: baselineValues.gobernabilidad
        }
    };
    
    // Crear el gráfico radial
    createRadarChart(chartData);
    
    console.log('Gráfico radial creado con valores base:', chartData);
    console.log('Escala máxima configurada:', maxScale + '%');
});