# 🚀 GUÍA PARA EJECUTAR FITGENIUS - SOLUCIÓN COMPLETA

## ⚠️ PROBLEMA IDENTIFICADO

Tu servidor estaba usando **dos bases de datos diferentes**:
- **Local (XAMPP MySQL)** para las pruebas en desarrollo
- **Neon PostgreSQL** en producción

Por eso **no se guardaban los datos**. El servidor no sabía a cuál base de datos guardar.

---

## ✅ SOLUCIÓN IMPLEMENTADA

1. **Copiamos `.env` a `/server`** para que `dotenv` lo cargue correctamente
2. **Agregamos endpoint POST `/api/members`** para guardar miembros en la BD
3. **Agregamos inicialización automática de tablas** en PostgreSQL
4. **Mejoramos el servidor para usar siempre PostgreSQL/Neon**

---

## 🎯 CÓMO EJECUTAR AHORA

### Opción 1: Usando PowerShell (RECOMENDADO)
```powershell
.\RUN-SERVER.ps1
```

Este script automáticamente:
- ✅ Verifica que `.env` esté en `/server`
- ✅ Instala dependencias si falta `node_modules`
- ✅ Ejecuta `npm start` (que corre `server-neon.js`)
- ✅ Muestra las variables de entorno cargadas

### Opción 2: Manual
```bash
cd server
npm install
npm start
```

### Opción 3: Usando Node directamente
```bash
cd server
node --watch server-neon.js
```

---

## 📋 VERIFICAR QUE TODO FUNCIONA

### 1️⃣ Health Check
```
GET http://localhost:3001/api/health
```
Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2026-01-14T..."
}
```

### 2️⃣ Probar Gemini
```
GET http://localhost:3001/api/test-gemini
```

### 3️⃣ Ver Estadísticas de BD
```
GET http://localhost:3001/api/admin/database-stats
```
Te mostrará cuántos usuarios, perfiles, rutinas y dietas hay.

### 4️⃣ Guardar un Miembro (NUEVO)
```
POST http://localhost:3001/api/members
Content-Type: application/json

{
  "id": "member-123",
  "name": "Juan Pérez",
  "plan": "Premium",
  "status": "Activo",
  "lastPaymentDate": "2026-01-14",
  "lastPaymentAmount": 50,
  "subscriptionEndDate": "2026-02-14"
}
```

---

## 🔧 CONFIGURACIÓN DE BASE DE DATOS

Tu archivo `.env` debe tener:
```
DATABASE_URL=postgresql://neondb_owner:npg_b3qTerlAm9uU@ep-noisy-thunder-ael66t3m-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
GEMINI_API_KEY=AIzaSyBZcPx4viYy7C7EVwT0bBr_x71qtCXR9Ck
PORT=3001
```

Si necesitas cambiar la BD:
1. Actualiza `DATABASE_URL` en `.env`
2. Copia el `.env` a `/server` (o ejecuta `RUN-SERVER.ps1`)
3. Reinicia el servidor

---

## 🗄️ TABLAS CREADAS AUTOMÁTICAMENTE

El servidor ahora crea estas tablas automáticamente en PostgreSQL:

1. **users** - Usuarios registrados
2. **user_profiles** - Perfiles de usuario (edad, peso, meta, etc.)
3. **gym_members** - Miembros del gimnasio
4. **workout_plans** - Planes de entrenamiento
5. **diet_plans** - Planes de dieta

Si quieres crearlas manualmente en Neon, usa el archivo:
```
server/INIT-NEON-DB.sql
```

---

## 🐛 DEBUGGING

Si tienes errores, revisa:

### 1. ¿DATABASE_URL está cargada?
```
GET http://localhost:3001/api/health
```
Si ves errores de conexión, verifica que `.env` esté en `/server`

### 2. Ver los logs del servidor
Ejecuta con:
```
npm run dev
```
Verás todos los mensajes de conexión y errores en tiempo real.

### 3. Verificar que las tablas existan
```
GET http://localhost:3001/api/admin/database-stats
```
Te mostrará cuántas filas hay en cada tabla.

---

## ✨ RESUMEN DE CAMBIOS

| Cambio | Archivo | Descripción |
|--------|---------|-------------|
| 🆕 Endpoint POST /api/members | `server-neon.js` | Ahora puedes guardar miembros |
| 🆕 Inicialización automática | `server-neon.js` | Las tablas se crean al inicio |
| 📋 Script de ejecución | `RUN-SERVER.ps1` | Script PowerShell para ejecutar fácil |
| 📄 Script SQL | `server/INIT-NEON-DB.sql` | Inicialización manual si lo necesitas |
| ✅ .env en /server | `server/.env` | dotenv ahora lo carga correctamente |

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Por qué no se guardaban los datos?**
R: El servidor estaba usando MySQL local en lugar de PostgreSQL/Neon, y además le faltaba el endpoint para guardar miembros.

**P: ¿Debo cambiar mi código frontend?**
R: No, todo funciona igual. El endpoint es: `POST /api/members` (igual que antes).

**P: ¿Dónde están mis datos antiguos?**
R: Probablemente en la base de datos local de XAMPP (`fitgenius_db`). Si los necesitas, puedo ayudarte a migrarlos.

**P: ¿Esto funciona en Railway/Producción?**
R: Sí, el servidor automáticamente detecta `DATABASE_URL` y se conecta a Neon en producción.

---

## 🚀 PRÓXIMOS PASOS

1. Ejecuta `.\RUN-SERVER.ps1`
2. Prueba guardar un miembro con Postman/Thunder Client
3. Verifica que aparezca en `/api/admin/database-stats`
4. ¡Disfruta de tu app funcional! 🎉
