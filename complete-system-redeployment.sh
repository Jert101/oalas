#!/bin/bash

echo "========================================"
echo "    COMPLETE SYSTEM REDEPLOYMENT"
echo "========================================"
echo ""

echo "Step 1: Backup current environment"
ssh root@72.60.76.125 "cd /var/www && cp -r oalass oalass-backup-$(date +%Y%m%d-%H%M%S)"

echo ""
echo "Step 2: Stop current application"
ssh root@72.60.76.125 "pm2 stop oalass"

echo ""
echo "Step 3: Remove old deployment directory"
ssh root@72.60.76.125 "rm -rf /var/www/oalass"

echo ""
echo "Step 4: Fresh clone from GitHub"
ssh root@72.60.76.125 "cd /var/www && git clone https://github.com/Jert101/oalas.git oalass"

echo ""
echo "Step 5: Navigate to new directory and verify"
ssh root@72.60.76.125 "cd /var/www/oalass && pwd && git log --oneline -1"

echo ""
echo "Step 6: Copy environment file from backup"
ssh root@72.60.76.125 "cd /var/www/oalass && cp ../oalass-backup-*/oalass/.env .env 2>/dev/null || echo 'No .env backup found, will need manual setup'"

echo ""
echo "Step 7: Install dependencies"
ssh root@72.60.76.125 "cd /var/www/oalass && npm install"

echo ""
echo "Step 8: Generate Prisma client"
ssh root@72.60.76.125 "cd /var/www/oalass && npm run db:generate"

echo ""
echo "Step 9: Build application"
ssh root@72.60.76.125 "cd /var/www/oalass && npm run build"

echo ""
echo "Step 10: Start application with PM2"
ssh root@72.60.76.125 "cd /var/www/oalass && pm2 start npm --name 'oalass' -- start"

echo ""
echo "Step 11: Save PM2 configuration"
ssh root@72.60.76.125 "pm2 save"

echo ""
echo "Step 12: Check application status"
ssh root@72.60.76.125 "pm2 status"

echo ""
echo "Step 13: Verify latest changes are deployed"
ssh root@72.60.76.125 "cd /var/www/oalass && grep -n 'roleCategory' src/app/admin/manage-accounts/page.tsx | head -2"

echo ""
echo "Step 14: Test application locally"
ssh root@72.60.76.125 "curl -I http://127.0.0.1:3000"

echo ""
echo "========================================"
echo "    REDEPLOYMENT COMPLETED"
echo "========================================"
echo ""
echo "Expected results:"
echo "✅ Fresh repository clone"
echo "✅ Latest commit: 126f35e"
echo "✅ All dependencies installed"
echo "✅ Application built and running"
echo "✅ PM2 process online"
echo ""
echo "Test your application:"
echo "https://ckcm-oala.site"
echo ""
echo "If issues persist, check:"
echo "1. Environment variables (.env file)"
echo "2. Database connection"
echo "3. PM2 logs: pm2 logs oalass"
echo ""

