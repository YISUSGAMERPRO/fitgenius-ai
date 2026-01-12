@echo off
cls
echo ============================================
echo   CONFIGURANDO BASE DE DATOS EN RAILWAY
echo ============================================
echo.
cd /d "C:\xampp\htdocs\fitgenius-ai\server"
node setup-railway-auto.js
echo.
echo ============================================
pause
