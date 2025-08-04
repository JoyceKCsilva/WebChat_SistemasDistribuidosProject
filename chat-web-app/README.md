# 🏛️ Fórum Web - Sistema de Chat Avançado com Salas

Este projeto é um sistema de fórum web moderno e completo que permite criar salas de discussão privadas com códigos únicos para pareamento de usuários. Desenvolvido com WebSockets para comunicação em tempo real e recursos avançados de mídia.

## ✨ Funcionalidades Principais

### 💬 **Chat em Tempo Real**

- **Comunicação Instantânea**: WebSockets para mensagens em tempo real
- **Salas Privadas**: Códigos únicos de 8 caracteres para acesso
- **Persistência**: Histórico completo de mensagens no banco SQLite
- **Status Online**: Visualização de usuários conectados em tempo real
- **Notificações**: Feedback visual para todas as ações

### 🎤 **Gravação de Áudio** _(NOVO!)_

- **Gravação Integrada**: Botão 🎤 para gravar áudio diretamente do navegador
- **Interface Intuitiva**: Timer em tempo real e controles de gravação
- **Alta Qualidade**: Cancelamento de eco e supressão de ruído
- **Formatos Suportados**: WebM, MP4, WAV com fallbacks automáticos
- **Player Integrado**: Reprodução direta no chat com controles HTML5

### 📎 **Sistema de Arquivos Avançado** _(NOVO!)_

#### **🖼️ Imagens**

- **Preview Inline**: Visualização direta no chat (300x200px)
- **Modal Full-Size**: Clique para ver em tamanho real
- **Formatos**: JPG, JPEG, PNG, GIF, WebP
- **Download**: Botão de download integrado

#### **🎥 Vídeos**

- **Player Integrado**: Reprodução direta no chat
- **Controles Completos**: Play, pause, volume, barra de progresso
- **Formatos**: MP4, AVI, MOV, MKV, WebM
- **Otimizado**: Preview em tamanho ideal para chat

#### **🎵 Áudios**

- **Player Compacto**: Controles otimizados para conversas
- **Preload Inteligente**: Carrega metadados automaticamente
- **Formatos**: MP3, WAV, OGG, WebM, M4A, AAC
- **Multi-Source**: Fallbacks para máxima compatibilidade

#### **� Documentos PDF**

- **Visualização Integrada**: Modal com iframe para visualização completa
- **Interface Intuitiva**: Card clicável com preview
- **Funcionalidades**: Visualizar, baixar, zoom
- **Responsivo**: Adapta ao tamanho da tela

#### **📝 Arquivos de Texto**

- **Visualização Inline**: Conteúdo exibido em modal formatado
- **Preservação de Formatação**: Quebras de linha e espaçamento
- **Formatos**: TXT, MD, LOG
- **Download**: Opção de baixar o arquivo original

### 🔧 **Recursos Técnicos**

- **Rate Limiting**: Proteção contra spam (100 req/15min)
- **Validação Robusta**: Tipos MIME e extensões verificadas
- **Limite de Tamanho**: 10MB por arquivo
- **Interface Responsiva**: Funciona perfeitamente em mobile
- **Reconexão Automática**: WebSocket reconecta automaticamente

## 🏗️ Estrutura do Projeto

```
forum-web-app/
├── server/
│   ├── server.js                 # Servidor principal (Express + WebSocket)
│   ├── websocket.js              # Lógica do WebSocket
│   └── database/
│       └── database.js           # Configuração e métodos do banco SQLite
├── public/
│   ├── index.html               # Página inicial (criar/entrar em salas)
│   ├── room.html                # Página da sala de chat
│   ├── css/
│   │   ├── main.css            # Estilos da página inicial
│   │   ├── style.css           # Estilos globais
│   │   └── room.css            # Estilos da sala (modais, anexos, áudio)
│   ├── js/
│   │   ├── main.js             # JavaScript da página inicial
│   │   ├── client.js           # Cliente WebSocket
│   │   ├── chat.js             # Lógica do chat
│   │   └── room.js             # Funcionalidades da sala (áudio, anexos)
│   └── uploads/                # Diretório para arquivos enviados
│       └── .gitkeep           # Mantém estrutura no git
├── data/
│   └── forum.db               # Banco de dados SQLite (auto-criado)
├── package.json               # Dependências e scripts
├── .gitignore                # Arquivos ignorados pelo git
└── README.md                 # Este arquivo
```

## 🚀 Como Executar

### 1. **Pré-requisitos**

- Node.js versão 14.0.0 ou superior
- NPM (vem com o Node.js)
- Navegador moderno com suporte a WebRTC e MediaRecorder API

### 2. **Instalação**

