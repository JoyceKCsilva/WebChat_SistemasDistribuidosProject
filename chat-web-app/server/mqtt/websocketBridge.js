const WebSocket = require('ws');
const MQTTService = require('./mqttService');

class WebSocketMQTTBridge {
  constructor() {
    this.mqttService = new MQTTService();
    this.rooms = new Map(); // roomId -> Set of WebSocket connections
    this.clients = new Map(); // WebSocket -> { roomId, userId, username }
    
    this.setupMQTTListeners();
  }

  async initialize() {
    try {
      await this.mqttService.connect();
      console.log('🌉 Bridge WebSocket-MQTT inicializado');
    } catch (error) {
      console.warn('🌉 Bridge inicializado sem MQTT:', error.message);
      // Não lançar erro, apenas continuar sem MQTT
    }
  }

  setupMQTTListeners() {
    // Escutar eventos de erro e não lançar exceção
    this.mqttService.on('error', (error) => {
      console.warn('⚠️ Erro MQTT no bridge:', error.message);
    });

    this.mqttService.on('fallback', () => {
      console.log('🔄 Sistema funcionando sem MQTT');
    });

    // Escutar mensagens de chat via MQTT
    this.mqttService.on('roomMessage', ({ topic, payload }) => {
      const roomId = this.extractRoomIdFromTopic(topic);
      if (roomId) {
        this.broadcastToRoom(roomId, {
          type: 'message',
          data: payload.data
        });
      }
    });

    // Escutar eventos de usuários via MQTT
    this.mqttService.on('roomUsers', ({ topic, payload }) => {
      const roomId = this.extractRoomIdFromTopic(topic);
      if (roomId) {
        this.broadcastToRoom(roomId, {
          type: 'userEvent',
          data: payload
        });
      }
    });

    // Escutar eventos da sala via MQTT
    this.mqttService.on('roomEvents', ({ topic, payload }) => {
      const roomId = this.extractRoomIdFromTopic(topic);
      if (roomId) {
        this.broadcastToRoom(roomId, {
          type: 'roomEvent',
          data: payload
        });
      }
    });

    // Escutar eventos do sistema via MQTT
    this.mqttService.on('systemEvent', ({ topic, payload }) => {
      this.broadcastToAll({
        type: 'systemEvent',
        data: payload
      });
    });
  }

  extractRoomIdFromTopic(topic) {
    const parts = topic.split('/');
    if (parts[0] === 'forum' && parts[1] === 'rooms' && parts[2]) {
      return parts[2];
    }
    return null;
  }

  handleWebSocketConnection(ws, roomId, userId, username) {
    // Registrar cliente
    this.clients.set(ws, { roomId, userId, username });
    
    // Adicionar à sala
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(ws);

    // Publicar evento de entrada do usuário via MQTT
    this.mqttService.publishRoomUserEvent(roomId, 'join', {
      userId,
      username,
      timestamp: new Date().toISOString()
    });

    console.log(`👤 Usuário ${username} entrou na sala ${roomId}`);

    // Configurar handlers para esta conexão
    ws.on('message', (message) => {
      this.handleWebSocketMessage(ws, message);
    });

    ws.on('close', () => {
      this.handleWebSocketDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ Erro WebSocket:', error);
      this.handleWebSocketDisconnection(ws);
    });

    // Enviar lista de usuários online para o novo usuário
    this.sendOnlineUsersToClient(ws, roomId);
  }

  handleWebSocketMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      const clientInfo = this.clients.get(ws);
      
      if (!clientInfo) {
        console.warn('⚠️ Cliente não registrado tentou enviar mensagem');
        return;
      }

      const { roomId, userId, username } = clientInfo;

