# Dynamic Leave Balance System Implementation

## Overview
I have implemented a comprehensive dynamic leave balance system that addresses all your requirements:

## ✅ Implemented Features

### 1. Academic Year Matches Admin-Set Period
- **API Endpoint**: `/api/calendar-period/current`
- **Functionality**: Retrieves the current calendar period set by admin
- **Integration**: Teacher leave application automatically fetches and displays current academic year

### 2. Leave Limits Based on User Status & Calendar Period
- **Database Model**: Added `LeaveBalance` model to Prisma schema
- **API Endpoint**: `/api/leave-balance`
- **Functionality**: 
  - Dynamically calculates leave balances based on user's status (Regular, Probation, etc.)
  - Considers current calendar period (Academic vs Summer term)
  - Automatically creates initial balances from `LeaveLimit` settings
  - Tracks used vs remaining days

### 3. Automatic Reset on Calendar Period Change
- **Implementation**: When admin changes current calendar period via `/api/admin/calendar-periods/[id]/set-current`
- **Functionality**: New leave balances are automatically created for the new period based on current leave limits

## 🗄️ Database Schema Changes

### New LeaveBalance Model
```prisma
model LeaveBalance {
  leave_balance_id      Int              @id @default(autoincrement())
  users_id              String           // Foreign key to users table
  calendar_period_id    Int              // Foreign key to calendar periods table
  status_id             Int              // Foreign key to Status table
  termType              TermType         // ACADEMIC or SUMMER
  leaveType             LeaveType        // VACATION, SICK, etc.
  allowedDays           Int              // Days allowed for this period
  usedDays              Int              @default(0)
  remainingDays         Int              // Calculated field
  lastCalculated        DateTime         @default(now())
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
  
  // Relations
  user                  User
  calendarPeriod        CalendarPeriod
  status                Status
  
  @@unique([users_id, calendar_period_id, termType, leaveType])
}
```

### Updated Relations
- Added `leaveBalances` relation to `User`, `CalendarPeriod`, and `Status` models

## 🔧 API Endpoints

### 1. Get Current Calendar Period
- **Endpoint**: `GET /api/calendar-period/current`
- **Purpose**: Returns the currently active calendar period set by admin
- **Response**: Calendar period with `academicYear`, `term`, `startDate`, `endDate`

### 2. Get Leave Balances
- **Endpoint**: `GET /api/leave-balance?leaveType=VACATION`
- **Purpose**: Returns user's leave balances for current period
- **Features**:
  - Automatically creates balances if none exist for current period
  - Calculates used days from approved leave applications
  - Updates remaining days in real-time
  - Filters by specific leave type if requested

## 🎯 Frontend Integration

### Teacher Apply Leave Page Updates
1. **Dynamic Balance Fetching**: `fetchLeaveBalance()` function calls real API
2. **Status-Based Display**: Shows leave limits based on user's employment status
3. **Period-Aware**: Displays current academic year and term
4. **Real-Time Calculations**: Shows actual remaining leave days

### Updated Interface
```typescript
interface LeaveBalance {
  leave_balance_id: number;
  allowedDays: number;
  usedDays: number;
  remainingDays: number;
  leaveType: string;
  termType: string;
  calendarPeriod: {
    academicYear: string;
    term: string;
  };
  status: {
    name: string;
  };
}
```

## 🔄 How It Works

### 1. User Selects Leave Type
1. Teacher clicks on leave type (Vacation, Sick, etc.)
2. System calls `fetchLeaveBalance(leaveTypeId)`
3. API fetches current calendar period
4. API gets user's status and corresponding leave limits
5. API calculates or retrieves existing leave balance
6. Modal displays current balance information

### 2. Dynamic Balance Calculation
1. System checks for existing `LeaveBalance` records for current period
2. If none exist, creates new balances based on `LeaveLimit` settings
3. Calculates used days from approved `LeaveApplication` records
4. Updates `remainingDays` = `allowedDays` - `usedDays`

### 3. Period Change Handling
1. When admin sets new current calendar period
2. Next time user accesses leave balance, system detects new period
3. Creates fresh leave balances based on updated leave limits
4. Previous period balances remain for historical tracking

## 🏗️ Migration Applied
- **Migration**: `20250811022842_add_leave_balance_model`
- **Status**: Successfully applied to database
- **Tables Added**: `leave_balances` with all required fields and relations

## 🧪 Testing
- Server starts successfully on `http://localhost:3001`
- Leave balance API endpoints are functional
- Teacher apply leave page integrates with new dynamic system
- No compilation errors in TypeScript

## 📋 Next Steps for Full Implementation
1. **Admin Interface**: Add UI for admins to manage calendar periods easily
2. **Leave Limit Management**: Enhance admin interface to set different limits for different statuses
3. **Bulk Balance Reset**: Add admin function to reset all user balances when changing periods
4. **Audit Trail**: Track balance changes and calculations for transparency
5. **Email Notifications**: Notify users when leave balances are reset or updated

## 🎉 Summary
The system now provides:
- ✅ **Dynamic leave balances** based on user status and calendar period
- ✅ **Admin-controlled academic year** matching
- ✅ **Automatic reset** when calendar periods change
- ✅ **Real-time calculation** of used vs remaining days
- ✅ **Status-aware limits** (probation vs regular employees)
- ✅ **Term-specific balances** (Academic vs Summer)

The leave application process is now fully dynamic and reflects the actual leave policies as configured by administrators.
