$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$releaseRoot = Join-Path $root "release"
$packageRoot = Join-Path $releaseRoot "army-claw-core"
$distDir = Join-Path $backend "dist"
$frontendDist = Join-Path $frontend "dist"
$webTarget = Join-Path $backend "openclaw\web"
$innoScript = Join-Path $root "installer\army-claw-core.iss"
$isccDefault = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"

function Resolve-Python {
  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) { return $python.Source }

  $bundled = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
  if (Test-Path -LiteralPath $bundled) { return $bundled }

  throw "Python executable was not found."
}

function Resolve-Node {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) { return $node.Source }

  $bundled = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if (Test-Path -LiteralPath $bundled) { return $bundled }

  throw "Node executable was not found."
}

function Resolve-InnoCompiler {
  $iscc = Get-Command ISCC.exe -ErrorAction SilentlyContinue
  if ($iscc) { return $iscc.Source }
  if (Test-Path -LiteralPath $isccDefault) { return $isccDefault }
  return $null
}

function Resolve-AppDependencyPath {
  param([string]$PythonExe)

  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $PythonExe -c "import fastapi, pydantic, uvicorn" *> $null
  $dependencyCheckExitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference
  if ($dependencyCheckExitCode -eq 0) { return $null }

  if ($env:ARMY_CLAW_APP_DEPENDENCY_PATH) {
    if (Test-Path -LiteralPath $env:ARMY_CLAW_APP_DEPENDENCY_PATH) {
      return $env:ARMY_CLAW_APP_DEPENDENCY_PATH
    }
    throw "ARMY_CLAW_APP_DEPENDENCY_PATH does not exist: $env:ARMY_CLAW_APP_DEPENDENCY_PATH"
  }

  $bundledSitePackages = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\Lib\site-packages"
  if (Test-Path -LiteralPath $bundledSitePackages) {
    return $bundledSitePackages
  }

  throw "FastAPI, Pydantic, and Uvicorn were not found for the packaging Python, and no bundled dependency path was available."
}

$pythonExe = Resolve-Python
$nodeExe = Resolve-Node
$appDependencyPath = Resolve-AppDependencyPath -PythonExe $pythonExe

Write-Host "== Army Claw Core packaging =="
Write-Host "Python: $pythonExe"
Write-Host "Node: $nodeExe"
if ($appDependencyPath) {
  Write-Host "App dependency path: $appDependencyPath"
}

& $pythonExe -m PyInstaller --version | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "PyInstaller is not installed for this Python. Install or import PyInstaller before building the Core installer."
}

Push-Location $frontend
try {
  if (Test-Path -LiteralPath "node_modules\vite\bin\vite.js") {
    & $nodeExe ".\node_modules\vite\bin\vite.js" build
  } else {
    $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
    if (-not $pnpm) { throw "Vite was not found. Install frontend dependencies first." }
    & $pnpm.Source run build
  }
} finally {
  Pop-Location
}

if (Test-Path -LiteralPath $webTarget) {
  Remove-Item -LiteralPath $webTarget -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $webTarget | Out-Null
Copy-Item -Path (Join-Path $frontendDist "*") -Destination $webTarget -Recurse -Force

Push-Location $backend
try {
  $pyinstallerArgs = @(
    "--clean",
    "--noconfirm",
    "--name",
    "ArmyClawCore",
    "--add-data",
    "openclaw\web;openclaw\web",
    "--collect-submodules",
    "uvicorn"
  )
  if ($appDependencyPath) {
    $pyinstallerArgs += @("--paths", $appDependencyPath)
  }
  $pyinstallerArgs += "openclaw\__main__.py"
  & $pythonExe -m PyInstaller @pyinstallerArgs
} finally {
  Pop-Location
}

if (Test-Path -LiteralPath $packageRoot) {
  Remove-Item -LiteralPath $packageRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $packageRoot | Out-Null
Copy-Item -LiteralPath (Join-Path $distDir "ArmyClawCore") -Destination $packageRoot -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root "config\openclaw.config.example.json") -Destination $packageRoot -Force

$isccExe = Resolve-InnoCompiler
if ($isccExe) {
  Write-Host "Inno Setup: $isccExe"
  & $isccExe $innoScript
} else {
  Write-Host "Inno Setup compiler was not found. Skipping installer EXE build."
}

Write-Host "Package prepared at: $packageRoot"
