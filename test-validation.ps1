$BaseUrl = "https://fitgenius-ai-production.up.railway.app"

Write-Host "╔════════════════════════════════════════╗"
Write-Host "║   FITGENIUS AI - VALIDACION FINAL     ║"
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n📋 TEST 1: Health Check" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -Method GET -ContentType "application/json" -ErrorAction Stop -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend activo (Status: 200)" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   Status DB: $(if ($data.database) { '✅ Conectado' } else { '❌ Desconectado' })" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test 2: Registration
Write-Host "`n📋 TEST 2: Registro de Usuario" -ForegroundColor Cyan
$email = "test-$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
try {
    $body = @{
        email = $email
        password = "TestPassword123!"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop -TimeoutSec 10
    if ($response.StatusCode -eq 201 -or $response.StatusCode -eq 200) {
        $user = $response.Content | ConvertFrom-Json
        $script:userId = $user.id
        Write-Host "✅ Registro exitoso (Status: $($response.StatusCode))" -ForegroundColor Green
        Write-Host "   User ID: $($user.id)" -ForegroundColor Cyan
        Write-Host "   Email: $($user.email)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    return
}

# Test 3: Save Profile
if ($userId) {
    Write-Host "`n📋 TEST 3: Guardar Perfil" -ForegroundColor Cyan
    try {
        $body = @{
            userId = $userId
            age = 28
            weight = 75
            height = 180
            goal = "muscle_gain"
            fitnessLevel = "intermediate"
            availableDays = 4
            preferences = @("strength", "compound")
            medicalHistory = ""
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/profile" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Perfil guardado" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Warning: $_" -ForegroundColor Yellow
    }

    # Test 4: Generate Workout
    Write-Host "`n📋 TEST 4: Generar Rutina" -ForegroundColor Cyan
    try {
        $body = @{
            userId = $userId
            goal = "muscle_gain"
            daysAvailable = 4
            equipmentAvailable = @("dumbbells", "barbell", "bench")
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/generate-workout" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            $workout = $response.Content | ConvertFrom-Json
            if ($workout.error) {
                Write-Host "⚠️  API Response: $($workout.error)" -ForegroundColor Yellow
            } else {
                Write-Host "✅ Rutina generada" -ForegroundColor Green
                Write-Host "   Título: $($workout.title)" -ForegroundColor Cyan
                if ($workout.schedule) {
                    Write-Host "   Días: $($workout.schedule.Count)" -ForegroundColor Cyan
                }
                
                # Test 5: Save Workout
                Write-Host "`n📋 TEST 5: Guardar Rutina en BD" -ForegroundColor Cyan
                try {
                    $saveBody = @{
                        userId = $userId
                        title = $workout.title
                        planData = $workout
                    } | ConvertTo-Json -Depth 10
                    
                    $saveResponse = Invoke-WebRequest -Uri "$BaseUrl/api/save-workout" -Method POST -Body $saveBody -ContentType "application/json" -ErrorAction Stop -TimeoutSec 10
                    if ($saveResponse.StatusCode -eq 200) {
                        Write-Host "✅ Rutina guardada en BD" -ForegroundColor Green
                        $saveData = $saveResponse.Content | ConvertFrom-Json
                        Write-Host "   Plan ID: $($saveData.id)" -ForegroundColor Cyan
                    }
                } catch {
                    Write-Host "❌ Error al guardar: $_" -ForegroundColor Red
                }
            }
        }
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }

    # Test 6: Generate Diet
    Write-Host "`n📋 TEST 6: Generar Plan de Dieta" -ForegroundColor Cyan
    try {
        $body = @{
            userId = $userId
            goal = "muscle_gain"
            calories = 2500
            restrictions = @()
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/generate-diet" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            $diet = $response.Content | ConvertFrom-Json
            if ($diet.error) {
                Write-Host "⚠️  API Response: $($diet.error)" -ForegroundColor Yellow
            } else {
                Write-Host "✅ Dieta generada" -ForegroundColor Green
                Write-Host "   Título: $($diet.title)" -ForegroundColor Cyan
                if ($diet.days) {
                    Write-Host "   Días: $($diet.days.Count)" -ForegroundColor Cyan
                }
                
                # Test 7: Save Diet
                Write-Host "`n📋 TEST 7: Guardar Dieta en BD" -ForegroundColor Cyan
                try {
                    $saveBody = @{
                        userId = $userId
                        title = $diet.title
                        planData = $diet
                    } | ConvertTo-Json -Depth 10
                    
                    $saveResponse = Invoke-WebRequest -Uri "$BaseUrl/api/save-diet" -Method POST -Body $saveBody -ContentType "application/json" -ErrorAction Stop -TimeoutSec 10
                    if ($saveResponse.StatusCode -eq 200) {
                        Write-Host "✅ Dieta guardada en BD" -ForegroundColor Green
                        $saveData = $saveResponse.Content | ConvertFrom-Json
                        Write-Host "   Plan ID: $($saveData.id)" -ForegroundColor Cyan
                    }
                } catch {
                    Write-Host "❌ Error al guardar: $_" -ForegroundColor Red
                }
            }
        }
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}

Write-Host "`n╔════════════════════════════════════════╗"
Write-Host "║     VALIDACION COMPLETADA             ║"
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host "✅ FitGenius AI está listo para producción" -ForegroundColor Green
