# Database Setup Script for LeadRouter (MongoDB)
Write-Host "🗄️  Setting up LeadRouter database..." -ForegroundColor Green
Write-Host ""

# Check if MongoDB connection string is set
if ($env:MONGODB_URI) {
    Write-Host "✅ MONGODB_URI is set" -ForegroundColor Green
    Write-Host "   Using MongoDB Atlas or external MongoDB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Running setup script..." -ForegroundColor Yellow
    npm run setup
    
    Write-Host ""
    Write-Host "✅ Database setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start the app with: npm run dev" -ForegroundColor Cyan
    exit 0
}

# Check if MongoDB is accessible locally
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow
Write-Host ""

# Try to connect using mongosh if available
try {
    $mongoshCheck = & mongosh --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB client tools found" -ForegroundColor Green
        Write-Host ""
        
        $host = $env:DB_HOST
        if (-not $host) {
            $host = "localhost"
        }
        
        $port = $env:DB_PORT
        if (-not $port) {
            $port = "27017"
        }
        
        Write-Host "Attempting to connect to MongoDB at ${host}:${port}..." -ForegroundColor Yellow
        
        # Test connection
        $testConnection = & mongosh "mongodb://${host}:${port}" --eval "db.adminCommand('ping')" --quiet 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MongoDB is running!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Running setup script..." -ForegroundColor Yellow
            npm run setup
            
            Write-Host ""
            Write-Host "✅ Database setup complete!" -ForegroundColor Green
            Write-Host ""
            Write-Host "You can now start the app with: npm run dev" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️  Could not connect to MongoDB" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Please:" -ForegroundColor Yellow
            Write-Host "  1. Set MONGODB_URI in .env for MongoDB Atlas" -ForegroundColor White
            Write-Host "  2. Or start MongoDB locally: docker run -d -p 27017:27017 --name mongodb mongo:7.0" -ForegroundColor White
            Write-Host "  3. Or install MongoDB: https://www.mongodb.com/try/download/community" -ForegroundColor White
        }
    } else {
        throw "mongosh not found"
    }
} catch {
    Write-Host "⚠️  MongoDB client tools not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Set MONGODB_URI in .env for MongoDB Atlas (recommended)" -ForegroundColor White
    Write-Host "  2. Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:7.0" -ForegroundColor White
    Write-Host "  3. Or install MongoDB: https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host ""
    Write-Host "Running setup script anyway (will use MONGODB_URI if set)..." -ForegroundColor Yellow
    npm run setup
}
