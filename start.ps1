# start.ps1
# Startup script for Antigravity LMS Monorepo
# Rule: No emojis in scripts or code. Use plain ASCII text for all log output.

Write-Host "[BOOT] Booting Antigravity LMS..." -ForegroundColor Cyan

# Check if pnpm is installed
if (!(Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] pnpm is not installed. Please install it globally: npm install -g pnpm" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
pnpm install

Write-Host "[INFO] Running database migrations and seeding..." -ForegroundColor Yellow
Set-Location apps/api
pnpm run db:push
pnpm run db:seed
Set-Location ../..

Write-Host "[OK] Setup complete. Starting servers..." -ForegroundColor Green

# Start backend and frontend concurrently in separate windows
Start-Process -FilePath "pnpm" -ArgumentList "--filter=@lms/api", "dev" -WindowStyle Normal -NoNewWindow
Start-Process -FilePath "pnpm" -ArgumentList "--filter=@lms/web", "dev" -WindowStyle Normal -NoNewWindow

Write-Host "[INFO] Frontend is running at http://localhost:3000" -ForegroundColor Blue
Write-Host "[INFO] Backend  is running at http://localhost:4000" -ForegroundColor Blue
Write-Host "[INFO] Press Ctrl+C to stop (you may need to manually close the node processes)." -ForegroundColor DarkGray

# Keep script alive
while ($true) {
    Start-Sleep -Seconds 1
}
