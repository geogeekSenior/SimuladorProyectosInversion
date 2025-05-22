/**
 * layer-connections.js - Conexión de checkboxes con análisis multidimensional
 * Complemento para HORIZONTE 2.0
 * Versión actualizada para RasterFunction y servicio único
 */

/**
 * Actualiza el estado del checkbox principal basado en los checkboxes individuales
 */
function updateDimensionCheckbox(dimensionId) {
    const allVarCheckboxes = document.querySelectorAll(`.${dimensionId}-variable`);
    const checkedVarCheckboxes = Array.from(allVarCheckboxes).filter(checkbox => checkbox.checked);

    const dimensionCheckbox = document.getElementById(`${dimensionId}-all`);
    if (!dimensionCheckbox) return;

    if (checkedVarCheckboxes.length === 0) {
        dimensionCheckbox.checked = false;
        dimensionCheckbox.indeterminate = false;
    } else if (checkedVarCheckboxes.length === allVarCheckboxes.length) {
        dimensionCheckbox.checked = true;
        dimensionCheckbox.indeterminate = false;
    } else {
        dimensionCheckbox.indeterminate = true;
    }
}

/**
 * Sincroniza los checkboxes con el estado actual del sistema
 */
function syncCheckboxesWithSystem() {
    console.log("Sincronizando checkboxes con el sistema...");
    
    ['seguridad', 'desarrollo', 'gobernabilidad'].forEach(dimensionId => {
        updateDimensionCheckbox(dimensionId);
    });

    console.log("Sincronización completada.");
}

/**
 * Configura las conexiones entre checkboxes y el sistema de análisis
 */
function setupCheckboxConnections() {
    if (!window.horizonte || !window.horizonte.bandasConfig) {
        console.warn("Sistema HORIZONTE no está listo. La configuración se reintentará...");
        return;
    }

    console.log("Configurando conexiones de checkboxes...");

    // Procesar cada dimensión
    ['seguridad', 'desarrollo', 'gobernabilidad'].forEach(dimensionId => {
        const variableCheckboxes = document.querySelectorAll(`.${dimensionId}-variable`);

        variableCheckboxes.forEach((checkbox) => {
            // Obtener el nombre de la variable desde la etiqueta adyacente
            const variableNameElement = checkbox.nextElementSibling;
            if (!variableNameElement || !variableNameElement.classList.contains('variable-name')) {
                console.warn("No se pudo encontrar el nombre de la variable para el checkbox:", checkbox.id);
                return;
            }
            const variableName = variableNameElement.textContent.trim();

            // Verificar que la variable existe en la configuración de bandas
            if (!window.horizonte.bandasConfig[dimensionId] || 
                !window.horizonte.bandasConfig[dimensionId][variableName]) {
                console.warn(`Variable '${variableName}' no encontrada en configuración de bandas para dimensión '${dimensionId}'`);
                return;
            }

            // Conectar el evento del checkbox
            checkbox.addEventListener('calciteCheckboxChange', function(event) {
                const isChecked = event.target.checked;
                console.log(`Variable ${dimensionId}:${variableName} ${isChecked ? 'activada' : 'desactivada'}`);
                
                // La función applyWeightedCombination se llama automáticamente desde script.js
                // No necesitamos llamarla aquí para evitar duplicación
            });
        });
    });

    console.log("Conexiones de checkboxes configuradas correctamente.");
}

/**
 * Valida que todas las variables en los checkboxes tienen configuración de banda correspondiente
 */
function validateVariableConfiguration() {
    if (!window.horizonte || !window.horizonte.bandasConfig) {
        console.warn("No se puede validar: configuración de bandas no disponible");
        return false;
    }

    let allValid = true;
    const missingVars = [];

    ['seguridad', 'desarrollo', 'gobernabilidad'].forEach(dimensionId => {
        const variableCheckboxes = document.querySelectorAll(`.${dimensionId}-variable`);
        
        variableCheckboxes.forEach(checkbox => {
            const variableNameElement = checkbox.nextElementSibling;
            if (variableNameElement && variableNameElement.classList.contains('variable-name')) {
                const variableName = variableNameElement.textContent.trim();
                
                if (!window.horizonte.bandasConfig[dimensionId] || 
                    !window.horizonte.bandasConfig[dimensionId][variableName]) {
                    missingVars.push(`${dimensionId}:${variableName}`);
                    allValid = false;
                }
            }
        });
    });

    if (!allValid) {
        console.error("Variables sin configuración de banda:", missingVars);
    } else {
        console.log("✅ Todas las variables tienen configuración de banda válida");
    }

    return allValid;
}

/**
 * Obtiene estadísticas de las variables seleccionadas
 */
function getSelectionStats() {
    const stats = {
        seguridad: { total: 0, selected: 0, weight: 0 },
        desarrollo: { total: 0, selected: 0, weight: 0 },
        gobernabilidad: { total: 0, selected: 0, weight: 0 }
    };

    ['seguridad', 'desarrollo', 'gobernabilidad'].forEach(dimensionId => {
        const variableCheckboxes = document.querySelectorAll(`.${dimensionId}-variable`);
        stats[dimensionId].total = variableCheckboxes.length;

        variableCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                stats[dimensionId].selected++;
                
                const variableName = checkbox.nextElementSibling?.textContent.trim();
                if (variableName && window.horizonte.bandasConfig[dimensionId][variableName]) {
                    stats[dimensionId].weight += window.horizonte.bandasConfig[dimensionId][variableName].peso;
                }
            }
        });
    });

    return stats;
}

// --- Event Listeners ---

// Escuchar cuando el sistema esté listo
window.addEventListener('horizonte:systemReady', function() {
    console.log("Evento horizonte:systemReady recibido en layer-connections.js");

    // Configurar las conexiones de checkboxes
    setupCheckboxConnections();

    // Validar configuración
    validateVariableConfiguration();

    // Sincronizar estado inicial
    setTimeout(syncCheckboxesWithSystem, 100);
});

// Función global para mostrar estadísticas (útil para debugging)
window.showSelectionStats = function() {
    const stats = getSelectionStats();
    console.table(stats);
    return stats;
};

// Event listener de respaldo por si el DOM carga antes que el sistema
document.addEventListener('DOMContentLoaded', () => {
    // Si el sistema ya está listo
    if (window.horizonte && window.horizonte.bandasConfig) {
        console.log("DOM cargado y sistema ya listo, configurando conexiones...");
        setupCheckboxConnections();
        setTimeout(syncCheckboxesWithSystem, 100);
    }
});