# Complete System Redeployment Guide

## 🚀 **COMPLETE SYSTEM REDEPLOYMENT**

Since the automated deployment is having issues, here's a step-by-step manual guide to completely redeploy your system with the proper process.

### **Step 1: Connect to VPS**
```bash
ssh root@72.60.76.125
```

### **Step 2: Backup Current System**
```bash
cd /var/www
cp -r oalass oalass-backup
echo "Backup completed"
```

### **Step 3: Stop Current Application**
```bash
pm2 stop oalass
pm2 delete oalass
echo "Application stopped"
```

### **Step 4: Remove Old Deployment**
```bash
rm -rf /var/www/oalass
echo "Old deployment removed"
```

### **Step 5: Fresh Clone from GitHub**
```bash
cd /var/www
git clone https://github.com/Jert101/oalas.git oalass
cd oalass
echo "Repository cloned"
```

### **Step 6: Verify Latest Commit**
```bash
git log --oneline -1
echo "Should show: 126f35e feat: Complete probation management and edit user modal enhancements"
```

### **Step 7: Restore Environment File**
```bash
cp ../oalass-backup/.env .env
echo "Environment file restored"
```

### **Step 8: Install Dependencies**
```bash
npm install
echo "Dependencies installed"
```

### **Step 9: Generate Prisma Client**
```bash
npm run db:generate
echo "Prisma client generated"
```

### **Step 10: Build Application**
```bash
npm run build
echo "Application built"
```

### **Step 11: Start with PM2**
```bash
pm2 start npm --name "oalass" -- start
pm2 save
echo "Application started with PM2"
```

### **Step 12: Check Status**
```bash
pm2 status
echo "Should show oalass as online"
```

### **Step 13: Verify Changes**
```bash
grep -n "roleCategory" src/app/admin/manage-accounts/page.tsx | head -2
grep -n "getCountdown" src/app/admin/manage-probation/page.tsx | head -2
echo "Should show our changes are present"
```

### **Step 14: Test Application**
```bash
curl -I http://127.0.0.1:3000
echo "Should return HTTP 200 OK"
```

### **Step 15: Test External Access**
```bash
curl -I https://ckcm-oala.site
echo "Should return HTTP 200 OK"
```

## 🎯 **Expected Results**

After completing all steps:

✅ **Repository:** Fresh clone from GitHub  
✅ **Commit:** `126f35e` (latest with all changes)  
✅ **Dependencies:** All installed  
✅ **Build:** Successful  
✅ **Application:** Running on PM2  
✅ **Features:** All new features deployed  

## 🔍 **Verification Checklist**

- [ ] Latest commit `126f35e` is deployed
- [ ] `roleCategory` found in manage-accounts page
- [ ] `getCountdown` found in manage-probation page
- [ ] PM2 shows application as online
- [ ] Application responds to HTTP requests
- [ ] External domain is accessible

## 🌐 **Test Your Application**

Visit: **https://ckcm-oala.site**

### **New Features to Test:**

1. **Manage Accounts Page:**
   - Edit user modal should have role category dropdown
   - No display name field
   - Office head question for non-teaching staff

2. **Probation Management:**
   - CRUD operations (Edit/Delete buttons)
   - Real-time countdown functionality
   - Enhanced UI with action buttons

## 🚨 **If Issues Persist**

1. **Check PM2 logs:**
   ```bash
   pm2 logs oalass
   ```

2. **Check application logs:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. **Restart nginx:**
   ```bash
   systemctl restart nginx
   ```

4. **Check disk space:**
   ```bash
   df -h
   ```

5. **Check memory usage:**
   ```bash
   free -h
   ```

## 📞 **Support**

If you encounter any issues during the manual deployment, please share:
1. The exact error message
2. Which step failed
3. The output of `pm2 status`
4. The output of `pm2 logs oalass`

This manual deployment ensures a completely fresh start with the proper deployment process: **Local → GitHub → VPS**.

