
        /**
 * variable-scale-config.js - Configuración de escalas para variables HORIZONTE 2.0
 * Define qué variables tienen escala invertida en la simbología
 */

// Configuración de variables con escala invertida
// En estas variables: BAJO = NEGATIVO (rojo), ALTO = POSITIVO (amarillo/verde)
const VARIABLES_ESCALA_INVERTIDA = {
    seguridad: [
        'seguridad-EstacionesPolicia',
        'seguridad-MinasIntervenidas',
        'seguridad-PresenciaAreasBase',
    ],
    
    desarrollo: [
        'desarrollo-AcueductoAlcantarillado',
        'desarrollo-EnergiaElectrica',
        'desarrollo-Gas',
        'desarrollo-Internet',
        'desarrollo-Alfabetismo',
        'desarrollo-NivelEducacion',
    ],
    
    gobernabilidad: [
        'gobernabilidad-InstitucionesSalud',
        'gobernabilidad-InstitucionesEducativas',
        'gobernabilidad-CensoPoblacional',
        'gobernabilidad-ComunidadesNegras',
        'gobernabilidad-ReservasIndigenas',
        'gobernabilidad-AreasProtegidas',
        'gobernabilidad-DesarrolloTuristico',
        'gobernabilidad-Hoteles',
    ]
};

// Resto del código igual...

// Función para verificar si una variable tiene escala invertida
function tieneEscalaInvertida(variableId) {
    for (const dimension in VARIABLES_ESCALA_INVERTIDA) {
        if (VARIABLES_ESCALA_INVERTIDA[dimension].includes(variableId)) {
            return true;
        }
    }
    return false;
}

// Función para obtener todas las variables con escala invertida como array plano
function obtenerVariablesEscalaInvertida() {
    const todasLasVariables = [];
    for (const dimension in VARIABLES_ESCALA_INVERTIDA) {
        todasLasVariables.push(...VARIABLES_ESCALA_INVERTIDA[dimension]);
    }
    return todasLasVariables;
}

// Función para agregar o quitar variables de la lista de escala invertida
function modificarEscalaInvertida(variableId, agregar = true) {
    const dimension = variableId.split('-')[0];
    
    if (!VARIABLES_ESCALA_INVERTIDA[dimension]) {
        console.warn(`Dimensión ${dimension} no encontrada`);
        return false;
    }
    
    const index = VARIABLES_ESCALA_INVERTIDA[dimension].indexOf(variableId);
    
    if (agregar && index === -1) {
        VARIABLES_ESCALA_INVERTIDA[dimension].push(variableId);
        console.log(`Variable ${variableId} agregada a escala invertida`);
        return true;
    } else if (!agregar && index !== -1) {
        VARIABLES_ESCALA_INVERTIDA[dimension].splice(index, 1);
        console.log(`Variable ${variableId} removida de escala invertida`);
        return true;
    }
    
    return false;
}

// Exportar configuración globalmente
window.variableScaleConfig = {
    VARIABLES_ESCALA_INVERTIDA,
    tieneEscalaInvertida,
    obtenerVariablesEscalaInvertida,
    modificarEscalaInvertida
};

// Log inicial
console.log("📊 Configuración de escalas cargada");
console.log(`Variables con escala invertida: ${obtenerVariablesEscalaInvertida().length}`);
