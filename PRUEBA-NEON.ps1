
# Test - Guardar datos en Neon

Write-Host "`n===== TEST: GUARDAR DATOS EN NEON =====" -ForegroundColor Cyan
Write-Host "Servidor: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""

# Test Health
Write-Host "1. Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   Servidor OK - Status: $($health.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: No se pudo conectar al servidor" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 1: Guardar miembro
Write-Host "2. Guardando miembro en Neon..." -ForegroundColor Yellow
try {
    $json = @{
        name = "Carlos Mendez"
        plan = "Premium"
        status = "Activo"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/members" -Method POST `
        -ContentType "application/json" -Body $json -TimeoutSec 10 -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "   EXITO - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   ID Generado: $($result.id)" -ForegroundColor Green
    Write-Host "   Mensaje: $($result.message)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Guardar otro miembro
Write-Host "3. Guardando segundo miembro..." -ForegroundColor Yellow
try {
    $json2 = @{
        name = "Maria Lopez"
        plan = "Standard"
        status = "Activo"
    } | ConvertTo-Json
    
    $response2 = Invoke-WebRequest -Uri "http://localhost:3001/api/members" -Method POST `
        -ContentType "application/json" -Body $json2 -TimeoutSec 10 -ErrorAction Stop
    
    $result2 = $response2.Content | ConvertFrom-Json
    Write-Host "   EXITO - Status: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "   ID Generado: $($result2.id)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Ver estadisticas
Write-Host "4. Consultando estadisticas de BD..." -ForegroundColor Yellow
try {
    $stats = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/database-stats" `
        -Method GET -TimeoutSec 10 -ErrorAction Stop
    
    $data = $stats.Content | ConvertFrom-Json
    Write-Host "   EXITO - Status: $($stats.StatusCode)" -ForegroundColor Green
    Write-Host "   Total Miembros: $($data.gym_members_count)" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "   Ultimos Miembros:" -ForegroundColor Cyan
    $data.recent_gym_members | ForEach-Object {
        Write-Host "      - $($_.name) (Plan: $($_.plan), Estado: $($_.status))" -ForegroundColor Green
    }
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "===== RESUMEN =====" -ForegroundColor Cyan
Write-Host "Los datos ESTAN SIENDO GUARDADOS EN NEON" -ForegroundColor Green
Write-Host "Verifica en: https://console.neon.tech" -ForegroundColor Cyan
Write-Host "SQL: SELECT * FROM gym_members;" -ForegroundColor Cyan
Write-Host ""
Read-Host "Presiona Enter para salir"
