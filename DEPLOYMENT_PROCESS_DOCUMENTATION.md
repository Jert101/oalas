# OALAS Deployment Process Documentation

## 📋 Standard Deployment Flow

This document outlines the **mandatory process** for all future updates and deployments to ensure consistency and reliability.

## 🔄 Required Deployment Process

### 1. **Local Development & Testing**
```bash
# 1. Make changes in local system
# 2. Test changes locally
npm run dev

# 3. Test all functionality
# - Login/logout
# - Database connections
# - OAuth providers
# - All user roles and permissions
```

### 2. **Git Version Control**
```bash
# 1. Stage all changes
git add .

# 2. Commit with descriptive message
git commit -m "Description of changes made"

# 3. Push to GitHub repository
git push origin main
```

### 3. **VPS Deployment**
```bash
# 1. SSH to VPS
ssh root@72.60.76.125

# 2. Navigate to application directory
cd /var/www/oala

# 3. Pull latest changes from GitHub
git pull origin main

# 4. Update environment variables if needed
nano .env

# 5. Install any new dependencies
npm install

# 6. Build application (if needed)
npm run build

# 7. Restart application
pm2 restart oala

# 8. Verify deployment
pm2 status
curl -I https://ckcm-oala.site
```

## 🚨 **MANDATORY RULES**

### ❌ **NEVER DO:**
- Direct edits on VPS without local changes
- Skip local testing
- Deploy without git commit
- Make changes without version control

### ✅ **ALWAYS DO:**
1. **Local First**: Make all changes locally first
2. **Test Locally**: Verify functionality before deployment
3. **Git Commit**: Always commit changes with descriptive messages
4. **GitHub Push**: Push to GitHub before VPS deployment
5. **VPS Pull**: Pull from GitHub on VPS, never direct edits
6. **Verify Deployment**: Test production site after deployment

## 🔧 **Environment Management**

### Local Environment (.env)
```bash
# Database Configuration
DATABASE_URL="mysql://root@localhost:3306/oalass"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-local-secret"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Production Environment (VPS .env)
```bash
# Database Configuration
DATABASE_URL="mysql://root@localhost:3306/oalass"

# NextAuth Configuration
NEXTAUTH_URL="https://ckcm-oala.site"
NEXTAUTH_SECRET="your-production-secret"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 📝 **Deployment Checklist**

### Pre-Deployment
- [ ] All changes tested locally
- [ ] Environment variables configured
- [ ] Git commit with descriptive message
- [ ] GitHub push completed

### VPS Deployment
- [ ] SSH connection to VPS established
- [ ] Git pull from GitHub completed
- [ ] Environment variables updated (if needed)
- [ ] Dependencies installed (if needed)
- [ ] Application built (if needed)
- [ ] PM2 service restarted
- [ ] Production site verified

### Post-Deployment
- [ ] Site accessibility confirmed
- [ ] All features tested
- [ ] Database connections verified
- [ ] OAuth providers working
- [ ] Error logs checked

## 🚀 **Quick Deployment Commands**

### Full Deployment Script
```bash
#!/bin/bash
# Save as deploy.sh

echo "🚀 Starting OALAS Deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Build application
echo "🔨 Building application..."
npm run build

# 4. Restart PM2
echo "🔄 Restarting application..."
pm2 restart oala

# 5. Verify deployment
echo "✅ Verifying deployment..."
pm2 status
curl -I https://ckcm-oala.site

echo "🎉 Deployment completed!"
```

### Usage
```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## 🔍 **Troubleshooting**

### Common Issues & Solutions

#### 1. **Git Pull Conflicts**
```bash
# If conflicts occur
git stash
git pull origin main
git stash pop
# Resolve conflicts manually
```

#### 2. **PM2 Service Issues**
```bash
# Check PM2 status
pm2 status

# Restart specific service
pm2 restart oala

# View logs
pm2 logs oala

# Kill and restart
pm2 delete oala
pm2 start npm --name "oala" -- start
```

#### 3. **Environment Variable Issues**
```bash
# Check current environment
pm2 env 0

# Update environment and restart
pm2 restart oala --update-env
```

#### 4. **Database Connection Issues**
```bash
# Test database connection
mysql -u root -e "SHOW DATABASES;"

# Check application logs
pm2 logs oala --lines 50
```

## 📊 **Monitoring & Maintenance**

### Daily Checks
- [ ] Site accessibility
- [ ] PM2 service status
- [ ] Error logs review
- [ ] Database connectivity

### Weekly Maintenance
- [ ] Security updates
- [ ] Dependency updates
- [ ] Backup verification
- [ ] Performance monitoring

### Monthly Reviews
- [ ] SSL certificate status
- [ ] Google OAuth configuration
- [ ] Database optimization
- [ ] System performance analysis

## 🎯 **Success Metrics**

### Deployment Success Criteria
- ✅ Site loads without errors
- ✅ All authentication methods working
- ✅ Database connections stable
- ✅ No critical errors in logs
- ✅ All user roles functional
- ✅ OAuth providers operational

## 📚 **Documentation Updates**

This document should be updated whenever:
- New deployment procedures are added
- Environment variables change
- New services are integrated
- Troubleshooting procedures are updated

---

**Last Updated**: October 18, 2025
**Version**: 1.0.0
**Status**: Active
