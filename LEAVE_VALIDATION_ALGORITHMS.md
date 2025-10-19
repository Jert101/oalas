# Leave Validation Conflict Detection, Exemption Logic, and Approval Routing Algorithms

## Overview

The OALAS system implements sophisticated algorithms for leave application validation, conflict detection, exemption handling, and multi-stage approval routing. These algorithms ensure data integrity, prevent conflicts, and maintain proper workflow management across different user roles and departments.

## 1. Leave Validation Conflict Detection Algorithm

### 1.1 Algorithm Overview

The conflict detection algorithm operates in multiple phases to ensure comprehensive validation:

```typescript
Algorithm: validateNewApplication(userId, startDate, endDate, leaveTypeId)
Input: userId (string), startDate (Date), endDate (Date), leaveTypeId (number)
Output: ValidationResult { canApply: boolean, reason?: string, conflicts?: [] }

BEGIN
    1. pendingCheck = checkPendingApplications(userId)
    2. IF !pendingCheck.canApply THEN
         RETURN pendingCheck
    3. dateCheck = checkDateConflicts(userId, startDate, endDate, leaveTypeId)
    4. IF !dateCheck.canApply THEN
         RETURN dateCheck
    5. RETURN { canApply: true }
END
```

### 1.2 Pending Applications Check

**Purpose**: Prevents users from submitting multiple applications simultaneously.

```typescript
Algorithm: checkPendingApplications(userId)
Input: userId (string)
Output: ValidationResult

BEGIN
    1. pendingLeaveApplications = FIND leave applications WHERE
         users_id = userId AND
         status IN ['PENDING', 'DEAN_APPROVED']
    
    2. pendingTravelOrders = FIND travel orders WHERE
         users_id = userId AND
         status IN ['PENDING', 'DEAN_APPROVED']
    
    3. IF pendingLeaveApplications.length > 0 OR pendingTravelOrders.length > 0 THEN
         RETURN {
             canApply: false,
             reason: "You already have applications pending review...",
             pendingApplications: [pendingLeaveApplications + pendingTravelOrders]
         }
    
    4. RETURN { canApply: true }
END
```

**Time Complexity**: O(1) - Database queries with indexed user_id
**Space Complexity**: O(k) where k is the number of pending applications

### 1.3 Date Conflict Detection Algorithm

**Purpose**: Detects overlapping leave periods and travel orders.

```typescript
Algorithm: checkDateConflicts(userId, startDate, endDate, leaveTypeId)
Input: userId (string), startDate (Date), endDate (Date), leaveTypeId (number)
Output: ValidationResult

BEGIN
    1. // Check exemption first (early exit optimization)
    2. IF leaveTypeId IS NOT NULL THEN
        3. leaveType = FIND leave_types WHERE leave_type_id = leaveTypeId
        4. IF leaveType.exempt_from_date_restriction = true THEN
            5. RETURN { canApply: true, reason: "Leave type is exempt from date restrictions" }
    
    6. // Check for overlapping approved leave applications
    7. conflictingLeaveApplications = FIND leave applications WHERE
         users_id = userId AND
         status = 'APPROVED' AND
         (
             // Case 1: New app starts during existing app
             (startDate <= newStartDate AND endDate >= newStartDate) OR
             // Case 2: New app ends during existing app
             (startDate <= newEndDate AND endDate >= newEndDate) OR
             // Case 3: New app completely contains existing app
             (startDate >= newStartDate AND endDate <= newEndDate)
         )
    
    8. // Check for overlapping approved travel orders
    9. conflictingTravelOrders = FIND travel orders WHERE
         users_id = userId AND
         status = 'APPROVED' AND
         (
             // Similar overlap logic for travel dates
             (dateOfTravel <= startDate AND expectedReturn >= startDate) OR
             (dateOfTravel <= endDate AND expectedReturn >= endDate) OR
             (dateOfTravel >= startDate AND expectedReturn <= endDate)
         )
    
    10. // Double-check exemption (defense in depth)
    11. IF leaveTypeId IS NOT NULL THEN
        12. leaveType = FIND leave_types WHERE leave_type_id = leaveTypeId
        13. IF leaveType.exempt_from_date_restriction = true THEN
            14. RETURN { canApply: true, reason: "Leave type is exempt from date restrictions" }
    
    15. IF conflictingLeaveApplications.length > 0 OR conflictingTravelOrders.length > 0 THEN
        16. RETURN {
             canApply: false,
             reason: "You have approved applications that conflict with the selected dates...",
             conflictingApplications: [conflictingLeaveApplications + conflictingTravelOrders]
         }
    
    17. RETURN { canApply: true }
END
```

