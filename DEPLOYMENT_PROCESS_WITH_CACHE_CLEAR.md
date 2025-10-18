# 🚀 Enhanced OALA System Deployment Process

## ⚠️ CRITICAL: Next.js Build Cache Issue

**Problem**: The deployed system was running with cached build artifacts from the previous version, even though the code was updated via git pull.

**Root Cause**: Next.js caches build artifacts in the `.next` directory, and PM2 continues running the old cached version.

## 🛠️ Complete Solution Process

### Step-by-Step Deployment Process:

1. **📥 Pull Latest Changes**
   ```bash
   ssh root@72.60.76.125 "cd /var/www/oala && git pull origin main"
   ```

2. **🛑 Stop PM2 Process**
   ```bash
   ssh root@72.60.76.125 "pm2 stop oala"
   ```

3. **🧹 Clear Build Cache (CRITICAL)**
   ```bash
   ssh root@72.60.76.125 "cd /var/www/oala && rm -rf .next"
   ```

4. **📦 Install Dependencies**
   ```bash
   ssh root@72.60.76.125 "cd /var/www/oala && npm install"
   ```

5. **🔨 Rebuild Application**
   ```bash
   ssh root@72.60.76.125 "cd /var/www/oala && npm run build"
   ```

6. **▶️ Start PM2 Process**
   ```bash
   ssh root@72.60.76.125 "pm2 start npm --name oala -- start"
   ```

7. **🔍 Verify Deployment**
   ```bash
   ssh root@72.60.76.125 "pm2 status oala"
   ```

## 📋 Available Deployment Scripts

### For Linux/macOS:
```bash
chmod +x deploy-with-cache-clear.sh
./deploy-with-cache-clear.sh
```

### For Windows (Command Prompt):
```cmd
deploy-with-cache-clear.bat
```

### For Windows (PowerShell):
```powershell
.\deploy-with-cache-clear.ps1
```

## 🎯 Why This Process is Essential

### Without Cache Clearing:
- ❌ Changes not reflected in production
- ❌ Old build artifacts continue running
- ❌ Frustrating debugging sessions
- ❌ Users see outdated functionality

### With Cache Clearing:
- ✅ All changes immediately visible
- ✅ Fresh build artifacts generated
- ✅ Reliable deployment process
- ✅ Users see latest functionality

## 🔧 Manual Deployment Commands

If you prefer to run commands manually:

```bash
# Complete deployment sequence
ssh -o StrictHostKeyChecking=no root@72.60.76.125 "cd /var/www/oala && git pull origin main && pm2 stop oala && rm -rf .next && npm install && npm run build && pm2 start npm --name oala -- start && echo '🚀 Deployment completed successfully!'"
```

## 📊 Verification Steps

After deployment, verify the changes are live:

1. **Check Application Status**:
   ```bash
   ssh root@72.60.76.125 "pm2 status oala"
   ```

2. **Test Website Accessibility**:
   ```bash
   curl -I https://ckcm-oala.site
   ```

3. **Check Specific Pages**:
   ```bash
   curl -I https://ckcm-oala.site/admin/manage-accounts
   ```

## 🚨 Troubleshooting

### If deployment fails:

1. **Check PM2 logs**:
   ```bash
   ssh root@72.60.76.125 "pm2 logs oala --lines 20"
   ```

2. **Verify build success**:
   ```bash
   ssh root@72.60.76.125 "cd /var/www/oala && ls -la .next"
   ```

3. **Check disk space**:
   ```bash
   ssh root@72.60.76.125 "df -h"
   ```

## 📝 Best Practices

1. **Always use the complete deployment process**
2. **Never skip the cache clearing step**
3. **Verify deployment after completion**
4. **Keep deployment scripts updated**
5. **Document any custom deployment requirements**

## 🔄 Future Updates

When making any changes to the system:

1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub
4. **Always use the enhanced deployment process with cache clearing**
5. Verify changes are live

---

**Remember**: The cache clearing step is CRITICAL for ensuring all changes are reflected in the deployed system!
