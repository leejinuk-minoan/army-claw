$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root ".tmp\openclaw-prod-install"
$releaseRoot = Join-Path $root "release"
$packageRoot = Join-Path $releaseRoot "army-claw-openclaw-beta"
$appTarget = Join-Path $packageRoot "app"
$nodeTarget = Join-Path $packageRoot "node"
$binTarget = Join-Path $packageRoot "bin"
$hancomToolsSource = Join-Path $root "tools\hancom"
$installerScript = Join-Path $root "installer\army-claw-openclaw-beta.iss"
$isccDefault = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
$nodeSource = "C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node"

function Assert-InsideRoot {
  param([string]$PathToCheck)
  $resolvedRoot = (Resolve-Path -LiteralPath $root).Path
  $parent = Split-Path -Parent $PathToCheck
  if (-not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }
  $full = [System.IO.Path]::GetFullPath($PathToCheck)
  if (-not $full.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to operate outside project root: $full"
  }
}

function Invoke-RobocopyChecked {
  param(
    [string]$From,
    [string]$To,
    [string[]]$CopyArgs
  )
  & robocopy $From $To @CopyArgs
  $code = $LASTEXITCODE
  if ($code -gt 7) {
    throw "robocopy failed with exit code $code from $From to $To"
  }
}

if (-not (Test-Path -LiteralPath (Join-Path $source "node_modules\openclaw\openclaw.mjs"))) {
  throw "OpenClaw production install was not found: $source"
}
if (-not (Test-Path -LiteralPath (Join-Path $source "node_modules\openclaw\dist"))) {
  throw "OpenClaw production dist missing: $source"
}
if (-not (Test-Path -LiteralPath (Join-Path $nodeSource "bin\node.exe"))) {
  throw "Bundled Node runtime was not found: $nodeSource"
}