**Time Complexity**: O(1) - Database queries with indexed user_id and status
**Space Complexity**: O(m) where m is the number of conflicting applications

### 1.4 Date Overlap Detection Logic

The algorithm uses three cases to detect all possible overlaps:

```
Case 1: Partial Overlap (Start)
New:     [----]
Existing:  [----]
Result: CONFLICT

Case 2: Partial Overlap (End)
New:       [----]
Existing: [----]
Result: CONFLICT

Case 3: Complete Containment
New:     [----]
Existing:  [--]
Result: CONFLICT

Case 4: No Overlap
New:     [----]
Existing:        [----]
Result: NO CONFLICT
```

## 2. Exemption Logic Algorithm

### 2.1 Leave Type Exemption System

**Purpose**: Allows certain leave types to bypass date conflict restrictions.

```typescript
Algorithm: checkExemption(leaveTypeId)
Input: leaveTypeId (number)
Output: boolean

BEGIN
    1. leaveType = FIND leave_types WHERE leave_type_id = leaveTypeId
    2. RETURN leaveType.exempt_from_date_restriction === true
END
```

### 2.2 Exemption Implementation Strategy

The system implements a **double-check pattern** for exemptions:

1. **Early Exit Check**: Before expensive conflict queries
2. **Final Verification**: After conflict detection, before returning conflicts

```typescript
// Early exit optimization
if (leaveTypeId && leaveType.exempt_from_date_restriction) {
    return { canApply: true, reason: "Leave type is exempt" }
}

// ... perform conflict detection ...

// Final verification (defense in depth)
if (leaveTypeId && leaveType.exempt_from_date_restriction) {
    return { canApply: true, reason: "Leave type is exempt" }
}
```

**Benefits**:
- Performance optimization for exempt leave types
- Defense in depth against logic errors
- Clear audit trail of exemption decisions

## 3. Approval Routing Algorithm

### 3.1 Multi-Stage Approval Workflow

The system implements a hierarchical approval process:

```
Application Flow:
PENDING → DEAN_APPROVED → APPROVED → [COMPLETED]

Rejection Flow:
PENDING → REJECTED
DEAN_APPROVED → REJECTED (by Finance)
```

### 3.2 Dean Approval Algorithm

```typescript
Algorithm: approveByDean(applicationId, deanUserId)
Input: applicationId (number), deanUserId (string)
Output: ApprovalResult

BEGIN
    1. // Authorization Check
    2. IF !isAuthorized(deanUserId, ['Dean/Program Head', 'Department Head']) THEN
        3. RETURN { error: "Access denied" }
    
    4. // Application Retrieval
    5. application = FIND leave application WHERE leave_application_id = applicationId
    6. IF !application THEN
        7. RETURN { error: "Application not found" }
    
    8. // Department Authorization
    9. IF !isSameDepartment(deanUserId, application.userId) THEN
        10. RETURN { error: "Access denied - Application not in your department" }
    
    11. // Status Validation
    12. IF application.status != 'PENDING' THEN
        13. RETURN { error: "Application is not in pending status" }
    
    14. // Update Application
    15. UPDATE leave application SET
         status = 'DEAN_APPROVED',
         deanReviewedAt = NOW(),
         deanReviewedBy = deanUserId,
         deanComments = 'Approved by Dean'
    16. WHERE leave_application_id = applicationId
    
    17. // Send Notifications
    18. notifyLeaveApplicationApproved(application.userId, applicationId, deanName)
    19. sendRealtimeUpdate(application.userId, updatedApplication)
    
    20. RETURN { success: true, application: updatedApplication }
END
```

