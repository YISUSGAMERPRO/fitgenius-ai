FROM node:22-alpine

WORKDIR /app

# Copiar archivos del proyecto
COPY package*.json ./
COPY server/ ./server/

# Instalar dependencias del proyecto raíz
RUN npm install --production

# Instalar dependencias del backend
WORKDIR /app/server
RUN npm install --production

# Volver al directorio raíz
WORKDIR /app

# Exponer puerto
EXPOSE 3001

# Comando para iniciar
CMD ["node", "server/server.js"]
