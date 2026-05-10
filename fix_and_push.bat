@echo off
cd /d "%~dp0"
echo Limpiando locks de git...
if exist .git\index.lock del .git\index.lock
if exist .git\HEAD.lock del .git\HEAD.lock
echo.
echo Reparando indice de git...
git read-tree HEAD
echo.
echo Añadiendo todos los archivos...
git add -A
echo.
echo Haciendo commit...
git commit -m "seo: sitemap.xml, robots.txt, canonical, og:image, twitter card, schema.org + hero menciona correo corporativo y carga manual"
echo.
echo Subiendo a GitHub...
git push origin main
echo.
echo Listo! Vercel desplegara automaticamente.
pause
