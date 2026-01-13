# ========================================
# SCRIPT DE DESPLIEGUE COMPLETO
# FitGenius AI - Railway + Netlify
# ========================================

Write-Host "`n🚀 INICIANDO DESPLIEGUE COMPLETO DE FITGENIUS AI" -ForegroundColor Cyan
Write-Host "=" -Repeat 60 -ForegroundColor Cyan

# ========================================
# PASO 1: Validar instalaciones
# ========================================
Write-Host "`n📦 Verificando dependencias..." -ForegroundColor Yellow

# Verificar Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js no está instalado. Descárgalo de: https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js instalado: $(node --version)" -ForegroundColor Green

# Verificar npm
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm no está disponible" -ForegroundColor Red
    exit 1
}
Write-Host "✅ npm instalado: $(npm --version)" -ForegroundColor Green

# Verificar Railway CLI (opcional)
if (Get-Command railway -ErrorAction SilentlyContinue) {
    Write-Host "✅ Railway CLI instalado: $(railway --version)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Railway CLI no instalado (opcional). Instalar con: npm i -g @railway/cli" -ForegroundColor Yellow
}

# Verificar Netlify CLI (opcional)
if (Get-Command netlify -ErrorAction SilentlyContinue) {
    Write-Host "✅ Netlify CLI instalado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Netlify CLI no instalado (opcional). Instalar con: npm i -g netlify-cli" -ForegroundColor Yellow
}

# ========================================
# PASO 2: Instalar dependencias
# ========================================
Write-Host "`n📦 Instalando dependencias del proyecto..." -ForegroundColor Yellow

# Frontend
Write-Host "  → Instalando dependencias del frontend..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al instalar dependencias del frontend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencias del frontend instaladas" -ForegroundColor Green

# Backend
Write-Host "  → Instalando dependencias del backend..." -ForegroundColor Cyan
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al instalar dependencias del backend" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "✅ Dependencias del backend instaladas" -ForegroundColor Green

# ========================================
# PASO 3: Configurar variables de entorno
# ========================================
Write-Host "`n🔧 Verificando configuración..." -ForegroundColor Yellow

