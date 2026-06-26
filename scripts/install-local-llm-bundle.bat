@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-local-llm-bundle.ps1" %*
exit /b %ERRORLEVEL%
