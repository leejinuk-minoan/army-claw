$ErrorActionPreference = "Stop"

$script = Get-Content -LiteralPath (Join-Path $PSScriptRoot "hwp-automation-diagnostics.ps1") -Raw

if ($script -notmatch 'native-layout-normalize') {
  throw "native-layout-normalize mode is missing"
}
if ($script -notmatch 'Open\(\$SourcePath,\s*"HWPX"') {
  throw "native-layout-normalize must open input as HWPX"
}
if ($script -notmatch 'SaveAs\(\$OutputPath,\s*"HWPX"') {
  throw "native-layout-normalize must save to a separate HWPX output"
}
if ($script -notmatch 'source_unchanged') {
  throw "source unchanged verification is required"
}
if ($script -notmatch 'started_process_ids') {
  throw "owned Hwp process tracking is required"
}

Write-Output "hwp-native-layout-normalize static contract passed"
