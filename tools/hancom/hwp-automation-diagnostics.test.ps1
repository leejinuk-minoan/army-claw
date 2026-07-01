$ErrorActionPreference = "Stop"

$script = Join-Path $PSScriptRoot "hwp-automation-diagnostics.ps1"
if (-not (Test-Path -LiteralPath $script)) {
  throw "diagnostics script not found: $script"
}

$content = Get-Content -LiteralPath $script -Raw
$requiredSteps = @(
  "process_start",
  "host_bitness_detected",
  "com_object_create_start",
  "com_object_create_success",
  "window_access_start",
  "security_module_start",
  "open_start",
  "save_as_start",
  "close_start",
  "quit_start",
  "process_end"
)

foreach ($step in $requiredSteps) {
  if ($content -notmatch [regex]::Escape($step)) {
    throw "missing diagnostics step: $step"
  }
}

if ($content -notmatch "startedProcessIds") {
  throw "diagnostics script must track owned Hwp process ids"
}

if ($content -notmatch "source_sha256_before" -or $content -notmatch "source_sha256_after") {
  throw "diagnostics script must report source hash before and after"
}

if ($content -notmatch "HWPFrame.HwpObject") {
  throw "diagnostics script must probe HWPFrame.HwpObject"
}

"hwp-automation-diagnostics static contract passed"
