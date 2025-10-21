# OALASS Production Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- Linux server with Docker and Docker Compose installed
- Domain name with SSL certificate
- MySQL server access
- SMTP email service configuration

### 1. Server Setup
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone and Configure
```bash
# Clone the repository
git clone <your-repository-url>
cd oalass

# Copy environment configuration
cp config/env.example config/production.env

# Edit production environment
nano config/production.env
```

### 3. Environment Configuration
Update `config/production.env` with your production values:
```env
# Database Configuration
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=oalass_production
MYSQL_USER=oalass_user
MYSQL_PASSWORD=your_secure_db_password
DATABASE_URL=mysql://oalass_user:your_secure_db_password@mysql:3306/oalass_production

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret_minimum_32_characters
NEXTAUTH_URL=https://your-domain.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
EMAIL_FROM=noreply@your-domain.com
```

### 4. SSL Certificate Setup
```bash
# Create SSL directory
mkdir -p docker/nginx/ssl

# Copy your SSL certificates
cp your-cert.pem docker/nginx/ssl/cert.pem
cp your-key.pem docker/nginx/ssl/key.pem
```

### 5. Deploy the Application
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh scripts/rollback.sh

# Run deployment
./scripts/deploy.sh
```

### 6. Verify Deployment
```bash
# Check application health
curl https://your-domain.com/api/health

# Check all services
docker-compose -f docker/docker-compose.yml ps

# View logs
docker-compose -f docker/docker-compose.yml logs -f
```

## 📋 Detailed Deployment Steps

### Step 1: Server Preparation
1. **System Requirements:**
   - Ubuntu 20.04+ or CentOS 8+
   - 4GB RAM minimum (8GB recommended)
   - 50GB disk space
   - Docker 20.10+
   - Docker Compose 2.0+

2. **Security Setup:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Configure firewall
   sudo ufw allow 22    # SSH
   sudo ufw allow 80   # HTTP
   sudo ufw allow 443  # HTTPS
   sudo ufw enable
   ```

### Step 2: Database Setup
1. **MySQL Configuration:**
   ```bash
   # Create database and user
   mysql -u root -p
   CREATE DATABASE oalass_production;
   CREATE USER 'oalass_user'@'%' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON oalass_production.* TO 'oalass_user'@'%';
   FLUSH PRIVILEGES;
   ```

2. **Run Database Migrations:**
   ```bash
   # After deployment, run migrations
   docker-compose -f docker/docker-compose.yml exec app npx prisma migrate deploy
   ```

### Step 3: SSL Certificate Configuration
1. **Let's Encrypt (Recommended):**
   ```bash
   # Install Certbot
   sudo apt install certbot
   
   # Get certificate
   sudo certbot certonly --standalone -d your-domain.com
   
   # Copy certificates
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/key.pem
   ```

2. **Manual Certificate:**
   - Place your certificate files in `docker/nginx/ssl/`
   - Ensure proper permissions: `chmod 600 docker/nginx/ssl/*.pem`

### Step 4: Application Deployment
1. **Deploy Services:**
   ```bash
   # Start all services
   docker-compose -f docker/docker-compose.yml up -d
   
   # Check service status
   docker-compose -f docker/docker-compose.yml ps
   ```

2. **Verify Health:**
   ```bash
   # Check application health
   curl http://localhost/api/health
   
   # Check database connectivity
   docker-compose -f docker/docker-compose.yml exec app npx prisma db push
   ```

### Step 5: Domain Configuration
1. **DNS Setup:**
   - Point your domain to the server IP
   - Configure A record: `your-domain.com -> SERVER_IP`
   - Configure CNAME: `www.your-domain.com -> your-domain.com`

2. **Nginx Configuration:**
   - Update `docker/nginx/nginx.conf` with your domain
   - Replace `server_name _;` with `server_name your-domain.com;`

## 🔧 Maintenance and Operations

