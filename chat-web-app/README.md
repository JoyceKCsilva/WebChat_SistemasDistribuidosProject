# 🏛️ Fórum Web - Sistema de Chat Avançado com Salas

Sistema de fórum web moderno que permite criar salas privadas de chat em tempo real, com recursos avançados de mídia, upload de arquivos, gravação de áudio, visualização rica de anexos e gerenciamento de usuários online.

---

## ✨ Funcionalidades Principais

- **Chat em Tempo Real**: Mensagens instantâneas via WebSocket, histórico persistente em banco SQLite.
- **Comunicação Distribuída**: MQTT para integração com microserviços (opcional).
- **Salas Privadas**: Criação e entrada em salas por código único de 8 caracteres.
- **Upload de Arquivos**: Imagens, vídeos, áudios, PDFs, textos e outros (até 10MB).
- **Gravação de Áudio**: Grave e envie mensagens de áudio direto do navegador.
- **Visualização de Mídia**: Preview e modais para imagens, vídeos, áudios, PDFs e textos.
- **Lista de Usuários Online**: Sidebar mostra quem está conectado na sala.
- **Notificações Visuais**: Feedback para ações e erros.
- **Cópia de Código da Sala**: Botão para copiar o código e compartilhar.
- **Responsividade**: Interface adaptada para desktop e mobile.
- **Confirmação de Saída**: Modal para evitar saídas acidentais.
- **Analytics em Tempo Real**: Métricas via MQTT (quando disponível).
- **Fallback Gracioso**: Sistema funciona com ou sem MQTT.

---

## 🏗️ Estrutura do Projeto

```
chat-web-app/
├── server/
│   ├── server.js           # Servidor Express + WebSocket + MQTT
│   ├── websocket.js        # Lógica do WebSocket (legado)
│   ├── database/
│   │   └── database.js     # Métodos e config do SQLite
│   └── mqtt/
│       ├── mqttService.js      # Serviço principal MQTT
│       └── websocketBridge.js  # Bridge WebSocket-MQTT
├── public/
│   ├── index.html          # Página inicial (criar/entrar em salas)
│   ├── room.html           # Página da sala de chat
│   ├── css/
│   │   ├── main.css        # Estilos da página inicial
│   │   ├── style.css       # Estilos globais
│   │   └── room.css        # Estilos da sala (modais, anexos, áudio)
│   ├── js/
│   │   ├── main.js         # JS da página inicial
│   │   ├── room.js         # JS da sala (chat, anexos, áudio)
│   │   ├── chat.js         # (Reservado para lógica de chat)
│   │   └── client.js       # (Reservado para WebSocket client)
│   └── uploads/            # Arquivos enviados pelos usuários
│       └── .gitkeep
├── mosquitto/
│   ├── config/
│   │   └── mosquitto.conf  # Configuração do broker MQTT
│   ├── data/               # Dados persistentes do MQTT
│   └── log/                # Logs do broker
├── data/
│   └── forum.db            # Banco de dados SQLite
├── docker-compose.yml      # Orquestração Docker
├── Dockerfile              # Container da aplicação
├── .env.example            # Variáveis de ambiente
├── test-mqtt.js            # Script de teste MQTT
├── CHECKLIST-TESTES.md     # Checklist de validação
├── package.json            # Dependências e scripts
├── .gitignore
└── README.md
```

---

## 🚀 Como Executar

### 1. Pré-requisitos

**Essenciais:**
- Node.js 14+  
- NPM  
- Navegador moderno (suporte a WebRTC e MediaRecorder API)

**Opcionais (para MQTT):**
- Docker (recomendado) ou Mosquitto standalone
- Para funcionalidades distribuídas e microserviços

> 💡 **Instalação rápida do Docker:**
> - **Windows**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
> - **Linux**: `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh`
> - **macOS**: `brew install --cask docker`

### 2. Instalação

```bash
git clone https://github.com/JoyceKCsilva/WebChat_SistemasDistribuidosProject.git
cd WebChat_SistemasDistribuidosProject/chat-web-app
npm install
```

### 3. Executar o Projeto

#### 🐳 **Opção 1: Com Docker (Recomendado - Mais Simples)**

```bash
# Iniciar todos os serviços (aplicação + broker MQTT)
docker-compose up

# Ou em modo detached (segundo plano)
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Parar todos os serviços
docker-compose down
```

#### 🔧 **Opção 2: Modo Híbrido (MQTT via Docker + App Local)**

```bash
# 1. Iniciar apenas o broker MQTT via Docker
docker-compose up mosquitto -d

# 2. Em outro terminal, iniciar a aplicação Node.js
npm start  # Produção
npm run dev  # Desenvolvimento com auto-reload
```

> ⚠️ **Importante**: Se você executar apenas `npm start` sem o MQTT rodando, o sistema funcionará apenas com WebSocket (sem funcionalidades distribuídas).

#### ⚙️ **Opção 3: Sem Docker (Manual)**

```bash
# 1. Instalar e iniciar broker MQTT (Eclipse Mosquitto)
# Windows (via Chocolatey): choco install mosquitto
# Linux: sudo apt-get install mosquitto mosquitto-clients
# macOS: brew install mosquitto

# 2. Iniciar o broker MQTT
mosquitto -c mosquitto/config/mosquitto.conf

# 3. Em outro terminal, iniciar a aplicação
npm start  # Produção
npm run dev  # Desenvolvimento
```

### 4. Acessar a Aplicação

