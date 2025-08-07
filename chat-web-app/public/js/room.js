// JavaScript para a página da sala do fórum

class RoomChat {
  constructor() {
    this.roomCode = null;
    this.username = null;
    this.socket = null;
    this.selectedFile = null;

    // Propriedades para gravação de áudio
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingTimer = null;
    this.recordingStartTime = 0;
    this.recordedAudioBlob = null;

    this.initializeFromSession();
    this.initializeElements();
    this.attachEventListeners();
    this.connectWebSocket();
  }

  initializeFromSession() {
    // Recuperar dados da sessão
    this.roomCode = sessionStorage.getItem("roomCode");
    this.username = sessionStorage.getItem("username");

    // Verificar se temos os dados necessários
    if (!this.roomCode || !this.username) {
      // Redirecionar para a página inicial se não temos os dados
      window.location.href = "/";
      return;
    }

    // Também tentar obter do URL como fallback
    const urlPath = window.location.pathname;
    const urlRoomCode = urlPath.split("/").pop();
    if (urlRoomCode && !this.roomCode) {
      this.roomCode = urlRoomCode;
    }
  }

  initializeElements() {
    // Elementos do header
    this.roomNameElement = document.getElementById("room-name");
    this.roomCodeDisplay = document.getElementById("room-code-display");
    this.userCountElement = document.getElementById("user-count");
    this.copyRoomCodeBtn = document.getElementById("copy-room-code");
    this.leaveRoomBtn = document.getElementById("leave-room");

    // Elementos da sidebar
    this.usersList = document.getElementById("users-list");

    // Elementos de mensagens
    this.messagesContainer = document.getElementById("messages-container");
    this.loadingMessages = document.getElementById("loading-messages");
    this.messagesElement = document.getElementById("messages");

    // Elementos de input
    this.fileInput = document.getElementById("file-input");
    this.attachFileBtn = document.getElementById("attach-file-btn");
    this.filePreview = document.getElementById("file-preview");
    this.fileNameElement = document.getElementById("file-name");
    this.removeFileBtn = document.getElementById("remove-file");
    this.messageInput = document.getElementById("message-input");
    this.sendMessageBtn = document.getElementById("send-message-btn");

    // Elementos de áudio
    this.recordAudioBtn = document.getElementById("record-audio-btn");
    this.audioRecordingPreview = document.getElementById(
      "audio-recording-preview"
    );
    this.recordingTime = document.getElementById("recording-time");
    this.stopRecordingBtn = document.getElementById("stop-recording");
    this.cancelRecordingBtn = document.getElementById("cancel-recording");
    this.audioPreview = document.getElementById("audio-preview");
    this.audioPlayer = document.getElementById("audio-player");
    this.sendAudioBtn = document.getElementById("send-audio");
    this.reRecordAudioBtn = document.getElementById("re-record-audio");
    this.cancelAudioBtn = document.getElementById("cancel-audio");

    // Modal de confirmação
    this.leaveModal = document.getElementById("leave-modal");
    this.confirmLeaveBtn = document.getElementById("confirm-leave");
    this.cancelLeaveBtn = document.getElementById("cancel-leave");

    // Notificações
    this.notification = document.getElementById("notification");
    this.notificationText = document.getElementById("notification-text");
    this.closeNotificationBtn = document.getElementById("close-notification");

    // Atualizar UI inicial
    this.updateRoomInfo();
  }