```bash
# Clone o repositório
git clone https://github.com/JoyceKCsilva/WebChat_SistemasDistribuidosProject.git
cd WebChat_SistemasDistribuidosProject/chat-web-app

# Instale as dependências
npm install
```

### 3. **Executar o Projeto**

**Produção:**

```bash
npm start
```

**Desenvolvimento (com auto-reload):**

```bash
npm run dev
```

### 4. **Acessar a Aplicação**

```
http://localhost:8080
```

## 📋 Como Usar

### 🆕 **Criar uma Nova Sala**

1. Na página inicial, preencha o nome da sala e seu nome
2. Clique em "Criar Sala"
3. Um código único será gerado (ex: ABC12345)
4. Compartilhe este código com outros usuários
5. Clique em "Entrar na Sala" para começar

### 🚪 **Entrar em uma Sala Existente**

1. Digite o código da sala que você recebeu
2. Digite seu nome de usuário
3. Clique em "Entrar na Sala"

### 💬 **Funcionalidades da Sala**

#### **Mensagens de Texto**

- Digite sua mensagem no campo inferior
- Pressione `Enter` ou clique em "Enviar"
- Use `Ctrl+Enter` para quebrar linha

#### **🎤 Gravação de Áudio**

1. Clique no botão 🎤 ao lado do campo de texto
2. Permita o acesso ao microfone quando solicitado
3. Grave sua mensagem (timer mostra a duração)
4. Clique em ⏹️ para parar ou ❌ para cancelar
5. Ouça o preview e clique em 📤 para enviar
6. Adicione texto opcional junto com o áudio

#### **📎 Envio de Arquivos**

1. Clique no botão 📎 para anexar arquivos
2. Selecione o arquivo desejado (máx. 10MB)
3. Adicione texto opcional como comentário
4. Clique em "Enviar"

#### **👁️ Visualização de Mídia**

- **Imagens**: Clique para ampliar em modal
- **Vídeos**: Player integrado com controles
- **Áudios**: Player compacto para reprodução
- **PDFs**: Visualização em modal com iframe
- **Textos**: Conteúdo exibido formatado
- **Outros**: Download direto

#### **👥 Gerenciamento da Sala**

- **Lista de Usuários**: Sidebar mostra quem está online
- **Copiar Código**: Botão 📋 no header
- **Sair da Sala**: Botão com confirmação
- **Atalhos**: `Esc` para fechar modais

## 🛠️ Tecnologias Utilizadas

### **Backend**

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web robusto
- **WebSocket (ws)** - Comunicação bidirecional em tempo real
- **SQLite3** - Banco de dados local com persistência
- **Multer** - Middleware para upload de arquivos
- **UUID** - Geração de identificadores únicos
- **CORS** - Controle de acesso entre origens
- **Express Rate Limit** - Proteção contra ataques DDoS

### **Frontend**

- **HTML5** - Estrutura semântica moderna
- **CSS3** - Estilização avançada com:
  - Grid e Flexbox layouts
  - Animações e transições suaves
  - Gradientes e sombras
  - Media queries para responsividade
- **JavaScript ES6+** - Lógica interativa com:
  - Classes e módulos
  - Async/await para operações assíncronas
  - Destructuring e template literals
  - WebSocket API nativa
  - MediaRecorder API para gravação
  - Fetch API para requisições

### **APIs Web Modernas Utilizadas**

- **WebSocket API** - Comunicação em tempo real
- **MediaRecorder API** - Gravação de áudio/vídeo
- **getUserMedia API** - Acesso ao microfone
- **File API** - Manipulação de arquivos
- **Clipboard API** - Cópia de códigos de sala
- **Fetch API** - Requisições HTTP assíncronas
- **History API** - Navegação entre páginas

## 🔒 Segurança e Performance

### **Validação de Arquivos**

- Verificação dupla: extensão + MIME type
- Lista branca de tipos permitidos
- Limite de 10MB por arquivo
- Sanitização de nomes de arquivos

### **Rate Limiting**

- 100 requisições por IP a cada 15 minutos
- Proteção contra spam de mensagens
- Timeout de reconexão WebSocket

### **Otimizações**

- Preload metadata para mídias
- Lazy loading de recursos
- Compressão de arquivos estáticos
- Cache de assets do navegador

## 🔮 Roadmap de Funcionalidades

### **Versão 2.1 - UX Melhorado** _(Em Desenvolvimento)_

- [ ] Indicadores de "usuário digitando"
- [ ] Emojis e reações nas mensagens
- [ ] Temas escuro/claro
- [ ] Sons de notificação configuráveis
- [ ] Modo de tela cheia para vídeos

### **Versão 2.2 - Recursos Sociais**

