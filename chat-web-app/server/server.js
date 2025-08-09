const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const Database = require("./database/database");
const WebSocketMQTTBridge = require("./mqtt/websocketBridge");

const app = express();
const server = http.createServer(app);
const db = new Database();

// Inicializar bridge MQTT-WebSocket
const bridge = new WebSocketMQTTBridge();

// Configurações de middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP a cada 15 minutos
});
app.use(limiter);

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/uploads/"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limite
  },
  fileFilter: function (req, file, cb) {
    // Permitir apenas certos tipos de arquivo
    const allowedTypes =
      /jpeg|jpg|png|gif|mp4|mp3|wav|pdf|doc|docx|txt|webm|ogg|m4a/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    // Lista de MIME types permitidos
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/quicktime",
      "video/webm",
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
      "audio/mp4",
      "audio/m4a",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    const mimetypeAllowed = allowedMimeTypes.includes(file.mimetype);

    if (extname && (mimetypeAllowed || file.mimetype.startsWith("text/"))) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Tipo de arquivo não permitido! Tipos aceitos: imagens, vídeos, áudios (incluindo gravações), PDFs, documentos Word e arquivos de texto."
        )
      );
    }
  },
});

// Armazenamento de conexões WebSocket por sala
const roomConnections = new Map();

// Função para gerar código de sala único
function generateRoomCode() {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Rotas da API

// Criar nova sala
app.post("/api/rooms", async (req, res) => {
  try {
    const { roomName, createdBy } = req.body;
    const roomCode = generateRoomCode();

    const room = await db.createRoom(roomCode, roomName, createdBy);

    res.json({
      success: true,
      roomCode: roomCode,
      roomName: roomName,
      message: "Sala criada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao criar sala:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Verificar se sala existe
app.get("/api/rooms/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const room = await db.getRoomByCode(code);

    if (room) {
      res.json({
        success: true,
        room: room,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }
  } catch (error) {
    console.error("Erro ao buscar sala:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Buscar mensagens da sala
app.get("/api/rooms/:code/messages", async (req, res) => {
  try {
    const { code } = req.params;
    const messages = await db.getRoomMessages(code);

    res.json({
      success: true,
      messages: messages,
    });
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Buscar usuários da sala
app.get("/api/rooms/:code/users", async (req, res) => {
  try {
    const { code } = req.params;

    // Verificar se a sala existe
    const room = await db.getRoomByCode(code);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }

    // Buscar apenas usuários que estão realmente online (com conexões WebSocket ativas)
    const onlineUsers = [];
    if (roomConnections.has(code)) {
      const connections = roomConnections.get(code);
      connections.forEach((conn) => {
        if (conn.ws.readyState === 1) {
          // WebSocket.OPEN
          // Verificar se o usuário já não está na lista (evitar duplicatas)
          const existingUser = onlineUsers.find(
            (user) => user.username === conn.username
          );
          if (!existingUser) {
            onlineUsers.push({
              username: conn.username,
              is_online: true,
              room_code: code,
            });
          }
        }
      });
    }

    res.json({
      success: true,
      users: onlineUsers,
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Rota para status do sistema (incluindo MQTT)
app.get("/api/system/status", (req, res) => {
  try {
    const stats = bridge.getStats();
    res.json({
      success: true,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      },
      websocket: {
        totalConnections: stats.totalConnections,
        totalRooms: stats.totalRooms,
        rooms: stats.roomsDetail
      },
      mqtt: stats.mqttStatus
    });
  } catch (error) {
    console.error("Erro ao obter status do sistema:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao obter status do sistema"
    });
  }
});

// Upload de arquivos
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Nenhum arquivo enviado",
      });
    }

    const { roomCode, username, message } = req.body;

    // Usar mensagem personalizada se fornecida, caso contrário usar padrão
    const messageContent =
      message && message.trim()
        ? message.trim()
        : `Arquivo enviado: ${req.file.originalname}`;

    // Salvar informação do arquivo no banco
    await db.saveMessage(
      roomCode,
      username,
      "file",
      messageContent,
      `/uploads/${req.file.filename}`,
      req.file.originalname,
      req.file.size
    );

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
      },
      message: messageContent,
    });
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao fazer upload do arquivo",
    });
  }
});

// Configuração do WebSocket com MQTT Bridge
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Cliente conectado");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case "join_room":
          await handleJoinRoom(ws, data);
          break;

        case "send_message":
          await handleSendMessage(ws, data);
          break;

        case "leave_room":
          await handleLeaveRoom(ws, data);
          break;

        default:
          console.log("Tipo de mensagem desconhecido:", data.type);
      }
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
    }
  });

  ws.on("close", () => {
    console.log("Cliente desconectado");
    // Remover da lista de conexões
    for (const [roomCode, connections] of roomConnections.entries()) {
      const index = connections.findIndex((conn) => conn.ws === ws);
      if (index !== -1) {
        const connection = connections[index];
        connections.splice(index, 1);

        // Atualizar status do usuário no banco
        if (connection.username) {
          db.updateUserStatus(connection.username, roomCode, false);
        }

        // Notificar outros usuários
        broadcastToRoom(roomCode, {
          type: "user_left",
          username: connection.username,
        });

        break;
      }
    }
  });
});

