const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

class Database {
  constructor() {
    // Garantir que a pasta data/ existe
    const dataDir = path.join(__dirname, "../../data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log("Pasta data/ criada.");
    }
    
    const dbPath = path.join(__dirname, "../../data/forum.db");
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Erro ao conectar com o banco de dados:", err.message);
      } else {
        console.log("Conectado ao banco de dados SQLite.");
        this.initializeTables();
      }
    });
  }

  initializeTables() {
    // Tabela de usuários autenticados
    this.db.run(`
            CREATE TABLE IF NOT EXISTS authenticated_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT UNIQUE,
                display_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active BOOLEAN DEFAULT 1
            )
        `);

    // Tabela de salas
    this.db.run(`
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_code TEXT UNIQUE NOT NULL,
                room_name TEXT NOT NULL,
                created_by TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        `);

    // Adicionar colunas que podem estar faltando na tabela rooms
    this.db.run(`ALTER TABLE rooms ADD COLUMN owner_username TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.log('Coluna owner_username já existe ou erro:', err.message);
        }
    });

    this.db.run(`ALTER TABLE rooms ADD COLUMN is_permanent BOOLEAN DEFAULT 1`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.log('Coluna is_permanent já existe ou erro:', err.message);
        }
    });

    // Tabela de participantes das salas
    this.db.run(`
            CREATE TABLE IF NOT EXISTS room_participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_code TEXT NOT NULL,
                username TEXT NOT NULL,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_online BOOLEAN DEFAULT 1,
                is_permanent_member BOOLEAN DEFAULT 0,
                UNIQUE(room_code, username)
            )
        `);

    // Tabela de sessões ativas
    this.db.run(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                room_code TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                is_active BOOLEAN DEFAULT 1
            )
        `);

    // Tabela de mensagens
    this.db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_code TEXT NOT NULL,
                username TEXT NOT NULL,
                message_type TEXT DEFAULT 'text',
                content TEXT NOT NULL,
                file_path TEXT,
                file_name TEXT,
                file_size INTEGER,
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (room_code) REFERENCES rooms (room_code)
            )
        `);

    console.log("Tabelas do banco de dados inicializadas.");
  }

  // Métodos para salas
  createRoom(roomCode, roomName, createdBy, ownerUsername) {
    return new Promise((resolve, reject) => {
      // Primeiro tentar inserir com owner_username
      this.db.run(
        "INSERT INTO rooms (room_code, room_name, created_by, owner_username) VALUES (?, ?, ?, ?)",
        [roomCode, roomName, createdBy, ownerUsername || createdBy],
        function (err) {
          if (err) {
            // Se falhar, tentar sem owner_username (para compatibilidade com tabelas antigas)
            this.run(
              "INSERT INTO rooms (room_code, room_name, created_by) VALUES (?, ?, ?)",
              [roomCode, roomName, createdBy],
              function (err2) {
                if (err2) {
                  reject(err2);
                } else {
                  resolve({ id: this.lastID, roomCode, roomName, createdBy, ownerUsername: createdBy });
                }
              }
            );
          } else {
            resolve({ id: this.lastID, roomCode, roomName, createdBy, ownerUsername: ownerUsername || createdBy });
          }
        }
      );
    });
  }

  getRoomByCode(roomCode) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT r.*, 
                COALESCE(au.display_name, r.created_by) as owner_display_name,
                COALESCE(r.owner_username, r.created_by) as owner_username
         FROM rooms r 
         LEFT JOIN authenticated_users au ON COALESCE(r.owner_username, r.created_by) = au.username
         WHERE r.room_code = ? AND r.is_active = 1`,
        [roomCode],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  // Métodos para usuários
  addUser(username, roomCode) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT INTO users (username, room_code) VALUES (?, ?)",
        [username, roomCode],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, username, roomCode });
          }
        }
      );
    });
  }

  updateUserStatus(username, roomCode, isOnline) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE users SET is_online = ?, last_seen = CURRENT_TIMESTAMP WHERE username = ? AND room_code = ?",
        [isOnline, username, roomCode],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  getRoomUsers(roomCode) {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT username, is_online, last_seen FROM users WHERE room_code = ? ORDER BY joined_at",
        [roomCode],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // Métodos para mensagens
  saveMessage(
    roomCode,
    username,
    messageType,
    content,
    filePath = null,
    fileName = null,
    fileSize = null
  ) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO messages (room_code, username, message_type, content, file_path, file_name, file_size) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          roomCode,
          username,
          messageType,
          content,
          filePath,
          fileName,
          fileSize,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        }
      );
    });
  }

  getRoomMessages(roomCode, limit = 100) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM messages WHERE room_code = ? 
                 ORDER BY sent_at ASC LIMIT ?`,
        [roomCode, limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // Métodos de autenticação
  createUser(username, passwordHash, email = null, displayName = null) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT INTO authenticated_users (username, password_hash, email, display_name) VALUES (?, ?, ?, ?)",
        [username, passwordHash, email, displayName || username],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, username, displayName: displayName || username });
          }
        }
      );
    });
  }

  getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT * FROM authenticated_users WHERE username = ? AND is_active = 1",
        [username],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  updateLastLogin(username) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE authenticated_users SET last_login = CURRENT_TIMESTAMP WHERE username = ?",
        [username],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  // Métodos de sessão
  createSession(username, sessionToken, roomCode, expiresAt) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT INTO user_sessions (username, session_token, room_code, expires_at) VALUES (?, ?, ?, ?)",
        [username, sessionToken, roomCode, expiresAt],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, sessionToken });
          }
        }
      );
    });
  }

  getSessionByToken(sessionToken) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT * FROM user_sessions WHERE session_token = ? AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP",
        [sessionToken],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  invalidateSession(sessionToken) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE user_sessions SET is_active = 0 WHERE session_token = ?",
        [sessionToken],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  // Métodos de participantes
  addRoomParticipant(roomCode, username, isPermanent = false) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT OR REPLACE INTO room_participants (room_code, username, is_permanent_member, last_seen) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        [roomCode, username, isPermanent ? 1 : 0],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        }
      );
    });
  }

  getRoomParticipants(roomCode) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT rp.*, au.display_name 
         FROM room_participants rp 
         JOIN authenticated_users au ON rp.username = au.username 
         WHERE rp.room_code = ? AND au.is_active = 1`,
        [roomCode],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  getUserRooms(username) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT r.*, 
                COALESCE(rp.is_permanent_member, 0) as is_permanent_member, 
                COALESCE(rp.last_seen, r.created_at) as last_seen,
                CASE WHEN COALESCE(r.owner_username, r.created_by) = ? THEN 1 ELSE 0 END as is_owner
         FROM rooms r 
         LEFT JOIN room_participants rp ON r.room_code = rp.room_code AND rp.username = ?
         WHERE r.is_active = 1 AND (
           COALESCE(rp.is_permanent_member, 0) = 1 OR 
           COALESCE(r.owner_username, r.created_by) = ? OR
           r.created_by = ?
         )
         ORDER BY COALESCE(rp.last_seen, r.created_at) DESC`,
        [username, username, username, username],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  removeUserFromRoom(roomCode, username) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "DELETE FROM room_participants WHERE room_code = ? AND username = ?",
        [roomCode, username],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  deleteRoom(roomCode, ownerUsername) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE rooms SET is_active = 0 WHERE room_code = ? AND (owner_username = ? OR created_by = ?)",
        [roomCode, ownerUsername, ownerUsername],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  updateRoomParticipantActivity(roomCode, username) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE room_participants SET last_seen = CURRENT_TIMESTAMP, is_online = 1 WHERE room_code = ? AND username = ?",
        [roomCode, username],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error("Erro ao fechar o banco de dados:", err.message);
      } else {
        console.log("Conexão com o banco de dados fechada.");
      }
    });
  }
}

module.exports = Database;
