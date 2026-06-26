@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0export-local-llm-bundle.ps1" %*
exit /b %ERRORLEVEL%
