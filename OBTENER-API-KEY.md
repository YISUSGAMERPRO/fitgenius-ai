# 🔑 Cómo Obtener tu GEMINI_API_KEY

## 🎯 Requisito Obligatorio

Para que tu aplicación genere rutinas y dietas personalizadas con IA, **necesitas una API Key de Google Gemini**.

---

## 📋 PASOS PARA OBTENER LA API KEY

### 1. Ve a Google AI Studio
🔗 **URL**: https://makersuite.google.com/app/apikey

O también puedes ir a:
🔗 https://aistudio.google.com/app/apikey

### 2. Inicia Sesión
- Usa tu cuenta de Google
- Acepta los términos y condiciones

### 3. Crear API Key

#### Opción A: Si ya tienes un proyecto de Google Cloud
1. Click en **"Create API Key"**
2. Selecciona tu proyecto existente
3. Click en **"Create API key in existing project"**
4. Copia la key que aparece

#### Opción B: Si no tienes un proyecto
1. Click en **"Get API Key"**
2. Click en **"Create API key in new project"**
3. Google creará automáticamente un proyecto
4. Copia la key que aparece

### 4. Guardar la Key
⚠️ **IMPORTANTE**: Copia y guarda esta key inmediatamente. Solo se muestra una vez.

```
Ejemplo de API Key:
AIzaSyBZcPx4viYy7C7EVwT0bBr_x71qtCXR9Ck
```

---

## 🔧 CONFIGURAR LA API KEY

### En Railway (Producción):

1. Ve a: https://railway.app
2. Tu proyecto > Backend service
3. Click en **"Variables"**
4. Click en **"+ New Variable"**
5. Agrega:
   ```
   Name: GEMINI_API_KEY
   Value: AIzaSy... (tu key completa)
   ```
6. Click en **"Add"**
7. Railway reiniciará automáticamente

### En Local (Desarrollo):

1. Abre el archivo `server/.env`
2. Agrega o actualiza:
   ```env
   GEMINI_API_KEY=AIzaSy_tu_key_aqui
   ```
3. Guarda el archivo
4. Reinicia el servidor

---

## ✅ VERIFICAR QUE FUNCIONA

### Método 1: Logs de Railway
1. Railway > Backend service > Deployments
2. Click en el último deployment
3. Busca esta línea:
   ```
   ✅ Gemini AI inicializado correctamente
   ```

### Método 2: Probar la API
```powershell
# Reemplaza TU_API_KEY con tu key real
$apiKey = "TU_API_KEY"
$body = @{
    contents = @(
        @{
            parts = @(
                @{ text = "Hola, di '¡Funciona!'" }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$apiKey" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

Si funciona, verás una respuesta con el texto "¡Funciona!".

---

## 💰 CUOTAS Y LÍMITES

### Plan Gratuito de Gemini:
- ✅ 60 solicitudes por minuto
- ✅ 1,500 solicitudes por día
- ✅ Sin costo
- ✅ Perfecto para desarrollo y apps pequeñas

### Para más solicitudes:
1. Ve a: https://console.cloud.google.com
2. Selecciona tu proyecto
3. Habilita facturación
4. Los límites aumentarán automáticamente

### Revisar tu uso:
1. Ve a: https://console.cloud.google.com/apis/dashboard
2. Selecciona tu proyecto
3. Ve a **"Generative Language API"**
4. Verás gráficas de uso

---

## 🔒 SEGURIDAD

### ✅ Buenas Prácticas:

1. **NUNCA expongas tu API Key en:**
   - Código frontend
   - GitHub (archivos .env)
   - Código público
   - Screenshots

2. **Usa variables de entorno:**
   - ✅ Railway variables
   - ✅ Netlify environment variables
   - ✅ Archivo .env (con .gitignore)

3. **Regenera la key si:**
   - Fue expuesta públicamente
   - Sospechas que fue comprometida
   - Ves uso no autorizado

### Regenerar API Key:

1. Ve a: https://makersuite.google.com/app/apikey
2. Click en tu key existente
3. Click en **"Delete"**
4. Crea una nueva key
5. Actualiza en Railway y .env local

---

## ❌ PROBLEMAS COMUNES

### "GEMINI_API_KEY no está configurada"

**Causa**: Variable no existe en Railway

**Solución**:
1. Railway > Backend > Variables
2. Agregar GEMINI_API_KEY
3. Esperar redeploy

### "API key not valid"

**Causa**: Key incorrecta o expirada

**Solución**:
1. Verifica que copiaste la key completa
2. Regenera la key en Google AI Studio
3. Actualiza en Railway

### "Quota exceeded"

**Causa**: Límite de solicitudes alcanzado

**Solución**:
1. Espera 24 horas (se resetea diariamente)
2. O habilita facturación en Google Cloud
3. O optimiza tu código para hacer menos llamadas

---

## 🧪 PROBAR EN TU APP

### Una vez configurada la API Key:

1. **Abre tu app** (en Netlify)
2. **Inicia sesión** o crea cuenta
3. **Completa tu perfil**:
   - Edad, peso, altura
   - Objetivo (perder peso, ganar músculo, etc.)
   - Nivel de actividad
4. **Ve a Rutinas**:
   - Click en "Generar Rutina"
   - Debe mostrar spinner
   - En 10-20 segundos: rutina completa ✅
5. **Ve a Dieta**:
   - Click en "Generar Dieta"
   - Debe mostrar spinner
   - En 10-20 segundos: plan nutricional ✅

---

## 📚 RECURSOS

- **Google AI Studio**: https://aistudio.google.com
- **Documentación Gemini**: https://ai.google.dev/docs
- **Console de Google Cloud**: https://console.cloud.google.com
- **Pricing**: https://ai.google.dev/pricing

---

## ✅ CHECKLIST

- [ ] Obtuve mi API Key de Google AI Studio
- [ ] Copié y guardé la key en un lugar seguro
- [ ] Agregué GEMINI_API_KEY en Railway
- [ ] Actualicé server/.env local
- [ ] Verifiqué los logs de Railway ("Gemini AI inicializado")
- [ ] Probé generar una rutina → Funciona
- [ ] Probé generar una dieta → Funciona

---

**¡Listo! Tu app ahora puede generar rutinas y dietas con IA** 🎉
