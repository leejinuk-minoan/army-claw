$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$wheelhouse = Join-Path $root "vendor\python-wheels"
$manifest = Join-Path $root "vendor\python-wheels.sha256"

if (-not (Test-Path -LiteralPath $wheelhouse)) {
  throw "Wheelhouse was not found: $wheelhouse"
}

$entries = Get-ChildItem -LiteralPath $wheelhouse -Filter *.whl -File |
  Sort-Object Name |
  ForEach-Object {
    $hash = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256
    "$($hash.Hash.ToLowerInvariant())  $($_.Name)"
  }

if (-not $entries) {
  throw "No wheel files were found in: $wheelhouse"
}

$entries | Set-Content -LiteralPath $manifest -Encoding UTF8
Write-Host "Wheelhouse manifest written to: $manifest"
