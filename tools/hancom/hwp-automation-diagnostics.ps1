param(
  [string]$SourcePath = "",
  [string]$OutputPath = "",
  [string]$Mode = "com-create",
  [switch]$Visible,
  [int]$TimeoutSeconds = 45
)

$ErrorActionPreference = "Stop"
$events = New-Object System.Collections.Generic.List[object]
$startedProcessIds = New-Object System.Collections.Generic.List[int]
$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Add-Event {
  param([string]$Step, [string]$Status = "ok", [hashtable]$Data = @{})
  $events.Add([ordered]@{
    timestamp = (Get-Date).ToString("o")
    step = $Step
    status = $Status
    data = $Data
  }) | Out-Null
}

function Get-HostBitness {
  if ([Environment]::Is64BitProcess) { "64-bit" } else { "32-bit" }
}

function Get-OsBitness {
  if ([Environment]::Is64BitOperatingSystem) { "64-bit" } else { "32-bit" }
}

function Get-ComRegistration {
  param([string]$ProgId)
  $views = @()
  foreach ($path in @("Registry::HKEY_CLASSES_ROOT\$ProgId", "Registry::HKEY_CLASSES_ROOT\WOW6432Node\CLSID")) {
    $views += [ordered]@{
      path = $path
      exists = [bool](Test-Path $path)
    }
  }
  $views
}

function Get-HwpProcessesSnapshot {
  Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessName -match "^Hwp$|^HwpApi$" } |
    Select-Object Id, ProcessName, MainWindowTitle, Path
}

$beforeProcesses = @(Get-HwpProcessesSnapshot)
$hwp = $null
$conversionStatus = "failed"
$lastSuccessfulStep = ""
$sourceHashBefore = ""
$sourceHashAfter = ""

