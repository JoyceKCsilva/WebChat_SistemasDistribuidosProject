// Main page functionality with authentication
class MainApp {
    constructor() {
        this.user = null;
        this.rooms = [];
        this.init();
    }

    async init() {
        // Verificar autenticação
        if (!await this.checkAuth()) {
            window.location.href = '/login';
            return;
        }

        this.bindEvents();
        await this.loadUserRooms();
    }

    async checkAuth() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            return false;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.user = result.user;
                this.updateUserDisplay();
                return true;
            } else {
                // Token inválido
                this.clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Erro na verificação de autenticação:', error);
            this.clearAuth();
            return false;
        }
    }

    clearAuth() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('displayName');
    }

    updateUserDisplay() {
        const displayElement = document.getElementById('user-display-name');
        if (displayElement && this.user) {
            displayElement.textContent = `Olá, ${this.user.display_name}`;
        }
    }

    bindEvents() {
        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Criar sala
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.createRoom();
        });

        // Entrar em sala
        document.getElementById('join-room-btn').addEventListener('click', () => {
            this.joinRoom();
        });

        // Eventos de modal
        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modal-confirm').addEventListener('click', () => {
            this.confirmModalAction();
        });

        // Modal de código de sala
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.hideRoomCodeModal();
        });

        document.getElementById('enter-created-room-btn').addEventListener('click', () => {
            this.enterCreatedRoom();
        });

        document.getElementById('copy-code-btn').addEventListener('click', () => {
            this.copyRoomCode();
        });

        // Enter key handlers
        document.getElementById('room-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createRoom();
            }
        });

        document.getElementById('room-code').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });

        // Auto uppercase room code
        document.getElementById('room-code').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    async loadUserRooms() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/user/rooms', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.rooms = result.rooms || [];
                this.renderRooms();
            } else {
                this.showToast('Erro ao carregar salas', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar salas:', error);
            this.showToast('Erro de conexão ao carregar salas', 'error');
        }
    }

    renderRooms() {
        const roomsList = document.getElementById('rooms-list');
        
        if (this.rooms.length === 0) {
            roomsList.innerHTML = `
                <div class="empty-rooms">
                    <p>Você ainda não tem salas. Crie uma nova sala ou entre em uma existente!</p>
                </div>
            `;
            return;
        }

        roomsList.innerHTML = this.rooms.map(room => `
            <div class="room-card" data-room-code="${room.room_code}">
                <div class="room-card-header">
                    <h3 class="room-name">${this.escapeHtml(room.room_name)}</h3>
                    ${room.is_owner ? '<span class="room-owner-badge">Dono</span>' : ''}
                </div>
                <div class="room-code">Código: ${room.room_code}</div>
                <div class="room-info">
                    <small>Criada em: ${new Date(room.created_at).toLocaleDateString('pt-BR')}</small>
                </div>
                <div class="room-actions">
                    <button class="btn-small btn-enter" onclick="mainApp.enterRoom('${room.room_code}')">
                        Entrar
                    </button>
                    ${room.is_owner ? 
                        `<button class="btn-small btn-close" onclick="mainApp.confirmCloseRoom('${room.room_code}')">
                            Fechar Sala
                        </button>` :
                        `<button class="btn-small btn-leave" onclick="mainApp.confirmLeaveRoom('${room.room_code}')">
                            Sair da Sala
                        </button>`
                    }
                </div>
            </div>
        `).join('');
    }

    async createRoom() {
        const roomName = document.getElementById('room-name').value.trim();
        
        if (!roomName) {
            this.showToast('Por favor, digite um nome para a sala', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ roomName })
            });

            const result = await response.json();

            if (response.ok) {
                document.getElementById('room-name').value = '';
                this.showRoomCodeModal(result.roomCode);
                await this.loadUserRooms();
                this.showToast('Sala criada com sucesso!', 'success');
            } else {
                this.showToast(result.message || 'Erro ao criar sala', 'error');
            }
        } catch (error) {
            console.error('Erro ao criar sala:', error);
            this.showToast('Erro de conexão', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async joinRoom() {
        const roomCode = document.getElementById('room-code').value.trim().toUpperCase();
        
        if (!roomCode) {
            this.showToast('Por favor, digite o código da sala', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/rooms/${roomCode}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                // Entrar na sala
                window.location.href = `/room/${roomCode}`;
            } else {
                this.showToast(result.message || 'Erro ao entrar na sala', 'error');
            }
        } catch (error) {
            console.error('Erro ao entrar na sala:', error);
            this.showToast('Erro de conexão', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    enterRoom(roomCode) {
        window.location.href = `/room/${roomCode}`;
    }

    confirmLeaveRoom(roomCode) {
        const room = this.rooms.find(r => r.room_code === roomCode);
        this.showConfirmationModal(
            'Sair da Sala',
            `Tem certeza que deseja sair permanentemente da sala "${room?.room_name}"? Você precisará de um novo convite para voltar.`,
            () => this.leaveRoom(roomCode)
        );
    }

    confirmCloseRoom(roomCode) {
        const room = this.rooms.find(r => r.room_code === roomCode);
        this.showConfirmationModal(
            'Fechar Sala',
            `Tem certeza que deseja fechar permanentemente a sala "${room?.room_name}"? Esta ação não pode ser desfeita e todos os participantes perderão acesso.`,
            () => this.closeRoom(roomCode)
        );
    }

    async leaveRoom(roomCode) {
        this.showLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/rooms/${roomCode}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                await this.loadUserRooms();
                this.showToast('Saiu da sala com sucesso', 'success');
            } else {
                this.showToast(result.message || 'Erro ao sair da sala', 'error');
            }
        } catch (error) {
            console.error('Erro ao sair da sala:', error);
            this.showToast('Erro de conexão', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async closeRoom(roomCode) {
        this.showLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/rooms/${roomCode}/close`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                await this.loadUserRooms();
                this.showToast('Sala fechada com sucesso', 'success');
            } else {
                this.showToast(result.message || 'Erro ao fechar sala', 'error');
            }
        } catch (error) {
            console.error('Erro ao fechar sala:', error);
            this.showToast('Erro de conexão', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    logout() {
        this.clearAuth();
        window.location.href = '/login';
    }

    // Modal methods
    showConfirmationModal(title, message, onConfirm) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('confirmation-modal').classList.remove('hidden');
        
        this.pendingConfirmAction = onConfirm;
    }

    hideModal() {
        document.getElementById('confirmation-modal').classList.add('hidden');
        this.pendingConfirmAction = null;
    }

    confirmModalAction() {
        if (this.pendingConfirmAction) {
            this.pendingConfirmAction();
            this.pendingConfirmAction = null;
        }
        this.hideModal();
    }

    showRoomCodeModal(roomCode) {
        document.getElementById('generated-code').textContent = roomCode;
        document.getElementById('room-code-modal').classList.remove('hidden');
        this.generatedRoomCode = roomCode;
    }

    hideRoomCodeModal() {
        document.getElementById('room-code-modal').classList.add('hidden');
        this.generatedRoomCode = null;
    }

    enterCreatedRoom() {
        if (this.generatedRoomCode) {
            window.location.href = `/room/${this.generatedRoomCode}`;
        }
    }

    copyRoomCode() {
        const code = document.getElementById('generated-code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            this.showToast('Código copiado!', 'success');
        }).catch(() => {
            this.showToast('Erro ao copiar código', 'error');
        });
    }

    // Utility methods
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar a aplicação
let mainApp;
document.addEventListener('DOMContentLoaded', () => {
    mainApp = new MainApp();
});
