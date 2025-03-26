/**
 * Sistema de creación y gestión de equipos para el Simulador de Inversiones de Proyectos Estratégicos
 * Permite la creación de un equipo con nombre personalizado y código único
 * Utiliza sessionStorage para mantener la persistencia de datos durante la sesión
 */

class TeamManager {
    constructor() {
        this.teamName = "";
        this.teamCode = "";
        this.initialized = false;
        
        // Comprobar si ya existe información de equipo en sessionStorage
        this.checkExistingTeam();
        
        // Si no hay equipo existente, mostrar el modal al cargar la página
        if (!this.initialized) {
            this.createModal();
            this.showModal();
        } else {
            // Si ya existe un equipo, actualizar la UI con la información
            this.updateTeamInfo();
        }
    }
    
    /**
     * Comprueba si ya existe información de equipo en sessionStorage
     */
    checkExistingTeam() {
        const savedTeam = sessionStorage.getItem('teamInfo');
        if (savedTeam) {
            const teamInfo = JSON.parse(savedTeam);
            this.teamName = teamInfo.name;
            this.teamCode = teamInfo.code;
            this.initialized = true;
        }
    }
    
    /**
     * Crea el HTML del modal
     */
    createModal() {
        const modalHTML = `
            <div id="teamModal" class="team-modal">
                <div class="team-modal-content">
                    <div class="team-modal-header">
                        <h2>REGISTRO DE EQUIPO ESTRATEGICO</h2>
                        <div class="team-modal-subtitle">Sistema de Inversiones Estratégicas</div>
                    </div>
                    <div class="team-modal-body">
                        <div class="team-input-group">
                            <label for="teamName">NOMBRE DEL EQUIPO:</label>
                            <input type="text" id="teamName" placeholder="Ingrese nombre del equipo" maxlength="30">
                            <div class="input-help">Máximo 30 caracteres</div>
                        </div>
                        
                        <div class="team-input-group">
                            <label for="teamCode">CÓDIGO DE IDENTIFICACIÓN:</label>
                            <div class="code-container">
                                <input type="text" id="teamCode" readonly>
                                <button id="regenerateCode" class="code-button" title="Generar nuevo código">↻</button>
                            </div>
                            <div class="input-help">Código generado automáticamente</div>
                        </div>
                        
                        <div class="team-instruction">
                            <div class="instruction-title">NOTA DE SEGURIDAD:</div>
                            Este código será utilizado para identificar su equipo durante toda la simulación. La sesión se mantendrá activa mientras no cierre el navegador o abandone la misión.
                        </div>
                    </div>
                    <div class="team-modal-footer">
                        <button id="teamSubmit" class="military-button">CONFIRMAR Y COMENZAR MISIÓN</button>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir a la página
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Generar código inicial
        this.generateTeamCode();
    }
    
    /**
     * Configura los event listeners para el modal
     */
    setupEventListeners() {
        document.getElementById('regenerateCode').addEventListener('click', () => {
            this.generateTeamCode();
        });
        
        document.getElementById('teamSubmit').addEventListener('click', () => {
            this.saveTeamInfo();
        });
        
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
    
    /**
     * Genera un código único para el equipo
     */
    generateTeamCode() {
        const now = new Date();
        const timestamp = now.getTime().toString().slice(-6); // Últimos 6 dígitos del timestamp
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4 dígitos aleatorios
        
        // Formatear como XXXX-XXXXXX
        this.teamCode = `${random}-${timestamp}`;
        
        // Actualizar el input
        document.getElementById('teamCode').value = this.teamCode;
    }
    
    /**
     * Muestra el modal
     */
    showModal() {
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
    
    /**
     * Guarda la información del equipo
     */
    saveTeamInfo() {
        const teamNameInput = document.getElementById('teamName');
        const teamName = teamNameInput.value.trim();
        
        // Validar nombre de equipo
        if (teamName === '') {
            teamNameInput.style.borderColor = 'var(--error-color, #AC1C1C)';
            teamNameInput.focus();
            return;
        }
        
        // Guardar info
        this.teamName = teamName;
        this.initialized = true;
        
        // Guardar en sessionStorage
        const teamInfo = {
            name: this.teamName,
            code: this.teamCode,
            createdAt: new Date().toISOString()
        };
        
        sessionStorage.setItem('teamInfo', JSON.stringify(teamInfo));
        
        // Cerrar modal con animación
        const modal = document.getElementById('teamModal');
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
            
            // Crear y mostrar el banner con la información del equipo
            this.updateTeamInfo();
            
            // Mostrar mensaje de éxito
            this.showStatusMessage("Equipo registrado con éxito", "success");
        }, 300);
    }
    
    /**
     * Actualiza la UI con la información del equipo
     */
    updateTeamInfo() {
        // Verificar si ya existe el contenedor del encabezado
        let headerContainer = document.querySelector('.military-header-container');
        
        // Si no existe, necesitamos modificar la estructura del encabezado
        if (!headerContainer) {
            // Seleccionar el encabezado militar existente
            const militaryHeader = document.querySelector('.military-header');
            
            if (militaryHeader) {
                // Obtener el contenido actual del encabezado
                const headerContent = militaryHeader.innerHTML;
                
                // Crear un nuevo contenedor
                militaryHeader.innerHTML = `
                    <div class="military-header-container">
                        <div class="military-header-content">
                            ${headerContent}
                        </div>
                        <div class="team-info-display">
                            <div class="team-info-block">
                                <div class="team-info-label">EQUIPO ESTRATEGICO:</div>
                                <div class="team-info-value">${this.teamName}</div>
                                <div class="team-info-code">ID: ${this.teamCode}</div>
                            </div>
                            <button id="logoutButton" class="logout-button">ABANDONAR MISIÓN</button>
                        </div>
                    </div>
                `;
                
                // Configurar evento para el botón de logout
                const logoutButton = document.getElementById('logoutButton');
                if (logoutButton) {
                    logoutButton.addEventListener('click', () => {
                        this.logout();
                    });
                }
            } else {
                // Si no hay encabezado militar, añadir un div al principio del body
                const headerDiv = document.createElement('div');
                headerDiv.className = 'military-header-container';
                headerDiv.style.position = 'relative';
                headerDiv.style.backgroundColor = '#0a0f14';
                headerDiv.style.padding = '10px';
                headerDiv.style.width = '100%';
                
                headerDiv.innerHTML = `
                    <div class="team-info-display">
                        <div class="team-info-block">
                            <div class="team-info-label">EQUIPO ESTRATEGICO:</div>
                            <div class="team-info-value">${this.teamName}</div>
                            <div class="team-info-code">ID: ${this.teamCode}</div>
                        </div>
                        <button id="logoutButton" class="logout-button">ABANDONAR MISIÓN</button>
                    </div>
                `;
                
                // Insertar al principio del body
                document.body.insertBefore(headerDiv, document.body.firstChild);
                
                // Configurar evento para el botón de logout
                const logoutButton = document.getElementById('logoutButton');
                if (logoutButton) {
                    logoutButton.addEventListener('click', () => {
                        this.logout();
                    });
                }
            }
        } else {
            // Si ya existe el contenedor, solo actualizamos la información del equipo
            const teamInfoDisplay = headerContainer.querySelector('.team-info-display');
            
            if (teamInfoDisplay) {
                teamInfoDisplay.innerHTML = `
                    <div class="team-info-block">
                        <div class="team-info-label">EQUIPO ESTRATEGICO:</div>
                        <div class="team-info-value">${this.teamName}</div>
                        <div class="team-info-code">ID: ${this.teamCode}</div>
                    </div>
                    <button id="logoutButton" class="logout-button">ABANDONAR MISIÓN</button>
                `;
                
                // Configurar evento para el botón de logout
                const logoutButton = document.getElementById('logoutButton');
                if (logoutButton) {
                    logoutButton.addEventListener('click', () => {
                        this.logout();
                    });
                }
            } else {
                // Si existe el contenedor pero no la info del equipo, la añadimos
                headerContainer.insertAdjacentHTML('beforeend', `
                    <div class="team-info-display">
                        <div class="team-info-block">
                            <div class="team-info-label">EQUIPO ESTRATEGICO:</div>
                            <div class="team-info-value">${this.teamName}</div>
                            <div class="team-info-code">ID: ${this.teamCode}</div>
                        </div>
                        <button id="logoutButton" class="logout-button">ABANDONAR MISIÓN</button>
                    </div>
                `);
                
                // Configurar evento para el botón de logout
                const logoutButton = document.getElementById('logoutButton');
                if (logoutButton) {
                    logoutButton.addEventListener('click', () => {
                        this.logout();
                    });
                }
            }
        }
    }
    
    /**
     * Realiza el cierre de sesión (logout)
     */
    logout() {
        // Mostrar confirmación
        const confirmLogout = confirm("¿Está seguro que desea abandonar la misión? Se perderá toda la información del equipo.");
        
        if (confirmLogout) {
            // Eliminar datos del sessionStorage
            sessionStorage.removeItem('teamInfo');
            
            // También eliminar otros datos si es necesario
            sessionStorage.removeItem('navigationState');
            sessionStorage.removeItem('lastStep');
            
            // Mostrar mensaje de cierre
            this.showStatusMessage("Abandonando misión. Reiniciando sistema...", "warning");
            
            // Redireccionar a la página inicial después de un breve retraso
            setTimeout(() => {
                window.location.href = 'step1.html';
            }, 1500);
        }
    }
    
    /**
     * Muestra un mensaje de estado temporal
     */
    showStatusMessage(mensaje, tipo) {
        // Usar la función existente en la aplicación si está disponible
        const statusMessage = document.getElementById('statusMessage');
        if (!statusMessage) return;
        
        statusMessage.textContent = mensaje;
        statusMessage.className = 'status-message';
        statusMessage.classList.add(`status-${tipo}`);
        statusMessage.style.opacity = '1';
        statusMessage.style.transform = 'translateY(0)';
        
        setTimeout(() => {
            statusMessage.style.opacity = '0';
            statusMessage.style.transform = 'translateY(20px)';
        }, 3000);
    }
}

// Inicializar el gestor de equipos cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    window.teamManager = new TeamManager();
});