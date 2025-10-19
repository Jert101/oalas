# OALAS (Online Academic Leave Application System) - Comprehensive System Analysis

## Executive Summary

The Online Academic Leave Application System (OALAS) is a comprehensive web-based platform built with Next.js 14 that manages academic leave applications for the College of Knowledge and Computer Management (CKCM). The system implements role-based access control (RBAC) with multiple user roles including Admin, Dean/Program Head, Department Head, Teacher/Instructor, Non-Teaching Personnel, and various specialized staff roles.

## System Architecture Overview

### Technology Stack
- **Frontend Framework**: Next.js 14 with App Router
- **UI Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: NextAuth.js with bcryptjs and JWT
- **Database**: MySQL via Prisma ORM
- **Validation**: Zod schemas
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast + Custom WebSocket system
- **Email Service**: NodeMailer with Gmail SMTP
- **State Management**: Zustand (optional)
- **Real-time Communication**: WebSocket server (Node.js)
- **File Handling**: Formidable for multipart uploads
- **Deployment**: PM2 process manager

### System Components

#### 1. Authentication & Authorization System

**Purpose**: Manages user authentication, session handling, and role-based access control.

**Key Files**:
- `src/lib/auth.ts` - NextAuth configuration
- `middleware.ts` - Route protection and role-based redirection
- `src/app/api/auth/[...nextauth]/route.ts` - Authentication API routes

**Key Functions**:
```typescript
// Authentication configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // User validation logic with bcrypt password hashing
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // JWT token customization with user role and department
    },
    async session({ session, token }) {
      // Session data enrichment
    }
  }
}
```

**Data Flow**:
1. User submits login credentials
2. System validates against database using bcrypt
3. JWT token created with user role and department info
4. Middleware checks routes against user permissions
5. Role-based dashboard redirection

**Dependencies**: bcryptjs, NextAuth.js, Prisma
**Special Logic**: Role hierarchy with department-specific access control

#### 2. Database Layer (Prisma ORM)

**Purpose**: Manages all data persistence and relationships.

**Key Files**:
- `prisma/schema.prisma` - Database schema definition
- `src/lib/prisma.ts` - Prisma client configuration

**Key Models**:
```prisma
model User {
  users_id          String    @id @default(cuid()) @map("users_id")
  name              String
  email             String    @unique
  password          String
  role              Role      @relation(fields: [role_id], references: [role_id])
  department        Department? @relation(fields: [department_id], references: [department_id])
  status            Status    @relation(fields: [status_id], references: [status_id])
  isDepartmentHead  Boolean   @default(false)
  // ... additional fields
}

model LeaveApplication {
  leave_application_id Int      @id @default(autoincrement())
  users_id            String
  user                User      @relation(fields: [users_id], references: [users_id])
  leave_type_id       Int
  leaveType           leave_types @relation(fields: [leave_type_id], references: [leave_type_id])
  startDate           DateTime
  endDate             DateTime
  status              String    // PENDING, APPROVED, REJECTED, etc.
  // ... additional fields
}
```

**Data Flow**:
1. Prisma client handles all database operations
2. Type-safe queries with automatic relationship loading
3. Transaction support for complex operations
4. Connection pooling for performance

**Dependencies**: MySQL, Prisma Client
**Special Logic**: Complex relationships between users, departments, leave types, and applications

#### 3. Role-Based Access Control (RBAC)

**Purpose**: Implements comprehensive role-based permissions and routing.

**Key Files**:
- `middleware.ts` - Route protection
- `src/app/dashboard/page.tsx` - Role-based redirection
- `src/components/app-sidebar.tsx` - Role-based navigation

**Role Hierarchy**:
```typescript
const roleHierarchy = {
  'Admin': {
    access: ['admin/*'],
    permissions: ['full_system_access', 'user_management', 'system_configuration']
  },
  'Dean/Program Head': {
    access: ['dean/*', 'admin/leave-types', 'admin/manage-leave-limits'],
    permissions: ['approve_leave', 'view_department_applications', 'manage_faculty']
  },
  'Department Head': {
    access: ['office-head/*'],
    permissions: ['approve_leave', 'view_department_applications', 'department_management']
  },
  'Teacher/Instructor': {
    access: ['teacher/*'],
    permissions: ['apply_leave', 'view_own_applications']
  },
  'Non-Teaching Personnel': {
    access: ['non-teaching-staff/*'],
    permissions: ['apply_leave', 'view_own_applications']
  }
}
```

