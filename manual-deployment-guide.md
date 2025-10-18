# Manual Deployment Guide for OALASS

## Issue Identified
The automated deployment script ran successfully, but the changes may not be reflecting due to:
1. Browser caching
2. CDN/Proxy caching
3. Application not fully restarting
4. Build cache issues

## Manual Deployment Steps

### Step 1: Connect to VPS
```bash
ssh root@72.60.76.125
```

### Step 2: Navigate to Project Directory
```bash
cd /var/www/oalass
```

### Step 3: Check Current Status
```bash
git status
git log --oneline -1
pm2 status
```

### Step 4: Force Pull Latest Changes
```bash
git fetch origin
git reset --hard origin/main
```

### Step 5: Clear All Caches
```bash
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force
```

### Step 6: Reinstall Dependencies
```bash
npm install
npm run db:generate
```

### Step 7: Build Application
```bash
npm run build
```

### Step 8: Restart Application
```bash
pm2 stop oalass
pm2 start npm --name "oalass" -- start
```

### Step 9: Check Application Status
```bash
pm2 status
pm2 logs oalass --lines 10
```

### Step 10: Test Application
```bash
curl -I http://localhost:3000
```

## Alternative: Complete Fresh Deployment

If the above doesn't work, try a complete fresh deployment:

### Step 1: Backup Environment File
```bash
cp .env .env.backup
```

### Step 2: Remove and Reclone Repository
```bash
cd /var/www
rm -rf oalass
git clone https://github.com/Jert101/oalas.git oalass
cd oalass
```

### Step 3: Restore Environment
```bash
cp ../oalass.backup/.env .env
```

### Step 4: Install and Build
```bash
npm install
npm run db:generate
npm run build
```

### Step 5: Start with PM2
```bash
pm2 start npm --name "oalass" -- start
pm2 save
pm2 startup
```

## Verification Steps

1. **Check if changes are deployed:**
   ```bash
   grep -n "roleCategory" src/app/admin/manage-accounts/page.tsx
   grep -n "getCountdown" src/app/admin/manage-probation/page.tsx
   ```

2. **Test API endpoints:**
   ```bash
   curl http://localhost:3000/api/admin/role-categories
   ```

3. **Check application logs:**
   ```bash
   pm2 logs oalass --lines 20
   ```

## Browser Cache Clearing

If the application is running but changes aren't visible:

1. **Hard Refresh:** Ctrl+F5 or Cmd+Shift+R
2. **Clear Browser Cache:** Clear all cached data
3. **Incognito/Private Mode:** Test in private browsing
4. **Different Browser:** Test in a different browser

## Expected Results

After successful deployment, you should see:

1. **Manage Accounts Page:** Role category dropdown working
2. **Probation Management:** CRUD operations and countdown
3. **Edit User Modal:** No display name field, role categories working

## Troubleshooting

If issues persist:

1. Check PM2 logs: `pm2 logs oalass`
2. Check system resources: `htop`
3. Check disk space: `df -h`
4. Check memory usage: `free -h`
5. Restart the entire server if needed: `reboot`
