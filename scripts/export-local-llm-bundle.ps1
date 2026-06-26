param(
  [string]$Model = "gemma3:12b",
  [string]$BundleRoot = "",
  [string]$OllamaInstaller = "",
  [switch]$IncludeModelStore
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($BundleRoot)) {
  $BundleRoot = Join-Path $root "local-llm-bundle"
}

$bundleRootPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($BundleRoot)
$ollamaDir = Join-Path $bundleRootPath "ollama"
$modelsDir = Join-Path $bundleRootPath "models"
$scriptsDir = Join-Path $bundleRootPath "scripts"
$manifestDir = Join-Path $bundleRootPath "manifests"
$modelSafeName = $Model.Replace(":", "_").Replace("/", "_").Replace("\", "_")

$ollamaCommand = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaCommand) {
  throw "Ollama command was not found. Install Ollama on the preparation PC before exporting the model bundle."
}

$modelList = (& $ollamaCommand.Source list) -join "`r`n"
if ($modelList -notmatch [regex]::Escape($Model)) {
  throw "Model was not found in local Ollama store: $Model. Run 'ollama pull $Model' on the preparation PC first."
}

New-Item -ItemType Directory -Force -Path $ollamaDir, $modelsDir, $scriptsDir, $manifestDir | Out-Null

if (-not [string]::IsNullOrWhiteSpace($OllamaInstaller)) {
  $installerPath = (Resolve-Path -LiteralPath $OllamaInstaller).Path
  Copy-Item -LiteralPath $installerPath -Destination (Join-Path $ollamaDir (Split-Path -Leaf $installerPath)) -Force
}

& $ollamaCommand.Source show $Model | Set-Content -LiteralPath (Join-Path $manifestDir "$modelSafeName.show.txt") -Encoding UTF8
& $ollamaCommand.Source show $Model --modelfile | Set-Content -LiteralPath (Join-Path $modelsDir "$modelSafeName.Modelfile") -Encoding UTF8
$modelList | Set-Content -LiteralPath (Join-Path $manifestDir "ollama-list.txt") -Encoding UTF8

if ($IncludeModelStore) {
  $sourceModels = if ($env:OLLAMA_MODELS) { $env:OLLAMA_MODELS } else { Join-Path $env:USERPROFILE ".ollama\models" }
  if (-not (Test-Path -LiteralPath $sourceModels)) {
    throw "Ollama model store was not found: $sourceModels"
  }

  $targetModels = Join-Path $modelsDir "ollama-models"
  if (Test-Path -LiteralPath $targetModels) {
    Remove-Item -LiteralPath $targetModels -Recurse -Force
  }
  Copy-Item -LiteralPath $sourceModels -Destination $targetModels -Recurse -Force
}

Copy-Item -LiteralPath (Join-Path $PSScriptRoot "install-local-llm-bundle.ps1") -Destination $scriptsDir -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "install-local-llm-bundle.bat") -Destination $scriptsDir -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "verify-local-llm-bundle.ps1") -Destination $scriptsDir -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "verify-local-llm-bundle.bat") -Destination $scriptsDir -Force

$hashEntries = Get-ChildItem -LiteralPath $bundleRootPath -File -Recurse |
  Where-Object { $_.FullName -notlike (Join-Path $manifestDir "bundle.sha256") } |
  Sort-Object FullName |
  ForEach-Object {
    $relative = $_.FullName.Substring($bundleRootPath.Length + 1).Replace("\", "/")
    $hash = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256
    "$($hash.Hash.ToLowerInvariant())  $relative"
  }

if (-not $hashEntries) {
  throw "No bundle files were created."
}

$hashEntries | Set-Content -LiteralPath (Join-Path $manifestDir "bundle.sha256") -Encoding UTF8
Write-Host "Local LLM bundle exported: $bundleRootPath"
Write-Host "Model: $Model"
Write-Host "Manifest: $(Join-Path $manifestDir 'bundle.sha256')"