async function handleJoinRoom(ws, data) {
  const { roomCode, username } = data;

  try {
    // Verificar se a sala existe
    const room = await db.getRoomByCode(roomCode);
    if (!room) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Sala não encontrada",
        })
      );
      return;
    }

    // Adicionar usuário à sala
    await db.addUser(username, roomCode);

    // Adicionar conexão WebSocket
    if (!roomConnections.has(roomCode)) {
      roomConnections.set(roomCode, []);
    }

    const userId = data.userId || uuidv4();
    roomConnections.get(roomCode).push({
      ws: ws,
      username: username,
      userId: userId
    });

    // Publicar evento de entrada via MQTT
    bridge.mqttService.publishRoomUserEvent(roomCode, 'join', {
      userId: userId,
      username: username
    });

    // Publicar analytics via MQTT
    bridge.mqttService.publishAnalytics({
      event: 'user_joined_room',
      roomId: roomCode,
      userId: userId,
      username: username
    });

    // Enviar histórico de mensagens
    const messages = await db.getRoomMessages(roomCode);
    ws.send(
      JSON.stringify({
        type: "message_history",
        messages: messages,
      })
    );

    // Notificar outros usuários
    broadcastToRoom(
      roomCode,
      {
        type: "user_joined",
        username: username,
      },
      ws
    );

    // Confirmar entrada na sala
    ws.send(
      JSON.stringify({
        type: "joined_room",
        roomCode: roomCode,
        roomName: room.room_name,
      })
    );
  } catch (error) {
    console.error("Erro ao entrar na sala:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Erro ao entrar na sala",
      })
    );
  }
}

async function handleSendMessage(ws, data) {
  const {
    roomCode,
    username,
    message,
    messageType = "text",
    filePath,
    fileName,
    fileSize,
  } = data;

  try {
    // Para mensagens de arquivo, não salvar novamente no banco (já foi salvo no upload)
    // Para mensagens de texto normais, salvar no banco
    if (messageType === "text") {
      await db.saveMessage(roomCode, username, messageType, message);
    }

    // Preparar dados para broadcast
    const broadcastData = {
      type: "new_message",
      username: username,
      message: message,
      messageType: messageType,
      timestamp: new Date().toISOString(),
    };

    // Adicionar informações do arquivo se for uma mensagem de arquivo
    if (messageType === "file" && filePath && fileName && fileSize) {
      broadcastData.filePath = filePath;
      broadcastData.fileName = fileName;
      broadcastData.fileSize = fileSize;
    }

    // Publicar via MQTT para outros serviços/microserviços
    if (messageType === "text") {
      bridge.mqttService.publishRoomMessage(roomCode, {
        id: data.id || uuidv4(),
        userId: data.userId || username,
        username: username,
        message: message,
        roomId: roomCode
      });
    } else if (messageType === "file") {
      bridge.mqttService.publishRoomMessage(roomCode, {
        id: data.id || uuidv4(),
        userId: data.userId || username,
        username: username,
        fileName: fileName,
        fileUrl: filePath,
        fileType: messageType,
        fileSize: fileSize,
        roomId: roomCode
      });
    }

    // Broadcast para todos na sala via WebSocket (mantendo compatibilidade)
    broadcastToRoom(roomCode, broadcastData);
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
  }
}

async function handleLeaveRoom(ws, data) {
  const { roomCode, username } = data;

  try {
    // Atualizar status no banco
    await db.updateUserStatus(username, roomCode, false);

    // Encontrar dados do usuário antes de remover
    let userId = null;
    if (roomConnections.has(roomCode)) {
      const connections = roomConnections.get(roomCode);
      const connectionIndex = connections.findIndex((conn) => conn.ws === ws);
      if (connectionIndex !== -1) {
        userId = connections[connectionIndex].userId;
        connections.splice(connectionIndex, 1);
      }
    }

    // Publicar evento de saída via MQTT
    if (userId) {
      bridge.mqttService.publishRoomUserEvent(roomCode, 'leave', {
        userId: userId,
        username: username
      });

      // Publicar analytics via MQTT
      bridge.mqttService.publishAnalytics({
        event: 'user_left_room',
        roomId: roomCode,
        userId: userId,
        username: username
      });
    }

    // Notificar outros usuários
    broadcastToRoom(roomCode, {
      type: "user_left",
      username: username,
    });
  } catch (error) {
    console.error("Erro ao sair da sala:", error);
  }
}

function broadcastToRoom(roomCode, message, excludeWs = null) {
  if (roomConnections.has(roomCode)) {
    const connections = roomConnections.get(roomCode);
    connections.forEach((connection) => {
      if (
        connection.ws !== excludeWs &&
        connection.ws.readyState === WebSocket.OPEN
      ) {
        connection.ws.send(JSON.stringify(message));
      }
    });
  }
}

// Servir página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Servir página da sala
app.get("/room/:code", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/room.html"));
});

const PORT = process.env.PORT || 8080;

// Inicializar bridge MQTT antes de iniciar o servidor
async function startServer() {
  try {
    console.log('🔄 Iniciando servidor...');
    
    // Tentar inicializar MQTT (não falha se não conseguir)
    try {
      await bridge.initialize();
      console.log('✅ Bridge MQTT-WebSocket inicializado');
    } catch (error) {
      console.warn('⚠️ Continuando sem MQTT:', error.message);
    }
    
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor do Fórum rodando em http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server is running on ws://localhost:${PORT}`);
      if (bridge.mqttService.isConnected) {
        console.log(`📡 MQTT Bridge ativo`);
      } else {
        console.log(`⚠️ MQTT não disponível - funcionando apenas com WebSocket`);
      }
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Fechando servidor...");
  await bridge.shutdown();
  db.close();
  process.exit(0);
});