- [ ] Mensagens privadas entre usuários
- [ ] Sistema de moderação (banir, silenciar)
- [ ] Roles de usuário (admin, moderador, usuário)
- [ ] Salas temporárias com expiração
- [ ] Backup e exportação de conversas

### **Versão 3.0 - Integração Enterprise**

- [ ] **Autenticação JWT** - Login seguro e sessões
- [ ] **PostgreSQL** - Banco robusto para produção
- [ ] **Redis** - Cache distribuído e sessões
- [ ] **Docker** - Containerização completa
- [ ] **HTTPS/WSS** - Comunicação criptografada
- [ ] **CDN** - Entrega otimizada de assets

### **Versão 4.0 - Comunicação Avançada**

- [ ] **WebRTC** - Chamadas de voz/vídeo P2P
- [ ] **MQTT Integration** - Notificações IoT
- [ ] **Push Notifications** - Notificações do sistema
- [ ] **Screen Sharing** - Compartilhamento de tela
- [ ] **File Streaming** - Upload de arquivos grandes
- [ ] **Live Streaming** - Transmissões ao vivo

## 🎨 Exemplos de Protocolos Avançados

### **MQTT para Notificações IoT**

```javascript
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

// Notificar dispositivos IoT sobre atividade na sala
client.publish(
  `forum/room/${roomCode}/activity`,
  JSON.stringify({
    type: "new_message",
    from: username,
    timestamp: new Date().toISOString(),
    preview: message.substring(0, 50) + "...",
  })
);
```

### **WebRTC para Vídeo Conferência**

```javascript
// Configuração para futuras chamadas de vídeo
const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "turn:turnserver.com", username: "user", credential: "pass" },
  ],
};

const peerConnection = new RTCPeerConnection(rtcConfig);
```

### **Server-Sent Events (SSE)**

```javascript
// Alternativa ao WebSocket para notificações unidirecionais
app.get("/api/events/:roomCode", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const heartbeat = setInterval(() => {
    res.write(
      `data: ${JSON.stringify({ type: "heartbeat", time: Date.now() })}\n\n`
    );
  }, 30000);

  req.on("close", () => clearInterval(heartbeat));
});
```

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Para contribuir:

### **Como Contribuir**

1. **Fork** o projeto
2. **Clone** seu fork: `git clone https://github.com/seu-usuario/WebChat_SistemasDistribuidosProject.git`
3. **Crie uma branch**: `git checkout -b feature/nova-funcionalidade`
4. **Faça suas alterações** e adicione testes se necessário
5. **Commit**: `git commit -m "Adiciona nova funcionalidade X"`
6. **Push**: `git push origin feature/nova-funcionalidade`
7. **Abra um Pull Request** com descrição detalhada

### **Diretrizes**

- Siga os padrões de código existentes
- Adicione comentários para código complexo
- Teste suas alterações em diferentes navegadores
- Atualize a documentação se necessário

### **Áreas que Precisam de Contribuição**

- 🐛 Correção de bugs
- ⚡ Otimizações de performance
- 🎨 Melhorias de UI/UX
- 🧪 Testes automatizados
- 📚 Documentação
- 🌐 Internacionalização (i18n)

## 📝 Licença

Este projeto está sob a licença **ISC**. Veja o arquivo `package.json` para mais detalhes.

## 🐛 Problemas Conhecidos e Soluções

### **Problemas Reportados**

- ❌ **Reconexão WebSocket**: Melhorias necessárias na estabilidade
- ❌ **Upload de arquivos grandes**: Interface pode travar temporariamente
- ❌ **Emojis em nomes**: Podem causar problemas de codificação

### **Soluções Aplicadas**

- ✅ **Reprodução de áudio**: Corrigido com múltiplas sources
- ✅ **Preview de imagens**: Modal responsivo implementado
- ✅ **Rate limiting**: Proteção contra spam adicionada

## 🔧 Troubleshooting

### **Problemas Comuns**

**🚨 Erro: "Cannot connect to server"**

```bash
# Verifique se a porta 8080 está disponível
netstat -an | findstr 8080

# Tente uma porta diferente
PORT=3000 npm start
```

**🚨 Erro: "Microfone não detectado"**

- Verifique permissões do navegador
- Teste em HTTPS (algumas APIs requerem conexão segura)
- Verifique se o microfone está funcionando em outros apps

**🚨 Erro: "Upload failed"**

- Verifique se o arquivo é menor que 10MB
- Confirme se o tipo de arquivo é suportado
- Verifique espaço em disco do servidor

### **Comandos Úteis**

```bash
# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Verificar versões
node --version
npm --version

# Debug mode
DEBUG=* npm start
```

