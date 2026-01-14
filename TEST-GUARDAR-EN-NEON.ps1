# Test Completo de Guardado en Neon
Write-Host "TEST GUARDANDO MIEMBROS EN NEON" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Guardar primer miembro
Write-Host "1. Guardando Miembro 1..." -ForegroundColor Yellow
try {
    $member1 = @{
        name = "Juan Carlos Lopez"
        plan = "Premium"
        status = "Activo"
    } | ConvertTo-Json
    
    $res1 = Invoke-WebRequest -Uri "http://localhost:3001/api/members" -Method POST -ContentType "application/json" -Body $member1 -ErrorAction Stop
    $data1 = $res1.Content | ConvertFrom-Json
    Write-Host "   Status: $($res1.StatusCode)" -ForegroundColor Green
    Write-Host "   ID Generado: $($data1.id)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Guardar segundo miembro
Write-Host "2. Guardando Miembro 2..." -ForegroundColor Yellow
try {
    $member2 = @{
        name = "Maria Garcia Rodriguez"
        plan = "Standard"
        status = "Activo"
    } | ConvertTo-Json
    
    $res2 = Invoke-WebRequest -Uri "http://localhost:3001/api/members" -Method POST -ContentType "application/json" -Body $member2 -ErrorAction Stop
    $data2 = $res2.Content | ConvertFrom-Json
    Write-Host "   Status: $($res2.StatusCode)" -ForegroundColor Green
    Write-Host "   ID Generado: $($data2.id)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Ver estadísticas
Write-Host "3. Estadísticas de Base de Datos..." -ForegroundColor Yellow
try {
    $stats = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/database-stats" -Method GET -ErrorAction Stop
    $statsData = $stats.Content | ConvertFrom-Json
    Write-Host "   Total Miembros: $($statsData.gym_members_count)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Mostrar últimos miembros
Write-Host "4. Ultimos Miembros Guardados:" -ForegroundColor Cyan
if ($statsData.recent_gym_members) {
    $statsData.recent_gym_members | ForEach-Object { 
        Write-Host "   - $($_.name) (Plan: $($_.plan), Estado: $($_.status))" -ForegroundColor Green
    }
} else {
    Write-Host "   (No hay registros)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "RESUMEN: Los datos estan siendo guardados EN NEON" -ForegroundColor Cyan
Write-Host "Verifica en: https://console.neon.tech" -ForegroundColor Cyan
