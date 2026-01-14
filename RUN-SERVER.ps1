# ========================================
# SCRIPT PARA EJECUTAR EL SERVIDOR CORRECTAMENTE
# ========================================

Write-Host "🚀 Iniciando FitGenius Server..." -ForegroundColor Green
Write-Host ""

# 1. Ir al directorio del servidor
Push-Location "C:\xampp\htdocs\fitgenius-ai\server"

# 2. Verificar si .env existe en el servidor
if (Test-Path ".\.env") {
    Write-Host "✅ Archivo .env encontrado en el servidor" -ForegroundColor Green
    Get-Content ".\.env"
} else {
    Write-Host "⚠️ No hay .env en /server, usando el de raíz..." -ForegroundColor Yellow
    if (Test-Path "..\..env") {
        Write-Host "✅ Copiando .env desde raíz..." -ForegroundColor Green
        Copy-Item "..\..env" ".\.env"
    } else {
        Write-Host "❌ No se encontró .env" -ForegroundColor Red
    }
}

# 3. Listar variables de entorno críticas
Write-Host ""
Write-Host "📋 Configuración de Entorno:" -ForegroundColor Cyan
Write-Host ""

$env:DATABASE_URL = Get-Content ".\.env" | Select-String "DATABASE_URL" | ForEach-Object { $_.Line.Split("=")[1] }
$env:GEMINI_API_KEY = Get-Content ".\.env" | Select-String "GEMINI_API_KEY" | ForEach-Object { $_.Line.Split("=")[1] }
$env:PORT = Get-Content ".\.env" | Select-String "PORT" | ForEach-Object { $_.Line.Split("=")[1] }

if (-not $env:PORT) { $env:PORT = "3001" }

Write-Host "  DATABASE_URL: $($env:DATABASE_URL.Substring(0, 30))..." -ForegroundColor Yellow
Write-Host "  GEMINI_API_KEY: $($env:GEMINI_API_KEY.Substring(0, 10))..." -ForegroundColor Yellow
Write-Host "  PORT: $($env:PORT)" -ForegroundColor Yellow
Write-Host ""

# 4. Asegurar que estamos instalando dependencias
if (-not (Test-Path ".\node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "✅ Dependencias ya instaladas" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Ejecutando con npm start (server-neon.js)..." -ForegroundColor Green
Write-Host ""

# 5. Ejecutar el servidor
npm start

Pop-Location