try {
  Add-Event "process_start" "ok" @{ mode = $Mode; visible = [bool]$Visible }
  Add-Event "host_bitness_detected" "ok" @{
    powershell_process = Get-HostBitness
    operating_system = Get-OsBitness
    ps_home = $PSHOME
  }
  Add-Event "com_registration_probe" "ok" @{
    HWPFrame_HwpObject = @(Get-ComRegistration "HWPFrame.HwpObject")
  }

  if ($SourcePath) {
    $SourcePath = (Resolve-Path -LiteralPath $SourcePath).Path
    $sourceHashBefore = (Get-FileHash -LiteralPath $SourcePath -Algorithm SHA256).Hash
  }
  if ($OutputPath) {
    $OutputPath = [System.IO.Path]::GetFullPath($OutputPath)
    New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($OutputPath)) -Force | Out-Null
  }
  if ($SourcePath -and $OutputPath -and $SourcePath.ToLowerInvariant() -eq $OutputPath.ToLowerInvariant()) {
    throw "output path must be different from source path"
  }

  Add-Event "com_object_create_start"
  $hwp = New-Object -ComObject "HWPFrame.HwpObject"
  $lastSuccessfulStep = "com_object_create_success"
  Add-Event $lastSuccessfulStep

  $afterCreateProcesses = @(Get-HwpProcessesSnapshot)
  $beforeIds = @($beforeProcesses | ForEach-Object { $_.Id })
  foreach ($process in $afterCreateProcesses) {
    if ($beforeIds -notcontains $process.Id) { $startedProcessIds.Add([int]$process.Id) | Out-Null }
  }
  Add-Event "created_process_snapshot" "ok" @{ started_process_ids = @($startedProcessIds); processes = @($afterCreateProcesses) }

  Add-Event "window_access_start"
  try {
    $hwp.XHwpWindows.Item(0).Visible = [bool]$Visible
    Add-Event "window_access_success" "ok" @{ visible = [bool]$Visible }
    $lastSuccessfulStep = "window_access_success"
  } catch {
    $warnings.Add("window access failed: $($_.Exception.Message)") | Out-Null
    Add-Event "window_access_failed" "warning" @{ message = $_.Exception.Message }
  }

  Add-Event "security_module_start"
  try {
    $result = $hwp.RegisterModule("FilePathCheckDLL", "FilePathCheckerModule")
    Add-Event "security_module_result" "ok" @{ result = $result }
    $lastSuccessfulStep = "security_module_result"
  } catch {
    $warnings.Add("security module registration failed: $($_.Exception.Message)") | Out-Null
    Add-Event "security_module_result" "warning" @{ message = $_.Exception.Message }
  }

  if ($Mode -eq "com-create") {
    $conversionStatus = "passed"
  } elseif ($Mode -eq "empty-save") {
    if (-not $OutputPath) { throw "OutputPath is required for empty-save" }
    Add-Event "save_as_start" "ok" @{ output_path = $OutputPath; format = "HWPX" }
    $saved = [bool]$hwp.SaveAs($OutputPath, "HWPX", "")
    Add-Event "save_as_success" "ok" @{ result = $saved; exists = [bool](Test-Path -LiteralPath $OutputPath) }
    $lastSuccessfulStep = "save_as_success"
    $conversionStatus = if ($saved -and (Test-Path -LiteralPath $OutputPath)) { "passed" } else { "failed" }
  } elseif ($Mode -eq "native-layout-normalize") {
    if (-not $SourcePath) { throw "SourcePath is required for native-layout-normalize" }
    if (-not $OutputPath) { throw "OutputPath is required for native-layout-normalize" }
    Add-Event "open_start" "ok" @{ source_path = $SourcePath; format = "HWPX" }
    $opened = [bool]$hwp.Open($SourcePath, "HWPX", "forceopen:true")
    Add-Event "open_success" "ok" @{ result = $opened }
    $lastSuccessfulStep = "open_success"
    if (-not $opened) { throw "HWPX Open returned false" }
    Start-Sleep -Milliseconds 500
    Add-Event "save_as_start" "ok" @{ output_path = $OutputPath; format = "HWPX" }
    $saved = [bool]$hwp.SaveAs($OutputPath, "HWPX", "")
    Add-Event "save_as_success" "ok" @{ result = $saved; exists = [bool](Test-Path -LiteralPath $OutputPath) }
    $lastSuccessfulStep = "save_as_success"
    $conversionStatus = if ($saved -and (Test-Path -LiteralPath $OutputPath)) { "passed" } else { "failed" }
  } elseif ($Mode -eq "open-only" -or $Mode -eq "convert") {
    if (-not $SourcePath) { throw "SourcePath is required for $Mode" }
    Add-Event "open_start" "ok" @{ source_path = $SourcePath }
    $opened = [bool]$hwp.Open($SourcePath, "HWP", "forceopen:true")
    Add-Event "open_success" "ok" @{ result = $opened }
    $lastSuccessfulStep = "open_success"
    if (-not $opened) { throw "HWP Open returned false" }
    if ($Mode -eq "convert") {
      if (-not $OutputPath) { throw "OutputPath is required for convert" }
      Add-Event "save_as_start" "ok" @{ output_path = $OutputPath; format = "HWPX" }
      $saved = [bool]$hwp.SaveAs($OutputPath, "HWPX", "")
      Add-Event "save_as_success" "ok" @{ result = $saved; exists = [bool](Test-Path -LiteralPath $OutputPath) }
      $lastSuccessfulStep = "save_as_success"
      $conversionStatus = if ($saved -and (Test-Path -LiteralPath $OutputPath)) { "passed" } else { "failed" }
    } else {
      $conversionStatus = "passed"
    }
  } else {
    throw "unsupported Mode: $Mode"
  }
} catch {
  $errors.Add($_.Exception.Message) | Out-Null
  Add-Event "error" "failed" @{ message = $_.Exception.Message; last_successful_step = $lastSuccessfulStep }
} finally {
  if ($hwp -ne $null) {
    Add-Event "close_start"
    try { $hwp.Clear(1) | Out-Null; Add-Event "close_success" } catch { Add-Event "close_failed" "warning" @{ message = $_.Exception.Message } }
    Add-Event "quit_start"
    try { $hwp.Quit() | Out-Null; Add-Event "quit_success" } catch { Add-Event "quit_failed" "warning" @{ message = $_.Exception.Message } }
    [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($hwp) | Out-Null
  }
  Start-Sleep -Milliseconds 500
foreach ($id in @($startedProcessIds)) {
    $process = Get-Process -Id $id -ErrorAction SilentlyContinue
    if ($process) {
      try {
        Stop-Process -Id $id -Force -ErrorAction Stop
        Add-Event "owned_process_cleanup" "ok" @{ process_id = $id }
      } catch {
        $warnings.Add("owned process cleanup failed: $id $($_.Exception.Message)") | Out-Null
        Add-Event "owned_process_cleanup_failed" "warning" @{ process_id = $id; message = $_.Exception.Message }
      }
    }
  }
  if ($SourcePath -and (Test-Path -LiteralPath $SourcePath)) {
    try {
      $sourceHashAfter = (Get-FileHash -LiteralPath $SourcePath -Algorithm SHA256).Hash
    } catch {
      $warnings.Add("source hash after cleanup failed: $($_.Exception.Message)") | Out-Null
      Add-Event "source_hash_after_failed" "warning" @{ message = $_.Exception.Message }
    }
  }
}

$outputInfo = $null
if ($OutputPath) {
  $item = Get-Item -LiteralPath $OutputPath -ErrorAction SilentlyContinue
  if ($item) {
    $outputInfo = [ordered]@{
      path = $item.FullName
      exists = $true
      length = $item.Length
    }
  } else {
    $outputInfo = [ordered]@{
      path = $OutputPath
      exists = $false
      length = 0
    }
  }
}

$sourceUnchanged = $null
if ($sourceHashBefore) {
  $sourceUnchanged = ($sourceHashBefore -eq $sourceHashAfter)
}

Add-Event "process_end" "ok" @{ conversion_status = $conversionStatus; last_successful_step = $lastSuccessfulStep }

$resultObject = New-Object PSObject
$resultObject | Add-Member -NotePropertyName "mode" -NotePropertyValue $Mode
$resultObject | Add-Member -NotePropertyName "conversion_status" -NotePropertyValue $conversionStatus
$resultObject | Add-Member -NotePropertyName "last_successful_step" -NotePropertyValue $lastSuccessfulStep
$resultObject | Add-Member -NotePropertyName "source_path" -NotePropertyValue $SourcePath
$resultObject | Add-Member -NotePropertyName "source_sha256_before" -NotePropertyValue $sourceHashBefore
$resultObject | Add-Member -NotePropertyName "source_sha256_after" -NotePropertyValue $sourceHashAfter
$resultObject | Add-Member -NotePropertyName "source_unchanged" -NotePropertyValue $sourceUnchanged
$resultObject | Add-Member -NotePropertyName "output" -NotePropertyValue $outputInfo
$resultObject | Add-Member -NotePropertyName "started_process_ids" -NotePropertyValue ([object[]]$startedProcessIds.ToArray())
$resultObject | Add-Member -NotePropertyName "warnings" -NotePropertyValue ([object[]]$warnings.ToArray())
$resultObject | Add-Member -NotePropertyName "errors" -NotePropertyValue ([object[]]$errors.ToArray())
$resultObject | Add-Member -NotePropertyName "events" -NotePropertyValue ([object[]]$events.ToArray())

$resultObject | ConvertTo-Json -Depth 12
