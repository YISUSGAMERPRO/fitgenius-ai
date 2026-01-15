@echo off
echo === DEPLOYMENT FITGENIUS ===
cd /d c:\xampp\htdocs\fitgenius-ai
echo.
echo [1/3] Adding files...
git add .
echo.
echo [2/3] Committing...
git commit -m "Fix: Railway deployment - Use server-neon.js and enforce full AI generation"
echo.
echo [3/3] Pushing to GitHub...
git push origin main
echo.
echo === DEPLOYMENT COMPLETED ===
echo Railway will redeploy automatically in 2-3 minutes
pause
