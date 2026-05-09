@echo off
cd /d "%~dp0"
echo Subiendo a GitHub...
git push origin main
echo.
echo Listo! Vercel desplegara automaticamente en unos segundos.
pause
