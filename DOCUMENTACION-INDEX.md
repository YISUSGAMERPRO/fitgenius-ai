# 📚 DOCUMENTACIÓN COMPLETA - FITGENIUS AI

## 🎯 Guía de Uso de la Documentación

Esta carpeta contiene toda la documentación necesaria para desplegar y usar FitGenius AI en producción con Railway y Netlify.

---

## 🚀 INICIO RÁPIDO

### ¿Primera vez?
👉 **Empieza aquí**: [README-DESPLIEGUE.md](README-DESPLIEGUE.md)
- ⚡ Resumen en 5 minutos
- 📋 Pasos esenciales
- ✅ Checklist rápido

### Verificar tu configuración local
👉 **Ejecuta**: `.\TEST-SIMPLE.ps1`
- ✅ Verifica archivos
- ✅ Verifica dependencias
- ✅ Verifica variables

---

## 📖 DOCUMENTACIÓN DETALLADA

### 1. Configuración de Railway
📄 **[CONFIGURACION-RAILWAY.md](CONFIGURACION-RAILWAY.md)**

**Cuándo usar**: Primera vez configurando Railway o necesitas referencia detallada

**Contiene**:
- ✅ Paso a paso para crear proyecto en Railway
- ✅ Configuración de MySQL
- ✅ Despliegue del backend
- ✅ Variables de entorno
- ✅ Conectar con Netlify
- ✅ Solución de problemas

---

### 2. Variables de Entorno
📄 **[VARIABLES-ENTORNO.md](VARIABLES-ENTORNO.md)**

**Cuándo usar**: Necesitas saber qué variables configurar

**Contiene**:
- 📝 Lista completa de variables requeridas
- 🔍 Variables de Railway vs Netlify
- ✅ Checklist de verificación
- 🚨 Soluciones rápidas

---

### 3. Solución: Rutinas y Dietas
📄 **[SOLUCION-RUTINAS-DIETAS.md](SOLUCION-RUTINAS-DIETAS.md)**

**Cuándo usar**: La app no genera rutinas o dietas

**Contiene**:
- 🔍 Diagnóstico del problema
- ✅ Solución paso a paso
- 🧪 Pruebas de verificación
- 🐛 Debugging detallado
- ❌ Errores comunes y soluciones

---

### 4. Obtener API Key de Gemini
📄 **[OBTENER-API-KEY.md](OBTENER-API-KEY.md)**

**Cuándo usar**: Necesitas obtener o regenerar tu API Key

**Contiene**:
- 🔑 Cómo obtener la key
- 🔧 Cómo configurarla
- ✅ Cómo verificar que funciona
- 💰 Información de cuotas
- 🔒 Seguridad y mejores prácticas

---

### 5. Resumen de Cambios
📄 **[RESUMEN-CAMBIOS.md](RESUMEN-CAMBIOS.md)**

**Cuándo usar**: Quieres saber qué se modificó en el proyecto

**Contiene**:
- 📝 Lista de todos los cambios realizados
- 🗄️ Arquitectura antes vs ahora
- 📋 Configuración requerida
- 🔧 Scripts disponibles

---

## 🤖 SCRIPTS AUTOMATIZADOS

### Script de Verificación
```powershell
.\TEST-SIMPLE.ps1
```
**Qué hace**:
- ✅ Verifica archivos de configuración
- ✅ Verifica dependencias instaladas
- ✅ Verifica variables de entorno

### Script de Despliegue Completo
```powershell
.\DEPLOY-COMPLETO.ps1
```
**Qué hace**:
- 📦 Instala dependencias
- 🏗️ Construye el proyecto
- 📋 Muestra instrucciones para Railway
- 📋 Muestra instrucciones para Netlify

---

## 🗺️ FLUJO DE TRABAJO RECOMENDADO

### Primera Configuración:

```
1. Lee: README-DESPLIEGUE.md (5 min)
   └─> Entiendes el proceso general

2. Obtén: OBTENER-API-KEY.md (5 min)
   └─> Tienes tu GEMINI_API_KEY

3. Ejecuta: .\TEST-SIMPLE.ps1 (1 min)
   └─> Verificas que todo esté listo localmente

4. Sigue: CONFIGURACION-RAILWAY.md (15 min)
   └─> Configuras Railway paso a paso

5. Configura Netlify (5 min)
   └─> Conectas frontend con backend

6. Prueba la app (2 min)
   └─> Genera rutina y dieta ✅
```

### Si algo falla:

```
1. Consulta: SOLUCION-RUTINAS-DIETAS.md
   └─> Soluciones a problemas específicos

2. Revisa: VARIABLES-ENTORNO.md
   └─> Verifica que todas las variables estén correctas

3. Ejecuta: .\TEST-SIMPLE.ps1
   └─> Identifica qué falta localmente
```