**Data Flow**:
1. User authentication determines role
2. Middleware validates route access
3. Component rendering based on permissions
4. API endpoint protection by role

**Dependencies**: NextAuth.js, Middleware
**Special Logic**: Dynamic route access with department-specific restrictions

#### 4. Leave Application Management System

**Purpose**: Core functionality for managing leave applications across all user roles.

**Key Files**:
- `src/app/api/teacher/leave/apply/route.ts` - Teacher leave application
- `src/app/api/dean/applications/[id]/approve/route.ts` - Dean approval
- `src/lib/validation-service.ts` - Application validation logic
- `src/components/leave-application-form.tsx` - Application form component

**Key Functions**:
```typescript
// Leave application submission
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const { startDate, endDate, leaveTypeId, numberOfDays, ...otherData } = await req.json()
  
  // Validate application
  const validation = await validateNewApplication(
    user.users_id, 
    new Date(startDate), 
    new Date(endDate), 
    leaveTypeId
  )
  
  if (!validation.canApply) {
    return NextResponse.json({ error: validation.reason }, { status: 400 })
  }
  
  // Create application
  const leaveApplication = await prisma.leaveApplication.create({
    data: {
      users_id: user.users_id,
      leave_type_id: leaveTypeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      numberOfDays,
      status: 'PENDING',
      // ... other fields
    }
  })
  
  // Send notifications
  await notifyLeaveApplicationSubmitted(user.users_id, leaveApplication.leave_application_id)
  
  return NextResponse.json({ success: true, application: leaveApplication })
}
```

**Data Flow**:
1. User fills leave application form
2. Real-time validation checks conflicts and limits
3. Application submitted to database
4. Notifications sent to relevant parties
5. Approval workflow initiated

**Dependencies**: Prisma, Validation Service, Notification Service
**Special Logic**: Multi-stage approval process with automatic notifications

#### 5. Validation & Conflict Detection System

**Purpose**: Ensures data integrity and prevents conflicting leave applications.

**Key Files**:
- `src/lib/validation-service.ts` - Centralized validation logic
- `src/components/date-validation.tsx` - Real-time validation component
- `src/components/validation-status.tsx` - Validation status display

**Key Functions**:
```typescript
export async function checkDateConflicts(
  userId: string,
  startDate: Date,
  endDate: Date,
  leaveTypeId?: number
): Promise<ValidationResult> {
  // Check if leave type is exempt from date restrictions
  if (leaveTypeId) {
    const leaveType = await prisma.leave_types.findUnique({
      where: { leave_type_id: leaveTypeId },
      select: { exempt_from_date_restriction: true }
    })
    
    if (leaveType?.exempt_from_date_restriction) {
      return { canApply: true, reason: "Leave type is exempt from date restrictions" }
    }
  }
  
  // Check for overlapping applications
  const conflictingApplications = await prisma.leaveApplication.findMany({
    where: {
      users_id: userId,
      status: 'APPROVED',
      OR: [
        { startDate: { lte: endDate }, endDate: { gte: startDate } }
      ]
    }
  })
  
  return {
    canApply: conflictingApplications.length === 0,
    reason: conflictingApplications.length > 0 ? "Date conflicts with existing approved leave" : undefined
  }
}
```

**Data Flow**:
1. User selects dates and leave type
2. Real-time validation API called
3. Conflict detection against existing applications
4. Leave type exemption rules applied
5. Validation result returned to frontend

**Dependencies**: Prisma, Date manipulation
**Special Logic**: Exempt leave types bypass date conflict checks

#### 6. File Upload & Management System

**Purpose**: Handles secure file uploads for medical proofs and documents.

**Key Files**:
- `src/app/api/upload/medical-proof/route.ts` - File upload endpoint
- `src/app/api/files/medical-proof/[filename]/route.ts` - Secure file serving
- `src/app/teacher/leave/apply/page.tsx` - File upload integration

