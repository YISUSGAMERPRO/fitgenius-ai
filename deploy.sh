#!/bin/bash
# Script automatizado para desplegar FitGenius AI en Railway y Netlify

echo "============================================"
echo "🚀 DESPLIEGUE AUTOMATIZADO - FITGENIUS AI"
echo "============================================"
echo ""

# PASO 1: Verificar que estamos en el repo correcto
echo "📍 Paso 1: Verificando repositorio..."
if [ ! -d ".git" ]; then
    echo "❌ No estamos en un repositorio Git"
    exit 1
fi

ORIGIN=$(git remote get-url origin)
echo "✅ Repositorio: $ORIGIN"
echo ""

# PASO 2: Verificar que hay commits en main
echo "📍 Paso 2: Verificando commits..."
COMMITS=$(git rev-list --count main 2>/dev/null || git rev-list --count HEAD)
echo "✅ Commits: $COMMITS"
echo ""

# PASO 3: Información para Railway
echo "📍 Paso 3: Datos para Railway..."
echo ""
echo "🔗 REPOSITORIO: $ORIGIN"
echo ""
echo "📋 PASOS EN RAILWAY:"
echo "   1. Ve a https://railway.app"
echo "   2. Login/Signup"
echo "   3. Click en '+ New Project'"
echo "   4. Click en 'Deploy from GitHub'"
echo "   5. Conecta tu GitHub y selecciona: yisusgamerpro/fitgenius-ai"
echo "   6. Railway importará las variables de railway.json automáticamente"
echo "   7. Click en 'Deploy'"
echo "   8. Espera 2-3 minutos a que se despliegue"
echo ""

# PASO 4: Info para Netlify
echo "📋 PASOS EN NETLIFY:"
echo "   1. Ve a https://app.netlify.com"
echo "   2. Abre tu sitio 'fitgenius'"
echo "   3. Site settings → Environment variables"
echo "   4. Agrega/Actualiza:"
echo "      VITE_API_URL = https://fitgenius-backend-production.up.railway.app/api"
echo "   5. Netlify se reconstruye automáticamente"
echo ""

# PASO 5: Verificación
echo "🧪 VERIFICACIÓN DESPUÉS DEL DESPLIEGUE:"
echo ""
echo "   En PowerShell:"
echo "   curl https://fitgenius-backend-production.up.railway.app/api/members"
echo ""
echo "   Deberías ver: []"
echo ""

# PASO 6: Prueba final
echo "✅ PRUEBA FINAL:"
echo "   1. Abre https://fitgenius.netlify.app"
echo "   2. Inicia sesión"
echo "   3. Workout View → Generar Rutina"
echo "   4. Selecciona tipo y genera"
echo "   5. Espera 15-20 segundos"
echo "   6. Recarga la página (F5)"
echo "   7. ¡La rutina debe persistir! ✅"
echo ""

echo "============================================"
echo "📌 NOTA: Los pasos anteriores son MANUALES"
echo "Debes hacerlos en railway.app y netlify.com"
echo "============================================"
echo ""

# PASO 7: Crear URL para desplegar directamente
echo "⚡ OPCIÓN RÁPIDA (Deploy directo):"
echo ""
echo "Copia esta URL en tu navegador:"
echo "https://railway.app/new/github?repo=yisusgamerpro%2Ffitgenius-ai"
echo ""

echo "¡Script completado! 🎉"
