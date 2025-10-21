# OALASS Deployment on Hostinger VPS

## 🚀 Hostinger VPS Specific Deployment Guide

### Hostinger VPS Setup

**Recommended VPS Configuration:**
- **Plan:** Business VPS or higher
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 50GB SSD
- **OS:** Ubuntu 20.04 LTS
- **Network:** Public IP with domain support

## 📋 Pre-Deployment Checklist

### 1. Hostinger VPS Configuration
```bash
# Access your VPS via SSH
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git nano htop
```

### 2. Docker Installation on Hostinger VPS
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 3. Firewall Configuration
```bash
# Configure UFW firewall
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable

# Check status
ufw status
```

## 🔧 Hostinger-Specific Configuration

### 1. Domain Setup in Hostinger
1. **Login to Hostinger Control Panel**
2. **Go to Domain Management**
3. **Add A Record:** `your-domain.com -> YOUR_VPS_IP`
4. **Add CNAME Record:** `www.your-domain.com -> your-domain.com`

### 2. SSL Certificate Setup (Let's Encrypt)
```bash
# Install Certbot
apt install -y certbot

# Stop any running web server
systemctl stop apache2 nginx

# Get SSL certificate
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Verify certificate
ls -la /etc/letsencrypt/live/your-domain.com/
```

### 3. OALASS Deployment on Hostinger VPS
```bash
# Clone repository
git clone https://github.com/your-username/oalass.git
cd oalass

# Copy environment configuration
cp config/env.example config/production.env

# Edit production environment for Hostinger
nano config/production.env
```

### 4. Hostinger-Specific Environment Configuration
```env
# Hostinger VPS Configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database Configuration (Hostinger MySQL)
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=oalass_production
MYSQL_USER=oalass_user
MYSQL_PASSWORD=your_secure_db_password
DATABASE_URL=mysql://oalass_user:your_secure_db_password@mysql:3306/oalass_production

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_minimum_32_characters
NEXTAUTH_URL=https://your-domain.com

# Google OAuth (Update with your domain)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Configuration (Hostinger SMTP)
EMAIL_SERVER_HOST=smtp.hostinger.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@your-domain.com
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM=noreply@your-domain.com

# Hostinger-specific settings
WEBSOCKET_PORT=3001
WEBSOCKET_HOST=0.0.0.0
MONITORING_ENABLED=true
LOG_LEVEL=info
```

### 5. SSL Certificate Integration
```bash
# Create SSL directory
mkdir -p docker/nginx/ssl

# Copy Let's Encrypt certificates
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/key.pem

# Set proper permissions
chmod 600 docker/nginx/ssl/*.pem
```

### 6. Deploy OALASS on Hostinger VPS
```bash
# Make scripts executable
chmod +x scripts/deploy.sh scripts/rollback.sh

# Deploy application
./scripts/deploy.sh
```

## 🌐 Hostinger Domain Configuration

### 1. DNS Settings in Hostinger
```
Type    Name                    Value
A       @                       YOUR_VPS_IP
A       www                     YOUR_VPS_IP
CNAME   api                     your-domain.com
CNAME   admin                   your-domain.com
```

### 2. Google OAuth Configuration
1. **Go to Google Cloud Console**
2. **Update Authorized Origins:**
   - `https://your-domain.com`
   - `https://www.your-domain.com`
3. **Update Authorized Redirect URIs:**
   - `https://your-domain.com/api/auth/callback/google`
   - `https://www.your-domain.com/api/auth/callback/google`

### 3. Email Configuration (Hostinger Email)
```env
# Hostinger Email Settings
EMAIL_SERVER_HOST=smtp.hostinger.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@your-domain.com
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM=noreply@your-domain.com
```

## 🔧 Hostinger VPS Optimization

### 1. System Optimization
```bash
# Optimize for Hostinger VPS
echo 'vm.swappiness=10' >> /etc/sysctl.conf
echo 'net.core.somaxconn=65535' >> /etc/sysctl.conf
sysctl -p

# Optimize Docker
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

# Restart Docker
systemctl restart docker
```

### 2. Resource Monitoring
```bash
# Install monitoring tools
apt install -y htop iotop nethogs

# Monitor resources
htop                    # CPU and memory
iotop                   # Disk I/O
nethogs                 # Network usage
```

