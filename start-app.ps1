# LeadRouter Startup Script
# Run this once Docker Desktop is fully running

Write-Host "🚀 Starting LeadRouter..." -ForegroundColor Green
Write-Host ""

# Check if Docker is ready
Write-Host "Checking Docker status..." -ForegroundColor Yellow
$dockerReady = $false
try {
    $result = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerReady = $true
        Write-Host "✅ Docker is ready!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Docker is not ready yet" -ForegroundColor Red
}

if (-not $dockerReady) {
    Write-Host ""
    Write-Host "⚠️  Docker Desktop is not ready yet!" -ForegroundColor Yellow
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Open Docker Desktop" -ForegroundColor Yellow
    Write-Host "  2. Wait until it shows 'Docker Desktop is running'" -ForegroundColor Yellow
    Write-Host "  3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "📦 Starting containers..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Containers started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Waiting for services to initialize (30 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    Write-Host ""
    Write-Host "📊 Checking container status..." -ForegroundColor Yellow
    docker-compose ps
    
    Write-Host ""
    Write-Host "🎉 LeadRouter is starting!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. View logs: docker-compose logs -f app" -ForegroundColor White
    Write-Host "  2. Open browser: http://localhost:3001" -ForegroundColor White
    Write-Host "  3. Login with:" -ForegroundColor White
    Write-Host "     - Admin: admin@leadrouter.com / admin123" -ForegroundColor White
    Write-Host "     - BDR: bdr@leadrouter.com / bdr123" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    Write-Host "Check logs: docker-compose logs" -ForegroundColor Yellow
}