  attachEventListeners() {
    // Eventos do header
    this.copyRoomCodeBtn.addEventListener("click", () => this.copyRoomCode());
    this.leaveRoomBtn.addEventListener("click", () => this.showLeaveModal());

    // Eventos de envio de mensagem
    this.sendMessageBtn.addEventListener("click", () => this.sendMessage());
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Eventos de arquivo
    this.attachFileBtn.addEventListener("click", () => this.fileInput.click());
    this.fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
    this.removeFileBtn.addEventListener("click", () =>
      this.removeSelectedFile()
    );

    // Eventos de áudio
    this.recordAudioBtn.addEventListener("click", () =>
      this.toggleAudioRecording()
    );
    this.stopRecordingBtn.addEventListener("click", () =>
      this.stopAudioRecording()
    );
    this.cancelRecordingBtn.addEventListener("click", () =>
      this.cancelAudioRecording()
    );
    this.sendAudioBtn.addEventListener("click", () => this.sendAudioMessage());
    this.reRecordAudioBtn.addEventListener("click", () =>
      this.startAudioRecording()
    );
    this.cancelAudioBtn.addEventListener("click", () => this.cancelAudio());

    // Eventos do modal
    this.confirmLeaveBtn.addEventListener("click", () => this.leaveRoom());
    this.cancelLeaveBtn.addEventListener("click", () => this.hideLeaveModal());

    // Notificações
    this.closeNotificationBtn.addEventListener("click", () =>
      this.hideNotification()
    );

    // Atualizar estado do botão enviar
    this.messageInput.addEventListener("input", () => this.updateSendButton());

    // Eventos de teclado
    this.setupKeyboardShortcuts();
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl+Enter para enviar mensagem
      if (e.ctrlKey && e.key === "Enter") {
        this.sendMessage();
      }

      // Escape para fechar modal
      if (e.key === "Escape") {
        this.hideLeaveModal();
      }
    });
  }

  updateRoomInfo() {
    if (this.roomCode) {
      this.roomCodeDisplay.textContent = this.roomCode;
      document.title = `Sala ${this.roomCode} - Fórum`;
    }
  }

  connectWebSocket() {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log("Conectado ao WebSocket");
      this.joinRoom();
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleWebSocketMessage(data);
    };

    this.socket.onclose = () => {
      console.log("Conexão WebSocket fechada");
      this.showNotification(
        "Conexão perdida. Tentando reconectar...",
        "warning"
      );

      // Tentar reconectar após 3 segundos
      setTimeout(() => {
        this.connectWebSocket();
      }, 3000);
    };

    this.socket.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
      this.showNotification("Erro de conexão", "error");
    };
  }

  joinRoom() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "join_room",
          roomCode: this.roomCode,
          username: this.username,
        })
      );
    }
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case "joined_room":
        this.onJoinedRoom(data);
        break;
      case "message_history":
        this.onMessageHistory(data);
        break;
      case "new_message":
        this.onNewMessage(data);
        break;
      case "user_joined":
        this.onUserJoined(data);
        break;
      case "user_left":
        this.onUserLeft(data);
        break;
      case "error":
        this.onError(data);
        break;
      default:
        console.log("Tipo de mensagem desconhecido:", data.type);
    }
  }

  onJoinedRoom(data) {
    this.roomNameElement.textContent = data.roomName || `Sala ${data.roomCode}`;
    this.showNotification("Conectado à sala com sucesso!", "success");
    this.loadRoomUsers();
  }

  onMessageHistory(data) {
    this.loadingMessages.classList.add("hidden");
    this.displayMessages(data.messages);
    this.scrollToBottom();
  }

  onNewMessage(data) {
    this.addMessage(data);
    this.scrollToBottom();
  }

  onUserJoined(data) {
    this.showNotification(`${data.username} entrou na sala`, "success");
    this.loadRoomUsers();
  }

  onUserLeft(data) {
    this.showNotification(`${data.username} saiu da sala`, "warning");
    this.loadRoomUsers();
  }

  onError(data) {
    this.showNotification(data.message, "error");
  }

  async loadRoomUsers() {
    try {
      console.log("Carregando usuários da sala:", this.roomCode);
      const response = await fetch(`/api/rooms/${this.roomCode}/users`);
      const data = await response.json();

      console.log("Resposta da API de usuários:", data);

      if (data.success) {
        this.updateUsersList(data.users);
      } else {
        console.error("Erro ao buscar usuários:", data.message);
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  }

  updateUsersList(users) {
    console.log("Atualizando lista de usuários:", users);
    this.usersList.innerHTML = "";
    this.userCountElement.textContent = users.length;

    console.log("Contador de usuários atualizado para:", users.length);

    users.forEach((user) => {
      const userElement = document.createElement("div");
      userElement.className = "user-item";
      userElement.innerHTML = `
                <div class="user-status ${
                  user.is_online ? "online" : "offline"
                }"></div>
                <span class="user-name">${user.username}</span>
            `;
      this.usersList.appendChild(userElement);
    });

    console.log("Lista de usuários atualizada com", users.length, "usuários");
  }

  displayMessages(messages) {
    this.messagesElement.innerHTML = "";
    messages.forEach((message) => {
      this.addMessage({
        username: message.username,
        message: message.content,
        messageType: message.message_type,
        timestamp: message.sent_at,
        filePath: message.file_path,
        fileName: message.file_name,
        fileSize: message.file_size,
      });
    });
  }

  addMessage(data) {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${
      data.username === this.username ? "sent" : "received"
    }`;

    if (data.messageType === "file") {
      messageElement.classList.add("file");
    }

    const timestamp = new Date(data.timestamp);
    const timeString = timestamp.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let content = `
            <div class="username">${data.username}</div>
            <div class="content">${data.message}</div>
        `;

    // Adicionar anexo se for um arquivo
    if (data.messageType === "file" && data.filePath) {
      const fileSize = this.formatFileSize(data.fileSize);
      const fileExtension = data.fileName.split(".").pop().toLowerCase();

      // Verificar pelo nome do arquivo se é áudio gravado
      const isRecordedAudio =
        data.fileName.startsWith("audio_") && fileExtension === "webm";
      const isAudio =
        ["mp3", "wav", "ogg", "m4a", "aac"].includes(fileExtension) ||
        isRecordedAudio;
      const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
        fileExtension
      );
      const isVideo =
        ["mp4", "avi", "mov", "mkv"].includes(fileExtension) ||
        (fileExtension === "webm" && !isRecordedAudio);
      const isPdf = fileExtension === "pdf";
      const isText = ["txt", "md", "log"].includes(fileExtension);

      if (isAudio) {
        // Anexo de áudio
        content += `
                <div class="audio-attachment">
                    <div class="audio-icon">🎵</div>
                    <audio controls preload="metadata">
                        <source src="${data.filePath}" type="audio/${
          fileExtension === "webm" ? "webm" : fileExtension
        }">
                        <source src="${data.filePath}" type="audio/mpeg">
                        <source src="${data.filePath}">
                        Seu navegador não suporta reprodução de áudio.
                    </audio>
                    <div class="audio-duration">${fileSize}</div>
                </div>
            `;
      } else if (isImage) {
        // Preview de imagem
        content += `
                <div class="image-attachment">
                    <img src="${data.filePath}" alt="${data.fileName}" 
                         onclick="openImageModal('${data.filePath}', '${data.fileName}')"
                         style="max-width: 300px; max-height: 200px; cursor: pointer; border-radius: 8px;">
                    <div class="file-info">
                        <div class="file-name">${data.fileName}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                </div>
            `;
      } else if (isVideo) {
        // Preview de vídeo
        content += `
                <div class="video-attachment">
                    <video controls preload="metadata" 
                           style="max-width: 300px; max-height: 200px; border-radius: 8px;">
                        <source src="${data.filePath}" type="video/${fileExtension}">
                        Seu navegador não suporta reprodução de vídeo.
                    </video>
                    <div class="file-info">
                        <div class="file-name">${data.fileName}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                </div>
            `;
      } else if (isPdf) {
        // Preview de PDF
        content += `
                <div class="document-attachment pdf" onclick="openDocument('${data.filePath}', '${data.fileName}')">
                    <div class="document-icon">📄</div>
                    <div class="file-info">
                        <div class="file-name">${data.fileName}</div>
                        <div class="file-size">${fileSize}</div>
                        <div class="file-type">Documento PDF</div>
                    </div>
                    <div class="document-action">👁️</div>
                </div>
            `;
      } else if (isText) {
        // Preview de texto
        content += `
                <div class="document-attachment text" onclick="openDocument('${data.filePath}', '${data.fileName}')">
                    <div class="document-icon">📝</div>
                    <div class="file-info">
                        <div class="file-name">${data.fileName}</div>
                        <div class="file-size">${fileSize}</div>
                        <div class="file-type">Arquivo de texto</div>
                    </div>
                    <div class="document-action">👁️</div>
                </div>
            `;
      } else {
        // Anexo de arquivo normal
        content += `
                <div class="file-attachment">
                    <div class="file-icon">${this.getFileIcon(
                      data.fileName
                    )}</div>
                    <div class="file-info">
                        <div class="file-name">${data.fileName}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                    <button class="file-download" onclick="window.open('${
                      data.filePath
                    }', '_blank')">
                        ⬇️
                    </button>
                </div>
            `;
      }
    }

    content += `<div class="time">${timeString}</div>`;

    messageElement.innerHTML = content;
    this.messagesElement.appendChild(messageElement);
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();

    console.log("=== SEND MESSAGE DEBUG ===");
    console.log("Texto da mensagem:", message);
    console.log("Arquivo selecionado:", this.selectedFile);
    console.log("Áudio gravado:", this.recordedAudioBlob);
    console.log(
      "Nome do arquivo:",
      this.selectedFile ? this.selectedFile.name : "nenhum"
    );

    if (!message && !this.selectedFile && !this.recordedAudioBlob) {
      console.log("Nenhum conteúdo para enviar");
      return;
    }

    try {
      // Se há um áudio gravado, enviar áudio
      if (this.recordedAudioBlob) {
        console.log("Enviando áudio gravado");
        await this.sendAudioMessage();
        return;
      }

      // Se há um arquivo selecionado, fazer upload primeiro
      if (this.selectedFile) {
        console.log("Enviando arquivo com texto:", message || "(sem texto)");
        await this.uploadFile();
        return; // O upload enviará a mensagem automaticamente
      }

      // Enviar mensagem de texto
      if (message && this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log("Enviando apenas texto:", message);
        this.socket.send(
          JSON.stringify({
            type: "send_message",
            roomCode: this.roomCode,
            username: this.username,
            message: message,
            messageType: "text",
          })
        );

        this.messageInput.value = "";
        this.updateSendButton();
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      this.showNotification("Erro ao enviar mensagem", "error");
    }
  }

  async uploadFile() {
    if (!this.selectedFile) {
      console.log("ERRO: uploadFile chamado mas selectedFile é null");
      return;
    }

    const messageText = this.messageInput.value.trim();

    console.log("=== UPLOAD FILE DEBUG ===");
    console.log("Arquivo:", this.selectedFile.name);
    console.log("Texto da mensagem:", messageText || "(vazio)");

    const formData = new FormData();
    formData.append("file", this.selectedFile);
    formData.append("roomCode", this.roomCode);
    formData.append("username", this.username);

    // Incluir o texto da mensagem se houver
    if (messageText) {
      formData.append("message", messageText);
      console.log("Texto adicionado ao FormData:", messageText);
    }

    try {
      this.sendMessageBtn.disabled = true;
      this.sendMessageBtn.textContent = "Enviando...";

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Resposta do upload:", data);

      if (data.success) {
        // Arquivo enviado com sucesso, agora enviar via WebSocket com todas as informações
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          console.log(
            "Enviando via WebSocket com informações completas do arquivo"
          );

          this.socket.send(
            JSON.stringify({
              type: "send_message",
              roomCode: this.roomCode,
              username: this.username,
              message: data.message, // Usar a mensagem retornada pelo servidor
              messageType: "file",
              filePath: data.file.path,
              fileName: data.file.originalname,
              fileSize: data.file.size,
            })
          );
        }

        this.removeSelectedFile();
        this.messageInput.value = "";
        this.showNotification("Arquivo enviado com sucesso!", "success");
      } else {
        this.showNotification(
          data.message || "Erro ao enviar arquivo",
          "error"
        );
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      this.showNotification("Erro ao enviar arquivo", "error");
    } finally {
      this.sendMessageBtn.disabled = false;
      this.sendMessageBtn.textContent = "Enviar";
      this.updateSendButton();
    }
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    console.log("=== FILE SELECT DEBUG ===");
    console.log("Arquivo selecionado:", file ? file.name : "nenhum");

    if (!file) return;

    // Verificar tamanho do arquivo (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      this.showNotification("Arquivo muito grande. Máximo 10MB.", "error");
      return;
    }

    this.selectedFile = file;
    console.log("selectedFile definido como:", this.selectedFile.name);
    this.showFilePreview(file);
    this.updateSendButton();
  }

  showFilePreview(file) {
    this.fileNameElement.textContent = `${file.name} (${this.formatFileSize(
      file.size
    )})`;
    this.filePreview.classList.remove("hidden");
  }

  removeSelectedFile() {
    console.log("=== REMOVE FILE DEBUG ===");
    console.log(
      "Removendo arquivo:",
      this.selectedFile ? this.selectedFile.name : "nenhum"
    );
    this.selectedFile = null;
    this.filePreview.classList.add("hidden");
    this.fileInput.value = "";
    this.updateSendButton();
    console.log("Arquivo removido, selectedFile agora é:", this.selectedFile);
  }

  updateSendButton() {
    const hasMessage = this.messageInput.value.trim().length > 0;
    const hasFile = this.selectedFile !== null;
    const hasAudio = this.recordedAudioBlob !== null;
    this.sendMessageBtn.disabled = !hasMessage && !hasFile && !hasAudio;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  getFileIcon(fileName) {
    const extension = fileName.split(".").pop().toLowerCase();

    const icons = {
      pdf: "📄",
      doc: "📝",
      docx: "📝",
      txt: "📄",
      jpg: "🖼️",
      jpeg: "🖼️",
      png: "🖼️",
      gif: "🖼️",
      mp4: "🎥",
      avi: "🎥",
      mov: "🎥",
      mp3: "🎵",
      wav: "🎵",
      ogg: "🎵",
      webm: "🎵", // Para áudios gravados
      m4a: "🎵",
    };

    return icons[extension] || "📎";
  }

  scrollToBottom() {
    this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
  }

  async copyRoomCode() {
    try {
      console.log("Tentando copiar código da sala:", this.roomCode);
      await navigator.clipboard.writeText(this.roomCode);
      this.showNotification("Código da sala copiado!", "success");
      console.log("Código copiado com sucesso!");
    } catch (error) {
      console.error("Erro ao copiar código:", error);

      // Fallback para navegadores que não suportam clipboard API
      try {
        const textArea = document.createElement("textarea");
        textArea.value = this.roomCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        this.showNotification("Código da sala copiado!", "success");
        console.log("Código copiado com fallback!");
      } catch (fallbackError) {
        console.error("Erro no fallback:", fallbackError);
        this.showNotification(
          "Não foi possível copiar o código. Código: " + this.roomCode,
          "error"
        );
      }
    }
  }

  showLeaveModal() {
    this.leaveModal.classList.add("show");
  }

  hideLeaveModal() {
    this.leaveModal.classList.remove("show");
  }

  leaveRoom() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "leave_room",
          roomCode: this.roomCode,
          username: this.username,
        })
      );
    }

    // Limpar dados da sessão
    sessionStorage.removeItem("roomCode");
    sessionStorage.removeItem("username");

    // Redirecionar para a página inicial
    window.location.href = "/";
  }

  showNotification(message, type = "success") {
    this.notificationText.textContent = message;
    this.notification.className = `notification ${type}`;
    this.notification.classList.remove("hidden");

    setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }

  hideNotification() {
    this.notification.classList.add("hidden");
  }

  // =================== MÉTODOS DE GRAVAÇÃO DE ÁUDIO ===================

  async toggleAudioRecording() {
    if (this.isRecording) {
      this.stopAudioRecording();
    } else {
      this.startAudioRecording();
    }
  }

  async startAudioRecording() {
    try {
      console.log("Iniciando gravação de áudio...");

      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.showNotification(
          "Seu navegador não suporta gravação de áudio",
          "error"
        );
        return;
      }

      // Solicitar permissão para usar o microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Limpar gravação anterior se existir
      this.recordedAudioBlob = null;
      this.audioChunks = [];

      // Configurar MediaRecorder
      const options = {
        mimeType: "audio/webm;codecs=opus",
      };

      // Fallback para outros formatos se webm não for suportado
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "audio/mp4";
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = "audio/wav";
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log("Gravação parada");
        this.recordedAudioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder.mimeType,
        });
        this.showAudioPreview();

        // Parar o stream do microfone
        stream.getTracks().forEach((track) => track.stop());
      };

      // Iniciar gravação
      this.mediaRecorder.start(100); // Capturar dados a cada 100ms
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      // Atualizar UI
      this.showRecordingUI();
      this.startRecordingTimer();

      console.log("Gravação iniciada com sucesso");
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);

      if (error.name === "NotAllowedError") {
        this.showNotification(
          "Permissão para usar o microfone negada",
          "error"
        );
      } else if (error.name === "NotFoundError") {
        this.showNotification("Nenhum microfone encontrado", "error");
      } else {
        this.showNotification("Erro ao acessar o microfone", "error");
      }
    }
  }

  stopAudioRecording() {
    if (this.mediaRecorder && this.isRecording) {
      console.log("Parando gravação...");
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.hideRecordingUI();
      this.stopRecordingTimer();
    }
  }

  cancelAudioRecording() {
    if (this.mediaRecorder && this.isRecording) {
      console.log("Cancelando gravação...");
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Parar o stream do microfone
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
    }

    this.hideRecordingUI();
    this.stopRecordingTimer();
    this.recordedAudioBlob = null;
    this.audioChunks = [];
    this.updateSendButton();
  }

  cancelAudio() {
    this.hideAudioPreview();
    this.recordedAudioBlob = null;
    this.audioChunks = [];
    this.updateSendButton();
  }

  showRecordingUI() {
    // Esconder outros previews
    this.filePreview.classList.add("hidden");
    this.audioPreview.classList.add("hidden");

    // Mostrar UI de gravação
    this.audioRecordingPreview.classList.remove("hidden");
    this.recordAudioBtn.classList.add("recording");
    this.recordAudioBtn.title = "Gravando... Clique para parar";
  }

  hideRecordingUI() {
    this.audioRecordingPreview.classList.add("hidden");
    this.recordAudioBtn.classList.remove("recording");
    this.recordAudioBtn.title = "Gravar áudio";
  }

  showAudioPreview() {
    // Esconder outros previews
    this.filePreview.classList.add("hidden");
    this.audioRecordingPreview.classList.add("hidden");

    // Mostrar preview do áudio
    this.audioPreview.classList.remove("hidden");

    // Configurar player de áudio
    const audioUrl = URL.createObjectURL(this.recordedAudioBlob);
    this.audioPlayer.src = audioUrl;

    this.updateSendButton();
  }

  hideAudioPreview() {
    this.audioPreview.classList.add("hidden");
    if (this.audioPlayer.src) {
      URL.revokeObjectURL(this.audioPlayer.src);
      this.audioPlayer.src = "";
    }
  }

  startRecordingTimer() {
    this.recordingTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      this.recordingTime.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }, 1000);
  }

  stopRecordingTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  async sendAudioMessage() {
    if (!this.recordedAudioBlob) {
      this.showNotification("Nenhum áudio para enviar", "error");
      return;
    }

    try {
      const messageText = this.messageInput.value.trim();

      // Criar um arquivo a partir do blob
      const audioFile = new File(
        [this.recordedAudioBlob],
        `audio_${Date.now()}.webm`,
        { type: this.recordedAudioBlob.type }
      );

      // Usar o mesmo sistema de upload de arquivos
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("roomCode", this.roomCode);
      formData.append("username", this.username);

      // Incluir mensagem se houver
      if (messageText) {
        formData.append("message", messageText);
      }

      this.sendMessageBtn.disabled = true;
      this.sendMessageBtn.textContent = "Enviando...";

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Enviar via WebSocket
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(
            JSON.stringify({
              type: "send_message",
              roomCode: this.roomCode,
              username: this.username,
              message: data.message,
              messageType: "file",
              filePath: data.file.path,
              fileName: data.file.originalname,
              fileSize: data.file.size,
            })
          );
        }

        this.cancelAudio();
        this.messageInput.value = "";
        this.showNotification("Áudio enviado com sucesso!", "success");
      } else {
        this.showNotification(data.message || "Erro ao enviar áudio", "error");
      }
    } catch (error) {
      console.error("Erro ao enviar áudio:", error);
      this.showNotification("Erro ao enviar áudio", "error");
    } finally {
      this.sendMessageBtn.disabled = false;
      this.sendMessageBtn.textContent = "Enviar";
      this.updateSendButton();
    }
  }
}

// Inicializar a aplicação da sala
document.addEventListener("DOMContentLoaded", () => {
  new RoomChat();
});

// Fechar modal ao clicar fora
document.addEventListener("click", (e) => {
  const modal = document.getElementById("leave-modal");
  if (e.target === modal) {
    modal.classList.remove("show");
  }
});

// =================== FUNÇÕES GLOBAIS PARA ANEXOS ===================

function openImageModal(imageSrc, imageName) {
  // Criar modal de imagem se não existir
  let imageModal = document.getElementById("image-modal");
  if (!imageModal) {
    imageModal = document.createElement("div");
    imageModal.id = "image-modal";
    imageModal.className = "image-modal";
    imageModal.innerHTML = `
      <div class="image-modal-content">
        <div class="image-modal-header">
          <span class="image-modal-title"></span>
          <button class="image-modal-close">&times;</button>
        </div>
        <div class="image-modal-body">
          <img class="image-modal-img" src="" alt="">
        </div>
        <div class="image-modal-footer">
          <button class="btn btn-primary" onclick="downloadFile()">Baixar</button>
        </div>
      </div>
    `;
    document.body.appendChild(imageModal);

    // Event listeners
    imageModal
      .querySelector(".image-modal-close")
      .addEventListener("click", closeImageModal);
    imageModal.addEventListener("click", (e) => {
      if (e.target === imageModal) closeImageModal();
    });
  }

  // Configurar modal
  imageModal.querySelector(".image-modal-title").textContent = imageName;
  imageModal.querySelector(".image-modal-img").src = imageSrc;
  imageModal.querySelector(".image-modal-img").alt = imageName;
  imageModal.dataset.downloadUrl = imageSrc;

  // Mostrar modal
  imageModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeImageModal() {
  const imageModal = document.getElementById("image-modal");
  if (imageModal) {
    imageModal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

function openDocument(docSrc, docName) {
  const fileExtension = docName.split(".").pop().toLowerCase();

  if (fileExtension === "pdf") {
    // Para PDFs, abrir em modal com iframe
    openPdfModal(docSrc, docName);
  } else if (["txt", "md", "log"].includes(fileExtension)) {
    // Para textos, carregar conteúdo e mostrar em modal
    openTextModal(docSrc, docName);
  } else {
    // Para outros tipos, abrir em nova aba
    window.open(docSrc, "_blank");
  }
}

function openPdfModal(pdfSrc, pdfName) {
  // Criar modal de PDF se não existir
  let pdfModal = document.getElementById("pdf-modal");
  if (!pdfModal) {
    pdfModal = document.createElement("div");
    pdfModal.id = "pdf-modal";
    pdfModal.className = "document-modal";
    pdfModal.innerHTML = `
      <div class="document-modal-content">
        <div class="document-modal-header">
          <span class="document-modal-title"></span>
          <div class="document-modal-actions">
            <button class="btn btn-secondary" onclick="downloadFile()">Baixar</button>
            <button class="document-modal-close">&times;</button>
          </div>
        </div>
        <div class="document-modal-body">
          <iframe class="document-iframe" src="" frameborder="0"></iframe>
        </div>
      </div>
    `;
    document.body.appendChild(pdfModal);

    // Event listeners
    pdfModal
      .querySelector(".document-modal-close")
      .addEventListener("click", closePdfModal);
    pdfModal.addEventListener("click", (e) => {
      if (e.target === pdfModal) closePdfModal();
    });
  }

  // Configurar modal
  pdfModal.querySelector(".document-modal-title").textContent = pdfName;
  pdfModal.querySelector(".document-iframe").src = pdfSrc;
  pdfModal.dataset.downloadUrl = pdfSrc;

  // Mostrar modal
  pdfModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closePdfModal() {
  const pdfModal = document.getElementById("pdf-modal");
  if (pdfModal) {
    pdfModal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

async function openTextModal(textSrc, textName) {
  try {
    // Carregar conteúdo do arquivo
    const response = await fetch(textSrc);
    const content = await response.text();

    // Criar modal de texto se não existir
    let textModal = document.getElementById("text-modal");
    if (!textModal) {
      textModal = document.createElement("div");
      textModal.id = "text-modal";
      textModal.className = "document-modal";
      textModal.innerHTML = `
        <div class="document-modal-content">
          <div class="document-modal-header">
            <span class="document-modal-title"></span>
            <div class="document-modal-actions">
              <button class="btn btn-secondary" onclick="downloadFile()">Baixar</button>
              <button class="document-modal-close">&times;</button>
            </div>
          </div>
          <div class="document-modal-body">
            <pre class="text-content"></pre>
          </div>
        </div>
      `;
      document.body.appendChild(textModal);

      // Event listeners
      textModal
        .querySelector(".document-modal-close")
        .addEventListener("click", closeTextModal);
      textModal.addEventListener("click", (e) => {
        if (e.target === textModal) closeTextModal();
      });
    }

    // Configurar modal
    textModal.querySelector(".document-modal-title").textContent = textName;
    textModal.querySelector(".text-content").textContent = content;
    textModal.dataset.downloadUrl = textSrc;

    // Mostrar modal
    textModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  } catch (error) {
    console.error("Erro ao carregar arquivo de texto:", error);
    // Fallback: abrir em nova aba
    window.open(textSrc, "_blank");
  }
}

function closeTextModal() {
  const textModal = document.getElementById("text-modal");
  if (textModal) {
    textModal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

function downloadFile() {
  // Descobrir qual modal está ativo e baixar o arquivo
  const activeModals = ["image-modal", "pdf-modal", "text-modal"];

  for (const modalId of activeModals) {
    const modal = document.getElementById(modalId);
    if (modal && modal.style.display === "flex") {
      const downloadUrl = modal.dataset.downloadUrl;
      if (downloadUrl) {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      break;
    }
  }
}

// Fechar modais com ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeImageModal();
    closePdfModal();
    closeTextModal();
  }
});
