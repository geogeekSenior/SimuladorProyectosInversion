/**
 * layer-connections.js - Conexión de checkboxes con capas del mapa
 * Complemento para HORIZONTE 2.0
 * Versión simplificada sin mapeo de respaldo.
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
 * Actualiza los checkboxes basado en qué capas están visibles actualmente
 */
function syncCheckboxesWithLayers() {
    if (!window.horizonte || !window.horizonte.layerByVariable) {
        console.warn("No hay capas cargadas para sincronizar checkboxes");
        return;
    }

    ['seguridad', 'desarrollo', 'gobernabilidad'].forEach(dimensionId => {
        // Asegurarse que el objeto de capas para la dimensión exista
        const dimensionLayersMap = window.horizonte.layerByVariable[dimensionId];
        if (!dimensionLayersMap) {
            console.warn(`No se encontró el mapa de capas para la dimensión '${dimensionId}' al sincronizar checkboxes.`);
            return; // Continuar con la siguiente dimensión
        }

        // Obtener todos los checkboxes para esta dimensión
        const variableCheckboxes = document.querySelectorAll(`.${dimensionId}-variable`);

        variableCheckboxes.forEach(checkbox => {
            if (!checkbox.nextElementSibling) return; // Saltar si no hay etiqueta de nombre

            const checkboxVarName = checkbox.nextElementSibling.textContent.trim();
            const layer = dimensionLayersMap[checkboxVarName]; // Buscar la capa por el nombre del checkbox

            if (layer && 'visible' in layer) {
                // Actualizar el estado del checkbox basado en la visibilidad de la capa
                // Solo actualizar si es diferente para evitar ciclos innecesarios
                if (checkbox.checked !== layer.visible) {
                     checkbox.checked = layer.visible;
                     // No disparamos evento aquí para evitar bucles, solo sincronizamos estado visual
                }
            } else {
                 // Si no encontramos la capa, asumimos que no está visible (o no cargó)
                 if (checkbox.checked !== false) {
                     checkbox.checked = false;
                 }
                 // console.log(`No se encontró capa o propiedad visible para ${checkboxVarName} al sincronizar.`);
            }
        });


        // Actualizar el estado del checkbox principal de la dimensión después de sincronizar los individuales
        updateDimensionCheckbox(dimensionId);
    });
     console.log("Sincronización de checkboxes con estado de capas completada.");
}


/**
 * Configura las conexiones entre checkboxes y capas
 */
function setupLayerCheckboxConnections() {
    // Verificar si las capas están cargadas
    if (!window.horizonte || !window.horizonte.layerByVariable) {
        console.warn("Las capas no están cargadas todavía. La configuración de conexiones se reintentará al recibir 'horizonte:layersLoaded'.");
        return;
    }

    // Solo registrar en consola, no mostrar en visor
    console.log("Configurando conexiones entre checkboxes y capas...");

    // Procesamos cada dimensión
    ['seguridad', 'desarrollo', 'gobernabilidad'].forEach(dimensionId => {
        const variableCheckboxes = document.querySelectorAll(`.${dimensionId}-variable`);

        variableCheckboxes.forEach((checkbox) => {
            // Obtener el nombre de la variable desde la etiqueta adyacente
             const variableNameElement = checkbox.nextElementSibling;
             if (!variableNameElement || !variableNameElement.classList.contains('variable-name')) {
                 console.warn("No se pudo encontrar el nombre de la variable para el checkbox:", checkbox.id);
                 return; // Saltar este checkbox si no tiene nombre asociado
             }
            const variableName = variableNameElement.textContent.trim();

            // Conectar el evento del checkbox con la visibilidad de la capa
            checkbox.addEventListener('calciteCheckboxChange', function(event) {
                const isChecked = event.target.checked;
                // Llamar a la función que cambia la visibilidad (esta ya no dispara applyWeights)
                toggleLayerVisibilityByCheckbox(dimensionId, variableName, isChecked);
                // El applyWeights se dispara globalmente desde script.js al detectar calciteCheckboxChange
            });

            // Verificar el estado inicial del checkbox y aplicarlo a la capa si ya está cargada
            // Esto asegura que si una capa carga como visible/invisible, el checkbox lo refleje
            // La función syncCheckboxesWithLayers se encarga mejor de esto después de que todo carga.
            /*
            if (window.horizonte.layerByVariable[dimensionId] && window.horizonte.layerByVariable[dimensionId][variableName]) {
                 const layer = window.horizonte.layerByVariable[dimensionId][variableName];
                 if ('visible' in layer && layer.visible !== checkbox.checked) {
                    toggleLayerVisibilityByCheckbox(dimensionId, variableName, checkbox.checked);
                 }
            }
            */
        });
    });

    console.log("Conexiones entre checkboxes y capas configuradas correctamente.");
}

