# Manual Database Connection Fix

## 🚨 **DATABASE CONNECTION ISSUE**

The MySQL VPS database is not connected to your deployed system. Here's how to fix it:

### **Step 1: Connect to VPS**
```bash
ssh root@72.60.76.125
```

### **Step 2: Navigate to Application Directory**
```bash
cd /var/www/oalass
```

### **Step 3: Check MySQL Service**
```bash
systemctl status mysql
```
**Expected:** Should show "active (running)"

### **Step 4: Check Database Users**
```bash
mysql -u root -e "SELECT User, Host FROM mysql.user WHERE User LIKE '%oalass%';"
```
**Expected:** Should show oalass_app and oalass_user

### **Step 5: Check Database Exists**
```bash
mysql -u root -e "SHOW DATABASES LIKE 'oalass';"
```
**Expected:** Should show the oalass database

### **Step 6: Fix Database User Credentials**
```bash
mysql -u root -e "ALTER USER 'oalass_app'@'localhost' IDENTIFIED BY 'Kf6iQLW2Ci5fPQzcOBh1';"
mysql -u root -e "GRANT ALL PRIVILEGES ON oalass.* TO 'oalass_app'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"
```

### **Step 7: Test Database Connection**
```bash
mysql -u oalass_app -pKf6iQLW2Ci5fPQzcOBh1 -h 127.0.0.1 -P 3306 -e "USE oalass; SHOW TABLES;"
```
**Expected:** Should show all your database tables

### **Step 8: Test Prisma Connection**
```bash
npx prisma db pull --force
```
**Expected:** Should sync the database schema

### **Step 9: Regenerate Prisma Client**
```bash
npm run db:generate
```
**Expected:** Should generate Prisma client successfully

### **Step 10: Restart Application**
```bash
pm2 restart oalass
```

### **Step 11: Check Application Status**
```bash
pm2 status
```
**Expected:** Should show oalass as "online"

### **Step 12: Test Application**
```bash
curl -I http://127.0.0.1:3000
```
**Expected:** Should return HTTP 200 OK

## 🔍 **Alternative Database Configuration**

If the above doesn't work, try using the `oalass_user` instead:

### **Update Environment File**
```bash
# Edit the .env file
nano .env

# Change the DATABASE_URL to:
DATABASE_URL=mysql://oalass_user:YOUR_PASSWORD@127.0.0.1:3306/oalass
```

### **Or Create New Database User**
```bash
mysql -u root -e "CREATE USER 'oalass_new'@'localhost' IDENTIFIED BY 'NewPassword123!';"
mysql -u root -e "GRANT ALL PRIVILEGES ON oalass.* TO 'oalass_new'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"
```

## 🚨 **Common Issues and Solutions**

### **Issue 1: Access Denied**
**Solution:** Reset the user password and grant privileges
```bash
mysql -u root -e "ALTER USER 'oalass_app'@'localhost' IDENTIFIED BY 'Kf6iQLW2Ci5fPQzcOBh1';"
mysql -u root -e "GRANT ALL PRIVILEGES ON oalass.* TO 'oalass_app'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"
```

### **Issue 2: Database Not Found**
**Solution:** Create the database
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS oalass;"
```

### **Issue 3: Tables Missing**
**Solution:** Run Prisma migrations
```bash
npx prisma migrate deploy
```

### **Issue 4: Connection Timeout**
**Solution:** Check MySQL configuration
```bash
# Check MySQL is listening on correct port
netstat -tlnp | grep :3306

# Check MySQL configuration
cat /etc/mysql/mysql.conf.d/mysqld.cnf | grep bind-address
```

## 📊 **Verification Steps**

After fixing the database connection:

1. **Test Database Connection:**
   ```bash
   mysql -u oalass_app -pKf6iQLW2Ci5fPQzcOBh1 -e "USE oalass; SELECT COUNT(*) FROM users;"
   ```

2. **Test Application API:**
   ```bash
   curl http://127.0.0.1:3000/api/health
   ```

3. **Check Application Logs:**
   ```bash
   pm2 logs oalass --lines 20
   ```

4. **Test External Access:**
   Visit: https://ckcm-oala.site

## 🎯 **Expected Results**

After successful database connection fix:
- ✅ MySQL service running
- ✅ Database user authenticated
- ✅ Prisma client generated
- ✅ Application connected to database
- ✅ All features working on deployed site

## 📞 **If Issues Persist**

If the database connection still doesn't work:

1. **Check MySQL Error Logs:**
   ```bash
   tail -f /var/log/mysql/error.log
   ```

2. **Check Application Error Logs:**
   ```bash
   pm2 logs oalass --err --lines 50
   ```

3. **Verify Environment Variables:**
   ```bash
   cat .env | grep DATABASE_URL
   ```

4. **Test with Different User:**
   Try using `oalass_user` or create a new user with proper permissions.

The database connection is essential for your application to function properly. Follow these steps to ensure your deployed system can connect to the MySQL VPS database.

