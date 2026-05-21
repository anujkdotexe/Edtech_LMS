# start.ps1
# Startup script for Antigravity LMS Monorepo

Write-Host "🚀 Booting Antigravity LMS..." -ForegroundColor Cyan

# Check if node/pnpm is installed
if (!(Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm is not installed. Please install it globally (npm install -g pnpm)." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install

Write-Host "🔄 Running database migrations and seeding..." -ForegroundColor Yellow
cd apps/api
pnpm run db:push
pnpm run db:seed
cd ../..

Write-Host "✅ Setup complete. Starting servers..." -ForegroundColor Green

# Use Start-Process to run backend and frontend concurrently
Start-Process -FilePath "pnpm" -ArgumentList "run dev:api" -WindowStyle Normal -NoNewWindow
Start-Process -FilePath "pnpm" -ArgumentList "run dev:web" -WindowStyle Normal -NoNewWindow

Write-Host "🌐 Frontend is running at http://localhost:3000" -ForegroundColor Blue
Write-Host "🔌 Backend is running at http://localhost:4000" -ForegroundColor Blue
Write-Host "Press Ctrl+C to terminate the script (you may need to manually close the node processes)." -ForegroundColor DarkGray

# Keep script alive to prevent immediate exit
while ($true) {
    Start-Sleep -Seconds 1
}
