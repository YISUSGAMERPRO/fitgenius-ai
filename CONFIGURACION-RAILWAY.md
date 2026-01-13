# 🚂 Configuración Completa de Railway para FitGenius AI

## 📋 Índice
1. [Crear Proyecto en Railway](#paso-1-crear-proyecto)
2. [Configurar Base de Datos MySQL](#paso-2-mysql)
3. [Configurar Backend](#paso-3-backend)
4. [Variables de Entorno](#paso-4-variables)
5. [Verificar Despliegue](#paso-5-verificar)
6. [Solución de Problemas](#solución-de-problemas)

---

## Paso 1: Crear Proyecto

### 1.1 Iniciar Sesión
1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Click en "New Project"

### 1.2 Elegir Template
- Selecciona **"Empty Project"** o **"Deploy from GitHub repo"**

---

## Paso 2: MySQL

### 2.1 Agregar Base de Datos
1. En tu proyecto, click **"+ New"**
2. Selecciona **"Database"**
3. Elige **"Add MySQL"**
4. Railway automáticamente la creará y configurará

### 2.2 Obtener Credenciales
1. Click en el servicio **MySQL**
2. Ve a la pestaña **"Variables"**
3. Verás estas variables automáticamente creadas:
   ```
   MYSQLHOST
   MYSQLPORT
   MYSQLUSER
   MYSQLPASSWORD
   MYSQLDATABASE
   MYSQL_URL
   DATABASE_URL  ← Esta es la importante
   ```

### 2.3 Conectar Base de Datos (Opcional - Railway lo hace automáticamente)
1. En el servicio de Backend
2. Ve a **Settings > Service Variables**
3. Click en **"+ New Variable > Reference"**
4. Selecciona el servicio MySQL > DATABASE_URL
5. Railway automáticamente enlazará las bases de datos

> ⚠️ **IMPORTANTE**: Railway automáticamente expone `DATABASE_URL` a todos los servicios. No necesitas configurarla manualmente.

---

## Paso 3: Backend

### 3.1 Opción A: Desplegar desde GitHub (Recomendado)

1. En tu proyecto de Railway, click **"+ New"**
2. Selecciona **"GitHub Repo"**
3. Conecta tu repositorio de FitGenius AI
4. **Importante**: Configura el **Root Directory**:
   - Settings > Service Settings > Root Directory
   - Cambia a: `/server`

### 3.2 Opción B: Desplegar usando Railway CLI

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Dentro de la carpeta server/
cd server
railway link   # Selecciona tu proyecto
railway up     # Despliega el backend
```

### 3.3 Configurar Build
Railway detecta automáticamente Node.js. Si necesitas personalizarlo:

1. Settings > Deploy
2. Build Command: `npm install`
3. Start Command: `npm start` o `node server.js`

---

## Paso 4: Variables

### 4.1 Variables Requeridas en el Servicio BACKEND

Ve al servicio de **Backend** (no MySQL) > **Variables** > **+ New Variable**

Agrega estas **3 variables obligatorias**:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `GEMINI_API_KEY` | `tu_api_key_aqui` | API de Google Gemini para IA |
| `PORT` | `3001` | Puerto del servidor (Railway lo asigna automáticamente, pero por claridad) |
| `RAILWAY_ENVIRONMENT` | `production` | Indica que está en producción |

> 🔑 **Obtener GEMINI_API_KEY**: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

### 4.2 Variables Automáticas de Railway

Railway crea automáticamente:
- ✅ `DATABASE_URL` - Conexión automática a MySQL
- ✅ `PORT` - Puerto asignado por Railway
- ✅ `RAILWAY_STATIC_URL` - URL pública del servicio
- ✅ `RAILWAY_PUBLIC_DOMAIN` - Dominio público

### 4.3 Variables Opcionales (Solo si no usa DATABASE_URL)

Si prefieres configurar manualmente la base de datos:

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `DB_HOST` | `containers-us-west-xxx.railway.app` | Host de MySQL |
| `DB_PORT` | `5432` | Puerto de MySQL |
| `DB_USER` | `root` | Usuario de MySQL |
| `DB_PASSWORD` | `contraseña_generada` | Contraseña |
| `DB_NAME` | `railway` | Nombre de la BD |

> 💡 **Recomendación**: Usa `DATABASE_URL` que Railway crea automáticamente. Es más simple y seguro.

---

## Paso 5: Verificar

### 5.1 Generar Dominio Público

1. En el servicio de **Backend**
2. Ve a **Settings > Networking**
3. Click en **"Generate Domain"**
4. Copia la URL (ejemplo: `https://fitgenius-backend-production.up.railway.app`)

### 5.2 Verificar Logs

1. Click en tu servicio de Backend
2. Ve a la pestaña **"Deployments"**
3. Click en el último deployment
4. Revisa los logs:
   ```
   ✅ Gemini AI inicializado correctamente
   📡 Conectando a Railway MySQL usando DATABASE_URL...
   ✅ Conectado a la base de datos MySQL con éxito.
   🚀 Servidor backend corriendo en http://localhost:3001
   ```

### 5.3 Probar API

Abre tu navegador o usa `curl`:

```bash
# Reemplaza con tu URL de Railway
curl https://tu-backend.up.railway.app/api/members
```

Deberías recibir una respuesta JSON (aunque esté vacía).

### 5.4 Verificar Variables de Entorno

```bash
# Ver todas las variables configuradas
railway variables
```

---

## Paso 6: Conectar con Netlify

### 6.1 Actualizar .env.production

En tu proyecto local, edita `.env.production`:

```env
# URL del backend en Railway
VITE_API_URL=https://tu-backend-railway.up.railway.app/api
```

### 6.2 Configurar Netlify

1. Ve a [app.netlify.com](https://app.netlify.com)
2. Tu sitio > **Site settings > Environment variables**
3. Agregar variable:
   - Key: `VITE_API_URL`
   - Value: `https://tu-backend-railway.up.railway.app/api`

### 6.3 Redesplegar Frontend

```bash
# Opción 1: Desde Netlify UI
Deploys > Trigger deploy > Deploy site

# Opción 2: Desde CLI
netlify deploy --prod

# Opción 3: Push a GitHub (si tienes continuous deployment)
git push origin main
```

---

## Solución de Problemas

### ❌ Error: "GEMINI_API_KEY no está configurada"

**Solución**:
1. Ve a Railway > Backend service > Variables
2. Verifica que `GEMINI_API_KEY` exista
3. Regenera el deployment: Deployments > ⋮ > Redeploy

### ❌ Error: "Cannot connect to MySQL"

**Solución**:
1. Verifica que el servicio MySQL esté activo (luz verde)
2. Ve a Backend service > Variables
3. Verifica que `DATABASE_URL` exista
4. Si no existe:
   - Settings > Service Variables > Reference > MySQL > DATABASE_URL

### ❌ Error: "CORS policy blocked"

**Solución**:
El backend ya tiene CORS habilitado. Si persiste:
1. Verifica que `VITE_API_URL` en Netlify sea correcto
2. Debe incluir `/api` al final
3. Debe usar `https://` (no `http://`)

### ❌ Las rutinas/dietas no se generan

**Causas posibles**:

1. **API Key inválida**:
   ```bash
   # Verifica que la API key funcione
   curl -H "Content-Type: application/json" \
        -d '{"contents":[{"parts":[{"text":"Hola"}]}]}' \
        https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=TU_API_KEY
   ```

2. **Variables faltantes**:
   - Ve a Railway logs y busca: `⚠️ GEMINI_API_KEY no está configurada`
   - Si aparece, agrega la variable

3. **Timeout**:
   - Railway Free Tier tiene límites de tiempo
   - Considera upgrade a Pro si las generaciones tardan mucho

### 📊 Verificar Estado del Backend

```bash
# Usando curl
curl https://tu-backend.up.railway.app/api/members

# Usando browser
https://tu-backend.up.railway.app/api/members
```

---

## 🔐 Seguridad

### ✅ Buenas Prácticas

1. **Nunca** subas archivos `.env` a GitHub
2. **Nunca** expongas tu `GEMINI_API_KEY` en el frontend
3. **Siempre** usa variables de entorno en Railway
4. **Revisa** los logs regularmente por accesos no autorizados

### 🛡️ Proteger tu API Key

Railway encripta todas las variables de entorno. Sin embargo:

1. No compartas tu `GEMINI_API_KEY`
2. Regenera la key si sospechas que fue comprometida
3. Configura cuotas en Google Cloud Console

---

## 📚 Recursos Adicionales

- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Gemini API Docs](https://ai.google.dev/docs)
- [MySQL Docs](https://dev.mysql.com/doc/)

---

## 🎉 ¡Listo!

Si seguiste todos los pasos, tu aplicación debería estar funcionando:
- ✅ Backend en Railway con MySQL
- ✅ Frontend en Netlify
- ✅ Generación de rutinas y dietas con IA funcionando

### Verificación Final:

1. Ve a tu app en Netlify
2. Crea una cuenta o inicia sesión
3. Completa tu perfil
4. Genera una rutina
5. Genera una dieta

Si todo funciona, ¡felicidades! 🎊
