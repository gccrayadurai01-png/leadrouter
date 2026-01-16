# Database Setup Script for LeadRouter
Write-Host "🗄️  Setting up LeadRouter database..." -ForegroundColor Green
Write-Host ""

# Check if PostgreSQL is accessible
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "postgres"
    $result = & psql -h localhost -U postgres -d postgres -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is running!" -ForegroundColor Green
        Write-Host ""
        
        # Create database if it doesn't exist
        Write-Host "Creating database..." -ForegroundColor Yellow
        & psql -h localhost -U postgres -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'leadrouter'" | Out-Null
        if ($LASTEXITCODE -ne 0) {
            & psql -h localhost -U postgres -d postgres -c "CREATE DATABASE leadrouter;"
            Write-Host "✅ Database created!" -ForegroundColor Green
        } else {
            Write-Host "ℹ️  Database already exists" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "Running setup script..." -ForegroundColor Yellow
        npm run setup
        
        Write-Host ""
        Write-Host "✅ Database setup complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now start the app with: npm run dev" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Cannot connect to PostgreSQL" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please:" -ForegroundColor Yellow
        Write-Host "  1. Install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor White
        Write-Host "  2. Make sure PostgreSQL service is running" -ForegroundColor White
        Write-Host "  3. Update .env with your PostgreSQL password if different" -ForegroundColor White
    }
} catch {
    Write-Host "❌ PostgreSQL not found or not accessible" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL:" -ForegroundColor Yellow
    Write-Host "  Download: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use Docker for PostgreSQL:" -ForegroundColor Yellow
    Write-Host "  docker run -d --name leadrouter-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=leadrouter -p 5432:5432 postgres:15-alpine" -ForegroundColor White
}

