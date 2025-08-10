// JavaScript para a página inicial do fórum

class ForumApp {
  constructor() {
    this.initializeElements();
    this.attachEventListeners();
  }

  initializeElements() {
    // Elementos do formulário de criar sala
    this.roomNameInput = document.getElementById("room-name");
    this.creatorNameInput = document.getElementById("creator-name");
    this.createRoomBtn = document.getElementById("create-room-btn");

    // Elementos do formulário de entrar na sala
    this.roomCodeInput = document.getElementById("room-code");
    this.userNameInput = document.getElementById("user-name");
    this.joinRoomBtn = document.getElementById("join-room-btn");

    // Elementos do modal
    this.roomCodeModal = document.getElementById("room-code-modal");
    this.generatedCodeSpan = document.getElementById("generated-code");
    this.copyCodeBtn = document.getElementById("copy-code-btn");
    this.enterCreatedRoomBtn = document.getElementById(
      "enter-created-room-btn"
    );
    this.closeModalBtn = document.getElementById("close-modal-btn");

    // Elementos de utilidade
    this.loadingSpinner = document.getElementById("loading-spinner");
    this.notification = document.getElementById("notification");
    this.notificationText = document.getElementById("notification-text");
    this.closeNotificationBtn = document.getElementById("close-notification");

    // Estado da aplicação
    this.currentRoomCode = null;
    this.currentUsername = null;
  }

  attachEventListeners() {
    // Eventos dos botões principais
    this.createRoomBtn.addEventListener("click", () => this.createRoom());
    this.joinRoomBtn.addEventListener("click", () => this.joinRoom());

    // Eventos do modal
    this.copyCodeBtn.addEventListener("click", () => this.copyRoomCode());
    this.enterCreatedRoomBtn.addEventListener("click", () =>
      this.enterCreatedRoom()
    );
    this.closeModalBtn.addEventListener("click", () => this.closeModal());

    // Eventos de notificação
    this.closeNotificationBtn.addEventListener("click", () =>
      this.hideNotification()
    );

    // Eventos de teclado
    this.setupKeyboardEvents();

    // Formatação automática do código da sala
    this.roomCodeInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    });
  }

  setupKeyboardEvents() {
    // Enter para criar sala
    [this.roomNameInput, this.creatorNameInput].forEach((input) => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.createRoom();
        }
      });
    });

    // Enter para entrar na sala
    [this.roomCodeInput, this.userNameInput].forEach((input) => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.joinRoom();
        }
      });
    });
  }

  async createRoom() {
    const roomName = this.roomNameInput.value.trim();
    const createdBy = this.creatorNameInput.value.trim();

    // Validação
    if (!roomName) {
      this.showNotification("Por favor, digite o nome da sala", "error");
      this.roomNameInput.focus();
      return;
    }

    if (!createdBy) {
      this.showNotification("Por favor, digite seu nome", "error");
      this.creatorNameInput.focus();
      return;
    }

    try {
      this.showLoading(true);

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomName: roomName,
          createdBy: createdBy,
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.currentRoomCode = data.roomCode;
        this.currentUsername = createdBy;
        this.showRoomCodeModal(data.roomCode);
        this.clearCreateRoomForm();
      } else {
        this.showNotification(data.message || "Erro ao criar sala", "error");
      }
    } catch (error) {
      console.error("Erro ao criar sala:", error);
      this.showNotification("Erro de conexão. Tente novamente.", "error");
    } finally {
      this.showLoading(false);
    }
  }

  async joinRoom() {
    const roomCode = this.roomCodeInput.value.trim();
    const username = this.userNameInput.value.trim();

    // Validação
    if (!roomCode) {
      this.showNotification("Por favor, digite o código da sala", "error");
      this.roomCodeInput.focus();
      return;
    }

    if (!username) {
      this.showNotification("Por favor, digite seu nome", "error");
      this.userNameInput.focus();
      return;
    }

    try {
      this.showLoading(true);

      // Verificar se a sala existe
      const response = await fetch(`/api/rooms/${roomCode}`);
      const data = await response.json();

      if (data.success) {
        // Sala existe, redirecionar para a página da sala
        this.navigateToRoom(roomCode, username);
      } else {
        this.showNotification(
          "Sala não encontrada. Verifique o código.",
          "error"
        );
      }
    } catch (error) {
      console.error("Erro ao verificar sala:", error);
      this.showNotification("Erro de conexão. Tente novamente.", "error");
    } finally {
      this.showLoading(false);
    }
  }

  showRoomCodeModal(roomCode) {
    this.generatedCodeSpan.textContent = roomCode;
    this.roomCodeModal.classList.add("show");
  }

  closeModal() {
    this.roomCodeModal.classList.remove("show");
  }

  async copyRoomCode() {
    try {
      await navigator.clipboard.writeText(this.currentRoomCode);
      this.showNotification(
        "Código copiado para a área de transferência!",
        "success"
      );
    } catch (error) {
      console.error("Erro ao copiar código:", error);
      // Fallback para navegadores mais antigos
      this.fallbackCopyToClipboard(this.currentRoomCode);
    }
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      this.showNotification(
        "Código copiado para a área de transferência!",
        "success"
      );
    } catch (error) {
      this.showNotification("Não foi possível copiar o código", "error");
    }

    document.body.removeChild(textArea);
  }

  enterCreatedRoom() {
    if (this.currentRoomCode && this.currentUsername) {
      this.navigateToRoom(this.currentRoomCode, this.currentUsername);
    }
  }

  navigateToRoom(roomCode, username) {
    // Salvar dados no sessionStorage para uso na página da sala
    sessionStorage.setItem("roomCode", roomCode);
    sessionStorage.setItem("username", username);

    // Redirecionar para a página da sala
    window.location.href = `/room/${roomCode}`;
  }

  clearCreateRoomForm() {
    this.roomNameInput.value = "";
    this.creatorNameInput.value = "";
  }

  showLoading(show) {
    if (show) {
      this.loadingSpinner.classList.remove("hidden");
    } else {
      this.loadingSpinner.classList.add("hidden");
    }
  }

  showNotification(message, type = "success") {
    this.notificationText.textContent = message;
    this.notification.className = `notification ${type}`;
    this.notification.classList.remove("hidden");

    // Auto-hide após 5 segundos
    setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }

  hideNotification() {
    this.notification.classList.add("hidden");
  }
}

// Inicializar a aplicação quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  new ForumApp();
});

// Fechar modal ao clicar fora dele
document.addEventListener("click", (e) => {
  const modal = document.getElementById("room-code-modal");
  if (e.target === modal) {
    modal.classList.remove("show");
  }
});
