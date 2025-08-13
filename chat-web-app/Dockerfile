# Usar Node.js como base
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p data public/uploads

# Expor porta
EXPOSE 8080

# Definir variável de ambiente
ENV NODE_ENV=production

# Comando para iniciar aplicação
CMD ["npm", "start"]
