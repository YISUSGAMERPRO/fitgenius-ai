# ========================================
# SCRIPT DE PRUEBA LOCAL
# Verifica que todo esté configurado correctamente
# ========================================

Write-Host "`n🧪 INICIANDO PRUEBAS LOCALES DE FITGENIUS AI" -ForegroundColor Cyan
Write-Host "=" -Repeat 60 -ForegroundColor Cyan

# ========================================
# 1. Verificar archivos de configuración
# ========================================
Write-Host "`n📋 Verificando archivos de configuración..." -ForegroundColor Yellow

$configFiles = @(
    @{ Path = ".env"; Required = $false; Description = "Entorno local" },
    @{ Path = ".env.production"; Required = $true; Description = "Producción (Netlify)" },
    @{ Path = "server\.env"; Required = $true; Description = "Backend (Railway)" },
    @{ Path = "package.json"; Required = $true; Description = "Dependencias frontend" },
    @{ Path = "server\package.json"; Required = $true; Description = "Dependencias backend" }
)

$missingFiles = @()
foreach ($file in $configFiles) {
    if (Test-Path $file.Path) {
        Write-Host "  ✅ $($file.Path) - $($file.Description)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($file.Path) - $($file.Description) (FALTA)" -ForegroundColor Red
        if ($file.Required) {
            $missingFiles += $file.Path
        }
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`n❌ Faltan archivos requeridos:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    exit 1
}

# ========================================
# 2. Verificar variables de entorno
# ========================================
Write-Host "`n🔑 Verificando variables de entorno..." -ForegroundColor Yellow

# Cargar .env.production
if (Test-Path ".env.production") {
    $envContent = Get-Content ".env.production"
    $viteApiUrl = ($envContent | Select-String "VITE_API_URL=").ToString().Split("=")[1]
    
    if ($viteApiUrl) {
        Write-Host "  ✅ VITE_API_URL configurada: $viteApiUrl" -ForegroundColor Green
        
        if ($viteApiUrl -like "*localhost*") {
            Write-Host "  ⚠️  Usando localhost. Actualiza para producción." -ForegroundColor Yellow
        } elseif ($viteApiUrl -notlike "*.railway.app*") {
            Write-Host "  ⚠️  No parece ser una URL de Railway. Verifica." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ VITE_API_URL no encontrada en .env.production" -ForegroundColor Red
    }
}

# Verificar server/.env
Write-Host "`n  Verificando server/.env..." -ForegroundColor Cyan
if (Test-Path "server\.env") {
    $serverEnv = Get-Content "server\.env"
    
    $geminiKey = ($serverEnv | Select-String "GEMINI_API_KEY=").ToString()
    if ($geminiKey -and $geminiKey -notlike "*GEMINI_API_KEY=`$*" -and $geminiKey.Length -gt 20) {
        Write-Host "  ✅ GEMINI_API_KEY configurada" -ForegroundColor Green
    } else {
        Write-Host "  ❌ GEMINI_API_KEY no configurada o inválida" -ForegroundColor Red
    }
    
    $dbHost = ($serverEnv | Select-String "DB_HOST=").ToString()
    if ($dbHost) {
        $dbHostValue = $dbHost.Split("=")[1]
        Write-Host "  ✅ DB_HOST configurado: $dbHostValue" -ForegroundColor Green
        
        if ($dbHostValue -match "rlwy.net") {
            Write-Host "    Info: Usando Railway MySQL" -ForegroundColor Cyan
        } elseif ($dbHostValue -eq "localhost") {
            Write-Host "    Aviso: Usando MySQL local. Cambiar para produccion." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  ❌ server\.env no encontrado" -ForegroundColor Red
}

# ========================================
# 3. Verificar dependencias
# ========================================
Write-Host "`n📦 Verificando dependencias..." -ForegroundColor Yellow

# Frontend
if (Test-Path "node_modules") {
    Write-Host "  ✅ Dependencias del frontend instaladas" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Dependencias del frontend no instaladas. Ejecuta: npm install" -ForegroundColor Yellow
}

# Backend
if (Test-Path "server\node_modules") {
    Write-Host "  ✅ Dependencias del backend instaladas" -ForegroundColor Green
} else {
    Write-Host "  Aviso: Dependencias del backend no instaladas. Ejecuta: cd server; npm install" -ForegroundColor Yellow
}

# ========================================
# 4. Probar servidor local (opcional)
# ========================================
Write-Host "`n🚀 ¿Deseas probar el servidor localmente? (s/n): " -ForegroundColor Yellow -NoNewline
$testLocal = Read-Host

if ($testLocal -eq "s") {
    Write-Host "`n  Iniciando servidor backend..." -ForegroundColor Cyan
    Write-Host "  Presiona Ctrl+C para detener cuando veas '🚀 Servidor backend corriendo'" -ForegroundColor Gray
    
    Set-Location server
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server.js"
    Set-Location ..
    
    Write-Host "`n  Esperando 5 segundos para que el servidor inicie..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    Write-Host "`n  Probando endpoint de API..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/members" -TimeoutSec 5 -UseBasicParsing
        Write-Host "  ✅ Servidor respondiendo correctamente (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Error al conectar con el servidor local" -ForegroundColor Red
        Write-Host "     Asegúrate de que el servidor esté corriendo en otra terminal" -ForegroundColor Yellow
    }
}

# ========================================
# 5. Resumen y recomendaciones
# ========================================
Write-Host "`n" + ("=" * 60) -ForegroundColor Green
Write-Host "📊 RESUMEN DE PRUEBAS" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Green

Write-Host "`n✅ TODO LISTO para despliegue si:" -ForegroundColor Green
Write-Host "  1. Todos los archivos existen" -ForegroundColor White
Write-Host "  2. GEMINI_API_KEY está configurada" -ForegroundColor White
Write-Host "  3. Las dependencias están instaladas" -ForegroundColor White
Write-Host "  4. El servidor local responde correctamente" -ForegroundColor White

Write-Host "`n📝 SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host "  1. Ejecuta: .\DEPLOY-COMPLETO.ps1" -ForegroundColor Cyan
Write-Host "  2. Sigue las instrucciones para Railway" -ForegroundColor Cyan
Write-Host "  3. Sigue las instrucciones para Netlify" -ForegroundColor Cyan

Write-Host "`n📚 DOCUMENTACIÓN:" -ForegroundColor Yellow
Write-Host "  - Guia completa: CONFIGURACION-RAILWAY.md" -ForegroundColor Cyan
Write-Host "  - Variables: VARIABLES-ENTORNO.md" -ForegroundColor Cyan

Write-Host "`nBuena suerte con el despliegue!" -ForegroundColor Green
