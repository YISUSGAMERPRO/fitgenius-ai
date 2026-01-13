FROM node:22-alpine

WORKDIR /app

# Copiar todo el proyecto
COPY . .

# Cambiar al directorio del servidor
WORKDIR /app/server

# Mostrar contenido para debugging
RUN ls -la

# Instalar dependencias (sin --production para asegurar que todo se instala)
RUN npm install

# Mostrar que node_modules existe
RUN ls -la node_modules | head -20

# Exponer puerto
EXPOSE 3001

# Comando para iniciar
CMD ["node", "server.js"]