/**
 * Cambia la visibilidad de una capa específica basado en el estado de su checkbox.
 * NO llama a applyWeightsToLayers, ya que se asume que esa función se llama
 * globalmente en respuesta al evento 'calciteCheckboxChange' en script.js.
 */
function toggleLayerVisibilityByCheckbox(dimensionId, variableName, isVisible) {
    // Verificar si tenemos el mapa de capas y la dimensión específica
    if (!window.horizonte || !window.horizonte.layerByVariable || !window.horizonte.layerByVariable[dimensionId]) {
        console.warn(`Mapa de capas para la dimensión '${dimensionId}' no disponible al intentar cambiar visibilidad de '${variableName}'.`);
        return false; // No se puede proceder
    }

    // Obtener la capa correspondiente directamente por nombre
    const layer = window.horizonte.layerByVariable[dimensionId][variableName];

    // Si encontramos la capa, cambiar su visibilidad
    if (layer) {
        // Comprobar si la capa tiene la propiedad 'visible' antes de asignarla
        if ('visible' in layer) {
             // Solo cambiar si el estado es diferente
             if (layer.visible !== isVisible) {
                 layer.visible = isVisible;
                 // console.log(`Visibilidad de capa '${variableName}' establecida a ${isVisible}`);
             }
             return true; // Se encontró y se estableció (o ya estaba) la visibilidad
        } else {
             console.warn(`La capa encontrada para '${variableName}' no tiene propiedad 'visible'.`, layer);
             return false; // La capa existe pero no se puede controlar su visibilidad
        }
    } else {
        // Si no se encontró la capa por nombre (puede pasar si aún no carga o hubo error al cargarla)
        // No mostramos advertencia aquí siempre, puede ser normal durante la carga inicial
        // console.log(`Capa no encontrada por nombre al intentar cambiar visibilidad: ${dimensionId} - ${variableName}`);
        return false; // No se encontró la capa
    }
}


// --- Event Listener para iniciar la configuración ---

// Escuchar el evento personalizado que dispara script.js cuando las capas terminan de cargarse
window.addEventListener('horizonte:layersLoaded', function() {
    console.log("Evento horizonte:layersLoaded recibido en layer-connections.js");

    // 1. Configurar los listeners de los checkboxes para que afecten a las capas
    setupLayerCheckboxConnections();

    // 2. Sincronizar el estado inicial de los checkboxes con la visibilidad real de las capas cargadas
    //    Usamos un pequeño retraso para asegurar que las capas estén completamente listas en el DOM/mapa.
    setTimeout(syncCheckboxesWithLayers, 500);
});

// Podríamos añadir un listener DOMContentLoaded por si acaso, aunque layersLoaded es más específico
/*
document.addEventListener('DOMContentLoaded', () => {
     // Si las capas ya están cargadas por alguna razón antes del evento
     if (window.horizonte && window.horizonte.layers) {
         console.log("DOM Cargado y capas ya existen, intentando configurar conexiones...");
         setupLayerCheckboxConnections();
         setTimeout(syncCheckboxesWithLayers, 500);
     }
});
*/