#!/bin/bash

# OALASS One-Click Deployment for Hostinger VPS
# This script does EVERYTHING automatically

set -e

# Configuration - UPDATE THESE VALUES
VPS_IP="72.60.76.125"
DOMAIN="your-domain.com"  # CHANGE THIS TO YOUR DOMAIN
EMAIL="your-email@domain.com"  # CHANGE THIS TO YOUR EMAIL

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warning() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO:${NC} $1"; }

log "🚀 OALASS One-Click Deployment Starting..."

# Check if we can connect to VPS
log "🔍 Testing connection to VPS..."
if ! ssh -o ConnectTimeout=10 root@$VPS_IP "echo 'Connection successful'" 2>/dev/null; then
    error "Cannot connect to VPS. Please check:"
    echo "1. VPS IP is correct: $VPS_IP"
    echo "2. SSH key is set up"
    echo "3. VPS is running"
    exit 1
fi

# Step 1: System setup
log "📦 Setting up system..."
ssh root@$VPS_IP << 'EOF'
apt update -y
apt upgrade -y
apt install -y curl wget git nano htop ufw certbot
EOF

# Step 2: Install Docker
log "🐳 Installing Docker..."
ssh root@$VPS_IP << 'EOF'
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker
EOF

# Step 3: Install Docker Compose
log "🔧 Installing Docker Compose..."
ssh root@$VPS_IP << 'EOF'
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
EOF

# Step 4: Configure firewall
log "🔥 Configuring firewall..."
ssh root@$VPS_IP << 'EOF'
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
EOF

# Step 5: Create OALASS directory and copy files
log "📁 Setting up OALASS..."
ssh root@$VPS_IP "mkdir -p /root/oalass"

# Copy all necessary files
log "📤 Copying files to VPS..."
scp -r docker/ root@$VPS_IP:/root/oalass/
scp -r config/ root@$VPS_IP:/root/oalass/
scp -r scripts/ root@$VPS_IP:/root/oalass/
scp ecosystem.config.js root@$VPS_IP:/root/oalass/
scp package*.json root@$VPS_IP:/root/oalass/
scp next.config.js root@$VPS_IP:/root/oalass/
scp tsconfig.json root@$VPS_IP:/root/oalass/
scp -r src/ root@$VPS_IP:/root/oalass/
scp -r prisma/ root@$VPS_IP:/root/oalass/
scp -r public/ root@$VPS_IP:/root/oalass/

# Step 6: Configure environment
log "⚙️ Configuring environment..."
ssh root@$VPS_IP << EOF
cd /root/oalass
cp config/env.example config/production.env
echo "NEXTAUTH_URL=https://$DOMAIN" >> config/production.env
echo "EMAIL_FROM=noreply@$DOMAIN" >> config/production.env
EOF

# Step 7: Get SSL certificate
log "🔒 Getting SSL certificate..."
ssh root@$VPS_IP << EOF
certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email $EMAIL
mkdir -p /root/oalass/docker/nginx/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /root/oalass/docker/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /root/oalass/docker/nginx/ssl/key.pem
chmod 600 /root/oalass/docker/nginx/ssl/*.pem
EOF

# Step 8: Deploy application
log "🚀 Deploying OALASS..."
ssh root@$VPS_IP << 'EOF'
cd /root/oalass
chmod +x scripts/deploy-hostinger.sh
./scripts/deploy-hostinger.sh
EOF

# Step 9: Verify deployment
log "✅ Verifying deployment..."
ssh root@$VPS_IP "docker-compose -f /root/oalass/docker/docker-compose.yml ps"
ssh root@$VPS_IP "curl -f https://$DOMAIN/api/health"

log "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "=========================================="
echo "🎉 OALASS SUCCESSFULLY DEPLOYED!"
echo "=========================================="
echo "🌐 URL: https://$DOMAIN"
echo "🏥 Health: https://$DOMAIN/api/health"
echo "📊 Logs: ssh root@$VPS_IP 'cd /root/oalass && docker-compose -f docker/docker-compose.yml logs -f'"
echo "🔄 Restart: ssh root@$VPS_IP 'cd /root/oalass && docker-compose -f docker/docker-compose.yml restart'"
echo "=========================================="
