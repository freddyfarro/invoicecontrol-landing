@echo off
cd /d "%~dp0"
echo Limpiando locks de git...
if exist .git\index.lock del .git\index.lock
if exist .git\HEAD.lock del .git\HEAD.lock
echo.
echo Haciendo commit...
git add -A
git commit -m "feat: guardar registros waitlist en Google Sheets"
echo.
echo Subiendo a GitHub...
git push origin main
echo.
echo Listo! Vercel desplegara automaticamente.
pause
