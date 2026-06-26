$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $root "backend")
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
  throw "python executable was not found on PATH."
}
& $python.Source -m uvicorn openclaw.main:app --host 127.0.0.1 --port 8765 --reload
