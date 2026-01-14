# 🔧 Configurar Variables de Entorno

## Tu Connection String de Neon:
```
postgresql://neondb_owner:npg_VGp3WBR4ncHO@ep-flat-butterfly-ahtr9wbs-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## 📦 1. RAILWAY (Backend)

1. Ve a: https://railway.app
2. Selecciona tu proyecto **fitgenius-ai**
3. Haz clic en tu servicio backend
4. Ve a la pestaña **"Variables"**
5. Agrega o actualiza esta variable:

**Nombre:** `NETLIFY_DATABASE_URL_UNPOOLED`  
**Valor:** `postgresql://neondb_owner:npg_VGp3WBR4ncHO@ep-flat-butterfly-ahtr9wbs-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

6. Haz clic en **"Add"** o **"Update"**
7. Railway redesplegará automáticamente

---

## 🌐 2. NETLIFY (Frontend)

1. Ve a: https://app.netlify.com
2. Selecciona tu sitio **ubiquitous-phoenix-9851dd**
3. Ve a **Site configuration** → **Environment variables**
4. Agrega o actualiza estas variables:

### Variable 1:
**Key:** `NETLIFY_DATABASE_URL_UNPOOLED`  
**Value:** `postgresql://neondb_owner:npg_VGp3WBR4ncHO@ep-flat-butterfly-ahtr9wbs-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

### Variable 2:
**Key:** `VITE_API_DATABASE_URL`  
**Value:** `postgresql://neondb_owner:npg_VGp3WBR4ncHO@ep-flat-butterfly-ahtr9wbs-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

5. Haz clic en **"Save"**
6. Ve a **Deploys** → **Trigger deploy** → **Deploy site**

---

## ✅ Verificar que funciona

Una vez configuradas las variables:

1. **Railway**: Verifica que el despliegue se completó sin errores
2. **Netlify**: Espera a que el redespliegue termine (1-2 minutos)
3. **Prueba tu app**: https://ubiquitous-phoenix-9851dd.netlify.app
   - Crea una cuenta nueva
   - Completa tu perfil
   - Recarga la página → Deberías seguir con sesión activa
   - Los datos deberían guardarse en la base de datos

---

## 🐛 Si algo falla

**Error de conexión a BD:**
- Verifica que copiaste el connection string completo (incluye `?sslmode=require&channel_binding=require`)
- Asegúrate de que no haya espacios antes/después del string

**La sesión no se guarda:**
- Verifica en la consola del navegador (F12) si hay errores
- Chequea los logs de Railway para ver si hay errores de conexión

**Pantalla azul en dieta:**
- Verifica que `GEMINI_API_KEY` esté configurada en ambos servicios
- Revisa los logs de Netlify Functions
