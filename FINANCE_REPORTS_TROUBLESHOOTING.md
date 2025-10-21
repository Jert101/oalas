# 🔧 Finance Reports Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Report didn't work" - Authentication Required**

**Problem**: You're not logged in with a finance account.

**Solution**:
1. **Login with Finance Account**:
   - Go to: `http://localhost:3000/login`
   - Email: `finance.officer@ckcm.edu`
   - Password: `password123`

2. **Verify Role Access**:
   - After login, check your role in the user profile
   - Finance accounts should have role: "Finance Officer" or "Finance Department"

### **Issue 2: "No data showing" - Database Issues**

**Problem**: Test data not properly seeded.

**Solution**:
```bash
# Re-run the seeder
npm run db:seed:finance

# Or reset and re-seed
npm run db:reset
npm run db:seed:finance
```

### **Issue 3: "API Error 500" - Server Issues**

**Problem**: Server or database connection issues.

**Solution**:
```bash
# Check if server is running
npm run dev

# Check database connection
npm run db:push

# Check Prisma client
npm run db:generate
```

### **Issue 4: "Page not loading" - Route Issues**

**Problem**: Finance reports page not accessible.

**Solution**:
1. **Check URL**: `http://localhost:3000/finance/reports`
2. **Check Authentication**: Must be logged in
3. **Check Role**: Must have finance role

## 🧪 **Step-by-Step Testing Guide**

### **Step 1: Verify Server is Running**
```bash
# Start development server
npm run dev

# Should see: "Ready - started server on 0.0.0.0:3000"
```

### **Step 2: Login with Finance Account**
1. Go to: `http://localhost:3000/login`
2. Email: `finance.officer@ckcm.edu`
3. Password: `password123`
4. Click "Sign In"

### **Step 3: Navigate to Finance Reports**
1. Go to: `http://localhost:3000/finance/reports`
2. You should see the Finance Reports dashboard
3. If you get redirected to login, the authentication isn't working

### **Step 4: Test Report Generation**
1. Click "Generate Summary" button
2. Wait for the report to load
3. Check if data appears in the "Report Results" section

### **Step 5: Test Filtering**
1. Click "Show Filters" button
2. Set a date range (e.g., last 3 months)
3. Select a department
4. Click "Generate Report"

### **Step 6: Test Export**
1. Generate a report first
2. Click "Export CSV" or "Export PDF"
3. Check if file downloads

## 🔍 **Debugging Steps**

### **Check 1: Browser Console**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for any JavaScript errors
4. Check Network tab for failed requests

### **Check 2: Server Logs**
1. Look at terminal where `npm run dev` is running
2. Check for error messages
3. Look for database connection issues

### **Check 3: Database Connection**
```bash
# Test database connection
npm run db:push

# Should see: "Your database is now in sync"
```

### **Check 4: Authentication**
1. Check if you're logged in: Look for user menu in top-right
2. Check user role: Should be "Finance Officer" or similar
3. Try logging out and back in

## 🚨 **Error Messages & Solutions**

### **"Unauthorized" Error**
- **Cause**: Not logged in or wrong role
- **Solution**: Login with finance account

### **"Internal Server Error"**
- **Cause**: Database or server issue
- **Solution**: Check server logs, restart server

### **"No data found"**
- **Cause**: No test data or wrong filters
- **Solution**: Run seeder, check date filters

### **"Page not found"**
- **Cause**: Wrong URL or route issue
- **Solution**: Use correct URL: `/finance/reports`

## 🎯 **Quick Test Checklist**

- [ ] Server running (`npm run dev`)
- [ ] Logged in with finance account
- [ ] Database seeded (`npm run db:seed:finance`)
- [ ] Can access `/finance/reports` page
- [ ] Can see report generation buttons
- [ ] Can generate a summary report
- [ ] Can see data in report results
- [ ] Can use filters
- [ ] Can export reports

## 🆘 **Still Not Working?**

If you're still having issues, please share:

1. **What exactly happens** when you try to use the reports?
2. **Any error messages** you see?
3. **What step** in the process fails?
4. **Browser console errors** (F12 → Console)
5. **Server terminal errors** (where `npm run dev` is running)

## 🎉 **Expected Behavior**

When working correctly, you should see:

1. **Finance Reports Dashboard** with 5 report type cards
2. **"Show Filters" button** that expands filter options
3. **Report generation buttons** that work when clicked
4. **Report results** showing data after generation
5. **Export buttons** (CSV/PDF) that download files
6. **Filtering options** that work properly

**The system should be fully functional with the test data we created!** 🚀
