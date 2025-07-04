/**
 * team.js - Sistema de gestión de equipos
 * Horizonte: Juego de Estrategia
 */

// Módulo de gestión de equipos
HORIZONTE.team = (function() {
    // Estado del módulo
    let state = {
        teamName: "",
        teamCode: "",
        initialized: false
    };
    
    // Array de páginas donde el modal debe activarse
    const ELIGIBLE_PAGES = [
        'step2.html',
        'index.html',
        'step3.html',
        'step4.html',
        'step5.html',

    ];
    
    // Inicializar el módulo
    function init() {
        // Verificar si la página actual está en la lista de páginas elegibles
        const currentPage = window.location.pathname.split('/').pop();
        
        if (!ELIGIBLE_PAGES.includes(currentPage)) {
            return; // No hacer nada si no es una página elegible
        }
        
        // Comprobar si ya existe información de equipo en sessionStorage
        checkExistingTeam();
        
        // Si no hay equipo existente, mostrar el modal al cargar la página
        if (!state.initialized) {
            createModal();
            showModal();
        } else {
            // Si ya existe un equipo, actualizar la UI con la información
            updateTeamInfo();
        }
    }
    
    // Comprobar si ya existe información de equipo en sessionStorage
    function checkExistingTeam() {
        if (HORIZONTE.utils && HORIZONTE.utils.loadFromSession) {
            const teamInfo = HORIZONTE.utils.loadFromSession('teamInfo');
            if (teamInfo) {
                state.teamName = teamInfo.name;
                state.teamCode = teamInfo.code;
                state.initialized = true;
            }
        } else {
            // Fallback si utils no está disponible
            try {
                const savedTeam = sessionStorage.getItem('teamInfo');
                if (savedTeam) {
                    const teamInfo = JSON.parse(savedTeam);
                    state.teamName = teamInfo.name;
                    state.teamCode = teamInfo.code;
                    state.initialized = true;
                }
            } catch (error) {
                console.error('Error al cargar datos de equipo:', error);
            }
        }
    }
    
    // Crear el HTML del modal
    function createModal() {
        const modalHTML = `
            <div id="teamModal" class="team-modal">
                <div class="team-modal-content">
                    <div class="team-modal-header">
                        <h2>REGISTRO DE EQUIPO</h2>
                        <div class="team-modal-subtitle">HORIZONTE: Juego de Inversiones</div>
                    </div>
                    <div class="team-modal-body">
                        <div class="team-input-group">
                            <label for="teamName">NOMBRE DEL EQUIPO:</label>
                            <input type="text" id="teamName" placeholder="Ingrese nombre del equipo" maxlength="30">
                            <div class="input-help">Máximo 30 caracteres</div>
                        </div>
                        
                        <div class="team-input-group">
                            <div class="code-container">
                                <input type="hidden" id="teamCode" readonly>
                            </div>
                        </div>
                        
                       
                    </div>
                    <div class="team-modal-footer">
                        <button id="teamSubmit" class="military-button">CONFIRMAR Y COMENZAR RETO</button>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir a la página
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar eventos
        setupEventListeners();
        
        // Generar código inicial
        generateTeamCode();
    }
    
    // Configurar los event listeners para el modal
    function setupEventListeners() {
        // document.getElementById('regenerateCode').addEventListener('click', generateTeamCode);
        
        document.getElementById('teamSubmit').addEventListener('click', saveTeamInfo);
        
        // Validación para no permitir guardar sin nombre de equipo
        document.getElementById('teamName').addEventListener('input', () => {
            const submitBtn = document.getElementById('teamSubmit');
            if (document.getElementById('teamName').value.trim() === '') {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            } else {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }
        });
        
        // Disparar validación inicial
        document.getElementById('teamName').dispatchEvent(new Event('input'));
    }
    
    // Generar un código único para el equipo
    function generateTeamCode() {
        const now = new Date();
        const timestamp = now.getTime().toString().slice(-6); // Últimos 6 dígitos del timestamp
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4 dígitos aleatorios
        
        // Formatear como XXXX-XXXXXX
        state.teamCode = `${random}-${timestamp}`;
        
        // Actualizar el input
        document.getElementById('teamCode').value = state.teamCode;
        const codeInput = document.getElementById('teamCode');
        if (codeInput) {
            codeInput.value = state.teamCode;
        }
    }
    
    // Mostrar el modal
    function showModal() {
        const modal = document.getElementById('teamModal');
        modal.style.display = 'flex';
        
        // Animación de entrada
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transition = 'opacity 0.3s ease-in-out';
        }, 10);
        
        // Focus en el input de nombre
        setTimeout(() => {
            document.getElementById('teamName').focus();
        }, 300);
    }
    
    // Guardar la información del equipo
    function saveTeamInfo() {
        const teamNameInput = document.getElementById('teamName');
        const teamName = teamNameInput.value.trim();
        
        // Validar nombre de equipo
        if (teamName === '') {
            teamNameInput.style.borderColor = 'var(--error-color)';
            teamNameInput.focus();
            return;
        }
        
        // Guardar info
        state.teamName = teamName;
        state.initialized = true;
        
        // Guardar en sessionStorage
        const teamInfo = {
            name: state.teamName,
            code: state.teamCode,
            createdAt: new Date().toISOString()
        };
        
        if (HORIZONTE.utils && HORIZONTE.utils.saveToSession) {
            HORIZONTE.utils.saveToSession('teamInfo', teamInfo);
        } else {
            // Fallback si utils no está disponible
            try {
                sessionStorage.setItem('teamInfo', JSON.stringify(teamInfo));
            } catch (error) {
                console.error('Error al guardar datos de equipo:', error);
            }
        }
        
        // Cerrar modal con animación
        const modal = document.getElementById('teamModal');
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
            
            // Crear y mostrar el banner con la información del equipo
            updateTeamInfo();
            
            // Mostrar mensaje de éxito
            if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                HORIZONTE.utils.showStatusMessage("Equipo registrado con éxito", "success");
            }
        }, 300);
    }
    
    /**
     * Modificación de la función updateTeamInfo en team.js para arreglar problemas de visualización
     */

    // Esta función debe reemplazar la actual updateTeamInfo en team.js
    function updateTeamInfo() {
        // Verificar si ya existe el contenedor del encabezado
        let headerContainer = document.querySelector('.military-header-container');
        
        // Si no existe, necesitamos modificar la estructura del encabezado
        if (!headerContainer) {
            // Seleccionar el encabezado militar existente
            const militaryHeader = document.querySelector('.military-header');
            
            if (militaryHeader) {
                // Obtener el contenido actual del encabezado
                const headerContent = militaryHeader.querySelector('.military-header-content') 
                    ? militaryHeader.querySelector('.military-header-content').outerHTML 
                    : `<div class="military-header-content">
                        <div class="military-title">CENTRO DE COMANDO Y CONTROL</div>
                        <div class="military-subtitle">SIMULADOR DE INVERSIONES</div>
                    </div>`;
                
                // Crear un nuevo contenedor con estructura mejorada
                militaryHeader.innerHTML = `
                    <div class="military-header-container">
                        ${headerContent}
                        <div class="team-info-display">
                            <div class="team-info-block">
                                <div class="team-info-label">EQUIPO:</div>
                                <div class="team-info-value">${state.teamName}</div>
                                <div class="team-info-code">ID: ${state.teamCode}</div>
                            </div>
                            <button id="logoutButton" class="logout-button">ABANDONAR MISIÓN</button>
                        </div>
                    </div>
                `;
                
                // Configurar evento para el botón de logout
                const logoutButton = document.getElementById('logoutButton');
                if (logoutButton) {
                    logoutButton.addEventListener('click', logout);
                }
            }
        } else {
            // Si ya existe el contenedor, solo actualizamos la información del equipo
            let teamInfoDisplay = headerContainer.querySelector('.team-info-display');
            
            if (teamInfoDisplay) {
                // Remover el display actual y crear uno nuevo para evitar problemas de estilos
                teamInfoDisplay.remove();
                
                // Crear nuevo elemento
                const newTeamInfoDisplay = document.createElement('div');
                newTeamInfoDisplay.className = 'team-info-display';
                newTeamInfoDisplay.innerHTML = `
                    <div class="team-info-block">
                        <div class="team-info-label">EQUIPO:</div>
                        <div class="team-info-value">${state.teamName}</div>
                        <div class="team-info-code">ID: ${state.teamCode}</div>
                    </div>
                    <button id="logoutButton" class="logout-button">ABANDONAR</button>
                `;
                
                // Añadir al contenedor
                headerContainer.appendChild(newTeamInfoDisplay);
                
                // Configurar evento para el botón de logout
                const logoutButton = document.getElementById('logoutButton');
                if (logoutButton) {
                    logoutButton.addEventListener('click', logout);
                }
            } else {
                // Si existe el contenedor pero no la info del equipo, la añadimos
                const teamInfoHTML = `
                    <div class="team-info-display">
                        <div class="team-info-block">
                            <div class="team-info-label">EQUIPO:</div>
                            <div class="team-info-value">${state.teamName}</div>
                            <div class="team-info-code">ID: ${state.teamCode}</div>
                        </div>
                        <button id="logoutButton" class="logout-button">ABANDONAR</button>
                    </div>
                `;
                
                // Añadir al final del contenedor
                headerContainer.insertAdjacentHTML('beforeend', teamInfoHTML);
                
                // Configurar evento para el botón de logout
                const logoutButton = document.getElementById('logoutButton');
                if (logoutButton) {
                    logoutButton.addEventListener('click', logout);
                }
            }
        }
    }
    
    // Realizar el cierre de sesión (logout)
    function logout() {
        // Mostrar confirmación
        const confirmLogout = confirm("¿Está seguro que desea abandonar la misión? Se perderá toda la información del equipo.");
        
        if (confirmLogout) {
            // Eliminar datos del sessionStorage
            sessionStorage.removeItem('teamInfo');
            sessionStorage.removeItem('navigationState');
            sessionStorage.removeItem('lastStep');
            
            // NUEVO: Eliminar variables de geoproceso
            sessionStorage.removeItem('ciclo1_procesado');
            sessionStorage.removeItem('ciclo2_procesado');
            sessionStorage.removeItem('availableResources');
            
            // NUEVO: Limpiar todo el sessionStorage para asegurar un reinicio completo
            try {
                sessionStorage.clear();
                console.log("SessionStorage limpiado completamente");
            } catch (error) {
                console.error("Error al limpiar sessionStorage:", error);
            }
            
            // Mostrar mensaje de cierre
            if (HORIZONTE.utils && HORIZONTE.utils.showStatusMessage) {
                HORIZONTE.utils.showStatusMessage("Abandonando misión. Reiniciando sistema...", "warning");
            }
            
            // Redireccionar a la página inicial después de un breve retraso
            setTimeout(() => {
                window.location.href = 'step1.html';
            }, 1500);
        }
    }
    
    // API pública del módulo
    return {
        init,
        getTeamName: () => state.teamName,
        getTeamCode: () => state.teamCode,
        isInitialized: () => state.initialized
    };
})();

// Inicialización cuando el DOM está listo
document.addEventListener('horizonte:ready', function() {
    HORIZONTE.team.init();
});