## 📞 Suporte e Contato

### **Para Dúvidas Técnicas**

1. 📋 Abra uma [issue no GitHub](https://github.com/JoyceKCsilva/WebChat_SistemasDistribuidosProject/issues)
2. 🔍 Verifique se o problema já foi reportado
3. 📝 Inclua logs de erro e versões do Node.js/navegador

### **Para Colaboração**

- 💼 LinkedIn: [JoyceKCsilva](https://linkedin.com/in/joycekc)
- 📧 Email: joyce.silva@example.com
- 🐙 GitHub: [@JoyceKCsilva](https://github.com/JoyceKCsilva)

---

## 🎯 **Status do Projeto: Produção Ready** ✅

**📊 Estatísticas:**

- ⭐ **Features**: 15+ funcionalidades implementadas
- 🧪 **Browser Support**: Chrome, Firefox, Safari, Edge
- 📱 **Mobile**: Totalmente responsivo
- 🔒 **Security**: Rate limiting + validação robusta
- ⚡ **Performance**: Otimizado para até 100 usuários simultâneos

**🎉 Divirta-se criando salas e conectando pessoas em tempo real com áudio, vídeo e muito mais!** 2. Digite seu nome de usuário 3. Clique em "Entrar na Sala"

### Funcionalidades da Sala

- **Enviar Mensagens**: Digite e pressione Enter ou clique em "Enviar"
- **Enviar Arquivos**: Clique no botão 📎 para anexar arquivos
- **Ver Usuários Online**: Lista lateral mostra quem está conectado
- **Copiar Código**: Botão 📋 no header para compartilhar o código
- **Sair da Sala**: Botão "Sair" com confirmação

## 🛠️ Tecnologias Utilizadas

### Backend

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **WebSocket (ws)** - Comunicação em tempo real
- **SQLite3** - Banco de dados local
- **Multer** - Upload de arquivos
- **UUID** - Geração de IDs únicos
- **CORS** - Controle de acesso
- **Express Rate Limit** - Limitação de requisições

### Frontend

- **HTML5** - Estrutura
- **CSS3** - Estilização moderna com gradientes e animações
- **JavaScript ES6+** - Lógica interativa
- **WebSocket API** - Comunicação cliente-servidor
- **Fetch API** - Requisições HTTP

## 🔮 Próximas Funcionalidades (Roadmap)

### Versão 2.1 - Melhorias de UX

- [ ] Indicadores de "usuário digitando"
- [ ] Emojis e reações nas mensagens
- [ ] Temas escuro/claro
- [ ] Sons de notificação

### Versão 2.2 - Funcionalidades Avançadas

- [ ] Mensagens privadas entre usuários
- [ ] Moderação de salas (banir usuários)
- [ ] Salas temporárias com expiração automática
- [ ] Backup e exportação de conversas

### Versão 3.0 - Integração com Protocolos Avançados

- [ ] **MQTT Integration**: Para notificações push e comunicação IoT
- [ ] **Redis**: Cache distribuído para múltiplas instâncias
- [ ] **PostgreSQL**: Banco de dados mais robusto para produção
- [ ] **JWT Authentication**: Sistema de autenticação mais seguro
- [ ] **Socket.IO**: Upgrade do WebSocket com fallbacks
- [ ] **Docker**: Containerização para deploy fácil

## 🌐 Ideias para Protocolos Complexos

### MQTT (Message Queuing Telemetry Transport)

```javascript
// Exemplo de integração MQTT para notificações
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

// Notificar dispositivos IoT sobre mensagens na sala
client.publish(
  `forum/room/${roomCode}/notification`,
  JSON.stringify({
    type: "new_message",
    from: username,
    preview: message.substring(0, 50),
  })
);
```

### WebRTC para Vídeo/Audio

```javascript
// Futuro: Chamadas de voz/vídeo nas salas
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});
```

### Server-Sent Events (SSE)

```javascript
// Alternativa ao WebSocket para notificações
app.get("/api/events/:roomCode", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Enviar atualizações da sala
  setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
  }, 30000);
});
```

## 🤝 Contribuições

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença ISC. Veja o arquivo `package.json` para mais detalhes.

## 🐛 Problemas Conhecidos

- [ ] Reconexão automática do WebSocket precisa de melhorias
- [ ] Upload de arquivos muito grandes pode travar a interface
- [ ] Emojis em nomes de usuário podem causar problemas de exibição

## 📞 Suporte

Para dúvidas ou problemas:

1. Abra uma issue no repositório
2. Verifique se o Node.js está na versão correta
3. Certifique-se de que a porta 8080 está disponível

---

**🎉 Divirta-se criando salas e conectando com pessoas!**
