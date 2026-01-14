@echo off
timeout /t 2
echo Testing API...
echo.

REM Test 1: Health Check
echo Test 1: Health Check
powershell -Command "Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -Method GET -ErrorAction SilentlyContinue | ConvertFrom-Json | ConvertTo-Json"
echo.

REM Test 2: Save Member
echo Test 2: Save Member
powershell -Command "$body = @{id='member-$(Get-Random)';name='Test User';plan='Premium';status='Activo'} | ConvertTo-Json; Invoke-WebRequest -Uri 'http://localhost:3001/api/members' -Method POST -ContentType 'application/json' -Body $body -ErrorAction SilentlyContinue | ConvertFrom-Json | ConvertTo-Json"
echo.

REM Test 3: Database Stats
echo Test 3: Database Stats  
powershell -Command "Invoke-WebRequest -Uri 'http://localhost:3001/api/admin/database-stats' -Method GET -ErrorAction SilentlyContinue | ConvertFrom-Json | ConvertTo-Json"
echo.

echo Tests completed!
pause
