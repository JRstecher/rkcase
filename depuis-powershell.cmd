@echo off
REM Lance Next.js sans executer de script PowerShell (antivirus / ExecutionPolicy).
REM Dans PowerShell :  .\depuis-powershell.cmd
cd /d "%~dp0"
call dev.cmd
