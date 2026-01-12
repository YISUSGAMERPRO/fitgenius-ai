# FitGenius AI - Guía de Despliegue

## 🚀 Desplegar en Railway (Backend + Base de Datos)

### Paso 1: Crear proyecto en Railway
1. Ve a [railway.app](https://railway.app) y crea cuenta
2. Clic en "New Project" → "Deploy MySQL"
3. Espera a que la base de datos esté lista

### Paso 2: Configurar Base de Datos
1. En Railway, ve a tu servicio MySQL
2. Copia las credenciales: `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`
3. Ve a la pestaña "Query" y ejecuta el contenido de `server/init-db.sql`

### Paso 3: Desplegar Backend
1. En Railway, clic en "New" → "GitHub Repo" (o "Empty Service")
2. Si usas GitHub:
   - Conecta tu repositorio
   - Selecciona la carpeta `server` como root directory
3. Si usas Empty Service:
   - Instala Railway CLI: `npm install -g @railway/cli`
   - En terminal: `cd server` → `railway link` → `railway up`

### Paso 4: Variables de Entorno (Backend)
En Railway, ve a tu servicio backend → Variables → Add:
```
DB_HOST=<MYSQLHOST de Railway>
DB_USER=<MYSQLUSER de Railway>
DB_PASSWORD=<MYSQLPASSWORD de Railway>
DB_NAME=<MYSQLDATABASE de Railway>
PORT=3001
GEMINI_API_KEY=tu_api_key_de_gemini
```

### Paso 5: Obtener URL del Backend
1. Railway genera una URL pública (ej: `https://tu-app.railway.app`)
2. Copia esta URL

---

## 🌐 Desplegar Frontend en Netlify

### Paso 1: Actualizar URL del Backend
1. Abre `services/api.ts`
2. Cambia `http://localhost:3001` por tu URL de Railway

### Paso 2: Desplegar en Netlify
**Opción A - Con GitHub:**
1. Sube tu código a GitHub
2. Ve a [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
3. Selecciona tu repositorio
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

**Opción B - Despliegue directo:**
1. Ejecuta: `npm run build`
2. En Netlify: "Deploy manually" → Arrastra carpeta `dist`

### Paso 3: Variables de Entorno (Frontend)
En Netlify → Site settings → Environment variables:
```
VITE_API_URL=https://tu-backend.railway.app
```

---

## 🎯 Alternativas de Despliegue

### Backend + BD:
- **Railway** ✅ (Recomendado - 500MB MySQL gratis)
- **Render** (PostgreSQL gratis, MySQL de pago)
- **DigitalOcean App Platform** ($5/mes)
- **AWS EC2 + RDS** (más complejo)

### Frontend:
- **Netlify** ✅ (Recomendado - 100GB/mes gratis)
- **Vercel** (Excelente para React)
- **GitHub Pages** (solo sitios estáticos)
- **Cloudflare Pages**

### Base de Datos MySQL:
- **Railway** ✅ (500MB gratis)
- **PlanetScale** (5GB gratis, compatible con MySQL)
- **ClearDB** (Addon para Heroku)
- **FreeSQLDatabase** (pequeño, para pruebas)

---

## ✅ Checklist Pre-Despliegue

- [ ] Variables de entorno configuradas (.env en backend)
- [ ] Base de datos inicializada (ejecutar init-db.sql)
- [ ] URL del backend actualizada en frontend
- [ ] Build del frontend exitoso (`npm run build`)
- [ ] Probar endpoints: `/api/login`, `/api/register`, `/api/profile/:userId`
- [ ] API Key de Gemini configurada
- [ ] CORS configurado para tu dominio de producción

---

## 🔒 Seguridad en Producción

1. **En server.js**, actualiza CORS:
```javascript
const corsOptions = {
  origin: ['https://tu-dominio.netlify.app'],
  credentials: true
};
app.use(cors(corsOptions));
```

2. **Hashear contraseñas** (instala bcrypt):
```bash
cd server
npm install bcrypt
```

3. **Variables sensibles**: Nunca subas `.env` a GitHub
