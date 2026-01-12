# 🚀 DESPLIEGUE ACTUALIZADO - FITGENIUS AI

## ✅ CAMBIOS IMPLEMENTADOS

### Backend (Railway)
- ✅ Integración con Gemini AI para generación de rutinas y dietas
- ✅ 4 nuevos endpoints:
  - `POST /api/generate-workout` - Genera rutinas
  - `POST /api/generate-diet` - Genera dietas
  - `GET /api/workout/:userId` - Obtiene rutina guardada
  - `GET /api/diet/:userId` - Obtiene dieta guardada
- ✅ 2 nuevas tablas en MySQL:
  - `workout_plans` - Almacena rutinas
  - `diet_plans` - Almacena dietas

### Frontend (Netlify)
- ✅ Actualizado para usar API del servidor
- ✅ Cache optimizado para mejor rendimiento

---

## 📋 PASOS PARA DESPLEGAR

### 1️⃣ ACTUALIZAR RAILWAY (Backend)

#### A. Agregar Variables de Entorno
1. Ve a https://railway.app
2. Abre tu proyecto FitGenius
3. Click en el servicio **Backend** (Node.js)
4. Ve a la pestaña **"Variables"**
5. Agrega estas 2 nuevas variables:

```
GEMINI_API_KEY = AIzaSyBZcPx4viYy7C7EVwT0bBr_x71qtCXR9Ck
RAILWAY_ENVIRONMENT = production
```

6. Railway se reiniciará automáticamente (espera 1-2 minutos)

#### B. Crear Nuevas Tablas en MySQL
**OPCIÓN 1 - Desde Railway Web (Recomendado):**
1. En Railway, click en el servicio **MySQL**
2. Click en la pestaña **"Query"**
3. Copia y pega el contenido de `server/update-railway-tables.sql`
4. Ejecuta el script

**OPCIÓN 2 - Desde terminal local:**
```bash
cd server
railway run mysql -u root -pRyfUFsHvrSJwQmnIJFNBEwlMpSRduxJR -h nozomi.proxy.rlwy.net -P 38903 railway < update-railway-tables.sql
```

#### C. Desplegar Código Actualizado
```bash
git add .
git commit -m "feat: Agregar generación de rutinas/dietas con IA en servidor"
git push origin main
```

Railway detectará el push y desplegará automáticamente.

---

### 2️⃣ ACTUALIZAR NETLIFY (Frontend)

#### A. Verificar Variables de Entorno
1. Ve a https://app.netlify.com
2. Abre tu sitio FitGenius
3. Ve a **Site settings** → **Environment variables**
4. Verifica que exista:
```
VITE_API_URL = https://fitgenius-backend-production.up.railway.app/api
```

#### B. Re-desplegar
Si ya hiciste push a GitHub, Netlify se actualizará automáticamente.

Si no, puedes desplegar manualmente:
```bash
npm run build
netlify deploy --prod
```

---

## 🧪 VERIFICAR QUE TODO FUNCIONA

### 1. Verifica el Backend (Railway)
```bash
curl https://fitgenius-backend-production.up.railway.app/api/members
```

Deberías ver respuesta JSON.

### 2. Verifica en la App
1. Abre tu app en Netlify
2. Inicia sesión
3. Ve a **Workout View** y genera una rutina
4. Ve a **Diet View** y genera una dieta
5. Las rutinas/dietas deben:
   - ✅ Generarse correctamente
   - ✅ Guardarse en la base de datos
   - ✅ Persistir al recargar la página

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Servicio de IA no disponible"
**Causa:** GEMINI_API_KEY no está configurada en Railway
**Solución:** Agrega la variable en Railway (Ver Paso 1A)

### Error: "Cannot find table workout_plans"
**Causa:** No se crearon las nuevas tablas
**Solución:** Ejecuta el script SQL (Ver Paso 1B)

### Error de CORS
**Causa:** Railway no permite peticiones desde Netlify
**Solución:** Ya está configurado con `app.use(cors())` en server.js

---

## 📊 ARQUITECTURA FINAL

```
┌─────────────────────────────────────────────────┐
│           NETLIFY (Frontend)                    │
│  https://fitgenius.netlify.app                  │
│                                                  │
│  - React + Vite                                 │
│  - Llama a API de Railway                       │
└──────────────────┬──────────────────────────────┘
                   │
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────┐
│         RAILWAY (Backend)                       │
│  https://fitgenius-backend-production...        │
│                                                  │
│  - Node.js + Express                            │
│  - Gemini AI Integration                        │
│  - 4 endpoints de generación IA                 │
└──────────────────┬──────────────────────────────┘
                   │
                   │ MySQL
                   ▼
┌─────────────────────────────────────────────────┐
│         RAILWAY MySQL                           │
│                                                  │
│  - users                                        │
│  - user_profiles                                │
│  - gym_members                                  │
│  - workout_plans ← NUEVO                        │
│  - diet_plans ← NUEVO                           │
└─────────────────────────────────────────────────┘
```

---

## 🎯 RESULTADO ESPERADO

✅ **Local (Desarrollo):**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- MySQL: localhost:3306

✅ **Producción:**
- Frontend: https://fitgenius.netlify.app
- Backend: https://fitgenius-backend-production.up.railway.app
- MySQL: Railway (interno)

✅ **Funcionalidades:**
- Rutinas generadas con IA → Guardadas en BD
- Dietas generadas con IA → Guardadas en BD
- Datos persisten entre sesiones
- Cache inteligente para mejor rendimiento

---

**¿Todo listo? ¡Despliega y prueba tu app! 🚀**
