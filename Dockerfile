FROM node:22-slim

# FORCE REBUILD: 2026-01-13-17:00:00
WORKDIR /app

# Copiar package files primero
COPY server/package*.json ./

# Debug: mostrar archivos copiados
RUN ls -la

# Instalar dependencias
RUN npm install && npm list --depth=0

# Debug: verificar node_modules
RUN ls -la node_modules | head -20

# Copiar código del servidor
COPY server/ ./

# Debug: verificar archivos finales
RUN ls -la

# Exponer puerto
EXPOSE 3001

# Comando para iniciar
CMD ["node", "server.js"]