**Key Functions**:
```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  }
  
  // Generate unique filename and save
  const fileName = `medical-proof-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
  const filePath = join(uploadsDir, fileName)
  
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filePath, buffer)
  
  return NextResponse.json({
    success: true,
    filePath: `/uploads/medical-proof/${fileName}`
  })
}
```

**Data Flow**:
1. User selects file for upload
2. File validated for type and size
3. Unique filename generated
4. File saved to secure directory
5. File path returned for database storage

**Dependencies**: Formidable, fs/promises, mime-types
**Special Logic**: Secure file serving with authentication checks

#### 7. Notification System

**Purpose**: Provides real-time notifications and email alerts for application status changes.

**Key Files**:
- `src/lib/notification-service.ts` - Centralized notification management
- `src/lib/email-service-simple.ts` - Email service with NodeMailer
- `websocket-server.js` - Real-time WebSocket server
- `src/components/notification-center.tsx` - Notification UI component

**Key Functions**:
```typescript
export async function createNotification({
  userId,
  title,
  message,
  type = 'INFO',
  link,
  sendEmail = false,
  emailTemplate,
  emailData
}: CreateNotificationParams) {
  // Create database notification
  const notification = await prisma.notification.create({
    data: { title, message, type, userId, link, isRead: false }
  })
  
  // Send email if requested
  if (sendEmail && userEmail && emailTemplate && emailData) {
    const emailContent = emailTemplates[emailTemplate](emailData)
    await sendEmail(userEmail, emailContent.subject, emailContent.html)
  }
  
  // Send real-time WebSocket notification
  await fetch(`http://localhost:3001/api/realtime/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, notification })
  })
  
  return { success: true, notification }
}
```

**Data Flow**:
1. Application status changes
2. Notification created in database
3. Email sent via NodeMailer
4. WebSocket notification pushed to client
5. Real-time UI update

**Dependencies**: NodeMailer, WebSocket, Prisma
**Special Logic**: Multi-channel notifications with template system

#### 8. Dashboard & Analytics System

**Purpose**: Provides role-specific dashboards with relevant metrics and data.

**Key Files**:
- `src/app/teacher/dashboard/page.tsx` - Teacher dashboard
- `src/app/dean/dashboard/page.tsx` - Dean dashboard
- `src/app/api/dean/dashboard-stats/route.ts` - Dashboard statistics API

**Key Functions**:
```typescript
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { department: true, role: true }
  })
  
  // Fetch department-specific statistics
  const stats = {
    totalApplications: await prisma.leaveApplication.count({
      where: { user: { department_id: user.department_id } }
    }),
    pendingApplications: await prisma.leaveApplication.count({
      where: { 
        user: { department_id: user.department_id },
        status: 'PENDING'
      }
    }),
    facultyMembers: await prisma.user.count({
      where: { 
        department_id: user.department_id,
        isActive: true
      }
    })
  }
  
  return NextResponse.json(stats)
}
```

**Data Flow**:
1. User accesses dashboard
2. Role-specific statistics fetched
3. Real-time data aggregation
4. Dashboard components rendered
5. Interactive charts and metrics displayed

**Dependencies**: Prisma, Chart.js, React components
**Special Logic**: Role-based data filtering and aggregation

#### 9. Calendar & Activity Tracking System

**Purpose**: Provides visual calendar views and activity logs for leave applications.

**Key Files**:
- `src/app/teacher/calendar/page.tsx` - Teacher calendar view
- `src/app/dean/activity/page.tsx` - Dean activity log
- `src/components/calendar-component.tsx` - Calendar UI component

**Key Functions**:
```typescript
export async function GET() {
  const applications = await prisma.leaveApplication.findMany({
    where: { 
      user: { department_id: user.department_id },
      status: 'APPROVED'
    },
    include: { user: true, leaveType: true },
    orderBy: { startDate: 'desc' }
  })
  
  const calendarData = applications.map(app => ({
    id: app.leave_application_id,
    title: `${app.user.name} - ${app.leaveType.name}`,
    start: app.startDate,
    end: app.endDate,
    status: app.status,
    type: app.leaveType.name
  }))
  
  return NextResponse.json(calendarData)
}
```

**Data Flow**:
1. Calendar component requests data
2. Approved applications fetched
3. Calendar events formatted
4. Interactive calendar rendered
5. Event details displayed on click

**Dependencies**: Calendar library, Prisma
**Special Logic**: Department-specific calendar filtering

#### 10. Admin Management System

**Purpose**: Provides administrative tools for system configuration and user management.

**Key Files**:
- `src/app/admin/leave-types/page.tsx` - Leave types management
- `src/app/admin/manage-accounts/page.tsx` - User account management
- `src/app/admin/manage-leave-limits/page.tsx` - Leave limits configuration

**Key Functions**:
```typescript
// Leave types management with exemption feature
export async function POST(req: NextRequest) {
  const { name, description, exempt_from_date_restriction } = await req.json()
  
  const created = await prisma.leave_types.upsert({
    where: { name },
    update: { description, exempt_from_date_restriction },
    create: { name, description, exempt_from_date_restriction }
  })
  
  return NextResponse.json(created, { status: 201 })
}
```

**Data Flow**:
1. Admin accesses management interface
2. Configuration changes submitted
3. Database updated with new settings
4. System-wide changes applied
5. Confirmation feedback provided

**Dependencies**: Prisma, Admin UI components
**Special Logic**: System-wide configuration management

## End-to-End Workflow

### Leave Application Process

1. **User Authentication**
   - User logs in with email/password
   - System validates credentials and assigns role
   - Role-based dashboard redirection

2. **Leave Application Submission**
   - User navigates to leave application form
   - Real-time validation checks conflicts and limits
   - File upload for medical proof (if required)
   - Application submitted to database

3. **Approval Workflow**
   - Notification sent to department head/dean
   - Reviewer examines application and documents
   - Approval or rejection decision made
   - Status updated in database

4. **Notification & Communication**
   - Email notification sent to applicant
   - Real-time WebSocket notification
   - Database notification record created
   - Status change reflected in UI

5. **Finance Processing** (if applicable)
   - Finance department reviews approved applications
   - Final approval or rejection
   - System notifications sent to all parties

### System Integration Points

1. **Database Integration**
   - Prisma ORM handles all database operations
   - Type-safe queries with relationship loading
   - Transaction support for complex operations

2. **Authentication Integration**
   - NextAuth.js manages sessions and JWT tokens
   - Middleware protects routes based on user roles
   - Role-based component rendering

3. **File System Integration**
   - Secure file upload and storage
   - Authentication-protected file serving
   - MIME type detection and validation

4. **Email Integration**
   - NodeMailer with Gmail SMTP
   - Template-based email generation
   - Automated notification delivery

5. **Real-time Communication**
   - WebSocket server for instant updates
   - HTTP-based notification forwarding
   - Client-side WebSocket connection management

## Key Features and Innovations

### 1. Role-Based Access Control (RBAC)
- Comprehensive role hierarchy with department-specific access
- Dynamic route protection and component rendering
- Granular permission system

### 2. Real-time Validation
- Instant conflict detection during application
- Leave type exemption rules
- Dynamic form validation with user feedback

### 3. Multi-channel Notifications
- Database notifications for persistence
- Email notifications for external communication
- Real-time WebSocket notifications for instant updates

### 4. Secure File Management
- Authentication-protected file uploads
- Secure file serving with proper MIME types
- File integrity verification

### 5. Comprehensive Leave Management
- Multiple leave types with configurable rules
- Date conflict detection and exemption
- Multi-stage approval workflow

### 6. Admin Configuration System
- Leave types management with exemption settings
- User account management
- Leave limits configuration

## Technical Architecture Summary

The OALAS system follows a modern web application architecture with clear separation of concerns:

- **Frontend**: Next.js 14 with React components and TypeScript
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: MySQL with complex relational schema
- **Authentication**: NextAuth.js with JWT and bcrypt
- **Real-time**: WebSocket server for instant updates
- **Email**: NodeMailer for automated notifications
- **File Storage**: Secure file system with authentication
- **Deployment**: PM2 process management

The system demonstrates enterprise-level architecture with proper error handling, validation, security measures, and scalability considerations. It successfully manages complex academic leave workflows while maintaining data integrity and providing excellent user experience across multiple roles and departments.

## Conclusion

The OALAS system represents a comprehensive solution for academic leave management, successfully implementing modern web development practices with robust security, real-time communication, and user-friendly interfaces. The system's modular architecture allows for easy maintenance and future enhancements while providing reliable service for academic institutions.
