# Test del API para guardar en Neon
Start-Sleep -Seconds 2
Write-Host "Testeando API..." -ForegroundColor Cyan

# Test 1: Health check
Write-Host "`n📡 Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET | ConvertFrom-Json
    Write-Host "✅ Servidor OK: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor no responde" -ForegroundColor Red
}

# Test 2: Guardar miembro
Write-Host "`n💾 Test 2: Guardar miembro en Neon" -ForegroundColor Yellow
try {
    $body = @{
        id = "member-test-$(Get-Random)"
        name = "Juan Pérez"
        plan = "Premium"
        status = "Activo"
        lastPaymentDate = "2025-01-14"
        lastPaymentAmount = 99.99
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/members" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Miembro guardado:" -ForegroundColor Green
    Write-Host "   ID: $($result.id)"
    Write-Host "   Mensaje: $($result.message)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Ver estadísticas de BD
Write-Host "`n📊 Test 3: Estadísticas de BD" -ForegroundColor Yellow
try {
    $stats = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/database-stats" -Method GET | ConvertFrom-Json
    Write-Host "✅ Estadísticas:" -ForegroundColor Green
    Write-Host "   Usuarios: $($stats.users_count)"
    Write-Host "   Miembros: $($stats.gym_members_count)"
    Write-Host "   Planes: $($stats.workout_plans_count)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Tests completados!" -ForegroundColor Cyan
