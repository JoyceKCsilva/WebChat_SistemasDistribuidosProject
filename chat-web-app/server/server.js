require("dotenv").config();
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const DatabaseFactory = require("./database/databaseFactory");
const WebSocketMQTTBridge = require("./mqtt/websocketBridge");

const app = express();
const server = http.createServer(app);
const db = DatabaseFactory.create();

// Inicializar bridge MQTT-WebSocket
const bridge = new WebSocketMQTTBridge();

// Configurações de middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Middleware para logar todas as requisições
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("📦 Body:", req.body);
  }
  next();
});

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

// Middleware de autenticação
function authenticateToken(req, res, next) {
  console.log("🔐 [AUTH] Verificando autenticação...");
  console.log("🔐 [AUTH] Headers:", req.headers);

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  console.log("🔐 [AUTH] Auth header:", authHeader);
  console.log("🔐 [AUTH] Token extraído:", token ? "Presente" : "Ausente");

  if (!token) {
    console.log("🔐 [AUTH] Token não fornecido");
    return res.status(401).json({ message: "Token de acesso requerido" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("🔐 [AUTH] Token inválido:", err.message);
      return res.status(403).json({ message: "Token inválido" });
    }
    console.log("🔐 [AUTH] Token válido, usuário:", user);
    req.user = user;
    next();
  });
}

