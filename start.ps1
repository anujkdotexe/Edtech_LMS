# ==========================================
# Gamified LMS Platform - Premium Startup Script
# ==========================================

$ErrorActionPreference = "Stop"
Clear-Host

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         ANTIGRAVITY GAMIFIED LMS - STARTUP UTILITY        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check prerequisites
Write-Host "[*] Validating core environment prerequisites..." -ForegroundColor White
$pnpmCheck = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpmCheck) {
    Write-Host "[!] ERROR: pnpm is not installed or not in PATH." -ForegroundColor Red
    Write-Host "    Please install pnpm using: npm install -g pnpm" -ForegroundColor Yellow
    Exit 1
}
Write-Host "[+] pnpm package manager detected successfully." -ForegroundColor Green

# 2. Check Port Availability
Write-Host "[*] Checking port allocations..." -ForegroundColor White
$ports = @(3000, 4000)
foreach ($port in $ports) {
    $portActive = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($portActive) {
        Write-Host "[!] WARNING: Port $port is already in use by another process." -ForegroundColor Yellow
        Write-Host "    If you experience issues, please terminate the process using port $port." -ForegroundColor Yellow
    }
}

# 3. Launching Standalone Fastify Server
Write-Host "[*] Booting Standalone Fastify API Backend (Port 4000)..." -ForegroundColor Cyan
$backendArgs = @("-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='LMS API Backend [Port 4000]'; pnpm --filter=@lms/api dev")
$backendProc = Start-Process powershell -ArgumentList $backendArgs -PassThru

# 4. Launching Next.js 14 Web Portal
Write-Host "[*] Booting Next.js 14 Frontend Web Portal (Port 3000)..." -ForegroundColor Cyan
$frontendArgs = @("-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='LMS Next.js Frontend [Port 3000]'; pnpm --filter=@lms/web dev")
$frontendProc = Start-Process powershell -ArgumentList $frontendArgs -PassThru

# 5. Waiting for Services to be responsive
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "           WAITING FOR SERVICES TO COME ONLINE            " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Poll Backend
Write-Host "[*] Waiting for API Backend to respond at http://127.0.0.1:4000/health..." -NoNewline -ForegroundColor White
$backendUp = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:4000/health" -Method Get -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($res.status -eq "healthy") {
            $backendUp = $true
            break
        }
    } catch {}
    Write-Host "." -NoNewline -ForegroundColor Cyan
    Start-Sleep -Seconds 1
}

if ($backendUp) {
    Write-Host " [ONLINE]" -ForegroundColor Green
} else {
    Write-Host " [TIMEOUT]" -ForegroundColor Red
    Write-Host "[!] API Backend did not start up within 30 seconds." -ForegroundColor Yellow
}

# Poll Frontend
Write-Host "[*] Waiting for Frontend to respond at http://127.0.0.1:3000..." -NoNewline -ForegroundColor White
$frontendUp = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $client = New-Object System.Net.WebClient
        $html = $client.DownloadString("http://127.0.0.1:3000")
        if ($html) {
            $frontendUp = $true
            break
        }
    } catch {}
    Write-Host "." -NoNewline -ForegroundColor Cyan
    Start-Sleep -Seconds 1
}

if ($frontendUp) {
    Write-Host " [ONLINE]" -ForegroundColor Green
} else {
    Write-Host " [TIMEOUT]" -ForegroundColor Red
    Write-Host "[!] Frontend Portal did not start up within 30 seconds." -ForegroundColor Yellow
}

Write-Host ""
if ($backendUp -and $frontendUp) {
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "    PLATFORM RUNNING SUCCESSFULLY IN DECOUPLED HARMONY   " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "    [+] API Endpoint   : http://127.0.0.1:4000" -ForegroundColor White
    Write-Host "    [+] Frontend Portal: http://127.0.0.1:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "[*] Launching browser to showcase the UI..." -ForegroundColor Cyan
    Start-Process "http://127.0.0.1:3000"
} else {
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host "        STARTUP COMPLETED WITH SYSTEM WARNINGS            " -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host "    Some systems are taking longer to respond. Please review" -ForegroundColor White
    Write-Host "    the individual logs in the spawned shell windows." -ForegroundColor White
}
Write-Host ""
Write-Host "Press any key to return back to this console..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
