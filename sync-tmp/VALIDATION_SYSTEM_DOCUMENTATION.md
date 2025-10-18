# Validation System Documentation

## Overview
The OALASS system now includes comprehensive validation to prevent users from submitting multiple applications and to avoid date conflicts with approved applications.

## Features Implemented

### 1. Pending Application Block
- **Purpose**: Prevent users from having multiple pending applications
- **Scope**: Applies to both leave applications and travel orders
- **Behavior**: If a user has any pending application, they cannot submit new ones

### 2. Date Conflict Prevention
- **Purpose**: Prevent overlapping approved applications
- **Scope**: Checks both leave applications and travel orders
- **Logic**: Detects any approved application that overlaps with the requested dates

### 3. Real-time Validation
- **Purpose**: Provide immediate feedback during form filling
- **Features**: 
  - Live date validation as users select dates
  - Visual indicators for validation status
  - Disabled submit buttons when validation fails

## Technical Implementation

### Backend Components

#### 1. Validation Service (`src/lib/validation-service.ts`)
```typescript
// Check for pending applications
checkPendingApplications(userId: string): Promise<ValidationResult>

// Check for date conflicts
checkDateConflicts(userId: string, startDate: Date, endDate: Date): Promise<ValidationResult>

// Comprehensive validation
validateNewApplication(userId: string, startDate: Date, endDate: Date): Promise<ValidationResult>
```

#### 2. API Endpoints
- **GET** `/api/teacher/validation` - Check validation status
- **POST** `/api/teacher/leave/apply` - Leave application with validation
- **POST** `/api/teacher/travel-order` - Travel order with validation

#### 3. Database Queries
The system uses Prisma ORM to query:
- `LeaveApplication` table for pending and approved applications
- `TravelOrder` table for pending and approved travel orders
- Complex date overlap detection using OR conditions

### Frontend Components

#### 1. Validation Status Component (`src/components/validation-status.tsx`)
- Shows current validation status on the main leave page
- Displays pending applications and conflicts
- Provides clear feedback on why applications are blocked

#### 2. Date Validation Component (`src/components/date-validation.tsx`)
- Real-time validation during form filling
- Shows conflicts with approved applications
- Updates submit button state

#### 3. Updated Forms
- **Leave Application Form**: Includes date validation
- **Travel Order Form**: Includes date validation
- **Main Leave Page**: Shows validation status

## User Experience

### 1. Main Leave Page (`/teacher/leave`)
- **Green Status**: User can apply for new applications
- **Red Status**: User cannot apply (shows reasons)
- **Disabled Button**: Apply button is disabled when validation fails

### 2. Application Forms
- **Real-time Feedback**: Date validation appears as user selects dates
- **Visual Indicators**: Green/red alerts for validation status
- **Disabled Submit**: Submit button disabled when validation fails
- **Clear Messages**: Specific reasons for validation failures

### 3. Error Handling
- **Toast Notifications**: Success/error messages
- **Detailed Feedback**: Specific validation error messages
- **Graceful Degradation**: System works even if validation fails

## Validation Rules

### 1. Pending Application Rules
```typescript
// User cannot have any pending applications
const hasPendingApplications = pendingLeaveApplications.length > 0 || pendingTravelOrders.length > 0
```

### 2. Date Conflict Rules
```typescript
// Check for overlapping approved applications
const overlappingConditions = [
  // New application starts during existing approved application
  { startDate: { lte: newStartDate }, endDate: { gte: newStartDate } },
  // New application ends during existing approved application
  { startDate: { lte: newEndDate }, endDate: { gte: newEndDate } },
  // New application completely contains existing approved application
  { startDate: { gte: newStartDate }, endDate: { lte: newEndDate } }
]
```

### 3. Application Types Covered
- **Leave Applications**: All types (Vacation, Sick, Maternity, Paternity, Emergency)
- **Travel Orders**: All travel order requests
- **Status Check**: Only checks PENDING and APPROVED applications

## Testing

### 1. Manual Testing
1. Create a pending application
2. Try to create another application (should be blocked)
3. Approve the first application
4. Try to create overlapping application (should be blocked)
5. Try to create non-overlapping application (should succeed)

### 2. Automated Testing
Run the test script:
```bash
node test-validation-system.js
```

### 3. API Testing
Test the validation endpoint:
```bash
curl http://localhost:3000/api/teacher/validation
```

## Configuration

### 1. Environment Variables
No additional environment variables required.

### 2. Database Requirements
- Existing `LeaveApplication` table
- Existing `TravelOrder` table
- Proper indexes on date fields for performance

### 3. Dependencies
- Prisma ORM (already included)
- React Hook Form (already included)
- Zod validation (already included)

## Performance Considerations

### 1. Database Queries
- Uses indexed fields for efficient queries
- Limits selected fields to reduce data transfer
- Uses proper date range queries

### 2. Caching
- Validation results are not cached (real-time accuracy required)
- API responses are minimal to reduce bandwidth

### 3. User Experience
- Real-time validation with debouncing
- Loading states for validation checks
- Graceful error handling

## Security

### 1. Authentication
- All validation endpoints require authentication
- User can only check their own validation status

### 2. Authorization
- Role-based access control maintained
- Teachers can only access their own data

### 3. Input Validation
- Date validation on both client and server
- SQL injection prevention via Prisma ORM

## Troubleshooting

### 1. Common Issues
- **Validation not working**: Check if WebSocket server is running
- **API errors**: Check authentication and session
- **Date conflicts not detected**: Verify date format and timezone

### 2. Debug Steps
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check database for existing applications
4. Test with different date ranges

### 3. Logs
- Server-side validation logs in console
- Client-side validation errors in browser console
- API response logs for debugging

## Future Enhancements

### 1. Potential Improvements
- Add validation for specific leave types
- Implement partial day conflicts
- Add holiday and weekend exclusions
- Create admin override capabilities

### 2. Performance Optimizations
- Add caching for validation results
- Implement batch validation for multiple users
- Add database query optimization

### 3. User Experience
- Add calendar view for conflicts
- Implement drag-and-drop date selection
- Add bulk application validation