// Função para gerar código de sala único
function generateRoomCode() {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Rotas de Autenticação

// Registro de usuário
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, email, displayName } = req.body;

    // Validações básicas
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Nome de usuário e senha são obrigatórios" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "A senha deve ter pelo menos 6 caracteres" });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res
        .status(400)
        .json({
          message:
            "Nome de usuário deve conter apenas letras, números e underscore",
        });
    }

    // Verificar se o usuário já existe
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Nome de usuário já está em uso" });
    }

    // Hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const user = await db.createUser(
      username,
      passwordHash,
      email,
      displayName
    );

    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso",
      user: {
        id: user.id,
        username: user.username,
        display_name: user.displayName,
      },
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Login de usuário
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Nome de usuário e senha são obrigatórios" });
    }

    // Buscar usuário
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    // Atualizar último login
    await db.updateLastLogin(username);

    // Gerar token JWT
    const token = jwt.sign(
      {
        username: user.username,
        displayName: user.display_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: "Login realizado com sucesso",
      token,
      user: {
        username: user.username,
        display_name: user.display_name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Verificar token
app.get("/api/auth/verify", authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({
      success: true,
      user: {
        username: user.username,
        display_name: user.display_name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erro na verificação:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Logout
app.post("/api/auth/logout", authenticateToken, (req, res) => {
  // No JWT, o logout é feito no cliente removendo o token
  res.json({ success: true, message: "Logout realizado com sucesso" });
});

// Obter salas do usuário
app.get("/api/user/rooms", authenticateToken, async (req, res) => {
  try {
    const rooms = await db.getUserRooms(req.user.username);
    res.json({ success: true, rooms });
  } catch (error) {
    console.error("Erro ao buscar salas do usuário:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rotas da API

// Criar nova sala
app.post("/api/rooms", authenticateToken, async (req, res) => {
  try {
    const { roomName } = req.body;
    const roomCode = generateRoomCode();
    const username = req.user.username;
    const displayName = req.user.displayName;

    const room = await db.createRoom(roomCode, roomName, displayName, username);

    // Adicionar o criador como participante permanente
    await db.addRoomParticipant(roomCode, username, true);

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

// Entrar em uma sala
app.post("/api/rooms/:code/join", authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const username = req.user.username;

    // Verificar se a sala existe
    const room = await db.getRoomByCode(code);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }

    // Adicionar usuário como participante permanente (ficará no histórico)
    await db.addRoomParticipant(code, username, true);

    res.json({
      success: true,
      message: "Entrou na sala com sucesso",
      room: room,
    });
  } catch (error) {
    console.error("Erro ao entrar na sala:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Sair permanentemente de uma sala
app.post("/api/rooms/:code/leave", authenticateToken, async (req, res) => {
  try {
    console.log("🚪 [LEAVE ROOM] Requisição recebida");
    console.log("🚪 [LEAVE ROOM] Parâmetros:", req.params);
    console.log("🚪 [LEAVE ROOM] Usuário:", req.user);

    const { code } = req.params;
    const username = req.user.username;

    console.log(
      `🚪 [LEAVE ROOM] Usuário ${username} tentando sair da sala ${code}`
    );

    // Verificar se a sala existe
    const room = await db.getRoomByCode(code);
    if (!room) {
      console.log("🚪 [LEAVE ROOM] Sala não encontrada");
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }

    console.log("🚪 [LEAVE ROOM] Sala encontrada:", room);

    // Verificar se é o dono da sala
    const isOwner =
      room.owner_username === username || room.created_by === username;
    console.log("🚪 [LEAVE ROOM] É proprietário?", isOwner);

    if (isOwner) {
      console.log(
        "🚪 [LEAVE ROOM] Proprietário não pode sair, deve fechar a sala"
      );
      return res.status(403).json({
        success: false,
        message:
          "O dono da sala não pode sair. Use a opção 'Fechar Sala' para encerrar definitivamente.",
      });
    }

    console.log("🚪 [LEAVE ROOM] Removendo usuário da sala...");
    // Remover usuário da sala
    await db.removeUserFromRoom(code, username);

    console.log("🚪 [LEAVE ROOM] Fazendo broadcast da lista de usuários...");
    // Fazer broadcast da lista atualizada de usuários
    await broadcastUsersList(code);

    console.log("🚪 [LEAVE ROOM] Usuário removido com sucesso");
    res.json({
      success: true,
      message: "Saiu da sala permanentemente",
    });
  } catch (error) {
    console.error("🚪 [LEAVE ROOM] Erro ao sair da sala:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Fechar sala (apenas para o dono)
app.post("/api/rooms/:code/close", authenticateToken, async (req, res) => {
  try {
    console.log("🔒 [CLOSE ROOM] Requisição recebida");
    console.log("🔒 [CLOSE ROOM] Parâmetros:", req.params);
    console.log("🔒 [CLOSE ROOM] Usuário:", req.user);

    const { code } = req.params;
    const username = req.user.username;

    console.log(
      `🔒 [CLOSE ROOM] Usuário ${username} tentando fechar a sala ${code}`
    );

    // Verificar se a sala existe
    const room = await db.getRoomByCode(code);
    console.log("🔒 [CLOSE ROOM] Sala encontrada:", room);
    if (!room) {
      console.log("🔒 [CLOSE ROOM] Sala não encontrada");
      return res.status(404).json({
        success: false,
        message: "Sala não encontrada",
      });
    }

    // Verificar se é o dono da sala
    const isOwner =
      room.owner_username === username || room.created_by === username;
    console.log(
      "[CLOSE ROOM] É proprietário?",
      isOwner,
      "| owner_username:",
      room.owner_username,
      "| created_by:",
      room.created_by
    );
    if (!isOwner) {
      console.log("[CLOSE ROOM] Usuário não é proprietário");
      return res.status(403).json({
        success: false,
        message: "Apenas o dono da sala pode fechá-la",
      });
    }

    console.log("[CLOSE ROOM] Notificando usuários da sala...");
    // Notificar todos os usuários que a sala foi fechada
    broadcastToRoom(code, {
      type: "room_closed",
      message: "Esta sala foi fechada pelo proprietário",
    });

    // Fechar todas as conexões WebSocket da sala
    if (roomConnections.has(code)) {
      const connections = roomConnections.get(code);
      console.log(
        "[CLOSE ROOM] Fechando",
        connections.size,
        "conexões WebSocket"
      );
      connections.forEach((connection) => {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(
            JSON.stringify({
              type: "room_closed",
              message: "Esta sala foi fechada pelo proprietário",
            })
          );
          connection.ws.close();
        }
      });
      roomConnections.delete(code);
    }

    console.log("[CLOSE ROOM] Deletando sala do banco de dados...");
    // Fechar sala no banco de dados
    const result = await db.deleteRoom(code, username);
    console.log("[CLOSE ROOM] Resultado da deleção:", result);

    console.log("[CLOSE ROOM] Sala fechada com sucesso");
    res.json({
      success: true,
      message: "Sala fechada com sucesso",
    });
  } catch (error) {
    console.error("[CLOSE ROOM] Erro ao fechar sala:", error);
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

    // Buscar todos os participantes da sala
    const participants = await db.getRoomParticipants(code);

    // Verificar status online para cada participante
    const onlineUsernames = new Set();
    if (roomConnections.has(code)) {
      const connections = roomConnections.get(code);
      connections.forEach((conn) => {
        if (conn.ws.readyState === 1) {
          // WebSocket.OPEN
          onlineUsernames.add(conn.username);
        }
      });
    }

    // Mapear participantes com status online/offline
    const users = participants.map((participant) => ({
      username: participant.username,
      display_name: participant.display_name || participant.username,
      is_online: onlineUsernames.has(participant.username),
      room_code: code,
      is_permanent_member: participant.is_permanent_member,
    }));

    res.json({
      success: true,
      users: users,
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
        timestamp: new Date().toISOString(),
      },
      websocket: {
        totalConnections: stats.totalConnections,
        totalRooms: stats.totalRooms,
        rooms: stats.roomsDetail,
      },
      mqtt: stats.mqttStatus,
    });
  } catch (error) {
    console.error("Erro ao obter status do sistema:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao obter status do sistema",
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

        // Fazer broadcast da lista atualizada de usuários
        broadcastUsersList(roomCode);

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

    // Adicionar usuário à sala (mantém compatibilidade)
    await db.addUser(username, roomCode);

    // Adicionar como participante permanente para aparecer no histórico
    await db.addRoomParticipant(roomCode, username, true);

    // Marcar usuário como online
    await db.updateUserStatus(username, roomCode, true);

    // Adicionar conexão WebSocket
    if (!roomConnections.has(roomCode)) {
      roomConnections.set(roomCode, []);
    }

    const userId = data.userId || uuidv4();
    roomConnections.get(roomCode).push({
      ws: ws,
      username: username,
      userId: userId,
    });

    // Publicar evento de entrada via MQTT
    bridge.mqttService.publishRoomUserEvent(roomCode, "join", {
      userId: userId,
      username: username,
    });

    // Publicar analytics via MQTT
    bridge.mqttService.publishAnalytics({
      event: "user_joined_room",
      roomId: roomCode,
      userId: userId,
      username: username,
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

    // Fazer broadcast da lista atualizada de usuários
    await broadcastUsersList(roomCode);
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
        roomId: roomCode,
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
        roomId: roomCode,
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
      bridge.mqttService.publishRoomUserEvent(roomCode, "leave", {
        userId: userId,
        username: username,
      });

      // Publicar analytics via MQTT
      bridge.mqttService.publishAnalytics({
        event: "user_left_room",
        roomId: roomCode,
        userId: userId,
        username: username,
      });
    }

    // Notificar outros usuários
    broadcastToRoom(roomCode, {
      type: "user_left",
      username: username,
    });

    // Fazer broadcast da lista atualizada de usuários
    await broadcastUsersList(roomCode);
  } catch (error) {
    console.error("Erro ao sair da sala:", error);
  }
}

function broadcastToRoom(roomCode, message, excludeWs = null) {
  if (roomConnections.has(roomCode)) {
    const connections = roomConnections.get(roomCode);
    connections.forEach((connection) => {
      if (
        connection.ws.readyState === WebSocket.OPEN &&
        (excludeWs === null || connection.ws !== excludeWs)
      ) {
        connection.ws.send(JSON.stringify(message));
      }
    });
  }
}

// Rota para página de login
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

// Servir página inicial (requer autenticação)
app.get("/", (req, res) => {
  // Em uma aplicação real, você verificaria o cookie/token aqui
  // Por enquanto, vamos servir a página e deixar o JavaScript do cliente verificar
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Servir página da sala (requer autenticação)
app.get("/room/:code", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/room.html"));
});

const PORT = process.env.PORT || 8080;

// Função para fazer broadcast da lista atualizada de usuários
async function broadcastUsersList(roomCode) {
  try {
    // Buscar todos os participantes da sala
    const participants = await db.getRoomParticipants(roomCode);

    // Verificar status online para cada participante
    const onlineUsernames = new Set();
    if (roomConnections.has(roomCode)) {
      const connections = roomConnections.get(roomCode);
      connections.forEach((conn) => {
        if (conn.ws.readyState === 1) {
          // WebSocket.OPEN
          onlineUsernames.add(conn.username);
        }
      });
    }

    // Mapear participantes com status online/offline
    const users = participants.map((participant) => ({
      username: participant.username,
      display_name: participant.display_name || participant.username,
      is_online: onlineUsernames.has(participant.username),
      room_code: roomCode,
      is_permanent_member: participant.is_permanent_member,
    }));

    // Fazer broadcast para todos os usuários da sala (incluindo o próprio usuário)
    broadcastToRoom(
      roomCode,
      {
        type: "users_list_updated",
        users: users,
      },
      null
    ); // null = não excluir ninguém
  } catch (error) {
    console.error("Erro ao fazer broadcast da lista de usuários:", error);
  }
}

// Inicializar bridge MQTT antes de iniciar o servidor
async function startServer() {
  try {
    console.log("🔄 Iniciando servidor...");

    // Tentar inicializar MQTT (não falha se não conseguir)
    try {
      await bridge.initialize();
      console.log("✅ Bridge MQTT-WebSocket inicializado");
    } catch (error) {
      console.warn("⚠️ Continuando sem MQTT:", error.message);
    }

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor do Fórum rodando em http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server is running on ws://localhost:${PORT}`);
      if (bridge.mqttService.isConnected) {
        console.log(`📡 MQTT Bridge ativo`);
      } else {
        console.log(
          `⚠️ MQTT não disponível - funcionando apenas com WebSocket`
        );
      }
    });
  } catch (error) {
    console.error("❌ Erro ao inicializar servidor:", error);
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
