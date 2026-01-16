# LeadRouter Production Deployment Script for Windows PowerShell
# This script automates the deployment process on Windows

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting LeadRouter Production Deployment..." -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found. Creating from env.production.example..." -ForegroundColor Yellow
    if (Test-Path env.production.example) {
        Copy-Item env.production.example .env
        Write-Host "⚠️  IMPORTANT: Please edit .env file with your production values before continuing!" -ForegroundColor Red
        Write-Host "   Especially: DB_PASSWORD, JWT_SECRET, CLIENT_URL" -ForegroundColor Red
        Read-Host "Press Enter after you've updated .env file"
    } else {
        Write-Host "❌ env.production.example not found. Please create .env manually." -ForegroundColor Red
        exit 1
    }
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "❌ docker-compose is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Load and validate environment variables
$envContent = Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -match '=' }
$envVars = @{}
foreach ($line in $envContent) {
    $parts = $line -split '=', 2
    if ($parts.Length -eq 2) {
        $envVars[$parts[0].Trim()] = $parts[1].Trim()
    }
}

# Validate critical environment variables
if (-not $envVars['DB_PASSWORD'] -or $envVars['DB_PASSWORD'] -eq 'your_secure_database_password_here') {
    Write-Host "❌ DB_PASSWORD is not set or is using default value. Please update .env file." -ForegroundColor Red
    exit 1
}

if (-not $envVars['JWT_SECRET'] -or $envVars['JWT_SECRET'] -eq 'your-very-secure-random-jwt-secret-here-change-this') {
    Write-Host "❌ JWT_SECRET is not set or is using default value. Please update .env file." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment variables validated" -ForegroundColor Green

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down 2>&1 | Out-Null

# Build and start containers
Write-Host "🏗️  Building and starting containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if database setup is needed
Write-Host "🔧 Setting up database..." -ForegroundColor Cyan
$setupResult = docker-compose -f docker-compose.prod.yml exec -T app node server/db/setup.js 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Database setup may have failed. Checking logs..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml logs app | Select-Object -Last 20
}

# Wait a bit more for app to be fully ready
Write-Host "⏳ Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Health check
Write-Host "🏥 Checking application health..." -ForegroundColor Cyan
$appPort = if ($envVars['APP_PORT']) { $envVars['APP_PORT'] } else { '3001' }
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:$appPort/health" -UseBasicParsing -TimeoutSec 5
    if ($healthCheck.Content -match '"status":"ok"') {
        Write-Host "✅ Application is healthy!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Health check returned unexpected response." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Health check failed. Checking logs..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml logs app | Select-Object -Last 30
}

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Application Status:" -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml ps
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:     docker-compose -f docker-compose.prod.yml logs -f app"
Write-Host "   Stop app:      docker-compose -f docker-compose.prod.yml down"
Write-Host "   Restart app:   docker-compose -f docker-compose.prod.yml restart"
Write-Host "   View status:   docker-compose -f docker-compose.prod.yml ps"
Write-Host ""
Write-Host "🌐 Application should be available at: http://localhost:$appPort" -ForegroundColor Green
Write-Host ""

