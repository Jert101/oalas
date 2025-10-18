#!/bin/bash

# Enhanced Deployment Script for OALA System
# Always clears Next.js build cache to ensure changes are reflected

echo "🚀 Starting Enhanced OALA Deployment Process..."

# Configuration
VPS_HOST="root@72.60.76.125"
APP_DIR="/var/www/oala"
APP_NAME="oala"

echo "📋 Deployment Configuration:"
echo "   VPS Host: $VPS_HOST"
echo "   App Directory: $APP_DIR"
echo "   App Name: $APP_NAME"

# Step 1: Pull latest changes
echo "📥 Step 1: Pulling latest changes from GitHub..."
ssh -o StrictHostKeyChecking=no $VPS_HOST "cd $APP_DIR && git pull origin main"
if [ $? -ne 0 ]; then
    echo "❌ Failed to pull changes from GitHub"
    exit 1
fi
echo "✅ Successfully pulled latest changes"

# Step 2: Stop PM2 process
echo "🛑 Step 2: Stopping PM2 process..."
ssh -o StrictHostKeyChecking=no $VPS_HOST "pm2 stop $APP_NAME"
echo "✅ PM2 process stopped"

# Step 3: Clear Next.js build cache (CRITICAL STEP)
echo "🧹 Step 3: Clearing Next.js build cache..."
ssh -o StrictHostKeyChecking=no $VPS_HOST "cd $APP_DIR && rm -rf .next"
echo "✅ Build cache cleared"

# Step 4: Install dependencies (if package.json changed)
echo "📦 Step 4: Installing dependencies..."
ssh -o StrictHostKeyChecking=no $VPS_HOST "cd $APP_DIR && npm install"
echo "✅ Dependencies installed"

# Step 5: Rebuild application with fresh artifacts
echo "🔨 Step 5: Building application with fresh artifacts..."
ssh -o StrictHostKeyChecking=no $VPS_HOST "cd $APP_DIR && npm run build"
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Application built successfully"

# Step 6: Start PM2 process with new build
echo "▶️ Step 6: Starting PM2 process with new build..."
ssh -o StrictHostKeyChecking=no $VPS_HOST "pm2 start npm --name $APP_NAME -- start"
echo "✅ PM2 process started"

# Step 7: Verify deployment
echo "🔍 Step 7: Verifying deployment..."
sleep 3
ssh -o StrictHostKeyChecking=no $VPS_HOST "pm2 status $APP_NAME"

echo "🎉 Deployment completed successfully!"
echo "🌐 Application should now be running with all latest changes"
echo "📍 URL: https://ckcm-oala.site"