### 3.3 Finance Approval Algorithm

```typescript
Algorithm: approveByFinance(applicationId, financeUserId)
Input: applicationId (number), financeUserId (string)
Output: ApprovalResult

BEGIN
    1. // Authorization Check
    2. IF !isAuthorized(financeUserId, ['Finance Department', 'Finance Officer', 'Finance Office Head']) THEN
        3. RETURN { error: "Access denied" }
    
    4. // Application Retrieval
    5. application = FIND leave application WHERE leave_application_id = applicationId
    6. IF !application THEN
        7. RETURN { error: "Application not found" }
    
    8. // Status Validation
    9. IF application.status != 'DEAN_APPROVED' THEN
        10. RETURN { error: "Application must be approved by dean before finance can approve" }
    
    11. // Update Application
    12. UPDATE leave application SET
         status = 'APPROVED',
         reviewedAt = NOW(),
         reviewedBy = financeUserId,
         comments = 'Approved by Finance Officer'
    13. WHERE leave_application_id = applicationId
    
    14. // Balance Deduction Logic
    15. currentPeriod = FIND calendar period WHERE isCurrent = true
    16. IF currentPeriod.termType.name.toLowerCase().includes('summer') THEN
        17. // Summer period: Update shared leave balance
        18. UPDATE leave balance SET
             usedDays = usedDays + application.numberOfDays,
             remainingDays = remainingDays - application.numberOfDays
        19. WHERE users_id = application.userId AND calendar_period_id = application.calendar_period_id
    20. ELSE
        21. // Regular period: Update specific leave type balance
        22. UPDATE leave balance SET
             usedDays = usedDays + application.numberOfDays,
             remainingDays = remainingDays - application.numberOfDays
        23. WHERE users_id = application.userId 
           AND calendar_period_id = application.calendar_period_id
           AND leave_type_id = application.leave_type_id
    
    24. // Send Notifications
    25. notifyFinanceApproval(application.userId, applicationId)
    26. sendRealtimeUpdate(application.userId, updatedApplication)
    
    27. RETURN { success: true, application: updatedApplication }
END
```

### 3.4 Department Authorization Algorithm

```typescript
Algorithm: isSameDepartment(reviewerUserId, applicantUserId)
Input: reviewerUserId (string), applicantUserId (string)
Output: boolean

BEGIN
    1. reviewer = FIND user WHERE users_id = reviewerUserId
    2. applicant = FIND user WHERE users_id = applicantUserId
    
    3. // Check department name match
    4. IF reviewer.department.name == applicant.department.name THEN
        5. RETURN true
    
    6. // Fallback: Check department ID match
    7. IF reviewer.department_id == applicant.department_id THEN
        8. RETURN true
    
    9. RETURN false
END
```

## 4. Real-time Validation Algorithm

### 4.1 Frontend Validation Integration

The system provides real-time validation through WebSocket connections:

```typescript
Algorithm: realTimeValidation(startDate, endDate, leaveTypeId)
Input: startDate (string), endDate (string), leaveTypeId (number)
Output: ValidationResult

BEGIN
    1. // Build query parameters
    2. params = new URLSearchParams()
    3. params.append('startDate', startDate)
    4. params.append('endDate', endDate)
    5. IF leaveTypeId THEN params.append('leaveTypeId', leaveTypeId.toString())
    
    6. // Call validation API
    7. response = FETCH('/api/teacher/validation?' + params.toString())
    8. result = await response.json()
    
    9. // Update UI based on result
    10. IF result.canApply THEN
        11. showSuccessMessage(result.reason || "Dates are available")
    12. ELSE
        13. showErrorMessage(result.reason)
        14. displayConflicts(result.conflictingApplications)
    
    15. RETURN result
END
```

