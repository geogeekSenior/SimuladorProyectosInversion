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

// Escuchar el evento cuando las capas estén cargadas
window.addEventListener('horizonte:layersLoaded', function() {
    console.log("Evento horizonte:layersLoaded recibido");
    setupLayerCheckboxConnections();
    
    // Sincronizar los checkboxes con el estado de las capas cargadas
    setTimeout(syncCheckboxesWithLayers, 500);
});/**
 * Actualiza los checkboxes basado en qué capas están visibles actualmente
 */
function syncCheckboxesWithLayers() {
    if (!window.horizonte || !window.horizonte.layerByVariable) {
        console.warn("No hay capas cargadas para sincronizar checkboxes");
        return;
    }
    
    ['seguridad', 'desarrollo', 'gobernabilidad'].forEach(dimensionId => {
        const dimensionLayers = window.horizonte.layerByVariable[dimensionId];
        
        for (const variableName in dimensionLayers) {
            const layer = dimensionLayers[variableName];
            if (!layer) continue;
            
            // Buscar el checkbox correspondiente
            const variableCheckboxes = document.querySelectorAll(`.${dimensionId}-variable`);
            
            for (const checkbox of variableCheckboxes) {
                const checkboxVarName = checkbox.nextElementSibling ? 
                    checkbox.nextElementSibling.textContent.trim() : '';
                
                if (checkboxVarName === variableName) {
                    // Actualizar el estado del checkbox sin disparar eventos
                    if (checkbox.checked !== layer.visible) {
                        checkbox.checked = layer.visible;
                    }
                    break;
                }
            }
        }
        
        // Actualizar el estado del checkbox principal
        updateDimensionCheckbox(dimensionId);
    });
}/**
 * layer-connections.js - Conexión de checkboxes con capas del mapa
 * Complemento para HORIZONTE 2.0
 */

// Mapeo de nombres de variables a índices
const variableLayerMapping = {
    seguridad: {
        'Instituciones de salud': 0,
        'Instituciones educativas': 1,
        'Censo': 2,
        'Comunidades étnicas': 3,
        'Reservas indígenas': 4,
        'Áreas protegidas': 5,
        'Límites administrativos': 6,
        'Desarrollo Turístico': 7
    },
    desarrollo: {
        'Acueducto y Alcantarillado': 0,
        'Energía Eléctrica': 1,
        'Alfabetismo': 2,
        'Nivel de Educación': 3,
        'Desnutrición aguda': 4,
        'Tasa de ocupación': 5,
        'Internet': 6,
        'Gas': 7,
        'Bajo peso al nacer': 8,
        'Cantidad de hoteles': 9
    },
    gobernabilidad: {
        'Instituciones de salud': 0,
        'Instituciones educativas': 1,
        'Censo': 2,
        'Comunidades étnicas': 3,
        'Reservas indígenas': 4,
        'Áreas protegidas': 5,
        'Límites administrativos': 6,
        'Desarrollo Turístico': 7
    }
};

/**
 * Configura las conexiones entre checkboxes y capas
 */
function setupLayerCheckboxConnections() {
    // Verificar si las capas están cargadas
    if (!window.horizonte || !window.horizonte.layerByVariable) {
        console.warn("Las capas no están cargadas todavía. Usaremos los eventos cuando estén disponibles.");
        return;
    }
    
    // Solo registrar en consola, no mostrar en visor
    console.log("Configurando conexiones entre checkboxes y capas...");
    
    // Procesamos cada dimensión
    ['seguridad', 'desarrollo', 'gobernabilidad'].forEach(dimensionId => {
        const variableCheckboxes = document.querySelectorAll(`.${dimensionId}-variable`);
        
        variableCheckboxes.forEach((checkbox, index) => {
            // Obtener el nombre de la variable
            const variableName = checkbox.nextElementSibling ? 
                checkbox.nextElementSibling.textContent.trim() : 
                `Variable ${index+1}`;
            
            // Conectar el evento del checkbox con la visibilidad de la capa
            checkbox.addEventListener('calciteCheckboxChange', function(event) {
                const isChecked = event.target.checked;
                toggleLayerVisibilityByCheckbox(dimensionId, variableName, isChecked);
            });
            
            // Verificar el estado inicial y aplicarlo
            if (checkbox.checked) {
                toggleLayerVisibilityByCheckbox(dimensionId, variableName, true);
            }
        });
    });
    
    console.log("Conexiones entre checkboxes y capas configuradas correctamente");
}

/**
 * Cambia la visibilidad de una capa a través de un checkbox
 * Esta versión no actualiza el UI porque es llamada desde el evento de checkbox
 */
function toggleLayerVisibilityByCheckbox(dimensionId, variableName, isVisible) {
    // Verificar si tenemos el mapa de capas
    if (!window.horizonte || !window.horizonte.layerByVariable) {
        console.warn("Las capas no están disponibles para", dimensionId, variableName);
        return false;
    }
    
    // Obtener la capa correspondiente
    const layer = window.horizonte.layerByVariable[dimensionId][variableName];
    
    // Si no se encuentra la capa, buscar por índice como respaldo
    if (!layer && variableLayerMapping[dimensionId] && 
        typeof variableLayerMapping[dimensionId][variableName] !== 'undefined') {
        
        const index = variableLayerMapping[dimensionId][variableName];
        const serviceDimension = window.horizonte.layers.filter(
            l => l.dimensionName === dimensionId
        );
        
        if (serviceDimension.length > index) {
            const layerByIndex = serviceDimension[index];
            if (layerByIndex) {
                console.log(`Capa encontrada por índice: ${dimensionId}[${index}]`);
                layerByIndex.visible = isVisible;
                return true;
            }
        }
        
        console.warn(`No se pudo encontrar la capa: ${dimensionId} - ${variableName}`);
        return false;
    }
    
    // Si encontramos la capa, cambiar su visibilidad
    if (layer) {
        layer.visible = isVisible;
        return true;
    } else {
        console.warn(`Capa no encontrada: ${dimensionId} - ${variableName}`);
        return false;
    }
}