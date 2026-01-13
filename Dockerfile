FROM node:22-alpine

WORKDIR /app

# Copiar todo el proyecto
COPY . .

# Cambiar al directorio del servidor
WORKDIR /app/server

# Instalar dependencias
RUN npm install --production

# Exponer puerto
EXPOSE 3001

# Comando para iniciar
CMD ["node", "server.js"]