# Verificar .env.production
if (!(Test-Path ".env.production")) {
    Write-Host "❌ Falta archivo .env.production" -ForegroundColor Red
    Write-Host "   Crea el archivo con: VITE_API_URL=https://tu-backend.up.railway.app/api" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Archivo .env.production encontrado" -ForegroundColor Green

# Verificar server/.env
if (!(Test-Path "server/.env")) {
    Write-Host "❌ Falta archivo server/.env" -ForegroundColor Red
    Write-Host "   Crea el archivo con las credenciales de Railway" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Archivo server/.env encontrado" -ForegroundColor Green

# ========================================
# PASO 4: Build del frontend
# ========================================
Write-Host "`n🏗️  Construyendo frontend para producción..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build del frontend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend construido exitosamente (carpeta dist/)" -ForegroundColor Green

# ========================================
# PASO 5: Desplegar Backend a Railway
# ========================================
Write-Host "`n🚂 Preparando despliegue del backend a Railway..." -ForegroundColor Yellow
Write-Host "`n┌─────────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "│  INSTRUCCIONES PARA RAILWAY                    │" -ForegroundColor Magenta
Write-Host "└─────────────────────────────────────────────────┘" -ForegroundColor Magenta

Write-Host "`n1️⃣  Ve a: https://railway.app" -ForegroundColor White
Write-Host "2️⃣  Selecciona tu proyecto" -ForegroundColor White
Write-Host "3️⃣  Si NO tienes un servicio de Backend:" -ForegroundColor White
Write-Host "   → New > GitHub Repo > Conecta este repositorio" -ForegroundColor Cyan
Write-Host "   → Configura Root Directory: /server" -ForegroundColor Cyan
Write-Host "`n4️⃣  Si NO tienes MySQL:" -ForegroundColor White
Write-Host "   → New > Database > MySQL" -ForegroundColor Cyan
Write-Host "`n5️⃣  En el servicio de BACKEND, configura estas variables:" -ForegroundColor White
Write-Host "   ┌─────────────────────────────────────────┐" -ForegroundColor Gray
Write-Host "   │ GEMINI_API_KEY = tu_api_key           │" -ForegroundColor Gray
Write-Host "   │ PORT = 3001                            │" -ForegroundColor Gray
Write-Host "   │ RAILWAY_ENVIRONMENT = production       │" -ForegroundColor Gray
Write-Host "   └─────────────────────────────────────────┘" -ForegroundColor Gray
Write-Host "`n6️⃣  Railway AUTOMÁTICAMENTE crea DATABASE_URL" -ForegroundColor White
Write-Host "   → Ve a Variables, verifica que DATABASE_URL exista" -ForegroundColor Cyan
Write-Host "`n7️⃣  Configura el dominio público:" -ForegroundColor White
Write-Host "   → Settings > Networking > Generate Domain" -ForegroundColor Cyan
Write-Host "   → Copia la URL (ej: https://xxx.up.railway.app)" -ForegroundColor Cyan
Write-Host "`n8️⃣  Actualiza .env.production con tu URL de Railway" -ForegroundColor White
Write-Host "   VITE_API_URL=https://tu-url.up.railway.app/api" -ForegroundColor Cyan

$continue = Read-Host "`n¿Ya configuraste Railway? (s/n)"
if ($continue -ne "s") {
    Write-Host "`n⏸️  Despliegue pausado. Configura Railway y vuelve a ejecutar este script." -ForegroundColor Yellow
    exit 0
}

# ========================================
# PASO 6: Desplegar Frontend a Netlify
# ========================================
Write-Host "`n🌐 Preparando despliegue del frontend a Netlify..." -ForegroundColor Yellow
Write-Host "`n┌─────────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "│  INSTRUCCIONES PARA NETLIFY                    │" -ForegroundColor Magenta
Write-Host "└─────────────────────────────────────────────────┘" -ForegroundColor Magenta

Write-Host "`n1️⃣  Ve a: https://app.netlify.com" -ForegroundColor White
Write-Host "2️⃣  Si NO tienes un sitio:" -ForegroundColor White
Write-Host "   → Add new site > Import an existing project" -ForegroundColor Cyan
Write-Host "   → Conecta tu repositorio de GitHub" -ForegroundColor Cyan
Write-Host "`n3️⃣  Configuración de Build:" -ForegroundColor White
Write-Host "   Build command: npm run build" -ForegroundColor Cyan
Write-Host "   Publish directory: dist" -ForegroundColor Cyan
Write-Host "`n4️⃣  Variables de entorno en Netlify:" -ForegroundColor White
Write-Host "   Site settings > Environment variables > Add" -ForegroundColor Cyan
Write-Host "   ┌─────────────────────────────────────────────────┐" -ForegroundColor Gray
Write-Host "   │ VITE_API_URL = https://tu-backend.up.railway.app/api │" -ForegroundColor Gray
Write-Host "   └─────────────────────────────────────────────────┘" -ForegroundColor Gray
Write-Host "`n5️⃣  Deploys > Trigger deploy" -ForegroundColor White

Write-Host "`n📌 O si tienes Netlify CLI instalado:" -ForegroundColor Yellow
Write-Host "   netlify deploy --prod" -ForegroundColor Cyan

# ========================================
# RESUMEN FINAL
# ========================================
Write-Host "`n" + ("=" * 60) -ForegroundColor Green
Write-Host "✅ PREPARACIÓN COMPLETADA" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Green

Write-Host "`n📋 RESUMEN:" -ForegroundColor Cyan
Write-Host "  ✅ Dependencias instaladas" -ForegroundColor White
Write-Host "  ✅ Frontend construido (dist/)" -ForegroundColor White
Write-Host "  ⚠️  Backend: Sigue las instrucciones de Railway arriba" -ForegroundColor Yellow
Write-Host "  ⚠️  Frontend: Sigue las instrucciones de Netlify arriba" -ForegroundColor Yellow

Write-Host "`n🔗 ENLACES ÚTILES:" -ForegroundColor Cyan
Write-Host "  Railway: https://railway.app" -ForegroundColor White
Write-Host "  Netlify: https://app.netlify.com" -ForegroundColor White
Write-Host "  Gemini API: https://makersuite.google.com/app/apikey" -ForegroundColor White

Write-Host "`n💡 SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host "  1. Verifica que Railway tenga las variables correctas" -ForegroundColor White
Write-Host "  2. Verifica que Netlify apunte a tu backend de Railway" -ForegroundColor White
Write-Host "  3. Prueba tu aplicación en el dominio de Netlify" -ForegroundColor White

Write-Host "`n🎉 ¡Listo para producción!" -ForegroundColor Green
