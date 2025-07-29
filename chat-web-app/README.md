# Chat Web Application

Este projeto é uma aplicação de chat em tempo real que utiliza WebSockets para comunicação entre os usuários.

## Estrutura do Projeto

A estrutura do projeto é a seguinte:

```
chat-web-app
├── public
│   ├── index.html        # Página principal da aplicação
│   ├── css
│   │   └── style.css     # Estilos da aplicação
│   └── js
│       ├── client.js     # Gerenciamento da conexão WebSocket
│       └── chat.js       # Lógica do chat e exibição de mensagens
├── server
│   ├── server.js         # Ponto de entrada do servidor WebSocket
│   └── websocket.js      # Lógica para gerenciar conexões WebSocket
├── package.json          # Configuração do npm
└── README.md             # Documentação do projeto
```

## Tecnologias Utilizadas

- HTML
- CSS
- JavaScript
- WebSocket

## Como Executar o Projeto

1. **Clone o repositório:**

   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd chat-web-app
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Inicie o servidor:**

   ```bash
   node server/server.js
   ```

4. **Abra o navegador e acesse:**

   ```
   http://localhost:3000
   ```


## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.