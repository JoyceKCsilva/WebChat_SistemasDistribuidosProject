# Migração Concluída para MongoDB

Este documento descreve a migração concluída do sistema de SQLite para MongoDB.

## 🎯 Status

✅ **MIGRAÇÃO CONCLUÍDA** - O sistema agora usa exclusivamente MongoDB

## 🛠️ Mudanças Implementadas

### Arquivos Removidos (Limpeza):

- `server/database/database.js` - Implementação SQLite
- `server/database/migration.js` - Script de migração
- `data/forum.db` - Banco SQLite (movido para backup)

### Arquivos Mantidos/Atualizados:

- `server/database/mongoDatabase.js` - Implementação MongoDB
- `server/database/databaseFactory.js` - Simplificado para MongoDB apenas
- `docker-compose.yml` - Com MongoDB
- `Dockerfile` - Otimizado para MongoDB
- `package.json` - Dependências MongoDB apenas

## 🚀 Como Usar

### Opção 1: Desenvolvimento Local

1. **Instalar dependências:**

```bash
npm install
```

2. **Configurar ambiente:**

```bash
cp .env.example .env
# Editar .env conforme necessário
```

3. **Iniciar MongoDB (Docker):**

```bash
docker run -d \
  --name forum-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  -e MONGO_INITDB_DATABASE=forumdb \
  mongo:7.0
```

4. **Executar aplicação:**

```bash
npm run dev
```

### Opção 2: Docker Compose (Recomendado)

1. **Iniciar todos os serviços:**

```bash
npm run docker:up
```

2. **Verificar logs:**

```bash
npm run docker:logs
```

3. **Parar serviços:**

```bash
npm run docker:down
```

## 🔄 Migração de Dados

### Migrar dados existentes do SQLite para MongoDB:

1. **Certificar que o MongoDB está rodando**

2. **Executar migração:**

```bash
npm run migrate
```

O script irá:

- Conectar aos dois bancos
- Migrar usuários, salas e mensagens
- Preservar relacionamentos e timestamps

## 🔧 Desenvolvimento

### Alternar entre SQLite e MongoDB

#### Usar SQLite (desenvolvimento local):

```bash
export DB_TYPE=sqlite
npm run dev
```

#### Usar MongoDB:

```bash
export DB_TYPE=mongodb
npm run dev
```

### Estrutura da Nova Implementação

#### DatabaseFactory

- Cria instância correta baseada em `DB_TYPE`
- Interface transparente para o restante da aplicação

#### MongoDatabase

- Implementa todos os métodos da interface original
- Usa Mongoose para ODM
- Schemas otimizados com índices
- Queries eficientes com aggregation

## 📊 Comparação de Performance

| Aspecto                 | SQLite        | MongoDB       |
| ----------------------- | ------------- | ------------- |
| **Escalabilidade**      | Arquivo local | Distribuído   |
| **Concorrência**        | Limitada      | Alta          |
| **Backup**              | Arquivo único | Dumps/Replica |
| **Consultas Complexas** | SQL           | Aggregation   |
| **Deploy**              | Simples       | Container     |

## 🔍 Monitoramento

### Verificar status dos containers:

```bash
docker ps
```

### Acessar MongoDB diretamente:

```bash
docker exec -it forum-mongodb mongosh -u admin -p password123 --authenticationDatabase admin
```

### Verificar logs da aplicação:

```bash
docker logs forum-app -f
```

## ⚠️ Troubleshooting

### Problemas Comuns

1. **Erro de conexão MongoDB:**

   - Verificar se container está rodando
   - Verificar string de conexão
   - Verificar credenciais

2. **Dados não migrados:**

   - Executar script de migração
   - Verificar se SQLite existe
   - Verificar logs de migração

3. **Performance lenta:**
   - Verificar índices MongoDB
   - Otimizar queries
   - Aumentar recursos do container

### Rollback para SQLite

Se necessário voltar para SQLite temporariamente:

1. **Parar containers:**

```bash
npm run docker:down
```

2. **Alterar configuração:**

```bash
export DB_TYPE=sqlite
```

3. **Executar aplicação:**

```bash
npm run dev
```

## 🎉 Benefícios da Migração

- ✅ **Escalabilidade**: Suporte a múltiplas instâncias
- ✅ **Performance**: Queries otimizadas e índices
- ✅ **Backup**: Sistema de backup robusto
- ✅ **Monitoring**: Ferramentas avançadas de monitoramento
- ✅ **Containerização**: Deploy simplificado
- ✅ **Desenvolvimento**: Ambiente isolado e reproduzível
