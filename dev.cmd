@echo off
setlocal EnableExtensions
REM Lance Next.js. Node est ajoute au PATH si installe en emplacement classique.
REM PowerShell bloque parfois les scripts : utilisez ce fichier ou depuis-powershell.cmd

if exist "%ProgramFiles%\nodejs\node.exe" (
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
)
for %%D in ("%ProgramFiles(x86)%\nodejs" "%LocalAppData%\Programs\node") do (
  if exist "%%~D\node.exe" set "PATH=%%~D;%PATH%"
)
if exist "%USERPROFILE%\.volta\bin\node.exe" (
  set "PATH=%USERPROFILE%\.volta\bin;%PATH%"
)

cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo [casebs] Node.js introuvable. Installez Node LTS depuis https://nodejs.org
  echo Cochez "Add to PATH" a l'installation, puis rouvrez le terminal.
  exit /b 1
)

call npm run dev
