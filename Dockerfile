FROM node:22-slim

# INVALIDATE CACHE: 2026-01-13-22:01:30-FINAL
WORKDIR /app

# Limpiar cualquier cache de npm
RUN npm cache clean --force

# Copiar package files primero
COPY server/package*.json ./

# Debug: mostrar package.json completo
RUN cat package.json

# Instalar dependencias SIN cache
RUN npm install --no-cache && npm list --depth=0

# Debug: verificar node_modules
RUN ls -la node_modules | head -30

# Copiar código del servidor
COPY server/ ./

# Debug: verificar archivos finales
RUN ls -la

# Exponer puerto
EXPOSE 3001

# Comando para iniciar
CMD ["node", "server.js"]
