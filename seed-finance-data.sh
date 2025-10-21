#!/bin/bash

echo "🌱 OALASS Finance Report Test Data Seeder"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Prisma is set up
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: Prisma schema not found. Please ensure you're in the correct directory."
    exit 1
fi

echo "🔧 Setting up database..."
npm run db:generate

echo "📊 Pushing database schema..."
npm run db:push

echo "🌱 Seeding finance test data..."
npm run db:seed:finance

echo ""
echo "✅ Finance test data seeding completed!"
echo ""
echo "🎯 Test Accounts Created:"
echo "   Finance Officer: finance.officer@ckcm.edu (password: password123)"
echo "   Finance Head: finance.head@ckcm.edu (password: password123)"
echo "   Teachers: john.doe@ckcm.edu, jane.smith@ckcm.edu, robert.wilson@ckcm.edu"
echo "   Department Heads: cs.head@ckcm.edu, math.head@ckcm.edu"
echo ""
echo "📊 Test Data Includes:"
echo "   - 6 months of leave applications (48 applications)"
echo "   - 4 months of travel orders (12 travel orders)"
echo "   - Multiple departments and leave types"
echo "   - Realistic approval patterns and costs"
echo ""
echo "🚀 You can now test the Finance Reports system!"
echo "   Navigate to: http://localhost:3000/finance/reports"
echo ""
