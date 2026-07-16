param(
    [Parameter(Mandatory=$false)]
    [string]$RepositoryRoot = (Get-Location).Path,
    [Parameter(Mandatory=$false)]
    [string]$RuntimeRoot,
    [Parameter(Mandatory=$false)]
    [string]$GitExe
)

$ErrorActionPreference = 'Stop'

$ExpectedBlob = 'ff4cfd5e8fdc49176c2d1d409afa897f40be01f4'
$ExpectedSha256 = 'acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e'
$RepositoryRoot = (Resolve-Path -LiteralPath $RepositoryRoot).Path

if (-not $RuntimeRoot) {
    $RuntimeRoot = Join-Path $RepositoryRoot '.tmp\task036-offline-node-runtime'
}

if (-not $GitExe) {
    $GitCommand = Get-Command git -ErrorAction SilentlyContinue
    if ($GitCommand) { $GitExe = $GitCommand.Source }
}
if (-not $GitExe -or -not (Test-Path -LiteralPath $GitExe)) {
    $DesktopGit = Join-Path $env:LOCALAPPDATA 'GitHubDesktop\app-3.6.2\resources\app\git\cmd\git.exe'
    if (Test-Path -LiteralPath $DesktopGit) { $GitExe = $DesktopGit }
}
if (-not $GitExe -or -not (Test-Path -LiteralPath $GitExe)) {
    throw 'git executable not found for blob verification.'
}

$VendorBundle = Join-Path $RepositoryRoot 'vendor\node\jszip\3.10.1\jszip.min.cjs'
if (-not (Test-Path -LiteralPath $VendorBundle)) {
    throw "Vendor bundle missing: $VendorBundle"
}

$SourceBlob = (& $GitExe hash-object -- $VendorBundle).Trim()
if ($SourceBlob -ne $ExpectedBlob) {
    throw "Vendor bundle blob mismatch: $SourceBlob"
}
$SourceHash = Get-FileHash -LiteralPath $VendorBundle -Algorithm SHA256
$SourceSha256 = $SourceHash.Hash.ToLowerInvariant()
if ($SourceSha256 -ne $ExpectedSha256) {
    throw "Vendor bundle SHA-256 mismatch: $SourceSha256"
}

$RuntimeRoot = [System.IO.Path]::GetFullPath($RuntimeRoot)
$NodeModulesRoot = Join-Path $RuntimeRoot 'node_modules'
$JsZipRoot = Join-Path $NodeModulesRoot 'jszip'
New-Item -ItemType Directory -Force -Path $JsZipRoot | Out-Null

$RuntimeBundle = Join-Path $JsZipRoot 'index.cjs'
Copy-Item -LiteralPath $VendorBundle -Destination $RuntimeBundle -Force

$PackageJson = @'
{
  "name": "jszip",
  "version": "3.10.1",
  "main": "index.cjs",
  "license": "MIT",
  "private": true
}
'@
$PackageJson | Set-Content -LiteralPath (Join-Path $JsZipRoot 'package.json') -Encoding UTF8
'module.exports = {};' | Set-Content -LiteralPath (Join-Path $RuntimeRoot '.army-claw-loader.cjs') -Encoding UTF8

$RuntimeBlob = (& $GitExe hash-object -- $RuntimeBundle).Trim()
if ($RuntimeBlob -ne $ExpectedBlob) {
    throw "Runtime bundle blob mismatch: $RuntimeBlob"
}
$RuntimeHash = Get-FileHash -LiteralPath $RuntimeBundle -Algorithm SHA256
$RuntimeSha256 = $RuntimeHash.Hash.ToLowerInvariant()
if ($RuntimeSha256 -ne $ExpectedSha256) {
    throw "Runtime bundle SHA-256 mismatch: $RuntimeSha256"
}

$SourceItem = Get-Item -LiteralPath $VendorBundle
$RuntimeItem = Get-Item -LiteralPath $RuntimeBundle

[pscustomobject]@{
    RuntimeRoot = $RuntimeRoot
    NodeModulesRoot = $RuntimeRoot
    JsZipVersion = '3.10.1'
    GitBlobSha = $ExpectedBlob
    SourceSha256 = $SourceSha256
    RuntimeSha256 = $RuntimeSha256
    SourceByteSize = $SourceItem.Length
    RuntimeByteSize = $RuntimeItem.Length
    RuntimeBundle = $RuntimeBundle
    PermanentEnvironmentModified = $false
    NetworkUsed = $false
    PackageManagerUsed = $false
}
