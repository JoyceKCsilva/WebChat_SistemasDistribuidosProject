const mongoose = require("mongoose");

// Schemas para MongoDB
const authenticatedUserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  display_name: String,
  created_at: { type: Date, default: Date.now },
  last_login: Date,
  is_active: { type: Boolean, default: true },
});

const roomSchema = new mongoose.Schema({
  room_code: { type: String, unique: true, required: true },
  room_name: { type: String, required: true },
  created_by: { type: String, required: true },
  owner_username: String,
  created_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true },
  is_permanent: { type: Boolean, default: true },
});

const roomParticipantSchema = new mongoose.Schema({
  room_code: { type: String, required: true },
  username: { type: String, required: true },
  joined_at: { type: Date, default: Date.now },
  last_seen: { type: Date, default: Date.now },
  is_online: { type: Boolean, default: true },
  is_permanent_member: { type: Boolean, default: false },
});

const userSessionSchema = new mongoose.Schema({
  username: { type: String, required: true },
  session_token: { type: String, unique: true, required: true },
  room_code: String,
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true },
  is_active: { type: Boolean, default: true },
});

const messageSchema = new mongoose.Schema({
  room_code: { type: String, required: true },
  username: { type: String, required: true },
  message_type: { type: String, default: "text" },
  content: { type: String, required: true },
  file_path: String,
  file_name: String,
  file_size: Number,
  sent_at: { type: Date, default: Date.now },
});

// Indexes compostos
roomParticipantSchema.index({ room_code: 1, username: 1 }, { unique: true });
messageSchema.index({ room_code: 1, sent_at: 1 });

class MongoDatabase {
  constructor() {
    this.AuthenticatedUser = mongoose.model(
      "AuthenticatedUser",
      authenticatedUserSchema
    );
    this.Room = mongoose.model("Room", roomSchema);
    this.RoomParticipant = mongoose.model(
      "RoomParticipant",
      roomParticipantSchema
    );
    this.UserSession = mongoose.model("UserSession", userSessionSchema);
    this.Message = mongoose.model("Message", messageSchema);

    this.connect();
  }

  async connect() {
    try {
      const mongoUri =
        process.env.MONGODB_URI ||
        "mongodb://admin:password123@localhost:27017/forumdb?authSource=admin";
      await mongoose.connect(mongoUri);
      console.log("Conectado ao MongoDB.");
    } catch (err) {
      console.error("Erro ao conectar com o MongoDB:", err.message);
      throw err;
    }
  }

  // Métodos para salas
  async createRoom(roomCode, roomName, createdBy, ownerUsername) {
    try {
      const room = new this.Room({
        room_code: roomCode,
        room_name: roomName,
        created_by: createdBy,
        owner_username: ownerUsername || createdBy,
      });

      const savedRoom = await room.save();
      return {
        id: savedRoom._id,
        roomCode,
        roomName,
        createdBy,
        ownerUsername: ownerUsername || createdBy,
      };
    } catch (err) {
      throw err;
    }
  }

  async getRoomByCode(roomCode) {
    try {
      const room = await this.Room.aggregate([
        { $match: { room_code: roomCode, is_active: true } },
        {
          $lookup: {
            from: "authenticatedusers",
            localField: "owner_username",
            foreignField: "username",
            as: "owner_info",
          },
        },
        {
          $addFields: {
            owner_display_name: {
              $ifNull: [
                { $arrayElemAt: ["$owner_info.display_name", 0] },
                "$created_by",
              ],
            },
            owner_username: { $ifNull: ["$owner_username", "$created_by"] },
          },
        },
        { $limit: 1 },
      ]);

      return room[0] || null;
    } catch (err) {
      throw err;
    }
  }

  // Métodos para usuários - mantendo compatibilidade
  async addUser(username, roomCode) {
    // Para compatibilidade, implementamos como addRoomParticipant
    return this.addRoomParticipant(roomCode, username, false);
  }

  async updateUserStatus(username, roomCode, isOnline) {
    try {
      await this.RoomParticipant.updateOne(
        { username, room_code: roomCode },
        {
          is_online: isOnline,
          last_seen: new Date(),
        }
      );
    } catch (err) {
      throw err;
    }
  }

  async getRoomUsers(roomCode) {
    try {
      const participants = await this.RoomParticipant.find(
        { room_code: roomCode },
        { username: 1, is_online: 1, last_seen: 1, _id: 0 }
      ).sort({ joined_at: 1 });

      return participants;
    } catch (err) {
      throw err;
    }
  }

  // Métodos para mensagens
  async saveMessage(
    roomCode,
    username,
    messageType,
    content,
    filePath = null,
    fileName = null,
    fileSize = null
  ) {
    try {
      const message = new this.Message({
        room_code: roomCode,
        username,
        message_type: messageType,
        content,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
      });

      const savedMessage = await message.save();
      return { id: savedMessage._id };
    } catch (err) {
      throw err;
    }
  }

  async getRoomMessages(roomCode, limit = 100) {
    try {
      const messages = await this.Message.find({ room_code: roomCode })
        .sort({ sent_at: 1 })
        .limit(limit)
        .lean();

      return messages;
    } catch (err) {
      throw err;
    }
  }

