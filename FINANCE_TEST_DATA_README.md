# 🧪 Finance Report Test Data

This document describes the comprehensive test data created for testing the Finance Reporting System.

## 🚀 Quick Start

### Option 1: Windows Batch File
```bash
seed-finance-data.bat
```

### Option 2: PowerShell Script
```powershell
.\seed-finance-data.ps1
```

### Option 3: Manual Execution
```bash
npm run db:seed:finance
```

## 📊 Test Data Overview

### 🏢 Organizations Structure
- **5 Departments**: Computer Science, Mathematics, Physics, Finance Office, Human Resources
- **3 Role Categories**: Teaching Staff, Non Teaching Staff, Finance
- **4 Roles**: Teacher/Instructor, Department Head, Finance Officer, Non Teaching Personnel
- **2 Statuses**: Regular, Probation
- **3 Term Types**: First Semester, Second Semester, Summer
- **2 Calendar Periods**: Current academic year with realistic dates

### 👥 Test Users (All passwords: `password123`)

#### Finance Department
- **finance.officer@ckcm.edu** - Finance Officer (Sarah Johnson)
- **finance.head@ckcm.edu** - Finance Officer (Michael Chen)

#### Teaching Staff
- **john.doe@ckcm.edu** - Computer Science Teacher (John Doe)
- **jane.smith@ckcm.edu** - Mathematics Teacher (Jane Smith)
- **robert.wilson@ckcm.edu** - Physics Teacher (Robert Wilson) - *Probationary*

#### Department Heads
- **cs.head@ckcm.edu** - Computer Science Department Head (Dr. Alice Brown)
- **math.head@ckcm.edu** - Mathematics Department Head (Dr. David Lee)

#### Administrative Staff
- **admin.staff@ckcm.edu** - Human Resources Staff (Lisa Garcia)

### 🏖️ Leave Types
- **Sick Leave** - Medical leave for illness
- **Vacation Leave** - Personal vacation time
- **Emergency Leave** - Emergency personal leave (exempt from date restrictions)
- **Maternity Leave** - Maternity leave for new mothers
- **Study Leave** - Leave for academic study

### 📝 Test Applications

#### Leave Applications (48 total)
- **Time Span**: 6 months of historical data
- **Applications per Month**: 8 applications
- **Status Distribution**: Mix of PENDING, DEAN_APPROVED, APPROVED, DENIED
- **Realistic Patterns**: Applications submitted 1-10 days before leave dates
- **Review Times**: 1-5 days processing time for reviewed applications

#### Travel Orders (12 total)
- **Time Span**: 4 months of historical data
- **Orders per Month**: 3 travel orders
- **Destinations**: Manila, Cebu, Davao, Singapore, Hong Kong, Tokyo, Seoul
- **Purposes**: Academic Conference, Research Collaboration, Training Workshop, etc.
- **Cost Structure**: Realistic transportation, seminar, and accommodation fees

### 💰 Financial Data
- **Transportation Fees**: ₱1,000 - ₱6,000
- **Seminar/Conference Fees**: ₱2,000 - ₱12,000
- **Meals & Accommodations**: ₱1,500 - ₱9,500
- **Total Travel Costs**: ₱4,500 - ₱27,500 per travel order

## 🧪 Testing Scenarios

### 1. Basic Report Generation
- Login as `finance.officer@ckcm.edu`
- Navigate to Finance Reports
- Generate Summary Report
- Verify data accuracy and formatting

### 2. Advanced Filtering
- Test date range filtering (last 3 months)
- Filter by department (Computer Science)
- Filter by leave type (Sick Leave)
- Filter by status (Approved only)
- Combine multiple filters

### 3. Export Functionality
- Generate CSV export
- Generate PDF export
- Verify export formatting and data completeness
- Test filtered exports

### 4. Analytics Testing
- Check approval rate calculations
- Verify month-over-month changes
- Test department analysis
- Validate leave type patterns

### 5. Role-Based Access
- Test Finance Officer access
- Test Finance Head access
- Verify data visibility restrictions
- Test unauthorized access prevention

## 📈 Expected Report Results

### Summary Statistics
- **Total Applications**: ~60 (48 leave + 12 travel)
- **Approval Rate**: ~60-70% (realistic mix)
- **Most Active Department**: Varies based on random generation
- **Peak Application Month**: Recent months should show higher activity

### Department Analysis
- **Computer Science**: ~20-25 applications
- **Mathematics**: ~15-20 applications
- **Physics**: ~10-15 applications
- **Finance Office**: ~5-10 applications
- **Human Resources**: ~5-10 applications

### Leave Type Distribution
- **Sick Leave**: ~25-30% of applications
- **Vacation Leave**: ~20-25% of applications
- **Emergency Leave**: ~15-20% of applications
- **Maternity Leave**: ~10-15% of applications
- **Study Leave**: ~10-15% of applications

## 🔧 Database Schema Impact

The seeder creates data in the following tables:
- `departments` - 5 new departments
- `role_categories` - 3 role categories
- `roles` - 4 roles
- `statuses` - 2 statuses
- `term_types` - 3 term types
- `calendar_periods` - 2 calendar periods
- `leave_types` - 5 leave types
- `users` - 8 test users
- `leave_applications` - 48 applications
- `travel_orders` - 12 travel orders
- `leave_balances` - Multiple balance records
- `leave_limits` - Multiple limit records

## 🚨 Important Notes

1. **Password Security**: All test accounts use `password123` - change in production
2. **Data Cleanup**: Run `npm run db:reset` to clear all data if needed
3. **Realistic Patterns**: Data follows realistic application patterns and approval workflows
4. **Cost Accuracy**: Travel order costs are realistic for Philippine context
5. **Date Ranges**: All dates are relative to current date for testing relevance

## 🎯 Testing Checklist

- [ ] Login with finance accounts
- [ ] Generate all report types
- [ ] Test all filter combinations
- [ ] Export CSV and PDF formats
- [ ] Verify data accuracy
- [ ] Test role-based access
- [ ] Validate analytics calculations
- [ ] Check responsive design
- [ ] Test error handling
- [ ] Verify audit logging

## 🆘 Troubleshooting

### Common Issues
1. **Database Connection**: Ensure DATABASE_URL is set in .env
2. **Prisma Client**: Run `npm run db:generate` if schema changes
3. **Permission Errors**: Run as administrator on Windows
4. **Memory Issues**: Large datasets may require more memory

### Reset Data
```bash
npm run db:reset
npm run db:seed:finance
```

This comprehensive test data will allow you to thoroughly test all aspects of the Finance Reporting System! 🎉
