# 💻 CodeRoom - Sistema de Chat Colaborativo Moderno

> **Versão 2.1.0** - Sistema de salas de chat em tempo real com design moderno

CodeRoom é uma plataforma moderna de salas de chat colaborativo em tempo real, projetada especialmente para desenvolvedores e equipes que precisam de comunicação eficiente e organizada. Com design contemporâneo inspirado no Telegram e interface responsiva.

---

## ✨ Características Modernas

### 🎨 Design Contemporâneo

- **Interface Escura**: Tema dark moderno que reduz o cansaço visual
- **Design System**: Sistema de cores e componentes consistente
- **Animações Suaves**: Transições e micro-interações elegantes
- **Tipografia Otimizada**: Fontes system para melhor legibilidade

### 📱 Responsividade Total

- **Mobile-First**: Projetado primeiro para dispositivos móveis
- **Breakpoints Inteligentes**: Adaptação perfeita para qualquer tela
- **Touch-Friendly**: Controles otimizados para toque
- **Performance**: Carregamento rápido em qualquer conexão

## ✨ Funcionalidades Principais

### 🎙️ **Novidade v2.1**: Sistema de Gravação de Áudio

- **Gravação em tempo real** com timer visual
- **Controles intuitivos**: gravar, parar, cancelar, re-gravar
- **Preview antes do envio** com player integrado
- **Qualidade otimizada** com cancelamento de eco e supressão de ruído
- **Compatibilidade ampla**: WebM, MP4, WAV com fallbacks automáticos

### 📺 **Novidade v2.1**: Visualização Rica de Mídia

- **Imagens**: Preview inline + modal full-size estilo galeria
- **Vídeos**: Player integrado com controles completos
- **Áudios**: Player compacto otimizado para mensagens
- **PDFs**: Visualização direta em modal com zoom
- **Documentos**: Arquivos de texto exibidos formatados
- **Navegação**: Modais responsivos com atalhos de teclado (ESC)

### 🔐 **Core Features**

- **Sistema de Autenticação**: Registro e login de usuários com JWT
- **Chat em Tempo Real**: Mensagens instantâneas via WebSocket, histórico persistente em MongoDB
- **Comunicação Distribuída**: MQTT para integração com microserviços (opcional)
- **Salas Privadas**: Criação e entrada em salas por código único de 8 caracteres
- **Upload de Arquivos**: Imagens, vídeos, áudios, PDFs, textos e outros (até 10MB)
- **Lista de Usuários Online**: Sidebar mostra quem está conectado na sala
- **Notificações Visuais**: Sistema de toast notifications moderno
- **Cópia de Código da Sala**: Botão para copiar o código e compartilhar
- **Interface Responsiva**: Design adaptado perfeitamente para desktop, tablet e mobile
- **Confirmação de Ações**: Modais para evitar ações acidentais
- **Analytics em Tempo Real**: Métricas via MQTT (quando disponível)
- **Fallback Gracioso**: Sistema funciona com ou sem MQTT

---

## 🏗️ Estrutura do Projeto

```
chat-web-app/
├── server/
│   ├── server.js           # Servidor Express + WebSocket + MQTT + Auth
│   ├── database/
│   │   ├── databaseFactory.js  # Factory para MongoDB
│   │   └── mongoDatabase.js    # Métodos e config do MongoDB
│   └── mqtt/
│       ├── mqttService.js      # Serviço principal MQTT
│       └── websocketBridge.js  # Bridge WebSocket-MQTT
├── public/
│   ├── index.html          # Página inicial (criar/entrar em salas)
│   ├── login.html          # Página de autenticação (login/registro)
│   ├── room.html           # Página da sala de chat
│   ├── css/
│   │   ├── main.css        # Estilos da página inicial
│   │   ├── login.css       # Estilos da página de login
│   │   ├── style.css       # Estilos globais
│   │   └── room.css        # Estilos da sala (modais, anexos, áudio)
│   ├── js/
│   │   ├── main.js         # JS da página inicial
│   │   ├── login.js        # JS da página de login
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
├── mongo-init/
│   └── init-mongo.js       # Script de inicialização MongoDB
├── docker-compose.yml      # Orquestração Docker (MongoDB + MQTT + App)
├── Dockerfile              # Container da aplicação Node.js
├── .env.example            # Variáveis de ambiente template
├── test-mqtt.js            # Script de teste e validação MQTT
├── test-api.js             # Script de teste das APIs REST
├── CHANGELOG.md            # Histórico de versões e mudanças
├── MIGRATION.md            # Documentação da migração para MongoDB
├── CHECKLIST-TESTES.md     # Checklist de validação e testes
├── CONTRIBUTING.md         # Guia para contribuidores
├── package.json            # Dependências, scripts e metadados
├── .gitignore              # Arquivos ignorados pelo Git
└── README.md               # Este arquivo
```

