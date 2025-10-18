# Enhanced Deployment Script for OALA System (PowerShell)
# Always clears Next.js build cache to ensure changes are reflected

Write-Host "🚀 Starting Enhanced OALA Deployment Process..." -ForegroundColor Green

# Configuration
$VPS_HOST = "root@72.60.76.125"
$APP_DIR = "/var/www/oala"
$APP_NAME = "oala"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Cyan
Write-Host "   VPS Host: $VPS_HOST" -ForegroundColor White
Write-Host "   App Directory: $APP_DIR" -ForegroundColor White
Write-Host "   App Name: $APP_NAME" -ForegroundColor White

# Step 1: Pull latest changes
Write-Host "📥 Step 1: Pulling latest changes from GitHub..." -ForegroundColor Yellow
$pullResult = ssh -o StrictHostKeyChecking=no $VPS_HOST "cd $APP_DIR && git pull origin main"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to pull changes from GitHub" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Successfully pulled latest changes" -ForegroundColor Green

# Step 2: Stop PM2 process
Write-Host "🛑 Step 2: Stopping PM2 process..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no $VPS_HOST "pm2 stop $APP_NAME"
Write-Host "✅ PM2 process stopped" -ForegroundColor Green

# Step 3: Clear Next.js build cache (CRITICAL STEP)
Write-Host "🧹 Step 3: Clearing Next.js build cache..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no $VPS_HOST "cd $APP_DIR && rm -rf .next"
Write-Host "✅ Build cache cleared" -ForegroundColor Green

# Step 4: Install dependencies (if package.json changed)
Write-Host "📦 Step 4: Installing dependencies..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no $VPS_HOST "cd $APP_DIR && npm install"
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Step 5: Rebuild application with fresh artifacts
Write-Host "🔨 Step 5: Building application with fresh artifacts..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no $VPS_HOST "cd $APP_DIR && npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Application built successfully" -ForegroundColor Green

# Step 6: Start PM2 process with new build
Write-Host "▶️ Step 6: Starting PM2 process with new build..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no $VPS_HOST "pm2 start npm --name $APP_NAME -- start"
Write-Host "✅ PM2 process started" -ForegroundColor Green

# Step 7: Verify deployment
Write-Host "🔍 Step 7: Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
ssh -o StrictHostKeyChecking=no $VPS_HOST "pm2 status $APP_NAME"

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Application should now be running with all latest changes" -ForegroundColor Cyan
Write-Host "📍 URL: https://ckcm-oala.site" -ForegroundColor Cyan
