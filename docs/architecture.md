# Architecture Documentation - OALASS

## Executive Summary

The OALASS (Online Academic Leave Application System) is a comprehensive web-based platform built with Next.js 14 that manages academic leave applications for educational institutions. The system implements a modern, scalable architecture with role-based access control, real-time communication, and multi-stage approval workflows.

## Technology Stack

### Frontend Technologies
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context + Zustand (optional)
- **Forms**: React Hook Form with Zod validation
- **Notifications**: React Hot Toast + Custom WebSocket system

### Backend Technologies
- **Runtime**: Node.js with Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT and bcrypt
- **Email Service**: NodeMailer with Gmail SMTP
- **File Handling**: Formidable for multipart uploads
- **Real-time**: Custom WebSocket server

### Development Tools
- **Language**: TypeScript
- **Package Manager**: npm
- **Database ORM**: Prisma
- **Validation**: Zod schemas
- **Testing**: Jest (planned)
- **Deployment**: PM2 process manager

## Architecture Pattern

### MVC with API Routes
The system follows a Model-View-Controller pattern adapted for Next.js:

- **Models**: Prisma schema definitions and database models
- **Views**: React components and pages
- **Controllers**: API route handlers in `/api` directory

### Layered Architecture

```
┌─────────────────────────────────────┐
│           Presentation Layer        │
│  (React Components, Pages, UI)      │
├─────────────────────────────────────┤
│           Business Logic Layer     │
│  (API Routes, Services, Actions)    │
├─────────────────────────────────────┤
│           Data Access Layer         │
│  (Prisma ORM, Database Queries)     │
├─────────────────────────────────────┤
│           Database Layer            │
│  (MySQL Database, Schema)           │
└─────────────────────────────────────┘
```

## System Components

### 1. Authentication & Authorization System

**Purpose**: Manages user authentication, session handling, and role-based access control.

**Key Components**:
- `src/lib/auth.ts` - NextAuth configuration
- `middleware.ts` - Route protection and role-based redirection
- `src/app/api/auth/[...nextauth]/route.ts` - Authentication API routes

**Architecture**:
```
User Request → Middleware → Route Protection → API Handler → Database
```

**Features**:
- JWT-based authentication
- Role-based access control (RBAC)
- Session management
- Google OAuth integration
- Password reset functionality

### 2. Leave Management System

**Purpose**: Handles leave applications, approvals, and workflow management.

**Key Components**:
- `src/app/api/teacher/leave-applications/` - Teacher application endpoints
- `src/app/api/dean/` - Dean approval endpoints
- `src/app/api/finance/` - Finance approval endpoints
- `src/lib/leave-balance-initializer.ts` - Leave balance calculations

**Workflow**:
```
Teacher Application → Dean Review → Finance Approval → Notification
```

**Features**:
- Multi-stage approval workflow
- Real-time conflict detection
- Leave balance tracking
- Date validation and exemption rules

### 3. Real-time Communication System

**Purpose**: Provides instant updates and notifications across the system.

**Key Components**:
- `websocket-server.js` - Custom WebSocket server
- `src/components/realtime-provider.tsx` - React context for real-time updates
- `src/lib/notification-service.ts` - Notification management

**Architecture**:
```
Client ←→ WebSocket Server ←→ Database ←→ Email Service
```

**Features**:
- Real-time application updates
- Instant notifications
- Live dashboard updates
- WebSocket connection management

### 4. File Management System

**Purpose**: Handles secure file uploads and serving.

**Key Components**:
- `src/app/api/files/upload/route.ts` - File upload endpoint
- `src/app/api/files/[path]/route.ts` - File serving endpoint
- `src/lib/validation-service.ts` - File validation

**Features**:
- Secure file uploads with authentication
- File type validation
- Secure file serving with proper MIME types
- File integrity verification

### 5. Notification System

**Purpose**: Multi-channel notification delivery.

**Key Components**:
- `src/lib/notification-service.ts` - Notification logic
- `src/lib/email-service.ts` - Email delivery
- `src/lib/gmail-service.ts` - Gmail integration

**Channels**:
- Database notifications (persistent)
- Email notifications (external)
- Real-time WebSocket notifications (instant)

## Database Architecture

### Schema Design
The database uses a relational design with the following key entities:

