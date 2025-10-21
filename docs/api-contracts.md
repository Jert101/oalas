# API Contracts - OALASS

## Authentication Endpoints

### POST /api/auth/signin
**Purpose:** User authentication
**Authentication:** None required
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "success": "boolean",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string"
  }
}
```

### POST /api/auth/signout
**Purpose:** User logout
**Authentication:** Required
**Response:**
```json
{
  "success": "boolean"
}
```

## Admin Management Endpoints

### GET /api/admin/users
**Purpose:** Get all users with pagination
**Authentication:** Admin role required
**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `search`: string (optional)
- `department`: string (optional)
- `role`: string (optional)

### POST /api/admin/users
**Purpose:** Create new user
**Authentication:** Admin role required
**Request Body:**
```json
{
  "email": "string",
  "name": "string",
  "department_id": "number",
  "role_id": "number",
  "password": "string"
}
```

### PUT /api/admin/users/[id]
**Purpose:** Update user information
**Authentication:** Admin role required
**Request Body:**
```json
{
  "name": "string",
  "department_id": "number",
  "role_id": "number",
  "isActive": "boolean"
}
```

### DELETE /api/admin/users/[id]
**Purpose:** Delete user
**Authentication:** Admin role required

## Leave Application Endpoints

### GET /api/teacher/leave-applications
**Purpose:** Get user's leave applications
**Authentication:** Teacher role required
**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `status`: string (optional)

### POST /api/teacher/leave-applications
**Purpose:** Create new leave application
**Authentication:** Teacher role required
**Request Body:**
```json
{
  "leave_type_id": "number",
  "startDate": "string (ISO date)",
  "endDate": "string (ISO date)",
  "reason": "string",
  "specificPurpose": "string",
  "numberOfDays": "number",
  "hours": "number"
}
```

### PUT /api/teacher/leave-applications/[id]
**Purpose:** Update leave application
**Authentication:** Teacher role required
**Request Body:**
```json
{
  "startDate": "string (ISO date)",
  "endDate": "string (ISO date)",
  "reason": "string",
  "specificPurpose": "string"
}
```

### DELETE /api/teacher/leave-applications/[id]
**Purpose:** Cancel leave application
**Authentication:** Teacher role required

## Dean/Program Head Endpoints

### GET /api/dean/applications
**Purpose:** Get applications for dean review
**Authentication:** Dean/Program Head role required
**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `status`: string (optional)
- `department`: string (optional)

### POST /api/dean/applications/[id]/approve
**Purpose:** Approve application
**Authentication:** Dean/Program Head role required
**Request Body:**
```json
{
  "comments": "string"
}
```

### POST /api/dean/applications/[id]/reject
**Purpose:** Reject application
**Authentication:** Dean/Program Head role required
**Request Body:**
```json
{
  "comments": "string",
  "rejectionReason": "string"
}
```

### GET /api/dean/reports
**Purpose:** Get dean reports and analytics
**Authentication:** Dean/Program Head role required
**Query Parameters:**
- `type`: string (summary|detailed)
- `startDate`: string (ISO date)
- `endDate`: string (ISO date)
- `department`: string (optional)
- `leaveType`: string (optional)
- `status`: string (optional)

## Finance Department Endpoints

### GET /api/finance/applications
**Purpose:** Get applications for finance review
**Authentication:** Finance role required
**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `status`: string (optional)

### POST /api/finance/applications/[id]/approve
**Purpose:** Approve application (final approval)
**Authentication:** Finance role required
**Request Body:**
```json
{
  "comments": "string"
}
```

### POST /api/finance/applications/[id]/reject
**Purpose:** Reject application
**Authentication:** Finance role required
**Request Body:**
```json
{
  "comments": "string",
  "rejectionReason": "string"
}
```

### GET /api/finance/reports
**Purpose:** Get finance reports and analytics
**Authentication:** Finance role required
**Query Parameters:**
- `type`: string (summary|detailed|approval-trends|department-analysis)
- `startDate`: string (ISO date)
- `endDate`: string (ISO date)
- `department`: string (optional)
- `leaveType`: string (optional)
- `status`: string (optional)
- `exportFormat`: string (json|csv|pdf)

## Leave Balance Endpoints

### GET /api/leave-balance
**Purpose:** Get user's leave balance
**Authentication:** Required
**Query Parameters:**
- `calendar_period_id`: number (optional)

### POST /api/leave-balance/calculate
**Purpose:** Calculate leave balance for user
**Authentication:** Admin role required
**Request Body:**
```json
{
  "users_id": "string",
  "calendar_period_id": "number"
}
```

## Notification Endpoints

### GET /api/notifications
**Purpose:** Get user notifications
**Authentication:** Required
**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `isRead`: boolean (optional)

### PUT /api/notifications/[id]/read
**Purpose:** Mark notification as read
**Authentication:** Required

### POST /api/notifications/mark-all-read
**Purpose:** Mark all notifications as read
**Authentication:** Required

## File Upload Endpoints

### POST /api/files/upload
**Purpose:** Upload file (medical proof, supporting documents)
**Authentication:** Required
**Request:** Multipart form data
**Response:**
```json
{
  "success": "boolean",
  "filePath": "string",
  "fileName": "string"
}
```

### GET /api/files/[path]
**Purpose:** Serve uploaded files
**Authentication:** Required
**Response:** File content with appropriate MIME type

## WebSocket Endpoints

### WebSocket /api/websocket
**Purpose:** Real-time communication
**Authentication:** Required (via session)
**Events:**
- `application_update`: Application status changes
- `notification`: New notifications
- `leave_balance_update`: Leave balance changes

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": "object|array",
  "message": "string (optional)"
}
```

### Error Response
```json
{
  "success": false,
  "error": "string",
  "details": "object (optional)"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": "array",
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

## Authentication Requirements

All endpoints (except authentication endpoints) require:
- Valid session token
- Appropriate role permissions
- Active user status

## Rate Limiting

- API calls: 100 requests per minute per user
- File uploads: 10 requests per minute per user
- WebSocket connections: 1 per user

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Validation Error
- `500`: Internal Server Error
