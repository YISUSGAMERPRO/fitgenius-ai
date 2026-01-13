# SCRIPT DE VERIFICACION LOCAL
# FitGenius AI

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "VERIFICACION LOCAL DE FITGENIUS AI" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar archivos de configuracion
Write-Host "Verificando archivos..." -ForegroundColor Yellow

if (Test-Path ".env.production") {
    Write-Host "  OK - .env.production encontrado" -ForegroundColor Green
} else {
    Write-Host "  ERROR - .env.production no encontrado" -ForegroundColor Red
}

if (Test-Path "server\.env") {
    Write-Host "  OK - server\.env encontrado" -ForegroundColor Green
} else {
    Write-Host "  ERROR - server\.env no encontrado" -ForegroundColor Red
}

if (Test-Path "package.json") {
    Write-Host "  OK - package.json encontrado" -ForegroundColor Green
} else {
    Write-Host "  ERROR - package.json no encontrado" -ForegroundColor Red
}

# Verificar dependencias
Write-Host ""
Write-Host "Verificando dependencias..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "  OK - Dependencias del frontend instaladas" -ForegroundColor Green
} else {
    Write-Host "  AVISO - Dependencias del frontend no instaladas" -ForegroundColor Yellow
    Write-Host "          Ejecuta: npm install" -ForegroundColor Gray
}

if (Test-Path "server\node_modules") {
    Write-Host "  OK - Dependencias del backend instaladas" -ForegroundColor Green
} else {
    Write-Host "  AVISO - Dependencias del backend no instaladas" -ForegroundColor Yellow
    Write-Host "          Ejecuta: cd server; npm install" -ForegroundColor Gray
}

# Verificar variables de entorno
Write-Host ""
Write-Host "Verificando variables de entorno..." -ForegroundColor Yellow

if (Test-Path ".env.production") {
    $envContent = Get-Content ".env.production" -Raw
    if ($envContent -match "VITE_API_URL=") {
        $url = ($envContent -split "`n" | Where-Object { $_ -match "VITE_API_URL=" }) -replace "VITE_API_URL=", ""
        Write-Host "  OK - VITE_API_URL configurada" -ForegroundColor Green
        Write-Host "       URL: $url" -ForegroundColor Gray
    } else {
        Write-Host "  ERROR - VITE_API_URL no encontrada" -ForegroundColor Red
    }
}

if (Test-Path "server\.env") {
    $serverEnv = Get-Content "server\.env" -Raw
    if ($serverEnv -match "GEMINI_API_KEY=AI") {
        Write-Host "  OK - GEMINI_API_KEY configurada" -ForegroundColor Green
    } else {
        Write-Host "  ERROR - GEMINI_API_KEY no configurada" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "VERIFICACION COMPLETADA" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso: .\DEPLOY-COMPLETO.ps1" -ForegroundColor Cyan
Write-Host ""