---

## 🚀 Como Executar

### 1. Pré-requisitos

**Essenciais:**

- Node.js 20+
- NPM
- Navegador moderno com suporte a:
  - WebSocket para chat em tempo real
  - MediaRecorder API para gravação de áudio
  - getUserMedia API para acesso ao microfone
  - File API para upload de arquivos
  - Fetch API para requisições

**Navegadores Testados:**

- ✅ Chrome 88+ (recomendado)
- ✅ Firefox 85+
- ✅ Safari 14+ (limitações na gravação)
- ✅ Edge 88+

**Opcionais (para MQTT):**

- Docker (recomendado) ou Mosquitto standalone
- Para funcionalidades distribuídas e microserviços

> 💡 **Instalação rápida do Docker:**
>
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

# Ou alterar a porta no .env
PORT=3000
```

#### 🍃 MongoDB não conecta

```bash
# Verificar se o MongoDB está rodando
docker-compose logs mongodb

# Reiniciar apenas o MongoDB
docker-compose restart mongodb

# Verificar conexão manual
mongosh "mongodb://admin:password123@localhost:27017/forumdb?authSource=admin"
```

---

## 🔧 Configurações

### Autenticação JWT

O sistema utiliza JWT para autenticação. Configure o JWT Secret antes de usar em produção:

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Configurar JWT Secret (OBRIGATÓRIO para produção)
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars

# Configurar MongoDB
MONGODB_URI=mongodb://admin:password123@localhost:27017/forumdb?authSource=admin
```

⚠️ **Importante**: Em produção, use um JWT Secret forte com pelo menos 32 caracteres aleatórios.

### Configuração MQTT

O sistema usa MQTT para comunicação entre microserviços. As configurações podem ser ajustadas via variáveis de ambiente:

```bash
# Editar configurações MQTT no .env
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID_PREFIX=forum-backend

# Configurações adicionais
PORT=8080
NODE_ENV=development
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./public/uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
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

# Scripts Docker
npm run docker:build   # Build das imagens
npm run docker:up      # Subir containers em background
npm run docker:down    # Parar containers
npm run docker:logs    # Ver logs dos containers
```

---

## 📋 Como Usar

### 🔐 Primeiro Acesso

