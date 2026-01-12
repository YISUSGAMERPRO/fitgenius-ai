@echo off
echo ========================================
echo ACTUALIZACION DE RAILWAY - FITGENIUS AI
echo ========================================
echo.
echo Este script:
echo 1. Crea las nuevas tablas en Railway
echo 2. Despliega el servidor actualizado
echo.

echo PASO 1: Conectando a Railway MySQL...
echo.

:: Usar Railway CLI para ejecutar SQL
railway run mysql -u root -pRyfUFsHvrSJwQmnIJFNBEwlMpSRduxJR -h nozomi.proxy.rlwy.net -P 38903 railway < update-railway-tables.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error: No se pudo conectar a Railway MySQL
    echo.
    echo SOLUCIÓN ALTERNATIVA:
    echo 1. Ve a railway.app
    echo 2. Abre tu proyecto
    echo 3. Click en el servicio MySQL
    echo 4. Click en "Query"
    echo 5. Copia y pega el contenido de update-railway-tables.sql
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Tablas actualizadas en Railway
echo.

echo PASO 2: Desplegando servidor actualizado...
echo.

:: Commit y push cambios
cd ..
git add .
git commit -m "feat: Agregar generación de rutinas/dietas en servidor con Gemini AI"
git push origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ Advertencia: No se pudo hacer push a Git
    echo Asegúrate de hacer commit y push manualmente
    echo.
)

echo.
echo ========================================
echo PASOS FINALES (MANUAL):
echo ========================================
echo.
echo 1. Ve a https://railway.app
echo 2. Abre tu proyecto FitGenius
echo 3. Click en el servicio del BACKEND
echo 4. Ve a "Variables"
echo 5. Agrega estas 2 variables:
echo.
echo    GEMINI_API_KEY = AIzaSyBZcPx4viYy7C7EVwT0bBr_x71qtCXR9Ck
echo    RAILWAY_ENVIRONMENT = production
echo.
echo 6. Railway se reiniciará automáticamente
echo 7. Verifica los logs para confirmar
echo.
echo ========================================
echo.

pause
