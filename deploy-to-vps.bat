@echo off
echo ========================================
echo    OALASS VPS DEPLOYMENT SCRIPT
echo ========================================
echo.

echo [1/6] Connecting to VPS and navigating to project directory...
ssh root@72.60.76.125 "cd /var/www/oalass && pwd"

echo.
echo [2/6] Pulling latest changes from GitHub...
ssh root@72.60.76.125 "cd /var/www/oalass && git pull origin main"

echo.
echo [3/6] Installing dependencies...
ssh root@72.60.76.125 "cd /var/www/oalass && npm install"

echo.
echo [4/6] Generating Prisma client...
ssh root@72.60.76.125 "cd /var/www/oalass && npm run db:generate"

echo.
echo [5/6] Restarting application with PM2...
ssh root@72.60.76.125 "cd /var/www/oalass && pm2 restart oalass"

echo.
echo [6/6] Checking application status...
ssh root@72.60.76.125 "cd /var/www/oalass && pm2 status"

echo.
echo ========================================
echo    DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Your application should now be running with the latest changes.
echo Check your deployed site to verify the new features are working.
echo.
pause
