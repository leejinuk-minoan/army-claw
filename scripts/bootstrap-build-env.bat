@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0bootstrap-build-env.ps1" %*
exit /b %ERRORLEVEL%
