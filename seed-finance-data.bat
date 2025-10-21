@echo off
echo 🌱 OALASS Finance Report Test Data Seeder
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Check if Prisma is set up
if not exist "prisma\schema.prisma" (
    echo ❌ Error: Prisma schema not found. Please ensure you're in the correct directory.
    pause
    exit /b 1
)

echo 🔧 Setting up database...
npm run db:generate

echo 📊 Pushing database schema...
npm run db:push

echo 🌱 Seeding finance test data...
npm run db:seed:finance

echo.
echo ✅ Finance test data seeding completed!
echo.
echo 🎯 Test Accounts Created:
echo    Finance Officer: finance.officer@ckcm.edu (password: password123)
echo    Finance Head: finance.head@ckcm.edu (password: password123)
echo    Teachers: john.doe@ckcm.edu, jane.smith@ckcm.edu, robert.wilson@ckcm.edu
echo    Department Heads: cs.head@ckcm.edu, math.head@ckcm.edu
echo.
echo 📊 Test Data Includes:
echo    - 6 months of leave applications (48 applications)
echo    - 4 months of travel orders (12 travel orders)
echo    - Multiple departments and leave types
echo    - Realistic approval patterns and costs
echo.
echo 🚀 You can now test the Finance Reports system!
echo    Navigate to: http://localhost:3000/finance/reports
echo.
pause
