// Script de inicialização do MongoDB
// Este script cria o banco de dados e configura os índices necessários

db = db.getSiblingDB("forumdb");

// Criar coleções e índices
db.createCollection("authenticatedusers");
db.createCollection("rooms");
db.createCollection("roomparticipants");
db.createCollection("usersessions");
db.createCollection("messages");

// Índices para performance
db.authenticatedusers.createIndex({ username: 1 }, { unique: true });
db.authenticatedusers.createIndex({ email: 1 }, { unique: true, sparse: true });

db.rooms.createIndex({ room_code: 1 }, { unique: true });
db.rooms.createIndex({ is_active: 1 });
db.rooms.createIndex({ owner_username: 1 });

db.roomparticipants.createIndex(
  { room_code: 1, username: 1 },
  { unique: true }
);
db.roomparticipants.createIndex({ username: 1 });
db.roomparticipants.createIndex({ room_code: 1 });

db.usersessions.createIndex({ session_token: 1 }, { unique: true });
db.usersessions.createIndex({ username: 1 });
db.usersessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

db.messages.createIndex({ room_code: 1, sent_at: 1 });
db.messages.createIndex({ username: 1 });

print("Banco de dados forumdb inicializado com sucesso!");
