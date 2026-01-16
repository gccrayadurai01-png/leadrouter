# Quick Database Connection Script
Write-Host "🔌 Quick Database Connection Helper" -ForegroundColor Green
Write-Host ""

Write-Host "Current .env settings:" -ForegroundColor Yellow
Get-Content .env | Select-String "DB_" | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
Write-Host ""

Write-Host "Testing connection..." -ForegroundColor Yellow
node test-db-connection.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Connection successful! Running setup..." -ForegroundColor Green
    npm run setup
} else {
    Write-Host ""
    Write-Host "❌ Connection failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix this:" -ForegroundColor Yellow
    Write-Host "  1. Open pgAdmin" -ForegroundColor White
    Write-Host "  2. Connect to PostgreSQL server" -ForegroundColor White
    Write-Host "  3. Open Query Tool" -ForegroundColor White
    Write-Host "  4. Run: ALTER USER postgres WITH PASSWORD '1573';" -ForegroundColor Cyan
    Write-Host "  5. Then run this script again: .\quick-connect.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use the SQL file: reset-postgres-password.sql" -ForegroundColor Yellow
}

