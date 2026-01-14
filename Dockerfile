FROM node:22-slim

# Build timestamp: 2026-01-13-16:30
WORKDIR /app

# Copiar package files primero
COPY server/package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código del servidor
COPY server/ ./

# Exponer puerto
EXPOSE 3001

# Comando para iniciar
CMD ["node", "server.js"]