1. **Acesse** [http://localhost:8080](http://localhost:8080)
2. **Se não estiver logado**, você será redirecionado para a página de login
3. **Faça login** ou **registre-se** se for seu primeiro acesso
4. **Nome de usuário**: Apenas letras, números e underscore
5. **Senha**: Mínimo 6 caracteres

### 🆕 Criar uma Nova Sala

1. Preencha o nome da sala na página inicial
2. Clique em "Criar Sala"
3. Um código único de 8 caracteres será gerado
4. Compartilhe o código com outros usuários
5. Clique em "Entrar na Sala" para começar

### 🚪 Entrar em uma Sala Existente

1. Digite o código da sala recebido (8 caracteres)
2. Clique em "Entrar na Sala"
3. Você será redirecionado para a sala automaticamente

### 💬 Funcionalidades da Sala

- **Mensagens de Texto**: Digite e envie pelo campo inferior
- **Gravação de Áudio**: Clique no botão 🎤, grave e envie
- **Envio de Arquivos**: Clique no botão 📎, selecione o arquivo (máx. 10MB) e envie
- **Visualização de Mídia**: Imagens, vídeos, áudios, PDFs e textos com preview/modal
- **Lista de Usuários**: Sidebar mostra quem está online
- **Copiar Código**: Botão 📋 no header
- **Sair da Sala**: Botão "Sair" com confirmação

#### 📁 Formatos de Arquivo Suportados

**Imagens**: JPG, JPEG, PNG, GIF, WebP, BMP, SVG  
**Vídeos**: MP4, AVI, MOV, WMV, FLV, MKV, WebM  
**Áudios**: MP3, WAV, OGG, M4A, AAC, WebM (áudio)  
**Documentos**: PDF, TXT, MD, LOG, DOC, DOCX  
**Outros**: ZIP, RAR, JSON, XML, CSV

---

## 🛠️ Tecnologias Utilizadas

### Backend

- **Node.js 20+** - Runtime JavaScript
- **Express.js** - Framework web
- **WebSocket (ws)** - Comunicação real-time frontend-backend
- **MQTT** - Comunicação distribuída backend-serviços
- **MongoDB** - Banco de dados NoSQL
- **Mongoose ODM** - Modelagem de dados MongoDB
- **JWT** - Autenticação e sessões
- **bcryptjs** - Hash de senhas
- **Multer** - Upload de arquivos
- **UUID** - Geração de IDs únicos
- **Express Rate Limit** - Proteção contra spam
- **CORS** - Configuração de recursos de origem cruzada
- **dotenv** - Gerenciamento de variáveis de ambiente

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

### ⚠️ Notas de Segurança (Produção)

**Para ambiente de produção, seria necessário:**

- Resolver vulnerabilidades conhecidas na imagem Docker base
- Implementar HTTPS com certificados SSL
- Configurar firewall e políticas de rede
- Adicionar monitoramento de segurança
- Implementar backup automatizado
- Configurar logs de auditoria

_Este projeto foi desenvolvido para fins acadêmicos/demonstração._

---

## 🔮 Roadmap

### 🎯 Versão 2.2 (Próxima)

#### Funcionalidades Web

- [ ] Indicador de "usuário digitando"
- [ ] Emojis e reações nas mensagens
- [ ] Temas escuro/claro personalizáveis
- [ ] Sons de notificação customizáveis
- [ ] Mensagens privadas entre usuários
- [ ] Sistema de moderação de salas

#### Melhorias Técnicas

- [ ] Compressão automática de imagens
- [ ] Cache inteligente de arquivos
- [ ] Backup automático de conversas
- [ ] Logs de auditoria detalhados

### 🚀 Versão 3.0 (Futuro)

#### Integração MQTT Avançada

- [x] Bridge WebSocket-MQTT implementado
- [x] Publicação de eventos via MQTT
- [x] Analytics em tempo real
- [ ] Dashboard de monitoramento em tempo real
- [ ] Microserviços de notificação push
- [ ] Serviço de moderação automática via IA
- [ ] Cache distribuído via Redis
- [ ] Load balancing com múltiplas instâncias
- [ ] Federação entre instâncias (protocolo próprio)

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
                                │   MongoDB   │
                                │ (Persistência)│
                                └─────────────┘
```

### Comunicação Híbrida

1. **Frontend ↔ Backend**: WebSocket para baixa latência
2. **Backend ↔ Serviços**: MQTT para distribuição e escalabilidade
3. **Persistência**: MongoDB para dados escaláveis e distribuídos
4. **Fallback**: Sistema funciona sem MQTT se necessário

---

## � Desenvolvimento e Testes

### Páginas de Teste Disponíveis

Para desenvolvedores, existem páginas de teste úteis:

- [http://localhost:8080/test-api.html](http://localhost:8080/test-api.html) - Teste das APIs
- [http://localhost:8080/test-room.html](http://localhost:8080/test-room.html) - Teste de sala de chat
- [http://localhost:8080/test-room-api.html](http://localhost:8080/test-room-api.html) - Teste de APIs de sala

### Monitoramento

- **Status do Sistema**: [http://localhost:8080/api/system/status](http://localhost:8080/api/system/status)
- **Logs**: Use `docker-compose logs -f forum-app` para ver logs em tempo real

### Scripts de Desenvolvimento

```bash
# Desenvolvimento com auto-reload
npm run dev

# Teste de conexão MQTT
npm run test-mqtt

# Comandos Docker úteis
npm run docker:build   # Build das imagens
npm run docker:up      # Subir containers
npm run docker:down    # Parar containers
npm run docker:logs    # Ver logs
```

---

## �🤝 Contribuindo

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

### Links Úteis

- **API Status**: [http://localhost:8080/api/system/status](http://localhost:8080/api/system/status)
- **Aplicação**: [http://localhost:8080](http://localhost:8080)
- **Login**: [http://localhost:8080/login.html](http://localhost:8080/login.html)
