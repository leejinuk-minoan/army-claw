param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [int]$TimeoutSeconds = 90
)

$ErrorActionPreference = "Stop"

function Convert-ToJsonResult {
  param([hashtable]$Result)
  $Result | ConvertTo-Json -Depth 8
}

function Get-Sha256 {
  param([string]$Path)
  (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
}

$result = @{
  source_path = $SourcePath
  output_path = $OutputPath
  output_format = "HWPX"
  source_sha256 = ""
  source_unchanged = $false
  success = $false
  prog_id = ""
  warnings = @()
  errors = @()
}

try {
  $source = (Resolve-Path -LiteralPath $SourcePath).Path
  if (-not $source.ToLowerInvariant().EndsWith(".hwp")) {
    throw "input file must be .hwp"
  }
  $outputFull = [System.IO.Path]::GetFullPath($OutputPath)
  if ($source.ToLowerInvariant() -eq $outputFull.ToLowerInvariant()) {
    throw "output path must be different from source path"
  }
  New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($outputFull)) -Force | Out-Null

  $beforeHash = Get-Sha256 $source
  $result.source_path = $source
  $result.output_path = $outputFull
  $result.source_sha256 = $beforeHash

  $progIds = @("HWPFrame.HwpObject", "HwpAutomationApp2.HwpAutomation")
  $hwp = $null
  foreach ($progId in $progIds) {
    try {
      $hwp = New-Object -ComObject $progId
      $result.prog_id = $progId
      break
    } catch {
      $result.warnings += "COM ProgID unavailable: $progId"
    }
  }
  if ($null -eq $hwp) {
    throw "No usable Hancom HWP Automation COM object was found."
  }

  try {
    try { $hwp.RegisterModule("FilePathCheckDLL", "FilePathCheckerModule") | Out-Null } catch { $result.warnings += "FilePathCheckerModule registration skipped: $($_.Exception.Message)" }
    try { $hwp.XHwpWindows.Item(0).Visible = $false } catch { $result.warnings += "Unable to hide HWP window: $($_.Exception.Message)" }

    $opened = $false
    foreach ($format in @("HWP", "")) {
      foreach ($option in @("forceopen:true", "")) {
        try {
          $opened = [bool]$hwp.Open($source, $format, $option)
          if ($opened) { break }
        } catch {
          $result.warnings += "Open attempt failed: format='$format', option='$option', $($_.Exception.Message)"
        }
      }
      if ($opened) { break }
    }
    if (-not $opened) {
      throw "Hancom HWP failed to open the source file."
    }

    try {
      $saved = [bool]$hwp.SaveAs($outputFull, "HWPX", "")
    } catch {
      $result.warnings += "SaveAs(HWPX) failed: $($_.Exception.Message)"
      $saved = [bool]$hwp.SaveAs($outputFull, "HWPX")
    }
    if (-not $saved -or -not (Test-Path -LiteralPath $outputFull)) {
      throw "Hancom HWP failed to save output HWPX."
    }
  } finally {
    try { $hwp.Clear(1) | Out-Null } catch {}
    try { $hwp.Quit() | Out-Null } catch {}
    [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($hwp) | Out-Null
  }

  $afterHash = Get-Sha256 $source
  $result.source_unchanged = ($beforeHash -eq $afterHash)
  $result.success = $true
  if (-not $result.source_unchanged) {
    $result.errors += "source hash changed after conversion"
    $result.success = $false
  }
} catch {
  $result.errors += $_.Exception.Message
}

Convert-ToJsonResult $result
