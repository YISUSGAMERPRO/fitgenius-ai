FROM node:22-alpine

WORKDIR /app/server

# Copiar solo el directorio server
COPY server/package*.json ./

# Instalar dependencias del backend
RUN npm install --production

# Copiar el código del servidor
COPY server/ ./

# Exponer puerto
EXPOSE 3001

# Comando para iniciar
CMD ["node", "server.js"]
