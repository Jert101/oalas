#!/bin/bash

echo "========================================"
echo "    DEPLOYING LATEST CHANGES TO VPS"
echo "========================================"
echo ""

echo "Step 1: Connect to VPS and navigate to project"
ssh root@72.60.76.125 "cd /var/www/oalass && pwd"

echo ""
echo "Step 2: Check current commit on VPS"
ssh root@72.60.76.125 "cd /var/www/oalass && git log --oneline -1"

echo ""
echo "Step 3: Pull latest changes from GitHub"
ssh root@72.60.76.125 "cd /var/www/oalass && git pull origin main"

echo ""
echo "Step 4: Check new commit after pull"
ssh root@72.60.76.125 "cd /var/www/oalass && git log --oneline -1"

echo ""
echo "Step 5: Clear build cache"
ssh root@72.60.76.125 "cd /var/www/oalass && rm -rf .next"

echo ""
echo "Step 6: Restart application"
ssh root@72.60.76.125 "cd /var/www/oalass && pm2 restart oalass"

echo ""
echo "Step 7: Check application status"
ssh root@72.60.76.125 "cd /var/www/oalass && pm2 status"

echo ""
echo "Step 8: Verify changes are deployed"
ssh root@72.60.76.125 "cd /var/www/oalass && grep -n 'roleCategory' src/app/admin/manage-accounts/page.tsx | head -2"

echo ""
echo "========================================"
echo "    DEPLOYMENT COMPLETED"
echo "========================================"
echo ""
echo "Expected commit: 126f35e"
echo "Expected message: feat: Complete probation management and edit user modal enhancements"
echo ""
echo "Test your application now:"
echo "https://ckcm-oala.site"
echo ""

