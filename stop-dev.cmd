@echo off
REM Arrete ce qui ecoute sur 3000 / 3001 (Next.js utilise parfois 3001).
setlocal EnableDelayedExpansion
echo [casebs] Arret des serveurs locaux (ports 3000 et 3001^)...
set "FOUND="
for %%P in (3000 3001) do (
  for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%%P" ^| findstr "LISTENING"') do (
    set "FOUND=1"
    echo   Port %%P - arret du PID %%a
    taskkill /PID %%a /F 2>nul
  )
)
if not defined FOUND echo   Rien en ecoute sur 3000 / 3001.
endlocal
echo [casebs] OK. Pour relancer : dev.cmd
REM Pas de "pause" : la fenetre peut se fermer toute seule (normal).
timeout /t 3 >nul
