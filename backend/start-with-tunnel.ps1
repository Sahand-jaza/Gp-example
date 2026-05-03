# Start Backend and Localtunnel
Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Job -ScriptBlock { bun run --watch src/index.ts } -Name "Backend"

Write-Host "Starting Tunnel..." -ForegroundColor Green
npx localtunnel --port 5000
