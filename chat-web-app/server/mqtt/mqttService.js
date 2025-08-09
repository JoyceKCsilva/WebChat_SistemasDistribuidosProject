const mqtt = require('mqtt');
const { EventEmitter } = require('events');

class MQTTService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isConnected = false;
    this.mqttDisabled = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.subscribers = new Map();
    this.config = {
      host: process.env.MQTT_HOST || 'localhost',
      port: process.env.MQTT_PORT || 1883,
      username: process.env.MQTT_USERNAME || '',
      password: process.env.MQTT_PASSWORD || '',
      clientId: `forum-backend-${Date.now()}`,
      keepalive: 60,
      clean: true,
      reconnectPeriod: 5000,
    };
    
    // Tópicos MQTT
    this.topics = {
      ROOM_MESSAGES: 'forum/rooms/+/messages',
      ROOM_USERS: 'forum/rooms/+/users',
      ROOM_EVENTS: 'forum/rooms/+/events',
      SYSTEM_EVENTS: 'forum/system/events',
      FILE_UPLOADS: 'forum/files/uploads',
      ANALYTICS: 'forum/analytics',
    };
  }

  async connect() {
    try {
      const brokerUrl = `mqtt://${this.config.host}:${this.config.port}`;
      
      this.client = mqtt.connect(brokerUrl, {
        clientId: this.config.clientId,
        username: this.config.username,
        password: this.config.password,
        keepalive: this.config.keepalive,
        clean: this.config.clean,
        reconnectPeriod: this.config.reconnectPeriod,
        connectTimeout: 5000, // 5 segundos timeout
      });

      this.client.on('connect', () => {
        console.log('✅ Conectado ao broker MQTT');
        this.isConnected = true;
        this.subscribeToTopics();
        this.emit('connected');
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on('error', (error) => {
        console.warn('⚠️ MQTT não disponível:', error.message);
        this.isConnected = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('🚫 Máximo de tentativas de reconexão atingido. Desabilitando MQTT.');
          this.mqttDisabled = true;
          this.emit('fallback');
          if (this.client) {
            this.client.end(true);
            this.client = null;
          }
        }
        
        this.emit('error', error);
      });

      this.client.on('close', () => {
        console.log('🔌 Conexão MQTT fechada');
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.client.on('reconnect', () => {
        if (!this.mqttDisabled && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log('🔄 Tentando reconectar ao MQTT...');
          this.emit('reconnecting');
        } else if (this.client) {
          this.client.end(true);
          this.client = null;
        }
      });

      // Timeout para fallback se MQTT não conectar
      setTimeout(() => {
        if (!this.isConnected) {
          console.warn('⚠️ MQTT não conectou em 5s, continuando sem MQTT');
          this.emit('fallback');
        }
      }, 5000);

    } catch (error) {
      console.warn('⚠️ Erro ao conectar MQTT, continuando sem MQTT:', error.message);
      this.emit('fallback');
      // Não lançar erro
    }
  }

  subscribeToTopics() {
    if (!this.isConnected) return;

    // Subscribe a todos os tópicos definidos
    Object.values(this.topics).forEach(topic => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Erro ao subscrever ao tópico ${topic}:`, err);
        } else {
          console.log(`📡 Subscrito ao tópico: ${topic}`);
        }
      });
    });
  }

  handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      
      // Emitir evento baseado no tópico
      if (topic.includes('/messages')) {
        this.emit('roomMessage', { topic, payload });
      } else if (topic.includes('/users')) {
        this.emit('roomUsers', { topic, payload });
      } else if (topic.includes('/events')) {
        this.emit('roomEvents', { topic, payload });
      } else if (topic.includes('/system/')) {
        this.emit('systemEvent', { topic, payload });
      } else if (topic.includes('/files/')) {
        this.emit('fileEvent', { topic, payload });
      } else if (topic.includes('/analytics')) {
        this.emit('analytics', { topic, payload });
      }

      // Evento genérico para todos os tópicos
      this.emit('message', { topic, payload });
      
    } catch (error) {
      console.error('❌ Erro ao processar mensagem MQTT:', error);
    }
  }

  // Publicar mensagem em um tópico
  publish(topic, payload, options = { qos: 1, retain: false }) {
    if (this.mqttDisabled || !this.isConnected) {
      // Falhar silenciosamente quando MQTT está desabilitado
      return false;
    }

    try {
      const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
      
      this.client.publish(topic, message, options, (err) => {
        if (err) {
          console.error(`❌ Erro ao publicar no tópico ${topic}:`, err);
        } else {
          console.log(`📤 Mensagem publicada no tópico: ${topic}`);
        }
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao publicar mensagem MQTT:', error);
      return false;
    }
  }

  // Métodos específicos para diferentes tipos de eventos
  publishRoomMessage(roomId, messageData) {
    const topic = `forum/rooms/${roomId}/messages`;
    return this.publish(topic, {
      type: 'message',
      timestamp: new Date().toISOString(),
      data: messageData
    });
  }

  publishRoomUserEvent(roomId, eventType, userData) {
    const topic = `forum/rooms/${roomId}/users`;
    return this.publish(topic, {
      type: eventType, // 'join', 'leave', 'update'
      timestamp: new Date().toISOString(),
      data: userData
    });
  }

  publishRoomEvent(roomId, eventType, eventData) {
    const topic = `forum/rooms/${roomId}/events`;
    return this.publish(topic, {
      type: eventType,
      timestamp: new Date().toISOString(),
      data: eventData
    });
  }

  publishSystemEvent(eventType, eventData) {
    const topic = 'forum/system/events';
    return this.publish(topic, {
      type: eventType,
      timestamp: new Date().toISOString(),
      data: eventData
    });
  }

  publishFileUpload(fileData) {
    const topic = 'forum/files/uploads';
    return this.publish(topic, {
      type: 'file_upload',
      timestamp: new Date().toISOString(),
      data: fileData
    });
  }

  publishAnalytics(analyticsData) {
    const topic = 'forum/analytics';
    return this.publish(topic, {
      timestamp: new Date().toISOString(),
      data: analyticsData
    });
  }

  // Desconectar do broker MQTT
  async disconnect() {
    if (this.client && this.isConnected) {
      return new Promise((resolve) => {
        this.client.end(false, {}, () => {
          console.log('🔌 Desconectado do broker MQTT');
          this.isConnected = false;
          resolve();
        });
      });
    }
  }

  // Verificar status da conexão
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      disabled: this.mqttDisabled,
      reconnectAttempts: this.reconnectAttempts,
      clientId: this.config.clientId,
      host: this.config.host,
      port: this.config.port
    };
  }

  // Verificar se MQTT está disponível
  isAvailable() {
    return !this.mqttDisabled && this.isConnected;
  }
}

module.exports = MQTTService;
