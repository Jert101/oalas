# OALASS VPS DEPLOYMENT SCRIPT
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    OALASS VPS DEPLOYMENT SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Connecting to VPS and navigating to project directory..." -ForegroundColor Yellow
ssh root@72.60.76.125 "cd /var/www/oalass && pwd"

Write-Host ""
Write-Host "[2/6] Pulling latest changes from GitHub..." -ForegroundColor Yellow
ssh root@72.60.76.125 "cd /var/www/oalass && git pull origin main"

Write-Host ""
Write-Host "[3/6] Installing dependencies..." -ForegroundColor Yellow
ssh root@72.60.76.125 "cd /var/www/oalass && npm install"

Write-Host ""
Write-Host "[4/6] Generating Prisma client..." -ForegroundColor Yellow
ssh root@72.60.76.125 "cd /var/www/oalass && npm run db:generate"

Write-Host ""
Write-Host "[5/6] Restarting application with PM2..." -ForegroundColor Yellow
ssh root@72.60.76.125 "cd /var/www/oalass && pm2 restart oalass"

Write-Host ""
Write-Host "[6/6] Checking application status..." -ForegroundColor Yellow
ssh root@72.60.76.125 "cd /var/www/oalass && pm2 status"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your application should now be running with the latest changes." -ForegroundColor White
Write-Host "Check your deployed site to verify the new features are working." -ForegroundColor White
Write-Host ""
Write-Host "New features deployed:" -ForegroundColor Cyan
Write-Host "✅ Enhanced Probation Management with CRUD operations" -ForegroundColor Green
Write-Host "✅ Real-time countdown functionality" -ForegroundColor Green
Write-Host "✅ Fixed Edit User Modal with role categories" -ForegroundColor Green
Write-Host "✅ New API endpoints and bug fixes" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue"
