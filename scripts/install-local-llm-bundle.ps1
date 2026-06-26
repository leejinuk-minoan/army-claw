param(
  [string]$BundleRoot = "",
  [string]$Model = "gemma3:12b",
  [string]$OllamaModelsRoot = "",
  [switch]$InstallOllama
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($BundleRoot)) {
  $BundleRoot = Split-Path -Parent $PSScriptRoot
}

$bundleRootPath = (Resolve-Path -LiteralPath $BundleRoot).Path
$modelsPayload = Join-Path $bundleRootPath "models\ollama-models"
$ollamaDir = Join-Path $bundleRootPath "ollama"

if ($InstallOllama) {
  $installer = Get-ChildItem -LiteralPath $ollamaDir -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension -in ".exe", ".msi" } |
    Select-Object -First 1

  if (-not $installer) {
    throw "Ollama installer was not found under: $ollamaDir"
  }

  Write-Host "Starting Ollama installer: $($installer.FullName)"
  $process = Start-Process -FilePath $installer.FullName -Wait -PassThru
  if ($process.ExitCode -ne 0) {
    throw "Ollama installer failed with exit code: $($process.ExitCode)"
  }
}

if (-not (Test-Path -LiteralPath $modelsPayload)) {
  throw "Bundled Ollama model store was not found: $modelsPayload"
}

if ([string]::IsNullOrWhiteSpace($OllamaModelsRoot)) {
  $OllamaModelsRoot = if ($env:OLLAMA_MODELS) { $env:OLLAMA_MODELS } else { Join-Path $env:USERPROFILE ".ollama\models" }
}

$targetRoot = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OllamaModelsRoot)
New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null

Copy-Item -Path (Join-Path $modelsPayload "*") -Destination $targetRoot -Recurse -Force
Write-Host "Ollama model store copied to: $targetRoot"

$verifyScript = Join-Path $PSScriptRoot "verify-local-llm-bundle.ps1"
& $verifyScript -BundleRoot $bundleRootPath -Model $Model