Abra [http://localhost:8080](http://localhost:8080) no navegador.

**APIs de Monitoramento:**
- Status do sistema: [http://localhost:8080/api/system/status](http://localhost:8080/api/system/status)

### 🔧 Resolução de Problemas Comuns

#### ⚠️ "MQTT não disponível - funcionando apenas com WebSocket"

**Problema**: O servidor Node.js não consegue conectar ao broker MQTT.

**Solução**:
```bash
# Verificar se o container MQTT está rodando
docker ps

# Se não estiver, iniciar o Mosquitto
docker-compose up mosquitto -d

# Reiniciar o servidor Node.js
# Parar o processo atual (Ctrl+C) e executar:
npm start
```

#### 🐳 Docker não está instalado

**Windows**: Baixe o [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**macOS**:
```bash
brew install --cask docker
```

#### 🔌 Porta 8080 já está em uso

```bash
# Encontrar processo usando a porta
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Linux/macOS

# Matar processo se necessário
taskkill /F /PID <PID>        # Windows
kill -9 <PID>                # Linux/macOS
```

---

## 🔧 Configuração MQTT

O sistema usa MQTT para comunicação entre microserviços. As configurações podem ser ajustadas via variáveis de ambiente:

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações MQTT
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

### Tópicos MQTT Utilizados

- `forum/rooms/+/messages` - Mensagens de chat
- `forum/rooms/+/users` - Eventos de usuários (entrada/saída)
- `forum/rooms/+/events` - Eventos da sala
- `forum/system/events` - Eventos do sistema
- `forum/files/uploads` - Upload de arquivos
- `forum/analytics` - Dados analíticos

### Scripts Disponíveis

```bash
# Iniciar em produção
npm start

# Desenvolvimento com auto-reload
npm run dev

# Testar conexão MQTT
npm run test-mqtt
```

---

## 📋 Como Usar

### 🆕 Criar uma Nova Sala

1. Preencha o nome da sala e seu nome na página inicial.
2. Clique em "Criar Sala".
3. Um código único será gerado.
4. Compartilhe o código com outros usuários.
5. Clique em "Entrar na Sala" para começar.

### 🚪 Entrar em uma Sala Existente

1. Digite o código da sala recebido.
2. Digite seu nome de usuário.
3. Clique em "Entrar na Sala".

### 💬 Funcionalidades da Sala

- **Mensagens de Texto**: Digite e envie pelo campo inferior.
- **Gravação de Áudio**: Clique no botão 🎤, grave e envie.
- **Envio de Arquivos**: Clique no botão 📎, selecione o arquivo (máx. 10MB) e envie.
- **Visualização de Mídia**: Imagens, vídeos, áudios, PDFs e textos com preview/modal.
- **Lista de Usuários**: Sidebar mostra quem está online.
- **Copiar Código**: Botão 📋 no header.
- **Sair da Sala**: Botão "Sair" com confirmação.

---

## 🛠️ Tecnologias Utilizadas

### Backend

- Node.js, Express.js
- WebSocket (ws) para comunicação frontend-backend
- MQTT para comunicação backend-serviços (distribuída)
- SQLite3
- Multer (upload de arquivos)
- UUID (IDs únicos)
- Express Rate Limit (proteção contra spam)

### Frontend

- HTML5, CSS3 (Flexbox, Grid, animações)
- JavaScript ES6+ (classes, async/await)
- WebSocket API, MediaRecorder API, File API, Clipboard API, Fetch API

### Infraestrutura

- Eclipse Mosquitto (broker MQTT)
- Docker & Docker Compose
- Bridge WebSocket-MQTT personalizado

---

## 🔒 Segurança e Performance

- Validação de arquivos (extensão, MIME, tamanho)
- Limite de 10MB por arquivo
- Rate limiting (100 req/15min)
- Preload e lazy loading de mídias
- Compressão e cache de assets

---

## 🔮 Roadmap

### Funcionalidades Web
- [ ] Indicador de "usuário digitando"
- [ ] Emojis e reações nas mensagens
- [ ] Temas escuro/claro
- [ ] Sons de notificação
- [ ] Mensagens privadas
- [ ] Moderação de salas

### Integração MQTT
- [x] Bridge WebSocket-MQTT implementado
- [x] Publicação de eventos via MQTT
- [x] Analytics em tempo real
- [ ] Dashboard de monitoramento
- [ ] Microserviços de notificação
- [ ] Serviço de moderação automática
- [ ] Cache distribuído via Redis
- [ ] Load balancing com múltiplas instâncias

---

## 🏛️ Arquitetura do Sistema

### Fluxo de Dados

```
┌─────────────┐    WebSocket    ┌─────────────┐    MQTT    ┌──────────────┐
│   Frontend  │ ◄────────────► │   Backend   │ ◄────────► │ Microserviços│
│  (Browser)  │                │ (Node.js)   │            │  (Opcional)  │
└─────────────┘                └─────────────┘            └──────────────┘
                                       │
                                       ▼
                                ┌─────────────┐
                                │   SQLite    │
                                │ (Persistência)│
                                └─────────────┘
```

### Comunicação Híbrida

1. **Frontend ↔ Backend**: WebSocket para baixa latência
2. **Backend ↔ Serviços**: MQTT para distribuição e escalabilidade
3. **Persistência**: SQLite para dados locais
4. **Fallback**: Sistema funciona sem MQTT se necessário

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes.

---

## 📝 Licença

Este projeto está sob a licença ISC. Veja o arquivo [package.json](package.json) para mais detalhes.

---

## 📞 Suporte

Para dúvidas ou problemas:

- **Issues**: [GitHub Issues](https://github.com/JoyceKCsilva/WebChat_SistemasDistribuidosProject/issues)
- **Documentação**: [CHECKLIST-TESTES.md](CHECKLIST-TESTES.md) para testes
- **Configuração**: [.env.example](.env.example) para variáveis de ambiente