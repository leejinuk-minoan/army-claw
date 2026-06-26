param(
  [string]$BundleRoot = "",
  [string]$Model = "gemma3:12b",
  [string]$OllamaBaseUrl = "http://127.0.0.1:11434",
  [switch]$SkipGenerate
)

$ErrorActionPreference = "Stop"

function Test-BundleManifest {
  param([string]$Root)

  $manifest = Join-Path $Root "manifests\bundle.sha256"
  if (-not (Test-Path -LiteralPath $manifest)) {
    Write-Host "Bundle manifest was not found. Skipping file hash verification."
    return
  }

  $lines = Get-Content -LiteralPath $manifest -Encoding UTF8 | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
  foreach ($line in $lines) {
    if ($line -notmatch "^([0-9a-fA-F]{64})\s\s(.+)$") {
      throw "Invalid manifest line: $line"
    }

    $expectedHash = $Matches[1].ToLowerInvariant()
    $relativePath = $Matches[2].Replace("/", "\")
    $filePath = Join-Path $Root $relativePath
    if (-not (Test-Path -LiteralPath $filePath)) {
      throw "Manifest file is missing: $relativePath"
    }

    $actualHash = (Get-FileHash -LiteralPath $filePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $expectedHash) {
      throw "Hash mismatch: $relativePath"
    }
  }

  Write-Host "Bundle file hashes verified: $($lines.Count) files"
}

if (-not [string]::IsNullOrWhiteSpace($BundleRoot)) {
  Test-BundleManifest -Root ((Resolve-Path -LiteralPath $BundleRoot).Path)
}

$ollamaCommand = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaCommand) {
  throw "Ollama command was not found. Install Ollama or add it to PATH before verification."
}

$tags = Invoke-RestMethod -Method Get -Uri "$OllamaBaseUrl/api/tags" -TimeoutSec 10
$modelNames = @($tags.models | ForEach-Object { $_.name })
if ($modelNames -notcontains $Model) {
  throw "Model was not found through Ollama API: $Model"
}

if (-not $SkipGenerate) {
  $body = @{
    model = $Model
    prompt = "Reply with pong."
    stream = $false
  } | ConvertTo-Json -Depth 4

  $generated = Invoke-RestMethod -Method Post -Uri "$OllamaBaseUrl/api/generate" -ContentType "application/json" -Body $body -TimeoutSec 120
  if ([string]::IsNullOrWhiteSpace($generated.response)) {
    throw "Ollama generated an empty response."
  }
  Write-Host "Generate response: $($generated.response.Trim())"
}

Write-Host "Local LLM bundle verification succeeded."