### Daily Operations
```bash
# Check service status
docker-compose -f docker/docker-compose.yml ps

# View application logs
docker-compose -f docker/docker-compose.yml logs app

# View database logs
docker-compose -f docker/docker-compose.yml logs mysql

# Check disk usage
docker system df
```

### Backup Procedures
```bash
# Database backup
docker-compose -f docker/docker-compose.yml exec mysql mysqldump -u root -p oalass_production > backup-$(date +%Y%m%d).sql

# Application files backup
docker-compose -f docker/docker-compose.yml exec app tar -czf - /app/uploads /app/logs > app-backup-$(date +%Y%m%d).tar.gz
```

### Updates and Rollbacks
```bash
# Update application
git pull origin main
./scripts/deploy.sh

# Rollback if needed
./scripts/rollback.sh
```

### Monitoring
```bash
# Check health endpoints
curl https://your-domain.com/api/health

# Monitor resource usage
docker stats

# Check logs for errors
docker-compose -f docker/docker-compose.yml logs --tail=100
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check logs
docker-compose -f docker/docker-compose.yml logs app

# Common fixes
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up -d
```

#### 2. Database Connection Issues
```bash
# Check database status
docker-compose -f docker/docker-compose.yml logs mysql

# Test connection
docker-compose -f docker/docker-compose.yml exec app npx prisma db push
```

#### 3. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in docker/nginx/ssl/cert.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
```

#### 4. Performance Issues
```bash
# Check resource usage
docker stats

# Scale PM2 instances
# Edit ecosystem.config.js and restart
docker-compose -f docker/docker-compose.yml restart pm2
```

### Emergency Procedures

#### 1. Quick Rollback
```bash
# Emergency rollback
./scripts/rollback.sh

# Or manual rollback
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up -d
```

#### 2. Database Recovery
```bash
# Restore from backup
docker-compose -f docker/docker-compose.yml exec mysql mysql -u root -p oalass_production < backup-file.sql
```

#### 3. Service Restart
```bash
# Restart all services
docker-compose -f docker/docker-compose.yml restart

# Restart specific service
docker-compose -f docker/docker-compose.yml restart app
```

## 📊 Monitoring and Alerts

### Health Check Endpoints
- **Application Health:** `https://your-domain.com/api/health`
- **Database Health:** Included in application health check
- **System Metrics:** Available through monitoring API

### Key Metrics to Monitor
- **Response Time:** < 2 seconds for API calls
- **Memory Usage:** < 80% of allocated memory
- **CPU Usage:** < 70% average
- **Disk Space:** > 20% free space
- **Database Connections:** < 80% of max connections

### Alerting Setup
Configure alerts for:
- Health check failures
- High memory usage
- Database connection errors
- SSL certificate expiration
- Disk space warnings

## 🔒 Security Checklist

### ✅ Pre-Deployment Security
- [ ] Strong database passwords
- [ ] Secure environment variables
- [ ] Valid SSL certificates
- [ ] Firewall configuration
- [ ] Non-root user setup

### ✅ Post-Deployment Security
- [ ] Security headers working
- [ ] Rate limiting active
- [ ] SSL/TLS encryption
- [ ] Database access restricted
- [ ] File upload security

### ✅ Ongoing Security
- [ ] Regular security updates
- [ ] SSL certificate renewal
- [ ] Log monitoring
- [ ] Access control review
- [ ] Backup verification

## 📞 Support and Documentation

### Documentation Files
- `docs/deployment-architecture.md` - Architecture design
- `docs/deployment-test-report.md` - Test results
- `docs/deployment-coordination-summary.md` - Team deliverables

### Support Contacts
- **Technical Issues:** Check logs and documentation first
- **Architecture Questions:** Reference deployment architecture
- **Testing Issues:** Review test reports and procedures

### Emergency Contacts
- **Critical Issues:** Use rollback procedures immediately
- **Data Loss:** Restore from latest backup
- **Security Issues:** Review security checklist and logs

---

**Deployment Guide Generated By:** John (Product Manager)  
**Date:** 2025-01-27  
**Version:** 1.0  
**Status:** ✅ READY FOR PRODUCTION
