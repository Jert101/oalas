#!/bin/bash

# OALASS Automated Deployment to Hostinger VPS
# Run this script from your local machine

set -e

# Configuration
VPS_IP="72.60.76.125"
DOMAIN="your-domain.com"  # Replace with your actual domain
APP_NAME="oalass"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
}

log "🚀 Starting automated OALASS deployment to Hostinger VPS ($VPS_IP)..."

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    warning "SSH key not found. Creating SSH key..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    log "SSH key created. Please copy the public key to your VPS:"
    echo "cat ~/.ssh/id_rsa.pub"
    echo "Then add it to /root/.ssh/authorized_keys on your VPS"
    read -p "Press Enter when you've added the SSH key to your VPS..."
fi

# Step 1: Update system and install dependencies
log "📦 Step 1: Updating system and installing dependencies..."
ssh root@$VPS_IP "apt update && apt upgrade -y"
ssh root@$VPS_IP "apt install -y curl wget git nano htop ufw certbot"

# Step 2: Install Docker
log "🐳 Step 2: Installing Docker..."
ssh root@$VPS_IP "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
ssh root@$VPS_IP "systemctl start docker && systemctl enable docker"

# Step 3: Install Docker Compose
log "🔧 Step 3: Installing Docker Compose..."
ssh root@$VPS_IP "curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)' -o /usr/local/bin/docker-compose"
ssh root@$VPS_IP "chmod +x /usr/local/bin/docker-compose"

# Step 4: Configure firewall
log "🔥 Step 4: Configuring firewall..."
ssh root@$VPS_IP "ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable"

# Step 5: Copy OALASS files to VPS
log "📁 Step 5: Copying OALASS files to VPS..."
ssh root@$VPS_IP "mkdir -p /root/$APP_NAME"
scp -r docker/ root@$VPS_IP:/root/$APP_NAME/
scp -r config/ root@$VPS_IP:/root/$APP_NAME/
scp -r scripts/ root@$VPS_IP:/root/$APP_NAME/
scp ecosystem.config.js root@$VPS_IP:/root/$APP_NAME/
scp package*.json root@$VPS_IP:/root/$APP_NAME/
scp next.config.js root@$VPS_IP:/root/$APP_NAME/
scp tsconfig.json root@$VPS_IP:/root/$APP_NAME/
scp -r src/ root@$VPS_IP:/root/$APP_NAME/
scp -r prisma/ root@$VPS_IP:/root/$APP_NAME/
scp -r public/ root@$VPS_IP:/root/$APP_NAME/

# Step 6: Configure environment
log "⚙️ Step 6: Configuring environment..."
ssh root@$VPS_IP "cd /root/$APP_NAME && cp config/env.example config/production.env"

# Step 7: Get SSL certificate
log "🔒 Step 7: Getting SSL certificate..."
echo "Please enter your domain name:"
read -p "Domain: " DOMAIN
ssh root@$VPS_IP "certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN"

# Step 8: Copy SSL certificates
log "📜 Step 8: Copying SSL certificates..."
ssh root@$VPS_IP "mkdir -p /root/$APP_NAME/docker/nginx/ssl"
ssh root@$VPS_IP "cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /root/$APP_NAME/docker/nginx/ssl/cert.pem"
ssh root@$VPS_IP "cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /root/$APP_NAME/docker/nginx/ssl/key.pem"
ssh root@$VPS_IP "chmod 600 /root/$APP_NAME/docker/nginx/ssl/*.pem"

# Step 9: Deploy application
log "🚀 Step 9: Deploying OALASS application..."
ssh root@$VPS_IP "cd /root/$APP_NAME && chmod +x scripts/deploy-hostinger.sh"
ssh root@$VPS_IP "cd /root/$APP_NAME && ./scripts/deploy-hostinger.sh"

# Step 10: Verify deployment
log "✅ Step 10: Verifying deployment..."
ssh root@$VPS_IP "docker-compose -f /root/$APP_NAME/docker/docker-compose.yml ps"
ssh root@$VPS_IP "curl -f https://$DOMAIN/api/health"

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
