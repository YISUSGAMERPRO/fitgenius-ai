# 🚀 GUÍA DE ACTIVACIÓN RAILWAY - FITGENIUS AI

## ✅ LO QUE SE HA HECHO

Tu código ya está actualizado y listo en la rama `main`. Ahora solo necesitas:
1. ✅ Agregar 2 variables de entorno en Railway
2. ✅ Ejecutar un script SQL
3. ✅ Verificar que funciona

**Tiempo total: 5 minutos**

---

## 🎯 PASO A PASO

### PASO 1: Agregar Variables de Entorno

#### 1.1 - Abre Railway
- Ve a https://railway.app
- Inicia sesión con tu cuenta

#### 1.2 - Abre tu Proyecto
- Click en "FitGenius"
- Click en el servicio **Backend** (Node.js)
  - ⚠️ **NO click en MySQL**, click en **Backend**

#### 1.3 - Ir a Variables
- Click en la pestaña **"Variables"**
- Verás algo como:
  ```
  NODE_ENV        production
  PORT            3001
  ```

#### 1.4 - Agregar GEMINI_API_KEY
- Click en **"Add Variable"** (botón verde)
- Name: `GEMINI_API_KEY`
- Value: `AIzaSyBZcPx4viYy7C7EVwT0bBr_x71qtCXR9Ck`
- Click en ✅ (checkmark)

#### 1.5 - Agregar RAILWAY_ENVIRONMENT
- Click nuevamente en **"Add Variable"**
- Name: `RAILWAY_ENVIRONMENT`
- Value: `production`
- Click en ✅ (checkmark)

**✅ Railway se reiniciará automáticamente (espera 1-2 minutos)**

---

### PASO 2: Ejecutar Script SQL

#### 2.1 - Abre MySQL en Railway
- En Railway.app
- Click en el servicio **MySQL**
- Click en la pestaña **"Query"**

#### 2.2 - Copiar Script SQL
Copia TODO el código SQL de abajo:

```sql
USE railway;

CREATE TABLE IF NOT EXISTS workout_plans (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(100),
    estimated_duration VARCHAR(100),
    difficulty VARCHAR(50),
    duration_weeks INT,
    plan_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_workout (user_id),
    INDEX idx_created (created_at)
);

CREATE TABLE IF NOT EXISTS diet_plans (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_calories_per_day INT,
    plan_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_diet (user_id),
    INDEX idx_created_diet (created_at)
);

SHOW TABLES;
```

#### 2.3 - Ejecutar
- Pega el código en el editor de Query
- Click en **"Run Query"** (botón azul)
- Deberías ver las 5 tablas al final:
  ```
  users
  user_profiles
  gym_members
  workout_plans ← NUEVA
  diet_plans ← NUEVA
  ```

✅ Si ves estas tablas = está correcto

---

### PASO 3: Verificar que Funciona

#### 3.1 - Abre tu App
- Ve a https://fitgenius.netlify.app
- Inicia sesión

#### 3.2 - Genera una Rutina
1. Click en **"Workout View"**
2. Click en **"Generar Rutina"**
3. Selecciona un tipo (ej: "Full Body")
4. Click en **"Generar"**
5. Espera 15-20 segundos
6. Deberías ver una rutina completa

#### 3.3 - Prueba de Persistencia
1. Recarga la página (F5)
2. La rutina sigue ahí ✅
3. Los datos se guardaron en la BD

#### 3.4 - Genera una Dieta
1. Click en **"Diet View"**
2. Selecciona tipo (ej: "Déficit Calórico")
3. Click en **"Generar"**
4. Espera 15-20 segundos
5. Deberías ver una dieta completa

**✅ SI VES RUTINAS Y DIETAS = TODO FUNCIONA**

---

## 🐛 Solución de Problemas

### Error: "Servicio de IA no disponible"
**Causa:** Las variables de entorno no se agregaron correctamente

**Solución:**
1. Ve a Railway → Backend → Variables
2. Verifica que existan:
   - `GEMINI_API_KEY` = `AIzaSyBZcPx4viYy7C7EVwT0bBr_x71qtCXR9Ck`
   - `RAILWAY_ENVIRONMENT` = `production`
3. Espera 2 minutos y recarga la app

### Error: "Cannot find table workout_plans"
**Causa:** No se ejecutó el script SQL

**Solución:**
1. Abre Railway → MySQL → Query
2. Ejecuta el script SQL (ver Paso 2.2)
3. Verifica que aparezcan las 5 tablas
4. Recarga la app

### Error: "Connection refused"
**Causa:** Railway Backend no está corriendo

**Solución:**
1. Ve a Railway → Backend → Deployments
2. Verifica que haya un ✅ verde
3. Si no, click en el último despliegue y revisa los logs

---

## 📊 Verificación Final

Después de completar los pasos, tu arquitectura debe ser:

```
┌─────────────────────────────┐
│  NETLIFY (Frontend)         │
│  https://fitgenius...       │
├─────────────────────────────┤
│  - React + Vite             │
│  - Llama API de Railway     │
└──────────────┬──────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────┐
│  RAILWAY (Backend)          │
│  Node.js + Gemini AI        │
├─────────────────────────────┤
│  Variables:                 │
│  ✅ GEMINI_API_KEY          │
│  ✅ RAILWAY_ENVIRONMENT     │
│  ✅ DB_HOST                 │
│  ✅ DB_USER                 │
│  ✅ DB_PASSWORD             │
└──────────────┬──────────────┘
               │ MySQL
               ▼
┌─────────────────────────────┐
│  RAILWAY MySQL              │
├─────────────────────────────┤
│  ✅ users                   │
│  ✅ user_profiles           │
│  ✅ gym_members             │
│  ✅ workout_plans (NUEVO)   │
│  ✅ diet_plans (NUEVO)      │
└─────────────────────────────┘
```

---

## ✅ RESULTADO ESPERADO

Después de completar todo:

✅ Puedes generar rutinas con IA en el servidor  
✅ Puedes generar dietas con IA en el servidor  
✅ Los datos se guardan automáticamente en MySQL  
✅ Los datos persisten entre sesiones  
✅ Funciona en cualquier dispositivo/navegador  

---

## 🎓 ¿QUÉ SE HA HECHO EN EL CÓDIGO?

### Backend (server.js)
- ✅ Integración con Gemini AI
- ✅ 4 nuevos endpoints:
  - `POST /api/generate-workout`
  - `POST /api/generate-diet`
  - `GET /api/workout/:userId`
  - `GET /api/diet/:userId`

### Frontend (React)
- ✅ Actualizado WorkoutView para usar API
- ✅ Actualizado DietView para usar API
- ✅ Cache inteligente (5 minutos)

### Base de Datos
- ✅ 2 nuevas tablas: `workout_plans` y `diet_plans`

---

## 💬 ¿Preguntas?

Si algo no funciona:
1. Revisa los logs en Railway: Backend → Deployments → Ver logs
2. Verifica que las variables estén en Railway
3. Verifica que las tablas estén en MySQL
4. Recarga la página (puede tomar 2 minutos después de cambios)

---

**¡Listo! Tu app está lista para usar IA de forma profesional! 🚀**
