# 🗄️ Configuración de Base de Datos Neon (PostgreSQL)

## ⚠️ IMPORTANTE: Ejecuta este script AHORA

Tu base de datos necesita la tabla `user_profiles` para guardar los datos de los usuarios.

## 📋 Pasos para configurar la base de datos:

### 1. Acceder a Neon Console
1. Ve a: https://console.neon.tech
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto de base de datos

### 2. Abrir SQL Editor
1. En el panel izquierdo, busca **"SQL Editor"** o **"Query"**
2. Haz clic para abrir el editor de consultas SQL

### 3. Ejecutar el script
1. Abre el archivo: `server/neon-setup-complete.sql`
2. **Copia TODO el contenido** del archivo
3. **Pega el contenido** en el SQL Editor de Neon
4. Haz clic en **"Run"** o **"Execute"** para ejecutar el script

### 4. Verificar que funcionó
Deberías ver un resultado como este:
```
tabla           | registros
----------------|----------
users           | 0
user_profiles   | 0
workout_plans   | 0
diet_plans      | 0
gym_members     | 0
gym_equipment   | 0
gym_expenses    | 0
```

## ✅ ¡Listo!

Una vez ejecutado el script:
- La tabla `users` tendrá la columna `email`
- La tabla `user_profiles` estará creada
- Los datos de perfil se guardarán correctamente

## 🔧 Variables de entorno necesarias

Asegúrate de tener estas variables configuradas:

**Railway (Backend):**
- `NETLIFY_DATABASE_URL_UNPOOLED` = Tu connection string de Neon (postgresql://...)
- `GEMINI_API_KEY` = Tu API key de Google Gemini

**Netlify (Frontend):**
- `VITE_API_URL` = URL de tu backend en Railway
- `GEMINI_API_KEY` = Tu API key de Google Gemini  
- `NETLIFY_DATABASE_URL_UNPOOLED` = Tu connection string de Neon

## 🐛 Si algo falla

Si ves errores como:
- "table user_profiles does not exist" → Ejecuta el script SQL
- "column email does not exist" → Ejecuta el script SQL
- "relation users does not exist" → Ejecuta el script SQL desde el principio

## 📞 Connection String de Neon

Tu connection string debe verse así:
```
postgresql://usuario:password@ep-nombre.region.aws.neon.tech/neondb?sslmode=require
```

Se encuentra en:
Neon Dashboard → Tu proyecto → Connection Details → Connection string
