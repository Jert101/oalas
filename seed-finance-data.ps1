# OALASS Finance Report Test Data Seeder
Write-Host "🌱 OALASS Finance Report Test Data Seeder" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if Prisma is set up
if (-not (Test-Path "prisma/schema.prisma")) {
    Write-Host "❌ Error: Prisma schema not found. Please ensure you're in the correct directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "🔧 Setting up database..." -ForegroundColor Cyan
npm run db:generate

Write-Host "📊 Pushing database schema..." -ForegroundColor Cyan
npm run db:push

Write-Host "🌱 Seeding finance test data..." -ForegroundColor Cyan
npm run db:seed:finance

Write-Host ""
Write-Host "✅ Finance test data seeding completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Test Accounts Created:" -ForegroundColor Yellow
Write-Host "   Finance Officer: finance.officer@ckcm.edu (password: password123)" -ForegroundColor White
Write-Host "   Finance Head: finance.head@ckcm.edu (password: password123)" -ForegroundColor White
Write-Host "   Teachers: john.doe@ckcm.edu, jane.smith@ckcm.edu, robert.wilson@ckcm.edu" -ForegroundColor White
Write-Host "   Department Heads: cs.head@ckcm.edu, math.head@ckcm.edu" -ForegroundColor White
Write-Host ""
Write-Host "📊 Test Data Includes:" -ForegroundColor Yellow
Write-Host "   - 6 months of leave applications (48 applications)" -ForegroundColor White
Write-Host "   - 4 months of travel orders (12 travel orders)" -ForegroundColor White
Write-Host "   - Multiple departments and leave types" -ForegroundColor White
Write-Host "   - Realistic approval patterns and costs" -ForegroundColor White
Write-Host ""
Write-Host "🚀 You can now test the Finance Reports system!" -ForegroundColor Green
Write-Host "   Navigate to: http://localhost:3000/finance/reports" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
