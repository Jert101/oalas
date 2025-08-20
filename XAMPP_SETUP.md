# 🗄️ XAMPP MySQL Setup Instructions for TeachStack

## 📋 Prerequisites

1. **Install XAMPP** if not already installed:
   - Download from: https://www.apachefriends.org/
   - Install with MySQL component enabled

## 🚀 Setup Steps

### Step 1: Start XAMPP Services

1. Open **XAMPP Control Panel**
2. Start **Apache** service (for phpMyAdmin)
3. Start **MySQL** service
4. Verify both are running (green indicators)

### Step 2: Create Database

**Option A: Using phpMyAdmin (Recommended)**
1. Open browser and go to: `http://localhost/phpmyadmin`
2. Click on **"New"** in the left sidebar
3. Enter database name: `oalass`
4. Select collation: `utf8mb4_unicode_ci`
5. Click **"Create"**

**Option B: Using MySQL Command Line**
```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE oalass CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE oalass;

-- Exit
EXIT;
```

**Option C: Import SQL Script**
1. In phpMyAdmin, select the `oalass` database
2. Go to **"Import"** tab
3. Choose file: `database/setup.sql`
4. Click **"Import"**

### Step 3: Configure Database Connection

The connection string is already configured:
```env
DATABASE_URL="mysql://root:@localhost:3306/oalass"
```

**If you have a MySQL root password:**
```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/oalass"
```

### Step 4: Create Tables with Prisma

```bash
# Push the schema to MySQL
npm run db:push

# Create admin user
npm run db:seed
```

### Step 5: Verify Setup

```bash
# Check database connection
npx prisma db push --preview-feature

# View database in phpMyAdmin
# Go to: http://localhost/phpmyadmin
# Select 'oalass' database
# You should see the tables: users, accounts, sessions, verification_tokens
```

## 🔧 Common Issues & Solutions

### Issue: "Access denied for user 'root'"
**Solution**: Add password to connection string
```env
DATABASE_URL="mysql://root:YOUR_MYSQL_ROOT_PASSWORD@localhost:3306/oalass"
```

### Issue: "Unknown database 'oalass'"
**Solution**: Create the database first using phpMyAdmin or SQL commands above

### Issue: "Can't connect to MySQL server"
**Solution**: 
1. Ensure XAMPP MySQL service is running
2. Check port 3306 is not blocked
3. Try restarting XAMPP services

### Issue: "Table doesn't exist"
**Solution**: Run Prisma migrations
```bash
npx prisma db push
```

## 📊 Database Schema Created

After running `npm run db:push`, these tables will be created:

- **users** - User accounts with roles and authentication data
- **accounts** - OAuth provider accounts (GitHub, etc.)
- **sessions** - User session data
- **verification_tokens** - Email verification and password reset tokens

## 🎯 Test Connection

```bash
# Start the development server
npm run dev

# Try logging in with:
# Email: admin@teachstack.com
# Password: Admin123!
```

## 📱 Accessing phpMyAdmin

- **URL**: http://localhost/phpmyadmin
- **Username**: root
- **Password**: (empty by default, or your XAMPP MySQL password)

Your TeachStack system is now configured to use XAMPP MySQL! 🎉
