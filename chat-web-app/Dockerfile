# Usar Node.js versão LTS mais recente como base
# NOTA: Para produção, seria necessário resolver CVEs da imagem base
FROM node:20-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Limpar cache npm e instalar dependências
RUN npm cache clean --force && \
    npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p public/uploads

# Definir variável de ambiente
ENV NODE_ENV=production

# Expor porta
EXPOSE 8080

# Comando para iniciar aplicação
CMD ["npm", "start"]
