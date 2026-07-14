@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0package-openclaw-beta.ps1"
exit /b %ERRORLEVEL%