  // Métodos de autenticação
  async createUser(username, passwordHash, email = null, displayName = null) {
    try {
      const user = new this.AuthenticatedUser({
        username,
        password_hash: passwordHash,
        email,
        display_name: displayName || username,
      });

      const savedUser = await user.save();
      return {
        id: savedUser._id,
        username,
        displayName: displayName || username,
      };
    } catch (err) {
      throw err;
    }
  }

  async getUserByUsername(username) {
    try {
      const user = await this.AuthenticatedUser.findOne({
        username,
        is_active: true,
      }).lean();

      return user;
    } catch (err) {
      throw err;
    }
  }

  async updateLastLogin(username) {
    try {
      const result = await this.AuthenticatedUser.updateOne(
        { username },
        { last_login: new Date() }
      );

      return result.modifiedCount;
    } catch (err) {
      throw err;
    }
  }

  // Métodos de sessão
  async createSession(username, sessionToken, roomCode, expiresAt) {
    try {
      const session = new this.UserSession({
        username,
        session_token: sessionToken,
        room_code: roomCode,
        expires_at: expiresAt,
      });

      const savedSession = await session.save();
      return {
        id: savedSession._id,
        sessionToken,
      };
    } catch (err) {
      throw err;
    }
  }

  async getSessionByToken(sessionToken) {
    try {
      const session = await this.UserSession.findOne({
        session_token: sessionToken,
        is_active: true,
        expires_at: { $gt: new Date() },
      }).lean();

      return session;
    } catch (err) {
      throw err;
    }
  }

  async invalidateSession(sessionToken) {
    try {
      const result = await this.UserSession.updateOne(
        { session_token: sessionToken },
        { is_active: false }
      );

      return result.modifiedCount;
    } catch (err) {
      throw err;
    }
  }

  // Métodos de participantes
  async addRoomParticipant(roomCode, username, isPermanent = false) {
    try {
      const participant = await this.RoomParticipant.findOneAndUpdate(
        { room_code: roomCode, username },
        {
          room_code: roomCode,
          username,
          is_permanent_member: isPermanent,
          last_seen: new Date(),
          is_online: true,
        },
        { upsert: true, new: true }
      );

      return { id: participant._id };
    } catch (err) {
      throw err;
    }
  }

  async getRoomParticipants(roomCode) {
    try {
      const participants = await this.RoomParticipant.aggregate([
        { $match: { room_code: roomCode } },
        {
          $lookup: {
            from: "authenticatedusers",
            localField: "username",
            foreignField: "username",
            as: "user_info",
          },
        },
        {
          $match: {
            "user_info.is_active": true,
          },
        },
        {
          $addFields: {
            display_name: { $arrayElemAt: ["$user_info.display_name", 0] },
          },
        },
        {
          $project: {
            username: 1,
            room_code: 1,
            joined_at: 1,
            last_seen: 1,
            is_online: 1,
            is_permanent_member: 1,
            display_name: 1,
          },
        },
      ]);

      return participants;
    } catch (err) {
      throw err;
    }
  }

  async getUserRooms(username) {
    try {
      const rooms = await this.Room.aggregate([
        {
          $lookup: {
            from: "roomparticipants",
            let: { roomCode: "$room_code" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$room_code", "$$roomCode"] },
                      { $eq: ["$username", username] },
                    ],
                  },
                },
              },
            ],
            as: "participation",
          },
        },
        {
          $match: {
            $and: [
              { is_active: true },
              {
                $or: [
                  { "participation.is_permanent_member": true },
                  { owner_username: username },
                  { created_by: username },
                ],
              },
            ],
          },
        },
        {
          $addFields: {
            is_permanent_member: {
              $ifNull: [
                { $arrayElemAt: ["$participation.is_permanent_member", 0] },
                false,
              ],
            },
            last_seen: {
              $ifNull: [
                { $arrayElemAt: ["$participation.last_seen", 0] },
                "$created_at",
              ],
            },
            is_owner: {
              $cond: {
                if: {
                  $eq: [
                    { $ifNull: ["$owner_username", "$created_by"] },
                    username,
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
        },
        { $sort: { last_seen: -1 } },
      ]);

      return rooms;
    } catch (err) {
      throw err;
    }
  }

  async removeUserFromRoom(roomCode, username) {
    try {
      const result = await this.RoomParticipant.deleteOne({
        room_code: roomCode,
        username,
      });

      return result.deletedCount;
    } catch (err) {
      throw err;
    }
  }

  async deleteRoom(roomCode, ownerUsername) {
    try {
      const result = await this.Room.updateOne(
        {
          room_code: roomCode,
          $or: [
            { owner_username: ownerUsername },
            { created_by: ownerUsername },
          ],
        },
        { is_active: false }
      );

      return result.modifiedCount;
    } catch (err) {
      throw err;
    }
  }

  async updateRoomParticipantActivity(roomCode, username) {
    try {
      const result = await this.RoomParticipant.updateOne(
        { room_code: roomCode, username },
        {
          last_seen: new Date(),
          is_online: true,
        }
      );

      return result.modifiedCount;
    } catch (err) {
      throw err;
    }
  }

  async close() {
    try {
      await mongoose.connection.close();
      console.log("Conexão com o MongoDB fechada.");
    } catch (err) {
      console.error("Erro ao fechar conexão com o MongoDB:", err.message);
    }
  }
}

module.exports = MongoDatabase;
