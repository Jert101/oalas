#!/bin/bash

# OALASS Automated Hostinger VPS Deployment Script
# This script automates the entire deployment process

set -e

# Configuration
VPS_IP="72.60.76.125"
DOMAIN="your-domain.com"  # Replace with your actual domain
APP_NAME="oalass"
REPO_URL="https://github.com/your-username/oalass.git"  # Replace with your actual repo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Function to run commands on VPS
run_on_vps() {
    ssh root@$VPS_IP "$1"
}

# Function to copy files to VPS
copy_to_vps() {
    scp -r "$1" root@$VPS_IP:"$2"
}

log "🚀 Starting automated OALASS deployment on Hostinger VPS ($VPS_IP)..."

# Step 1: Update system and install dependencies
log "📦 Step 1: Updating system and installing dependencies..."
run_on_vps "apt update && apt upgrade -y"
run_on_vps "apt install -y curl wget git nano htop ufw certbot"

# Step 2: Install Docker
log "🐳 Step 2: Installing Docker..."
run_on_vps "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
run_on_vps "systemctl start docker && systemctl enable docker"

# Step 3: Install Docker Compose
log "🔧 Step 3: Installing Docker Compose..."
run_on_vps "curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)' -o /usr/local/bin/docker-compose"
run_on_vps "chmod +x /usr/local/bin/docker-compose"

# Step 4: Configure firewall
log "🔥 Step 4: Configuring firewall..."
run_on_vps "ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable"

# Step 5: Clone repository
log "📥 Step 5: Cloning OALASS repository..."
run_on_vps "git clone $REPO_URL /root/$APP_NAME"
run_on_vps "cd /root/$APP_NAME"

# Step 6: Copy deployment files to VPS
log "📁 Step 6: Copying deployment files..."
copy_to_vps "docker/" "root@$VPS_IP:/root/$APP_NAME/"
copy_to_vps "config/" "root@$VPS_IP:/root/$APP_NAME/"
copy_to_vps "scripts/" "root@$VPS_IP:/root/$APP_NAME/"
copy_to_vps "ecosystem.config.js" "root@$VPS_IP:/root/$APP_NAME/"

# Step 7: Configure environment
log "⚙️ Step 7: Configuring environment..."
run_on_vps "cd /root/$APP_NAME && cp config/env.example config/production.env"

# Step 8: Get SSL certificate
log "🔒 Step 8: Getting SSL certificate..."
run_on_vps "certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN"

# Step 9: Copy SSL certificates
log "📜 Step 9: Copying SSL certificates..."
run_on_vps "mkdir -p /root/$APP_NAME/docker/nginx/ssl"
run_on_vps "cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /root/$APP_NAME/docker/nginx/ssl/cert.pem"
run_on_vps "cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /root/$APP_NAME/docker/nginx/ssl/key.pem"
run_on_vps "chmod 600 /root/$APP_NAME/docker/nginx/ssl/*.pem"

# Step 10: Deploy application
log "🚀 Step 10: Deploying OALASS application..."
run_on_vps "cd /root/$APP_NAME && chmod +x scripts/deploy-hostinger.sh"
run_on_vps "cd /root/$APP_NAME && ./scripts/deploy-hostinger.sh"

# Step 11: Verify deployment
log "✅ Step 11: Verifying deployment..."
run_on_vps "docker-compose -f /root/$APP_NAME/docker/docker-compose.yml ps"
run_on_vps "curl -f https://$DOMAIN/api/health"

log "🎉 Automated deployment completed successfully!"
log "🌐 Your OALASS application is now available at: https://$DOMAIN"
log "🏥 Health check: https://$DOMAIN/api/health"

echo ""
echo "=========================================="
echo "🎉 OALASS AUTOMATED DEPLOYMENT COMPLETE!"
echo "=========================================="
echo "🌐 URL: https://$DOMAIN"
echo "🏥 Health: https://$DOMAIN/api/health"
echo "📊 Logs: ssh root@$VPS_IP 'cd /root/$APP_NAME && docker-compose -f docker/docker-compose.yml logs -f'"
echo "🔄 Restart: ssh root@$VPS_IP 'cd /root/$APP_NAME && docker-compose -f docker/docker-compose.yml restart'"
echo "=========================================="
