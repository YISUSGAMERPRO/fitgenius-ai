#!/usr/bin/env pwsh
# Script de prueba completo: Registro → Perfil → Generación → Guardado

$BaseUrl = "https://fitgenius-ai-production.up.railway.app"
$Results = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Uri,
        [object]$Body
    )
    
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            ContentType = "application/json"
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = $Body | ConvertTo-Json -Depth 10
        }
        
        $response = Invoke-WebRequest @params
        $result = @{
            Name = $Name
            Status = $response.StatusCode
            Success = $true
            Data = $response.Content
        }
    } catch {
        $result = @{
            Name = $Name
            Status = $_.Exception.Response.StatusCode.Value__
            Success = $false
            Error = $_.Exception.Message
        }
    }
    
    $Results += $result
    Write-Host "[$($result.Status)] $Name - $(if ($result.Success) { '✅' } else { '❌' })"
    
    return $result
}

Write-Host "`n=== PRUEBAS END-TO-END FITGENIUS AI ===" -ForegroundColor Cyan

# 1. HEALTH CHECK
Write-Host "`n1️⃣  HEALTH CHECK"
$health = Test-Endpoint -Name "GET /api/health" -Method "GET" -Uri "$BaseUrl/api/health"

# 2. REGISTRO DE USUARIO
Write-Host "`n2️⃣  REGISTRO DE USUARIO"
$regBody = @{
    email = "testflow_$(Get-Random)@example.com"
    password = "TestPassword123!"
}
$regResult = Test-Endpoint -Name "POST /api/register" -Method "POST" -Uri "$BaseUrl/api/register" -Body $regBody

if ($regResult.Success) {
    $userId = ($regResult.Data | ConvertFrom-Json).id
    Write-Host "   ✓ Usuario creado: $userId" -ForegroundColor Green
} else {
    Write-Host "   ✗ Falló registro" -ForegroundColor Red
    exit 1
}

# 3. GUARDAR PERFIL
Write-Host "`n3️⃣  GUARDAR PERFIL"
$profileBody = @{
    id = "profile_$userId"
    user_id = $userId
    name = "Test User"
    age = 30
    height = 175
    weight = 75
    gender = "Masculino"
    body_type = "Mesomorfo"
    goal = "Ganar músculo"
    activity_level = "Moderado"
    equipment = @("Mancuernas", "Barra")
    injuries = $null
    is_cycle_tracking = $false
}
$profileResult = Test-Endpoint -Name "POST /api/profile" -Method "POST" -Uri "$BaseUrl/api/profile" -Body $profileBody

# 4. GENERAR RUTINA
Write-Host "`n4️⃣  GENERAR RUTINA"
$workoutBody = @{
    userId = $userId
    workoutType = "Full Body"
    profile = @{
        age = 30
        gender = "Masculino"
        weight = 75
        height = 175
        goal = "Ganar músculo"
        activityLevel = "Moderado"
        equipment = @("Mancuernas", "Barra")
        injuries = $null
    }
}
$workoutGenResult = Test-Endpoint -Name "POST /api/generate-workout" -Method "POST" -Uri "$BaseUrl/api/generate-workout" -Body $workoutBody

if ($workoutGenResult.Success) {
    $workoutData = $workoutGenResult.Data | ConvertFrom-Json
    Write-Host "   ✓ Rutina generada: $($workoutData.title)" -ForegroundColor Green
    $planId = $workoutData.id
} else {
    Write-Host "   ✗ Falló generación de rutina" -ForegroundColor Red
}

# 5. GENERAR DIETA
Write-Host "`n5️⃣  GENERAR DIETA"
$dietBody = @{
    userId = $userId
    dietType = "Balanceada"
    profile = @{
        age = 30
        gender = "Masculino"
        weight = 75
        height = 175
        goal = "Ganar músculo"
        activityLevel = "Moderado"
    }
}
$dietGenResult = Test-Endpoint -Name "POST /api/generate-diet" -Method "POST" -Uri "$BaseUrl/api/generate-diet" -Body $dietBody

if ($dietGenResult.Success) {
    $dietData = $dietGenResult.Data | ConvertFrom-Json
    Write-Host "   ✓ Dieta generada: $($dietData.title)" -ForegroundColor Green
} else {
    Write-Host "   ✗ Falló generación de dieta" -ForegroundColor Red
}

# 6. GUARDAR WORKOUT MANUALMENTE
Write-Host "`n6️⃣  GUARDAR WORKOUT"
$saveWorkoutBody = @{
    userId = $userId
    title = "Full Body Plan"
    planData = @{
        title = "Full Body"
        schedule = @(@{
            dayName = "Lunes"
            focus = "Cuerpo Completo"
            exercises = @(
                @{
                    name = "Sentadillas"
                    sets = 4
                    reps = "8-12"
                    rest = "90s"
                    muscleGroup = "Piernas"
                }
            )
        })
    }
}
$saveWorkoutResult = Test-Endpoint -Name "POST /api/save-workout" -Method "POST" -Uri "$BaseUrl/api/save-workout" -Body $saveWorkoutBody

# 7. OBTENER WORKOUT
Write-Host "`n7️⃣  OBTENER WORKOUT"
$getWorkoutResult = Test-Endpoint -Name "GET /api/workout/:userId" -Method "GET" -Uri "$BaseUrl/api/workout/$userId"

# 8. OBTENER PERFIL
Write-Host "`n8️⃣  OBTENER PERFIL"
$getProfileResult = Test-Endpoint -Name "GET /api/profile/:userId" -Method "GET" -Uri "$BaseUrl/api/profile/$userId"

# 9. VERIFICAR SESIÓN
Write-Host "`n9️⃣  VERIFICAR SESIONES"
$sessionsResult = Test-Endpoint -Name "GET /api/sessions/:userId" -Method "GET" -Uri "$BaseUrl/api/sessions/$userId"

# RESUMEN
Write-Host "`n`n=== RESUMEN ===" -ForegroundColor Cyan
$successCount = ($Results | Where-Object { $_.Success }).Count
$totalCount = $Results.Count

Write-Host "✅ Exitosas: $successCount/$totalCount" -ForegroundColor Green
Write-Host "❌ Fallidas: $($totalCount - $successCount)/$totalCount" -ForegroundColor Red

Write-Host "`n📋 Detalles:" -ForegroundColor Yellow
$Results | ForEach-Object {
    $status = if ($_.Success) { "✅" } else { "❌" }
    Write-Host "$status $($_.Name) - Status: $($_.Status)"
}

Write-Host "`n✨ PRUEBA COMPLETADA ✨" -ForegroundColor Cyan
