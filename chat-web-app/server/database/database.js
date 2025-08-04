const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class Database {
  constructor() {
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

    // Tabela de usuários
    this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                room_code TEXT NOT NULL,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_online BOOLEAN DEFAULT 1,
                FOREIGN KEY (room_code) REFERENCES rooms (room_code)
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
  createRoom(roomCode, roomName, createdBy) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT INTO rooms (room_code, room_name, created_by) VALUES (?, ?, ?)",
        [roomCode, roomName, createdBy],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, roomCode, roomName, createdBy });
          }
        }
      );
    });
  }

  getRoomByCode(roomCode) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT * FROM rooms WHERE room_code = ? AND is_active = 1",
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
