const MongoDatabase = require("./mongoDatabase");

class DatabaseFactory {
  static create() {
    console.log(`🗄️  Inicializando banco de dados: MONGODB`);
    return new MongoDatabase();
  }
}

module.exports = DatabaseFactory;
