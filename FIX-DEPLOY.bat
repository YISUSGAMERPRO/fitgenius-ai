@echo off
chcp 65001 >nul
echo ========================================
echo    FITGENIUS - DEPLOYMENT FIX
echo ========================================
echo.

cd /d c:\xampp\htdocs\fitgenius-ai

echo [1/4] Verificando sintaxis...
node --check server\server-neon.js
if errorlevel 1 (
    echo ERROR: El codigo tiene errores de sintaxis
    pause
    exit /b 1
)
echo OK - Sintaxis correcta

echo.
echo [2/4] Agregando archivos a git...
git add .
echo OK

echo.
echo [3/4] Haciendo commit...
git commit -m "Fix: Remove duplicate code block and use server-neon.js"
echo OK

echo.
echo [4/4] Subiendo a GitHub...
git push origin main
echo.

echo ========================================
echo    DEPLOYMENT COMPLETADO!
echo ========================================
echo.
echo Railway detectara los cambios en 2-3 min
echo y desplegara automaticamente.
echo.
pause