### 3. Backup Strategy for Hostinger VPS
```bash
# Create backup script
cat > /root/backup-oalass.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker-compose -f /root/oalass/docker/docker-compose.yml exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD --all-databases > $BACKUP_DIR/database_$DATE.sql

# Application files backup
docker-compose -f /root/oalass/docker/docker-compose.yml exec -T app tar -czf - /app/uploads /app/logs > $BACKUP_DIR/app_files_$DATE.tar.gz

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /root/backup-oalass.sh

# Schedule daily backups
echo "0 2 * * * /root/backup-oalass.sh" | crontab -
```

## 🚨 Hostinger VPS Troubleshooting

### 1. Common Hostinger Issues

#### Port 80/443 Already in Use
```bash
# Check what's using the ports
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Stop conflicting services
systemctl stop apache2
systemctl disable apache2
systemctl stop nginx
systemctl disable nginx
```

#### SSL Certificate Issues
```bash
# Check certificate status
certbot certificates

# Renew certificate
certbot renew --dry-run

# Manual renewal
certbot renew
```

#### Database Connection Issues
```bash
# Check MySQL status
docker-compose -f docker/docker-compose.yml logs mysql

# Test database connection
docker-compose -f docker/docker-compose.yml exec app npx prisma db push
```

### 2. Hostinger VPS Performance Issues

#### High Memory Usage
```bash
# Check memory usage
free -h
docker stats

# Optimize PM2 instances
# Edit ecosystem.config.js
nano ecosystem.config.js
# Reduce instances if needed
```

#### Slow Response Times
```bash
# Check disk I/O
iotop

# Check network
nethogs

# Optimize Nginx
# Edit docker/nginx/nginx.conf
nano docker/nginx/nginx.conf
```

### 3. Hostinger Support Integration

#### Log Analysis
```bash
# Application logs
docker-compose -f docker/docker-compose.yml logs app

# Database logs
docker-compose -f docker/docker-compose.yml logs mysql

# Nginx logs
docker-compose -f docker/docker-compose.yml logs nginx
```

#### Performance Monitoring
```bash
# System resources
htop

# Docker resource usage
docker stats

# Disk usage
df -h
du -sh /var/lib/docker
```

## 📊 Hostinger VPS Monitoring

### 1. Health Check Endpoints
```bash
# Application health
curl https://your-domain.com/api/health

# Database health (included in app health)
curl https://your-domain.com/api/health | jq '.services.database'
```

### 2. Automated Monitoring Script
```bash
# Create monitoring script
cat > /root/monitor-oalass.sh << 'EOF'
#!/bin/bash
DOMAIN="your-domain.com"
LOG_FILE="/var/log/oalass-monitor.log"

# Check application health
if ! curl -f https://$DOMAIN/api/health > /dev/null 2>&1; then
    echo "$(date): Application health check failed" >> $LOG_FILE
    # Restart services
    cd /root/oalass
    docker-compose -f docker/docker-compose.yml restart app
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): Disk usage high: $DISK_USAGE%" >> $LOG_FILE
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEM_USAGE -gt 80 ]; then
    echo "$(date): Memory usage high: $MEM_USAGE%" >> $LOG_FILE
fi
EOF

chmod +x /root/monitor-oalass.sh

# Schedule monitoring (every 5 minutes)
echo "*/5 * * * * /root/monitor-oalass.sh" | crontab -
```

## 🔒 Hostinger VPS Security

### 1. Basic Security Hardening
```bash
# Update SSH configuration
nano /etc/ssh/sshd_config
# Change default port, disable root login, etc.

# Install fail2ban
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Configure firewall rules
ufw default deny incoming
ufw default allow outgoing
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### 2. Docker Security
```bash
# Run containers as non-root user
# Already configured in Dockerfile

# Limit container resources
# Edit docker-compose.yml to add resource limits
```

## 📞 Hostinger VPS Support

### 1. Hostinger Support Resources
- **Knowledge Base:** https://support.hostinger.com/
- **VPS Documentation:** https://support.hostinger.com/en/articles/1583299
- **Docker Support:** https://support.hostinger.com/en/articles/1583299

### 2. Emergency Procedures
```bash
# Quick restart
cd /root/oalass
docker-compose -f docker/docker-compose.yml restart

# Full restart
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up -d

# Emergency rollback
./scripts/rollback.sh
```

### 3. Hostinger VPS Management
- **Control Panel:** Access via Hostinger dashboard
- **Resource Monitoring:** Use Hostinger monitoring tools
- **Backup Management:** Configure automated backups
- **SSL Management:** Use Hostinger SSL tools

---

**Hostinger VPS Deployment Guide**  
**Generated By:** John (Product Manager)  
**Date:** 2025-01-27  
**Version:** 1.0  
**Status:** ✅ READY FOR HOSTINGER VPS
