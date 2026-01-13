# 🔧 SOLUCIÓN: Rutinas y Dietas no se generan

## 🎯 Problema
La aplicación no genera rutinas ni dietas cuando el usuario hace click en "Generar".

---

## 🔍 Diagnóstico

### Posibles Causas:

1. ❌ **API Key de Gemini no configurada en Railway**
2. ❌ **Frontend no puede comunicarse con el backend**
3. ❌ **Base de datos no conectada**
4. ❌ **Variables de entorno mal configuradas**

---

## ✅ SOLUCIÓN PASO A PASO

### Paso 1: Verificar Backend en Railway

#### 1.1 Ir a Railway
1. Ve a: https://railway.app
2. Selecciona tu proyecto
3. Click en el servicio de **Backend** (NO MySQL)

#### 1.2 Verificar Variables
Click en **"Variables"** y confirma que existan:

```
✅ GEMINI_API_KEY = AIzaSy... (tu key real)
✅ DATABASE_URL = mysql://... (automática)
✅ PORT = 3001
✅ RAILWAY_ENVIRONMENT = production
```

#### 1.3 Si falta GEMINI_API_KEY:
1. Click en **"+ New Variable"**
2. Name: `GEMINI_API_KEY`
3. Value: Tu API key de Google (obtenerla en: https://makersuite.google.com/app/apikey)
4. Click **"Add"**
5. Railway reiniciará automáticamente el servicio

#### 1.4 Verificar Logs
1. Ve a **"Deployments"**
2. Click en el último deployment
3. Busca estas líneas:
   ```
   ✅ Gemini AI inicializado correctamente
   📡 Conectando a Railway MySQL...
   ✅ Conectado a la base de datos MySQL con éxito
   🚀 Servidor backend corriendo en http://localhost:3001
   ```

#### 1.5 Si ves errores:
- **"GEMINI_API_KEY no está configurada"** → Agregar la variable (Paso 1.3)
- **"Error conectando a MySQL"** → Verificar que MySQL esté activo y vinculado
- **"Cannot find module"** → Verificar que `package.json` tenga todas las dependencias

---

### Paso 2: Obtener URL del Backend

#### 2.1 Generar Dominio Público
1. En Railway > Backend service
2. Ve a **"Settings"** > **"Networking"**
3. Click en **"Generate Domain"**
4. Copia la URL completa (ejemplo: `https://fitgenius-backend-production.up.railway.app`)

---

### Paso 3: Configurar Frontend en Netlify

#### 3.1 Actualizar Variable de Entorno
1. Ve a: https://app.netlify.com
2. Tu sitio > **"Site settings"** > **"Environment variables"**
3. Busca `VITE_API_URL`

#### 3.2 Si existe:
- Click en **"Edit"**
- Cambiar el valor a: `https://TU-BACKEND.up.railway.app/api`
- ⚠️ **IMPORTANTE**: Debe terminar en `/api`
- Click **"Save"**

#### 3.3 Si NO existe:
- Click en **"Add a variable"**
- Key: `VITE_API_URL`
- Value: `https://TU-BACKEND.up.railway.app/api`
- Click **"Create variable"**

#### 3.4 Redesplegar
1. Ve a **"Deploys"**
2. Click en **"Trigger deploy"**
3. Selecciona **"Deploy site"**
4. Espera 1-2 minutos

---

### Paso 4: Actualizar Código Local (Para futuros deploys)

#### 4.1 Editar .env.production
```bash
# Abre el archivo .env.production
notepad .env.production
```

#### 4.2 Actualizar URL
```env
# Reemplaza con tu URL real de Railway
VITE_API_URL=https://tu-backend-railway.up.railway.app/api
```

#### 4.3 Guardar y Commitear
```bash
git add .env.production
git commit -m "Update Railway backend URL"
git push origin main
```

Netlify automáticamente redespleará con la nueva configuración.

---

### Paso 5: Probar la Aplicación

#### 5.1 Abrir la App
1. Ve a tu sitio de Netlify (ej: `https://tu-app.netlify.app`)

#### 5.2 Iniciar Sesión o Crear Cuenta

#### 5.3 Completar Perfil
- Edad, peso, altura, objetivo, etc.

#### 5.4 Generar Rutina
1. Ve a la sección de **Rutinas**
2. Selecciona un tipo (ej: "Fuerza")
3. Click en **"Generar Rutina"**
4. Debe mostrar un spinner y en 10-20 segundos generar la rutina

#### 5.5 Generar Dieta
1. Ve a la sección de **Dieta**
2. Selecciona un tipo (ej: "Balanceada")
3. Click en **"Generar Dieta"**
4. Debe mostrar un spinner y en 10-20 segundos generar la dieta

---

## 🐛 DEBUGGING

### Si sigue sin funcionar:

#### 1. Abrir Consola del Navegador (F12)
- Buscar errores en rojo
- Copiar el mensaje de error

#### 2. Errores Comunes:

##### ❌ "Network Error" o "Failed to fetch"
**Causa**: Frontend no puede comunicarse con el backend

**Solución**:
1. Verifica que `VITE_API_URL` esté correcta en Netlify
2. Verifica que el backend esté activo en Railway (luz verde)
3. Prueba acceder directamente a: `https://tu-backend.up.railway.app/api/members`
   - Debería responder JSON (aunque esté vacío)

##### ❌ "GEMINI_API_KEY no está configurada"
**Causa**: Variable faltante en Railway

**Solución**:
1. Railway > Backend > Variables
2. Agregar `GEMINI_API_KEY`
3. Esperar 1-2 minutos para redeploy

##### ❌ "Error al generar rutina: 503"
**Causa**: Servicio de IA no disponible

**Solución**:
1. Verificar que GEMINI_API_KEY sea válida
2. Probar la key en: https://makersuite.google.com/app/apikey
3. Si expiró, generar una nueva

##### ❌ "Error al guardar en base de datos"
**Causa**: Base de datos no conectada

**Solución**:
1. Railway > MySQL service > Verificar que esté activo (verde)
2. Railway > Backend > Variables > Verificar que `DATABASE_URL` exista
3. Si no existe: Settings > Variables > Reference > MySQL > DATABASE_URL

---

## 🧪 Prueba Manual de la API

### Desde tu terminal local:

```powershell
# Probar conexión al backend
Invoke-WebRequest -Uri "https://tu-backend.up.railway.app/api/members"

# Si funciona, deberías ver:
# StatusCode: 200
# Content: [] o [{"id": "...", "name": "..."}]
```

### Desde el navegador:

1. Abre: `https://tu-backend.up.railway.app/api/members`
2. Deberías ver JSON (aunque sea un array vacío: `[]`)

---

## 📋 Checklist Final

Antes de contactar soporte, verifica:

- [ ] ✅ Railway Backend está activo (luz verde)
- [ ] ✅ Railway MySQL está activo (luz verde)
- [ ] ✅ `GEMINI_API_KEY` configurada en Railway Backend
- [ ] ✅ `DATABASE_URL` existe en Railway Backend (automática)
- [ ] ✅ Dominio público generado en Railway Backend
- [ ] ✅ `VITE_API_URL` configurada en Netlify
- [ ] ✅ `VITE_API_URL` apunta a Railway (termina en `/api`)
- [ ] ✅ Frontend redesplerado en Netlify después de cambios
- [ ] ✅ Backend responde en: `https://tu-backend.up.railway.app/api/members`
- [ ] ✅ Logs de Railway muestran "Gemini AI inicializado correctamente"

---

## 🎯 Si TODO está OK y sigue sin funcionar:

### Logs Detallados:

1. **Railway Logs**:
   ```
   Railway > Backend > Deployments > Latest > View logs
   ```
   Copia los últimos 50 líneas

2. **Netlify Logs**:
   ```
   Netlify > Deploys > Latest > View logs
   ```
   Copia cualquier error

3. **Browser Console**:
   ```
   F12 > Console > Copia errores en rojo
   ```

---

## 🆘 Contacto

Si después de seguir todos los pasos sigue sin funcionar:
1. Anota el error exacto
2. Verifica que todos los checks anteriores estén ✅
3. Comparte:
   - Mensaje de error
   - Logs de Railway
   - Screenshot de la consola del navegador

---

## ✅ Confirmación de Éxito

Si todo funciona correctamente, deberías ver:

1. **Al generar rutina**:
   - Spinner de carga
   - Después de 10-20 segundos: Rutina completa con 7 días
   - Cada día tiene ejercicios con nombre, series, repeticiones, etc.

2. **Al generar dieta**:
   - Spinner de carga
   - Después de 10-20 segundos: Plan semanal con 7 días
   - Cada día tiene 5 comidas con ingredientes y calorías

---

## 🎉 ¡Éxito!

Si llegaste hasta aquí y funciona, ¡felicidades! Tu app está completamente funcional con:
- ✅ Base de datos en la nube (Railway MySQL)
- ✅ Backend en Railway
- ✅ Frontend en Netlify
- ✅ IA generando rutinas y dietas personalizadas
