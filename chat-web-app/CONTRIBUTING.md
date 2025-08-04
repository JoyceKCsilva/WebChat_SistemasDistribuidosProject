# 🤝 Guia de Contribuição

Obrigado por considerar contribuir para o **Forum Web App**! Este documento fornece diretrizes para contribuir com o projeto.

## 🎯 Como Contribuir

### 🐛 Reportando Bugs

Antes de reportar um bug, verifique se já existe uma issue para o problema:

1. **Pesquise** nas [issues existentes](https://github.com/JoyceKCsilva/WebChat_SistemasDistribuidosProject/issues)
2. Se não encontrar, **crie uma nova issue** com:
   - Título claro e descritivo
   - Passos para reproduzir o problema
   - Comportamento esperado vs. real
   - Screenshots (se aplicável)
   - Informações do ambiente:
     - SO e versão
     - Navegador e versão
     - Versão do Node.js
     - Versão do projeto

**Template para Bug Report:**

```markdown
## Descrição do Bug

Descrição clara e concisa do problema.

## Passos para Reproduzir

1. Vá para '...'
2. Clique em '...'
3. Veja o erro

## Comportamento Esperado

O que deveria acontecer.

## Screenshots

Se aplicável, adicione screenshots.

## Ambiente

- OS: [Windows/Mac/Linux]
- Navegador: [Chrome/Firefox/Safari]
- Versão do Node.js: [14.0.0]
- Versão do projeto: [2.1.0]
```

### 💡 Sugerindo Funcionalidades

Para sugerir novas funcionalidades:

1. **Verifique** se a funcionalidade já foi sugerida
2. **Crie uma issue** com o label `enhancement`
3. **Descreva** detalhadamente:
   - Problema que a funcionalidade resolve
   - Solução proposta
   - Alternativas consideradas
   - Mockups ou wireframes (se aplicável)

### 🔧 Contribuindo com Código

#### **Configuração do Ambiente**

1. **Fork** o repositório
2. **Clone** seu fork:
   ```bash
   git clone https://github.com/seu-usuario/WebChat_SistemasDistribuidosProject.git
   cd WebChat_SistemasDistribuidosProject/chat-web-app
   ```
3. **Instale** as dependências:
   ```bash
   npm install
   ```
4. **Crie** uma branch para sua feature:
   ```bash
   git checkout -b feature/nome-da-funcionalidade
   ```

#### **Padrões de Código**

**JavaScript:**

- Use ES6+ features (const/let, arrow functions, async/await)
- Indentação: 2 espaços
- Aspas: duplas para strings
- Semicolons: sempre usar
- Nomes em camelCase

**CSS:**

- Indentação: 2 espaços
- Ordem das propriedades: alfabética
- Use classes semânticas
- Mobile-first approach

**HTML:**

- Indentação: 2 espaços
- Use tags semânticas
- Atributos alt para imagens
- Acessibilidade (ARIA labels quando necessário)

**Exemplo de código JavaScript:**

```javascript
class RoomChat {
  constructor() {
    this.isConnected = false;
    this.initialize();
  }

  async connectToRoom(roomCode) {
    try {
      const response = await fetch(`/api/rooms/${roomCode}`);
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Erro ao conectar:", error);
      return false;
    }
  }
}
```

#### **Commits**

Use mensagens de commit claras e descritivas:

```bash
# ✅ Bom
git commit -m "Adiciona reprodução de áudio para mensagens"
git commit -m "Corrige bug na reconexão WebSocket"
git commit -m "Melhora responsividade dos modais de imagem"

# ❌ Ruim
git commit -m "fix"
git commit -m "update"
git commit -m "changes"
```

**Formato sugerido:**

```
<tipo>: <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos:**

- `feat`: nova funcionalidade
- `fix`: correção de bug
- `docs`: mudanças na documentação
- `style`: formatação, espaços em branco, etc.
- `refactor`: refatoração de código
- `test`: adicionar ou corrigir testes
- `chore`: manutenção geral

#### **Pull Requests**

1. **Certifique-se** de que seu código segue os padrões
2. **Teste** suas mudanças localmente
3. **Atualize** a documentação se necessário
4. **Crie** o Pull Request com:
   - Título claro
   - Descrição detalhada das mudanças
   - Link para issues relacionadas
   - Screenshots (se mudanças visuais)

**Template para Pull Request:**

```markdown
## Descrição

Breve descrição das mudanças implementadas.

## Tipo de Mudança

- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Melhoria de performance
- [ ] Atualização de documentação

## Como Testar

1. Instale as dependências
2. Execute `npm start`
3. Navegue para...
4. Teste a funcionalidade...

## Screenshots

[Se aplicável]

## Checklist

- [ ] Meu código segue os padrões do projeto
- [ ] Realizei uma auto-revisão do código
- [ ] Comentei o código em partes complexas
- [ ] Fiz mudanças correspondentes na documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Testei em diferentes navegadores
```

## 🧪 Testes

Atualmente o projeto não possui testes automatizados, mas planejamos implementar:

- **Unit Tests**: Jest
- **Integration Tests**: Supertest
- **E2E Tests**: Playwright

**Para testar manualmente:**

1. Execute `npm start`
2. Teste em múltiplos navegadores
3. Teste em diferentes tamanhos de tela
4. Teste funcionalidades de áudio em HTTPS
5. Teste upload de diferentes tipos de arquivo

## 📚 Áreas que Precisam de Contribuição

### **🔥 Alta Prioridade**

- **Testes Automatizados**: Implementar suite de testes
- **Acessibilidade**: Melhorar suporte a screen readers
- **Performance**: Otimizar carregamento de mensagens
- **Segurança**: Implementar autenticação JWT

### **🚀 Funcionalidades Novas**

- **Indicador de Digitação**: "Usuário está digitando..."
- **Emojis**: Picker de emojis para mensagens
- **Temas**: Modo escuro/claro
- **Notificações**: Sons e notificações push
- **Moderação**: Sistema de bans e silenciamento

### **🐛 Bugs Conhecidos**

- Reconexão WebSocket instável
- Upload de arquivos grandes trava interface
- Emojis em nomes de usuário causam problemas

### **📖 Documentação**

- Tradução para inglês
- Guia de deployment
- API documentation
- Exemplos de uso

## 🎨 Design Guidelines

### **Cores**

- Primary: `#667eea` - `#764ba2` (gradiente)
- Success: `#27ae60`
- Warning: `#f39c12`
- Error: `#e74c3c`
- Text: `#2c3e50`
- Background: `#f8f9fa`

### **Tipografia**

- Font Family: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`
- Sizes: 0.8rem, 0.9rem, 1rem, 1.2rem, 1.5rem

### **Espaçamento**

- Base unit: 0.5rem (8px)
- Multiply: 0.5rem, 1rem, 1.5rem, 2rem, 3rem

### **Componentes**

- Border radius: 8px
- Box shadow: `0 2px 10px rgba(0, 0, 0, 0.1)`
- Transitions: `0.3s ease`

## 🚀 Deployment

O projeto está configurado para deploy em:

- **Heroku**: Procfile incluído
- **Vercel**: vercel.json configurado
- **Docker**: Dockerfile disponível
- **VPS**: PM2 configuration

## 📞 Suporte

### **Dúvidas sobre Contribuição**

- 📋 Abra uma [issue de discussão](https://github.com/JoyceKCsilva/WebChat_SistemasDistribuidosProject/discussions)
- 📧 Email: joyce.silva@example.com
- 💼 LinkedIn: [JoyceKCsilva](https://linkedin.com/in/joycekc)

### **Primeiros Passos**

Se você é novo em contribuições open source:

1. Leia o [GitHub Guide](https://docs.github.com/pt/get-started/quickstart/contributing-to-projects)
2. Comece com issues marcadas como `good first issue`
3. Faça perguntas! A comunidade está aqui para ajudar

## 🏆 Reconhecimento

Todos os contribuidores serão:

- Listados no README.md
- Mencionados no CHANGELOG.md
- Creditados nas release notes

---

**🎉 Obrigado por contribuir! Juntos tornamos o projeto melhor para todos!**