---

## 📊 ESTRUCTURA DEL PROYECTO

```
fitgenius-ai/
├── 📄 README-DESPLIEGUE.md          ← Inicio rápido
├── 📄 CONFIGURACION-RAILWAY.md      ← Guía completa Railway
├── 📄 VARIABLES-ENTORNO.md          ← Referencia de variables
├── 📄 SOLUCION-RUTINAS-DIETAS.md    ← Solución de problemas IA
├── 📄 OBTENER-API-KEY.md            ← Cómo obtener Gemini key
├── 📄 RESUMEN-CAMBIOS.md            ← Qué se cambió
├── 📄 DOCUMENTACION-INDEX.md        ← Este archivo
├── 🤖 TEST-SIMPLE.ps1                ← Script de verificación
├── 🤖 DEPLOY-COMPLETO.ps1           ← Script de despliegue
├── 🌐 .env.production                ← Config frontend (Netlify)
├── server/
│   ├── 🖥️ server.js                  ← Backend actualizado
│   ├── 🔐 .env                       ← Config backend (Railway)
│   └── 📦 package.json
└── ... (resto del proyecto)
```

---

## ❓ PREGUNTAS FRECUENTES

### ¿Por qué Railway?
- ✅ Base de datos MySQL incluida
- ✅ Deploy automático desde GitHub
- ✅ Variables de entorno seguras
- ✅ Plan gratuito generoso
- ✅ Fácil de usar

### ¿Por qué Netlify?
- ✅ CDN global (rápido en todo el mundo)
- ✅ Deploy automático desde GitHub
- ✅ HTTPS gratis
- ✅ Plan gratuito generoso
- ✅ Ideal para React/Vite

### ¿Necesito tarjeta de crédito?
- ❌ Railway: No (plan gratuito sin tarjeta)
- ❌ Netlify: No (plan gratuito sin tarjeta)
- ❌ Google Gemini: No (60 req/min gratis)

### ¿Cuánto cuesta?
- 💰 Railway Free: $5 crédito/mes gratis
- 💰 Netlify Free: 100GB bandwidth/mes
- 💰 Gemini Free: 60 req/min, 1500/día
- 💰 **Total**: $0/mes para uso personal o pequeño

### ¿Qué pasa si excedo los límites?
- Railway: Se pausa hasta siguiente mes
- Netlify: Se pausa hasta siguiente mes
- Gemini: Error 429 (quota exceeded)
- Solución: Upgrade a plan pagado

---

## 🆘 SOPORTE

### Si necesitas ayuda:

1. **Revisa la documentación apropiada** (arriba)
2. **Ejecuta el script de verificación**: `.\TEST-SIMPLE.ps1`
3. **Revisa los logs**:
   - Railway: Backend > Deployments > View logs
   - Netlify: Deploys > View logs
   - Browser: F12 > Console
4. **Busca el error específico** en la documentación

### Información útil para reportar problemas:
- Resultado de `.\TEST-SIMPLE.ps1`
- Logs de Railway (últimas 50 líneas)
- Errores de consola del navegador (F12)
- Mensaje de error exacto

---

## 🎯 CHECKLIST DE ÉXITO

### Tu app está lista cuando:
- [ ] ✅ Railway tiene MySQL activo
- [ ] ✅ Railway tiene Backend desplegado
- [ ] ✅ GEMINI_API_KEY configurada en Railway
- [ ] ✅ DATABASE_URL existe en Railway
- [ ] ✅ Dominio público generado en Railway
- [ ] ✅ VITE_API_URL configurada en Netlify
- [ ] ✅ Frontend desplegado en Netlify
- [ ] ✅ Backend responde: `https://xxx.up.railway.app/api/members`
- [ ] ✅ Frontend carga correctamente
- [ ] ✅ Puedes crear cuenta
- [ ] ✅ Puedes guardar perfil
- [ ] ✅ **Puedes generar rutina** 🏋️
- [ ] ✅ **Puedes generar dieta** 🥗

---

## 🎉 ¡Éxito!

Si todos los checks están ✅, tu aplicación está **100% funcional** con:
- 🗄️ Base de datos independiente en la nube
- 🖥️ Backend profesional en Railway
- 🌐 Frontend global en Netlify
- 🤖 IA generando contenido personalizado

**¡Felicidades por tu despliegue exitoso!** 🚀

---

## 📞 ENLACES ÚTILES

- 🚂 Railway: https://railway.app
- 🌐 Netlify: https://app.netlify.com
- 🔑 Google AI Studio: https://aistudio.google.com
- 📚 Docs Railway: https://docs.railway.app
- 📚 Docs Netlify: https://docs.netlify.com
- 📚 Docs Gemini: https://ai.google.dev/docs

---

_Última actualización: 13 de enero de 2026_