Write-Host "== Ensure OpenClaw runtime dependencies =="
$pnpm = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
if (-not $pnpm) {
  $bundledPnpm = "C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd"
  if (Test-Path -LiteralPath $bundledPnpm) { $pnpm = Get-Item -LiteralPath $bundledPnpm }
}
$openClawPackageJson = Get-Content -LiteralPath (Join-Path $source "node_modules\openclaw\package.json") -Raw | ConvertFrom-Json
$runtimeDeps = @()
foreach ($section in @("dependencies", "optionalDependencies")) {
  if ($openClawPackageJson.$section) {
    foreach ($dep in $openClawPackageJson.$section.PSObject.Properties) {
      if ($dep.Name -ne "sqlite-vec") {
        $runtimeDeps += ("{0}@{1}" -f $dep.Name, $dep.Value)
      }
    }
  }
}
$runtimeDeps += @("json5@2.2.3", "tslog@4.10.2")
$runtimeDeps = $runtimeDeps | Sort-Object -Unique
$missingRuntimeDeps = @()
foreach ($depSpec in $runtimeDeps) {
  $versionAt = $depSpec.LastIndexOf('@')
  if ($versionAt -le 0) { throw "Invalid dependency spec: $depSpec" }
  $depName = $depSpec.Substring(0, $versionAt)
  if (-not (Test-Path -LiteralPath (Join-Path $source ("node_modules\" + $depName)))) {
    $missingRuntimeDeps += $depSpec
  }
}
if ($missingRuntimeDeps.Count -gt 0) {
  if (-not $pnpm) { throw "pnpm was not found and OpenClaw runtime dependencies are missing: $($missingRuntimeDeps -join ', ')" }
  Push-Location $source
  & $pnpm.Source add @missingRuntimeDeps --prod --offline --config.ignore-scripts=true
  if ($LASTEXITCODE -ne 0) { throw "Failed to add OpenClaw runtime dependencies: $($missingRuntimeDeps -join ', ')" }
  Pop-Location
}

Write-Host "== Normalize OpenClaw node_modules =="
if (-not $pnpm) { throw "pnpm was not found and OpenClaw node_modules cannot be normalized." }
Push-Location $source
& $pnpm.Source install --prod --offline --config.ignore-scripts=true --config.node-linker=hoisted
if ($LASTEXITCODE -ne 0) { throw "Failed to normalize OpenClaw node_modules with hoisted linker." }
Pop-Location
Assert-InsideRoot -PathToCheck $packageRoot
if (Test-Path -LiteralPath $packageRoot) {
  Remove-Item -LiteralPath $packageRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $appTarget, $nodeTarget, $binTarget | Out-Null

Write-Host "== Copy OpenClaw production payload =="
Invoke-RobocopyChecked -From $source -To $appTarget -CopyArgs @(
  "/MIR",
  "/R:1", "/W:1", "/NFL", "/NDL", "/NP"
)

Write-Host "== Copy Army Claw Hancom tools =="
$hancomToolsTarget = Join-Path $appTarget "army-claw-tools\hancom"
New-Item -ItemType Directory -Force -Path $hancomToolsTarget | Out-Null
Copy-Item -LiteralPath (Join-Path $hancomToolsSource "army-claw-hancom-tools.mjs") -Destination (Join-Path $hancomToolsTarget "army-claw-hancom-tools.mjs") -Force
Write-Host "== Copy Node runtime =="
Invoke-RobocopyChecked -From $nodeSource -To $nodeTarget -CopyArgs @(
  "/MIR",
  "/R:1", "/W:1", "/NFL", "/NDL", "/NP"
)

$cmd = @"
@echo off
setlocal
set "ROOT=%~dp0.."
set "NODE_DIR=%ROOT%\node"
set "APP_DIR=%ROOT%\app\node_modules\openclaw"
set "PATH=%NODE_DIR%\bin;%NODE_DIR%;%PATH%"
set "OPENCLAW_PROFILE=army-claw-beta"
set "ARMY_CLAW_OPENCLAW_BETA=1"
if "%~1"=="" (
  "%NODE_DIR%\bin\node.exe" "%APP_DIR%\openclaw.mjs" onboard
) else (
  "%NODE_DIR%\bin\node.exe" "%APP_DIR%\openclaw.mjs" %*
)
exit /b %ERRORLEVEL%
"@
[System.IO.File]::WriteAllText((Join-Path $binTarget "ArmyClawOpenClawBeta.cmd"), $cmd, [System.Text.Encoding]::ASCII)

$statusCmd = @"
@echo off
setlocal
set "ROOT=%~dp0.."
set "NODE_DIR=%ROOT%\node"
set "APP_DIR=%ROOT%\app\node_modules\openclaw"
set "PATH=%NODE_DIR%\bin;%NODE_DIR%;%PATH%"
set "OPENCLAW_PROFILE=army-claw-beta"
"%NODE_DIR%\bin\node.exe" "%APP_DIR%\openclaw.mjs" status
pause
exit /b %ERRORLEVEL%
"@
[System.IO.File]::WriteAllText((Join-Path $binTarget "ArmyClawOpenClawStatus.cmd"), $statusCmd, [System.Text.Encoding]::ASCII)

$hancomCmd = @"
@echo off
setlocal
set "ROOT=%~dp0.."
set "NODE_DIR=%ROOT%\node"
set "APP_ROOT=%ROOT%\app"
set "TOOL=%APP_ROOT%\army-claw-tools\hancom\army-claw-hancom-tools.mjs"
set "ARMY_CLAW_NODE_MODULES=%APP_ROOT%\node_modules"
set "PATH=%NODE_DIR%\bin;%NODE_DIR%;%PATH%"
"%NODE_DIR%\bin\node.exe" "%TOOL%" %*
exit /b %ERRORLEVEL%
"@
[System.IO.File]::WriteAllText((Join-Path $binTarget "ArmyClawHancomTools.cmd"), $hancomCmd, [System.Text.Encoding]::ASCII)

$hancomPromptCmd = @"
@echo off
setlocal
set "ROOT=%~dp0.."
set "NODE_DIR=%ROOT%\node"
set "APP_ROOT=%ROOT%\app"
set "TOOL=%APP_ROOT%\army-claw-tools\hancom\army-claw-hancom-tools.mjs"
set "ARMY_CLAW_NODE_MODULES=%APP_ROOT%\node_modules"
set "PATH=%NODE_DIR%\bin;%NODE_DIR%;%PATH%"
if "%~1"=="" (
  echo Usage:
  echo   ArmyClawHancomPrompt.cmd --workspace C:\work --path docs\report.hwpx --prompt "한글 보고서를 작성해줘" --model gemma3:12b --open
  exit /b 1
)
"%NODE_DIR%\bin\node.exe" "%TOOL%" prompt-create %*
exit /b %ERRORLEVEL%
"@
[System.IO.File]::WriteAllText((Join-Path $binTarget "ArmyClawHancomPrompt.cmd"), $hancomPromptCmd, [System.Text.Encoding]::ASCII)
$gatewayCmd = @"
@echo off
setlocal
set "ROOT=%~dp0.."
set "NODE_DIR=%ROOT%\node"
set "APP_DIR=%ROOT%\app\node_modules\openclaw"
set "PATH=%NODE_DIR%\bin;%NODE_DIR%;%PATH%"
set "OPENCLAW_PROFILE=army-claw-beta"
"%NODE_DIR%\bin\node.exe" "%APP_DIR%\openclaw.mjs" gateway run --force
exit /b %ERRORLEVEL%
"@
[System.IO.File]::WriteAllText((Join-Path $binTarget "ArmyClawOpenClawGateway.cmd"), $gatewayCmd, [System.Text.Encoding]::ASCII)

$readme = @"
Army Claw OpenClaw Beta
=======================

이 패키지는 OpenClaw 코드를 Army Claw 베타 실행 구조의 중심으로 전면 교체한 첫 설치 산출물입니다.

포함 항목:
- OpenClaw upstream commit: 843ad143
- OpenClaw CLI/runtime build output
- OpenClaw control-ui build output
- Node.js runtime for Windows
- Army Claw launcher scripts
- Army Claw Hancom/HWPX tool CLI
- Prompt-to-HWPX local LLM document generator
- OpenClaw MIT license and third-party notice files

기본 실행:
- 시작 메뉴의 Army Claw OpenClaw Beta를 실행하면 OpenClaw onboarding/CLI가 시작됩니다.
- 상태 확인은 Army Claw OpenClaw Status를 실행합니다.
- Gateway 직접 실행은 Army Claw OpenClaw Gateway를 실행합니다.

Army Claw 정책:
- 기본 로컬 LLM 방향은 Ollama + gemma3:12b입니다.
- 중국계 모델/provider는 Army Claw 기본 추천 및 기본 allowlist 대상에서 제외합니다.
- 한컴오피스 조작 도구는 이번 베타에서 프롬프트 기반 HWPX 생성, HWPX 요약/문단추가/한글 실행 CLI로 포함합니다.

주의:
- 이 빌드는 OpenClaw 전면 교체 베타의 첫 설치 가능 산출물입니다.
- 복잡한 한컴 COM 자동화와 OpenClaw planner 내부 tool-call 완전 연결은 다음 베타에서 확장합니다.
"@
[System.IO.File]::WriteAllText((Join-Path $packageRoot "ARMY_CLAW_BETA_README.txt"), $readme, [System.Text.Encoding]::UTF8)

$notice = @"
Army Claw OpenClaw Beta Notice
==============================

This beta distribution includes and is based on OpenClaw.

OpenClaw source:
https://github.com/openclaw/openclaw

Referenced upstream commit:
843ad143

OpenClaw license:
MIT License
Copyright (c) 2026 OpenClaw Foundation

Army Claw changes and packaging files are maintained by the Army Claw project.
The original OpenClaw copyright notice and MIT license text are preserved in this distribution.
"@
[System.IO.File]::WriteAllText((Join-Path $packageRoot "NOTICE.txt"), $notice, [System.Text.Encoding]::UTF8)

Copy-Item -LiteralPath (Join-Path $source "node_modules\openclaw\LICENSE") -Destination (Join-Path $packageRoot "LICENSE-OPENCLAW.txt") -Force
Copy-Item -LiteralPath (Join-Path $source "node_modules\openclaw\THIRD_PARTY_NOTICES.md") -Destination (Join-Path $packageRoot "THIRD_PARTY_NOTICES-OPENCLAW.md") -Force

$nodeExe = Join-Path $nodeTarget "bin\node.exe"
$launcher = Join-Path $binTarget "ArmyClawOpenClawBeta.cmd"
Write-Host "== Smoke test packaged launcher =="
& $nodeExe (Join-Path $appTarget "node_modules\openclaw\openclaw.mjs") --version
if ($LASTEXITCODE -ne 0) { throw "Packaged OpenClaw version smoke failed." }
& $launcher --version
if ($LASTEXITCODE -ne 0) { throw "Packaged Army Claw launcher smoke failed." }
Write-Host "== Hancom tool smoke =="
$hancomLauncher = Join-Path $binTarget "ArmyClawHancomTools.cmd"
& $hancomLauncher status --json
if ($LASTEXITCODE -ne 0) { throw "Packaged Hancom tool smoke failed." }

$payloadZip = Join-Path $releaseRoot "ArmyClawOpenClawBetaPayload-0.2.0-beta.1.zip"
if (Test-Path -LiteralPath $payloadZip) {
  Remove-Item -LiteralPath $payloadZip -Force
}
Write-Host "== Create payload ZIP =="
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($packageRoot, $payloadZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Write-Host "Payload ZIP: $payloadZip"

$iscc = Get-Command ISCC.exe -ErrorAction SilentlyContinue
if ($iscc) {
  $isccExe = $iscc.Source
} elseif (Test-Path -LiteralPath $isccDefault) {
  $isccExe = $isccDefault
} else {
  $isccExe = $null
}

if ($isccExe) {
  Write-Host "== Build installer =="
  & $isccExe $installerScript
  if ($LASTEXITCODE -ne 0) { throw "Inno Setup build failed." }
} else {
  Write-Host "Inno Setup compiler was not found. Package directory prepared only."
}

Write-Host "Package prepared at: $packageRoot"
Write-Host "Payload ZIP prepared at: $payloadZip"