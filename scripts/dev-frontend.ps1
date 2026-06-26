$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $root "frontend")
$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue

if ($pnpm) {
  & $pnpm.Source run dev -- --host 127.0.0.1 --port 5173
} elseif ($npm) {
  & $npm.Source run dev -- --host 127.0.0.1 --port 5173
} else {
  throw "Neither pnpm nor npm was found on PATH."
}
