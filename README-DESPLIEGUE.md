# 🚀 INICIO RÁPIDO - FITGENIUS AI

## ⚡ Resumen en 5 Minutos

### 📋 Lo que necesitas:
1. Cuenta en Railway (https://railway.app)
2. Cuenta en Netlify (https://app.netlify.com)
3. API Key de Gemini (https://makersuite.google.com/app/apikey)

---

## 🎯 PASOS RÁPIDOS

### 1️⃣ Railway (Backend + Base de Datos) - 5 minutos

```
1. Ve a https://railway.app
2. New Project > Empty Project
3. + New > Database > MySQL
4. + New > GitHub Repo > Selecciona tu repo
5. Configura Root Directory: /server
6. En Backend > Variables, agrega:
   - GEMINI_API_KEY = tu_key_aqui
   - PORT = 3001
   - RAILWAY_ENVIRONMENT = production
7. Settings > Networking > Generate Domain
8. COPIA LA URL: https://xxx.up.railway.app
```

### 2️⃣ Netlify (Frontend) - 3 minutos

```
1. Ve a https://app.netlify.com
2. Add new site > Import from Git > GitHub
3. Configura:
   - Build command: npm run build
   - Publish directory: dist
4. Site settings > Environment variables > Add:
   - VITE_API_URL = https://xxx.up.railway.app/api
5. Deploys > Trigger deploy
```

### 3️⃣ Actualizar Código Local - 1 minuto

```powershell
# Edita .env.production
VITE_API_URL=https://tu-url-railway.up.railway.app/api

# Guarda y sube a GitHub
git add .env.production
git commit -m "Update Railway URL"
git push
```

---

## ✅ Verificación

1. **Railway Logs**: Busca "✅ Gemini AI inicializado correctamente"
2. **Test API**: Abre `https://tu-backend.up.railway.app/api/members` → Debe responder JSON
3. **Netlify**: Tu sitio debe cargar
4. **Generar Rutina**: Debe funcionar sin errores
5. **Generar Dieta**: Debe funcionar sin errores

---

## 🆘 Si algo falla

### ❌ Rutinas/Dietas no se generan
- Lee: **SOLUCION-RUTINAS-DIETAS.md**

### ❌ Error de conexión a BD
- Verifica que MySQL esté activo en Railway (luz verde)
- Verifica que `DATABASE_URL` exista en Backend > Variables

### ❌ Error "GEMINI_API_KEY no configurada"
- Agrega la variable en Railway > Backend > Variables

### ❌ Frontend no se comunica con Backend
- Verifica que `VITE_API_URL` en Netlify termine en `/api`
- Verifica que apunte a tu URL de Railway

---

## 📚 Documentación Completa

- **Configuración detallada**: CONFIGURACION-RAILWAY.md
- **Variables de entorno**: VARIABLES-ENTORNO.md
- **Solución de problemas**: SOLUCION-RUTINAS-DIETAS.md
- **Script de despliegue**: DEPLOY-COMPLETO.ps1
- **Pruebas locales**: TEST-LOCAL.ps1

---

## 🎯 CHECKLIST RÁPIDO

### Railway:
- [ ] MySQL creado y activo
- [ ] Backend conectado a GitHub
- [ ] Root Directory = `/server`
- [ ] `GEMINI_API_KEY` configurada
- [ ] `DATABASE_URL` existe (automática)
- [ ] Dominio público generado
- [ ] Logs muestran "Gemini AI inicializado"

### Netlify:
- [ ] Sitio conectado a GitHub
- [ ] Build settings correctos
- [ ] `VITE_API_URL` configurada con Railway URL
- [ ] Deploy exitoso

### Prueba Final:
- [ ] Backend responde en: `https://xxx.up.railway.app/api/members`
- [ ] Frontend carga correctamente
- [ ] Crear cuenta funciona
- [ ] Guardar perfil funciona
- [ ] Generar rutina funciona ✅
- [ ] Generar dieta funciona ✅

---

## 🎉 ¡Listo!

Si todos los checks están ✅, tu aplicación está 100% funcional con:
- Base de datos independiente en la nube (Railway MySQL)
- Backend Node.js en Railway
- Frontend React en Netlify
- IA generando rutinas y dietas personalizadas

**¡Disfruta tu app!** 🏋️‍♀️🥗
