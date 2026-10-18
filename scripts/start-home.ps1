# Runs ReelGrab on this PC and shares it publicly through a free Cloudflare quick tunnel.
# Requests to YouTube/Instagram go out from your home connection, which isn't bot-blocked
# the way cloud servers are. The public https://*.trycloudflare.com URL is printed below
# and changes every time this script starts. Press Ctrl+C to stop everything.
#
# Usage (from the repo root):  powershell -ExecutionPolicy Bypass -File scripts\start-home.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$port = 5000

# Pick up tools installed by winget without needing a new terminal
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')

foreach ($tool in 'node', 'cloudflared') {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    throw "$tool is not installed. Run: winget install OpenJS.NodeJS.LTS Cloudflare.cloudflared yt-dlp.yt-dlp Gyan.FFmpeg"
  }
}

$busy = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($busy) { throw "Port $port is already in use (PID $($busy[0].OwningProcess)). Stop that process first." }

Write-Host '==> Installing dependencies & building the website...' -ForegroundColor Cyan
Push-Location "$root\backend"; npm.cmd install --no-audit --no-fund --omit=dev | Out-Null; Pop-Location
Push-Location "$root\frontend"; npm.cmd install --no-audit --no-fund | Out-Null; npm.cmd run build; Pop-Location

Write-Host "==> Starting ReelGrab on http://localhost:$port" -ForegroundColor Cyan
$env:NODE_ENV = 'production'
$env:PORT = "$port"
$server = Start-Process node -ArgumentList 'backend/src/server.js' -WorkingDirectory $root -NoNewWindow -PassThru

try {
  Start-Sleep -Seconds 3
  Write-Host '==> Opening the public tunnel. Look for the https://...trycloudflare.com link below.' -ForegroundColor Green
  cloudflared tunnel --no-autoupdate --url "http://localhost:$port"
}
finally {
  Write-Host '==> Stopping ReelGrab...' -ForegroundColor Cyan
  if (-not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}
