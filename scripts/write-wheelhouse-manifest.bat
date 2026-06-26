@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0write-wheelhouse-manifest.ps1"
exit /b %ERRORLEVEL%