      switch (data.type) {
        case 'message':
          this.handleChatMessage(roomId, userId, username, data);
          break;
        
        case 'file':
          this.handleFileMessage(roomId, userId, username, data);
          break;
        
        case 'audio':
          this.handleAudioMessage(roomId, userId, username, data);
          break;
        
        case 'typing':
          this.handleTypingEvent(roomId, userId, username, data);
          break;
        
        default:
          console.warn('⚠️ Tipo de mensagem desconhecida:', data.type);
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem WebSocket:', error);
    }
  }

  handleChatMessage(roomId, userId, username, data) {
    const messageData = {
      id: data.id,
      userId,
      username,
      message: data.message,
      timestamp: new Date().toISOString(),
      roomId
    };

    // Publicar via MQTT para outros serviços
    this.mqttService.publishRoomMessage(roomId, messageData);

    // Broadcast direto via WebSocket (para performance local)
    this.broadcastToRoom(roomId, {
      type: 'message',
      data: messageData
    }, ws); // Excluir o remetente

    // Analytics via MQTT
    this.mqttService.publishAnalytics({
      event: 'message_sent',
      roomId,
      userId,
      messageLength: data.message.length
    });
  }

  handleFileMessage(roomId, userId, username, data) {
    const fileData = {
      id: data.id,
      userId,
      username,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      fileSize: data.fileSize,
      timestamp: new Date().toISOString(),
      roomId
    };

    // Publicar via MQTT
    this.mqttService.publishRoomMessage(roomId, fileData);
    this.mqttService.publishFileUpload(fileData);

    // Broadcast via WebSocket
    this.broadcastToRoom(roomId, {
      type: 'file',
      data: fileData
    }, ws);

    // Analytics
    this.mqttService.publishAnalytics({
      event: 'file_shared',
      roomId,
      userId,
      fileType: data.fileType,
      fileSize: data.fileSize
    });
  }

  handleAudioMessage(roomId, userId, username, data) {
    const audioData = {
      id: data.id,
      userId,
      username,
      audioUrl: data.audioUrl,
      duration: data.duration,
      timestamp: new Date().toISOString(),
      roomId
    };

    // Publicar via MQTT
    this.mqttService.publishRoomMessage(roomId, audioData);

    // Broadcast via WebSocket
    this.broadcastToRoom(roomId, {
      type: 'audio',
      data: audioData
    }, ws);

    // Analytics
    this.mqttService.publishAnalytics({
      event: 'audio_sent',
      roomId,
      userId,
      duration: data.duration
    });
  }

  handleTypingEvent(roomId, userId, username, data) {
    // Eventos de digitação não são persistidos, apenas broadcast local
    this.broadcastToRoom(roomId, {
      type: 'typing',
      data: {
        userId,
        username,
        isTyping: data.isTyping
      }
    }, ws);
  }

  handleWebSocketDisconnection(ws) {
    const clientInfo = this.clients.get(ws);
    
    if (clientInfo) {
      const { roomId, userId, username } = clientInfo;
      
      // Remover da sala
      if (this.rooms.has(roomId)) {
        this.rooms.get(roomId).delete(ws);
        if (this.rooms.get(roomId).size === 0) {
          this.rooms.delete(roomId);
        }
      }
      
      // Remover do registro de clientes
      this.clients.delete(ws);
      
      // Publicar evento de saída via MQTT
      this.mqttService.publishRoomUserEvent(roomId, 'leave', {
        userId,
        username,
        timestamp: new Date().toISOString()
      });

      console.log(`👋 Usuário ${username} saiu da sala ${roomId}`);
      
      // Atualizar lista de usuários online
      this.updateOnlineUsersList(roomId);
    }
  }

  broadcastToRoom(roomId, message, excludeWs = null) {
    if (this.rooms.has(roomId)) {
      const messageStr = JSON.stringify(message);
      this.rooms.get(roomId).forEach(ws => {
        if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }

  broadcastToAll(message, excludeWs = null) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((clientInfo, ws) => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  sendOnlineUsersToClient(ws, roomId) {
    const users = this.getOnlineUsers(roomId);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'onlineUsers',
        data: { users }
      }));
    }
  }

  updateOnlineUsersList(roomId) {
    const users = this.getOnlineUsers(roomId);
    this.broadcastToRoom(roomId, {
      type: 'onlineUsers',
      data: { users }
    });
  }

  getOnlineUsers(roomId) {
    const users = [];
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).forEach(ws => {
        const clientInfo = this.clients.get(ws);
        if (clientInfo) {
          users.push({
            userId: clientInfo.userId,
            username: clientInfo.username
          });
        }
      });
    }
    return users;
  }

  // Método para obter estatísticas
  getStats() {
    return {
      totalConnections: this.clients.size,
      totalRooms: this.rooms.size,
      mqttStatus: this.mqttService.getConnectionStatus(),
      roomsDetail: Array.from(this.rooms.entries()).map(([roomId, connections]) => ({
        roomId,
        userCount: connections.size
      }))
    };
  }

  async shutdown() {
    console.log('🔄 Encerrando bridge WebSocket-MQTT...');
    
    // Fechar todas as conexões WebSocket
    this.clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    
    // Desconectar MQTT
    await this.mqttService.disconnect();
    
    console.log('✅ Bridge encerrado');
  }
}

module.exports = WebSocketMQTTBridge;