## 5. Performance Optimizations

### 5.1 Database Query Optimization

1. **Indexed Queries**: All user_id and status fields are indexed
2. **Early Exit**: Exemption checks occur before expensive conflict queries
3. **Selective Loading**: Only required fields are selected in queries

### 5.2 Caching Strategy

```typescript
// Leave type exemption cache (in-memory)
const exemptionCache = new Map<number, boolean>()

function getExemptionStatus(leaveTypeId: number): boolean {
    if (exemptionCache.has(leaveTypeId)) {
        return exemptionCache.get(leaveTypeId)!
    }
    
    const leaveType = await prisma.leave_types.findUnique({
        where: { leave_type_id: leaveTypeId },
        select: { exempt_from_date_restriction: true }
    })
    
    const isExempt = leaveType?.exempt_from_date_restriction || false
    exemptionCache.set(leaveTypeId, isExempt)
    return isExempt
}
```

## 6. Error Handling and Edge Cases

### 6.1 Edge Cases Handled

1. **Null/Undefined Values**: All inputs are validated before processing
2. **Date Boundary Conditions**: Inclusive date comparisons handle edge cases
3. **Concurrent Applications**: Pending check prevents race conditions
4. **Department Mismatches**: Multiple fallback checks for department authorization
5. **Missing Leave Types**: Graceful handling of deleted leave types

### 6.2 Error Recovery

```typescript
Algorithm: handleValidationError(error, context)
Input: error (Error), context (ValidationContext)
Output: ValidationResult

BEGIN
    1. LOG error details with context
    2. IF error.type == 'DATABASE_ERROR' THEN
        3. RETURN { canApply: false, reason: "Database error. Please try again." }
    4. ELSE IF error.type == 'NETWORK_ERROR' THEN
        5. RETURN { canApply: false, reason: "Network error. Please check connection." }
    6. ELSE
        7. RETURN { canApply: false, reason: "Validation error. Please contact administrator." }
END
```

## 7. Algorithm Complexity Analysis

### 7.1 Time Complexity

- **Pending Applications Check**: O(1) - Indexed queries
- **Date Conflict Detection**: O(1) - Indexed queries with date ranges
- **Exemption Check**: O(1) - Single table lookup
- **Approval Process**: O(1) - Single update operation
- **Overall Validation**: O(1) - All operations are constant time

### 7.2 Space Complexity

- **Validation Result**: O(k) where k is number of conflicts/pending applications
- **Cache Storage**: O(n) where n is number of leave types
- **Overall**: O(k + n) where k << n in typical usage

## 8. Security Considerations

### 8.1 Authorization Checks

1. **Role-based Access**: Only authorized roles can approve applications
2. **Department Isolation**: Users can only approve applications from their department
3. **Status Validation**: Applications can only be approved in correct status
4. **Input Sanitization**: All inputs are validated and sanitized

### 8.2 Data Integrity

1. **Atomic Operations**: Database transactions ensure consistency
2. **Foreign Key Constraints**: Database-level referential integrity
3. **Status Transitions**: Validated state machine for application status
4. **Audit Trail**: All approvals are logged with timestamps and user IDs

## Conclusion

The OALAS leave validation and approval algorithms provide a robust, secure, and efficient system for managing academic leave applications. The combination of conflict detection, exemption logic, and multi-stage approval routing ensures data integrity while providing flexibility for different leave types and organizational structures.

Key strengths of the algorithms include:
- **Performance**: O(1) complexity for all operations
- **Flexibility**: Exemption system allows for special cases
- **Security**: Multiple layers of authorization and validation
- **Reliability**: Comprehensive error handling and edge case management
- **Scalability**: Efficient database queries and caching strategies

The algorithms successfully balance strict validation requirements with practical usability, making the system suitable for academic institutions with complex leave management needs.
