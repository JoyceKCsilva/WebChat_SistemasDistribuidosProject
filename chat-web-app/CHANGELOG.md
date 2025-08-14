# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-08-03

### 🎉 Adicionado

- **Gravação de Áudio**: Sistema completo de gravação e envio de áudio

  - Botão de gravação integrado na interface
  - Timer em tempo real durante gravação
  - Controles para parar, cancelar e re-gravar
  - Player de preview antes do envio
  - Suporte a WebM, MP4 e WAV com fallbacks automáticos
  - Configurações de alta qualidade (cancelamento de eco, supressão de ruído)

- **Visualização Rica de Mídia**: Interface estilo WhatsApp/Telegram

  - **Imagens**: Preview inline + modal full-size
  - **Vídeos**: Player integrado com controles completos
  - **Áudios**: Player compacto otimizado para chat
  - **PDFs**: Visualização em modal com iframe
  - **Textos**: Conteúdo exibido formatado em modal
  - Modais responsivos com navegação por teclado (ESC)

- **Suporte a Novos Formatos**:
  - Áudio: WebM, M4A, AAC
  - Imagem: WebP
  - Vídeo: MKV, WebM (vídeo)
  - Documento: Markdown (.md), Logs (.log)

### 🔧 Melhorado

- **Reprodução de Áudio**: Corrigida com múltiplas sources para compatibilidade
- **Detecção de Tipos**: Lógica inteligente para diferenciar áudio/vídeo WebM
- **Interface de Upload**: Preview melhorado para todos os tipos de arquivo
- **Performance**: Preload metadata para otimização de carregamento
- **Responsividade**: Modais adaptáveis ao tamanho da tela

### 🛠️ Técnico

- Adicionada MediaRecorder API para gravação
- Implementada getUserMedia API para acesso ao microfone
- Criados modais dinâmicos com JavaScript
- Adicionados fallbacks para compatibilidade entre navegadores
- Melhorada validação de tipos MIME no servidor

## [2.0.0] - 2025-08-02

### 🎉 Adicionado

- Sistema de salas com códigos únicos de 8 caracteres
- Chat em tempo real com WebSockets
- Upload de arquivos (imagens, vídeos, áudios, documentos)
- Banco de dados MongoDB para persistência
- Lista de usuários online em tempo real
- Rate limiting para proteção contra spam
- Interface responsiva moderna
- Notificações visuais para ações

### 🔧 Funcionalidades Principais

- Criação e entrada em salas via código
- Envio de mensagens de texto
- Upload de arquivos até 10MB
- Histórico de mensagens persistente
- Status online/offline de usuários
- Cópia de código de sala
- Confirmação para sair da sala

## [1.0.0] - 2025-08-01

### 🎉 Inicial

- Versão inicial do projeto
- Estrutura básica do servidor Express
- WebSocket para comunicação em tempo real
- Interface básica de chat
- Banco de dados MongoDB
- Sistema básico de upload de arquivos

---

## Tipos de Mudanças

- `🎉 Adicionado` para novas funcionalidades
- `🔧 Melhorado` para mudanças em funcionalidades existentes
- `🐛 Corrigido` para correções de bugs
- `🛠️ Técnico` para mudanças técnicas internas
- `🗑️ Removido` para funcionalidades removidas
- `⚠️ Descontinuado` para funcionalidades que serão removidas
- `🔒 Segurança` para correções relacionadas à segurança
