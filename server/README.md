# FitGenius AI - Backend Server

Backend Node.js + Express + MySQL para FitGenius AI.

## 🚂 Despliegue en Railway

### Variables de Entorno Requeridas:

```
DB_HOST=<host_de_mysql_railway>
DB_USER=<usuario_mysql>
DB_PASSWORD=<password_mysql>
DB_NAME=<nombre_db>
PORT=3001
GEMINI_API_KEY=<tu_api_key>
```

### Configuración de Base de Datos:

1. Después de crear el servicio MySQL en Railway
2. Ve a la pestaña "Query" en MySQL
3. Ejecuta el contenido del archivo `init-db.sql`

### Comandos:

- **Desarrollo:** `npm run dev`
- **Producción:** `npm start`

## 📦 Dependencias

- express
- mysql2
- cors
- compression
- dotenv
- pdfkit
