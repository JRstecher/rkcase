@echo off
REM Nouvelle fenetre CMD + Next.js (evite les soucis PowerShell).
start "Casebs Next.js" /D "%~dp0" cmd /k dev.cmd
