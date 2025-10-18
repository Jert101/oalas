#!/bin/bash

echo "========================================"
echo "    OALASS DEPLOYMENT FIX SCRIPT"
echo "========================================"
echo ""

echo "Step 1: Navigate to project directory"
cd /var/www/oalass

echo "Step 2: Check current status"
echo "Current commit:"
git log --oneline -1
echo ""
echo "PM2 status:"
pm2 status
echo ""

echo "Step 3: Force pull latest changes"
git fetch origin
git reset --hard origin/main

echo "Step 4: Clear all caches"
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force

echo "Step 5: Reinstall dependencies"
npm install
npm run db:generate

echo "Step 6: Build application"
npm run build

echo "Step 7: Stop and restart application"
pm2 stop oalass
pm2 start npm --name "oalass" -- start

echo "Step 8: Check final status"
pm2 status
echo ""
echo "Application logs (last 10 lines):"
pm2 logs oalass --lines 10

echo ""
echo "========================================"
echo "    DEPLOYMENT FIX COMPLETED"
echo "========================================"
echo ""
echo "Test your application now:"
echo "https://ckcm-oala.site"
echo ""
