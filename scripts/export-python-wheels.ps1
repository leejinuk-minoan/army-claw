$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$requirements = Join-Path $root "requirements\build.txt"
$wheelhouse = Join-Path $root "vendor\python-wheels"

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

$pythonExe = Resolve-Python
New-Item -ItemType Directory -Force -Path $wheelhouse | Out-Null

Write-Host "== Army Claw Python wheel export =="
Write-Host "Python: $pythonExe"
Write-Host "Requirements: $requirements"
Write-Host "Wheelhouse: $wheelhouse"

& $pythonExe -m pip download --dest $wheelhouse --requirement $requirements

Write-Host "Python wheelhouse prepared at: $wheelhouse"
