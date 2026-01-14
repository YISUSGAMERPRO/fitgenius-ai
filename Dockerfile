FROM node:22-alpine

WORKDIR /app

# Copiar package.json del servidor
COPY server/package*.json ./

# Instalar dependencias
RUN npm ci --production

# Copiar server.js desde la raíz
COPY server.js .

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3001

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["node", "server.js"]
