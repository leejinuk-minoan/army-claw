param(
  [switch]$Recreate
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$venv = Join-Path $root ".build-venv"
$venvPython = Join-Path $venv "Scripts\python.exe"
$wheelhouse = Join-Path $root "vendor\python-wheels"
$requirements = Join-Path $root "requirements\build.txt"

function Resolve-Python {
  if ($env:ARMY_CLAW_BOOTSTRAP_PYTHON) {
    if (Test-Path -LiteralPath $env:ARMY_CLAW_BOOTSTRAP_PYTHON) {
      return $env:ARMY_CLAW_BOOTSTRAP_PYTHON
    }
    throw "ARMY_CLAW_BOOTSTRAP_PYTHON does not exist: $env:ARMY_CLAW_BOOTSTRAP_PYTHON"
  }

  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) { return $python.Source }

  throw "Python executable was not found."
}

if (-not (Test-Path -LiteralPath $wheelhouse)) {
  throw "Wheelhouse was not found: $wheelhouse. Run scripts\export-python-wheels.bat on an approved preparation machine, then bring vendor\python-wheels into the offline network."
}

if ($Recreate -and (Test-Path -LiteralPath $venv)) {
  Remove-Item -LiteralPath $venv -Recurse -Force
}

if (-not (Test-Path -LiteralPath $venvPython)) {
  $pythonExe = Resolve-Python
  Write-Host "Creating build venv with: $pythonExe"
  & $pythonExe -m venv $venv
}

Write-Host "== Army Claw build venv bootstrap =="
Write-Host "Venv: $venv"
Write-Host "Wheelhouse: $wheelhouse"

& $venvPython -m pip install --no-index --find-links $wheelhouse --requirement $requirements
& $venvPython -m pip install --no-index --find-links $wheelhouse --editable $backend
& $venvPython -m PyInstaller --version
& $venvPython -c "import fastapi, openclaw, pydantic, uvicorn; print('build venv imports ok')"

Write-Host "Build venv ready: $venvPython"
