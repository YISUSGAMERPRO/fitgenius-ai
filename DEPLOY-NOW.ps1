# Script de deployment rápido
Write-Host "🚀 Iniciando deployment..." -ForegroundColor Cyan

# Ir al directorio del proyecto
Set-Location "c:\xampp\htdocs\fitgenius-ai"

# Agregar todos los cambios
Write-Host "📦 Agregando archivos..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "💾 Haciendo commit..." -ForegroundColor Yellow  
git commit -m "Fix: Railway deployment - Use server-neon.js"

# Push
Write-Host "🌐 Subiendo a GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "✅ Deployment completado!" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Railway desplegará automáticamente en ~2-3 minutos" -ForegroundColor Cyan
Write-Host "🔍 Monitorea el deploy en: railway.app" -ForegroundColor Cyan
