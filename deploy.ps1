# Script automatizado para desplegar FitGenius AI
# EJECUTAR EN PowerShell

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🚀 DESPLIEGUE AUTOMATIZADO - FITGENIUS AI" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Verificar repositorio
Write-Host "📍 Paso 1: Verificando repositorio..." -ForegroundColor Yellow
if (!(Test-Path ".git")) {
    Write-Host "❌ No estamos en un repositorio Git" -ForegroundColor Red
    exit 1
}

$origin = git remote get-url origin
Write-Host "✅ Repositorio: $origin" -ForegroundColor Green
Write-Host ""

# Paso 2: Verificar commits
Write-Host "📍 Paso 2: Verificando commits..." -ForegroundColor Yellow
$commits = git rev-list --count main
Write-Host "✅ Commits: $commits" -ForegroundColor Green
Write-Host ""

# Paso 3: Log de últimos commits
Write-Host "📍 Paso 3: Últimos commits:" -ForegroundColor Yellow
git log --oneline -5
Write-Host ""

# Paso 4: Info para Railway
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "📋 PASOS EN RAILWAY:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""
Write-Host "OPCIÓN A: Deploy directo (Recomendado)" -ForegroundColor Green
Write-Host "Copia esta URL en tu navegador:" -ForegroundColor White
Write-Host "https://railway.app/new/github?repo=yisusgamerpro%2Ffitgenius-ai" -ForegroundColor Yellow
Write-Host ""
Write-Host "OPCIÓN B: Deploy manual" -ForegroundColor Green
Write-Host "   1. Ve a https://railway.app" -ForegroundColor White
Write-Host "   2. Login/Signup" -ForegroundColor White
Write-Host "   3. Click en '+ New Project'" -ForegroundColor White
Write-Host "   4. Click en 'Deploy from GitHub'" -ForegroundColor White
Write-Host "   5. Selecciona: yisusgamerpro/fitgenius-ai" -ForegroundColor White
Write-Host "   6. Railway importará variables de railway.json" -ForegroundColor White
Write-Host "   7. Click en 'Deploy'" -ForegroundColor White
Write-Host "   8. Espera 2-3 minutos" -ForegroundColor White
Write-Host ""

# Paso 5: Info para Netlify
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "📋 PASOS EN NETLIFY:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""
Write-Host "   1. Ve a https://app.netlify.com" -ForegroundColor White
Write-Host "   2. Abre tu sitio 'fitgenius'" -ForegroundColor White
Write-Host "   3. Site settings → Environment variables" -ForegroundColor White
Write-Host "   4. Agrega/Actualiza:" -ForegroundColor White
Write-Host "      VITE_API_URL = https://fitgenius-backend-production.up.railway.app/api" -ForegroundColor Yellow
Write-Host "   5. Netlify se reconstruye automáticamente" -ForegroundColor White
Write-Host ""

# Paso 6: Verificación
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "🧪 VERIFICACIÓN DESPUÉS DEL DESPLIEGUE:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""
Write-Host "   Ejecuta este comando en PowerShell:" -ForegroundColor White
Write-Host "   curl https://fitgenius-backend-production.up.railway.app/api/members" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Deberías ver: []" -ForegroundColor Green
Write-Host ""

# Paso 7: Prueba final
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "✅ PRUEBA FINAL EN LA APP:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""
Write-Host "   1. Abre https://fitgenius.netlify.app" -ForegroundColor White
Write-Host "   2. Inicia sesión" -ForegroundColor White
Write-Host "   3. Workout View → Generar Rutina" -ForegroundColor White
Write-Host "   4. Selecciona tipo y genera" -ForegroundColor White
Write-Host "   5. Espera 15-20 segundos (IA generando)" -ForegroundColor White
Write-Host "   6. Recarga la página (F5)" -ForegroundColor White
Write-Host "   7. ¡La rutina debe persistir en BD! ✅" -ForegroundColor Green
Write-Host ""
Write-Host "   Haz lo mismo con Diet View" -ForegroundColor White
Write-Host ""

# Paso 8: Resumen
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "📊 STATUS ACTUAL:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""
Write-Host "✅ Código en GitHub: yisusgamerpro/fitgenius-ai" -ForegroundColor Green
Write-Host "⏳ Railway: Pendiente de despliegue" -ForegroundColor Yellow
Write-Host "⏳ Netlify: Pendiente de actualizar variable" -ForegroundColor Yellow
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🎉 Script completado - Listo para desplegar!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Opción para abrir Railway directamente
$response = Read-Host "¿Abrir Railway ahora? (s/n)"
if ($response -eq 's') {
    Start-Process "https://railway.app/new/github?repo=yisusgamerpro%2Ffitgenius-ai"
}
