# 🚀 OALASS Hostinger VPS Quick Start

## ⚡ Quick Deployment Steps

### 1. Connect to Your Hostinger VPS
```bash
ssh root@your-vps-ip
```

### 2. Install Docker (if not already installed)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 3. Clone and Deploy OALASS
```bash
# Clone repository
git clone https://github.com/your-username/oalass.git
cd oalass

# Copy environment file
cp config/env.example config/production.env

# Edit environment variables
nano config/production.env
```

### 4. Configure Your Domain
```bash
# Get SSL certificate
certbot certonly --standalone -d your-domain.com

# Copy certificates
mkdir -p docker/nginx/ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/key.pem
```

### 5. Deploy OALASS
```bash
# Make script executable
chmod +x scripts/deploy-hostinger.sh

# Deploy application
./scripts/deploy-hostinger.sh
```

## 🔧 Essential Configuration

### Environment Variables (config/production.env)
```env
# Replace with your actual values
NEXTAUTH_URL=https://your-domain.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_SERVER_USER=your-email@your-domain.com
EMAIL_SERVER_PASSWORD=your_email_password
```

### Hostinger DNS Settings
```
Type: A     Name: @           Value: YOUR_VPS_IP
Type: A     Name: www         Value: YOUR_VPS_IP
```

## 🎯 Post-Deployment Checklist

- [ ] Application loads at https://your-domain.com
- [ ] Health check works: https://your-domain.com/api/health
- [ ] Google OAuth login works
- [ ] Email notifications work
- [ ] All user roles can access the system

## 🚨 Quick Troubleshooting

### Application Won't Start
```bash
# Check logs
docker-compose -f docker/docker-compose.yml logs app

# Restart services
docker-compose -f docker/docker-compose.yml restart
```

### SSL Issues
```bash
# Check certificate
certbot certificates

# Renew certificate
certbot renew
```

### Database Issues
```bash
# Check database logs
docker-compose -f docker/docker-compose.yml logs mysql

# Test connection
docker-compose -f docker/docker-compose.yml exec app npx prisma db push
```

## 📞 Support

- **Full Guide:** `docs/HOSTINGER_VPS_DEPLOYMENT.md`
- **General Guide:** `docs/PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Architecture:** `docs/deployment-architecture.md`

---

**Ready to deploy on Hostinger VPS!** 🎉