- **User Management**: Users, Roles, Departments, Statuses
- **Leave System**: Leave Applications, Travel Orders, Leave Types
- **Balance System**: Leave Balances, Leave Limits
- **Calendar System**: Calendar Periods, Term Types
- **Notification System**: Notifications, Account Setup Requests

### Relationships
```
User (1) ←→ (N) Leave Application
User (1) ←→ (N) Travel Order
User (1) ←→ (N) Leave Balance
Department (1) ←→ (N) User
Role (1) ←→ (N) User
Leave Type (1) ←→ (N) Leave Application
Calendar Period (1) ←→ (N) Leave Application
```

### Data Integrity
- Foreign key constraints
- Unique constraints on critical fields
- Check constraints for data validation
- Indexes for performance optimization

## API Architecture

### RESTful Design
The API follows RESTful principles with clear resource-based URLs:

```
/api/auth/*          - Authentication endpoints
/api/admin/*         - Admin management
/api/teacher/*       - Teacher operations
/api/dean/*          - Dean operations
/api/finance/*       - Finance operations
/api/notifications/* - Notification management
/api/files/*         - File operations
```

### Request/Response Format
```json
{
  "success": boolean,
  "data": object|array,
  "message": string,
  "error": string
}
```

### Authentication Flow
```
1. User Login → NextAuth.js → JWT Token
2. API Request → Middleware → Token Validation
3. Role Check → Route Access → Response
```

## Security Architecture

### Authentication
- JWT-based session management
- NextAuth.js integration
- Google OAuth support
- Password hashing with bcrypt

### Authorization
- Role-based access control (RBAC)
- Route-level protection
- API endpoint authorization
- Department-based access control

### Data Security
- Input validation with Zod schemas
- SQL injection prevention via Prisma ORM
- XSS protection with React
- CSRF protection with NextAuth.js

### File Security
- Authentication-required file uploads
- File type validation
- Secure file serving
- File integrity checks

## Performance Architecture

### Caching Strategy
- Next.js built-in caching
- Database query optimization
- API response caching
- Static asset optimization

### Database Optimization
- Indexed queries for performance
- Connection pooling with Prisma
- Query optimization
- Pagination for large datasets

### Real-time Performance
- WebSocket connection pooling
- Efficient event broadcasting
- Minimal data transfer
- Connection management

## Deployment Architecture

### Development Environment
```
Local Development → MySQL Database → WebSocket Server
```

### Production Environment
```
Vercel (Frontend) → External MySQL → WebSocket Server (Railway/Render)
```

### Process Management
- PM2 for WebSocket server
- Next.js built-in process management
- Database connection pooling
- Error handling and logging

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Database connection pooling
- WebSocket server clustering
- Load balancer compatibility

### Vertical Scaling
- Database query optimization
- Caching strategies
- Memory management
- CPU optimization

### Future Enhancements
- Microservices architecture
- Event-driven architecture
- Message queue integration
- Advanced caching layers

## Monitoring and Logging

### Application Monitoring
- Error tracking and reporting
- Performance metrics
- User activity logging
- System health checks

### Database Monitoring
- Query performance tracking
- Connection monitoring
- Index usage analysis
- Storage optimization

## Integration Points

### External Services
- Gmail SMTP for email delivery
- Google OAuth for authentication
- File storage for document management
- WebSocket server for real-time communication

### Internal Services
- Authentication service
- Notification service
- File management service
- Leave balance service

## Error Handling

### API Error Handling
- Consistent error response format
- HTTP status code standards
- Error logging and tracking
- User-friendly error messages

### Database Error Handling
- Transaction management
- Rollback strategies
- Connection error handling
- Data integrity validation

### Frontend Error Handling
- React error boundaries
- Form validation errors
- Network error handling
- User feedback mechanisms

## Testing Strategy

### Unit Testing
- API endpoint testing
- Service function testing
- Database model testing
- Utility function testing

### Integration Testing
- API integration tests
- Database integration tests
- Authentication flow testing
- File upload testing

### End-to-End Testing
- User workflow testing
- Cross-browser testing
- Performance testing
- Security testing

## Maintenance and Updates

### Code Maintenance
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Git hooks for pre-commit checks

### Database Maintenance
- Migration management
- Schema versioning
- Data backup strategies
- Performance monitoring

### Security Updates
- Dependency updates
- Security patch management
- Vulnerability scanning
- Access control reviews
