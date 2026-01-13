FROM node:22

# Forzar rebuild: 2026-01-13-v2
WORKDIR /app

# Copiar todo el proyecto
COPY . .

# Cambiar al directorio del servidor
WORKDIR /app/server

# Instalar dependencias
RUN npm ci --production

# Exponer puerto
EXPOSE 3001

# Comando para iniciar
CMD ["node", "server.js"]
