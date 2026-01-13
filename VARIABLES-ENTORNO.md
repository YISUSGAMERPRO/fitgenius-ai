# ⚡ GUÍA RÁPIDA - VARIABLES DE ENTORNO

## 📦 RAILWAY (Backend)

### ✅ Variables OBLIGATORIAS en el servicio de Backend:

```env
GEMINI_API_KEY=tu_api_key_de_google_gemini
PORT=3001
RAILWAY_ENVIRONMENT=production
```

### 🔗 Obtener API Keys:
- **Gemini API**: https://makersuite.google.com/app/apikey

---

## 🌐 NETLIFY (Frontend)

### ✅ Variables OBLIGATORIAS en Netlify:

```env
VITE_API_URL=https://tu-backend.up.railway.app/api
```

> ⚠️ **IMPORTANTE**: Debe terminar en `/api`

---

## 🗄️ BASE DE DATOS

### ✅ Railway crea automáticamente:

Railway enlaza automáticamente la base de datos MySQL con tu backend usando `DATABASE_URL`. 

**NO necesitas configurar manualmente**:
- ❌ DB_HOST
- ❌ DB_PORT
- ❌ DB_USER
- ❌ DB_PASSWORD
- ❌ DB_NAME
- ❌ DATABASE_URL

Railway lo hace por ti cuando agregas MySQL al proyecto.

---

## 🔍 VERIFICACIÓN RÁPIDA

### Backend (Railway):

1. Ve a: https://railway.app
2. Tu proyecto > Backend service > **Variables**
3. Deberías ver:
   ```
   ✅ GEMINI_API_KEY
   ✅ PORT
   ✅ RAILWAY_ENVIRONMENT
   ✅ DATABASE_URL (automática)
   ```

### Frontend (Netlify):

1. Ve a: https://app.netlify.com
2. Tu sitio > Site settings > **Environment variables**
3. Deberías ver:
   ```
   ✅ VITE_API_URL
   ```

---

## 🚨 SOLUCIÓN RÁPIDA DE PROBLEMAS

### ❌ "GEMINI_API_KEY no está configurada"
**Solución**: Agregar `GEMINI_API_KEY` en Railway > Backend > Variables

### ❌ "Cannot connect to database"
**Solución**: 
1. Verifica que el servicio MySQL esté activo
2. Ve a Backend > Variables > Verifica que existe `DATABASE_URL`
3. Si no existe: Settings > Variables > Reference > MySQL > DATABASE_URL

### ❌ "Network Error" o "Failed to fetch"
**Solución**: 
1. Verifica que `VITE_API_URL` en Netlify apunte a tu Railway URL
2. Debe ser: `https://xxx.up.railway.app/api` (con `/api` al final)
3. Debe ser HTTPS, no HTTP

### ❌ Rutinas/Dietas no se generan
**Causas**:
1. API Key inválida → Regenerar en Google AI Studio
2. Variable no configurada → Agregar en Railway
3. Límite de cuota → Verificar en Google Cloud Console

---

## 📝 CHECKLIST FINAL

### Railway:
- [ ] Servicio MySQL creado y activo (verde)
- [ ] Servicio Backend desplegado y activo (verde)
- [ ] `GEMINI_API_KEY` configurada en Backend
- [ ] `PORT` configurada en Backend
- [ ] `RAILWAY_ENVIRONMENT` configurada en Backend
- [ ] `DATABASE_URL` existe (automática)
- [ ] Dominio público generado en Backend

### Netlify:
- [ ] Sitio conectado a GitHub
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] `VITE_API_URL` configurada
- [ ] Deploy exitoso (verde)

### Archivos Locales:
- [ ] `.env.production` tiene la URL correcta de Railway
- [ ] `server/.env` tiene credenciales (solo para desarrollo local)

---

## 🎯 PASOS SIGUIENTES

1. **Actualizar URL de Railway**:
   ```bash
   # Edita .env.production
   VITE_API_URL=https://TU-URL-REAL.up.railway.app/api
   ```

2. **Redesplegar Frontend**:
   ```bash
   npm run build
   git add .
   git commit -m "Update Railway URL"
   git push
   ```

3. **Probar la aplicación**:
   - Ir a tu sitio de Netlify
   - Crear cuenta
   - Completar perfil
   - Generar rutina → Debe funcionar ✅
   - Generar dieta → Debe funcionar ✅

---

## 📞 SOPORTE

Si algo no funciona:
1. Revisa los logs de Railway: Backend service > Deployments > Latest > View logs
2. Revisa los logs de Netlify: Deploys > Latest deploy > View logs
3. Abre la consola del navegador (F12) y busca errores
