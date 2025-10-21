# OALASS - Project Documentation Index

## Project Overview

- **Project Name:** OALASS (Online Academic Leave Application System)
- **Type:** Web Application (Next.js 14)
- **Architecture:** Monolith with comprehensive RBAC system
- **Primary Language:** TypeScript
- **Framework:** Next.js 14 with App Router

## Quick Reference

- **Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Prisma ORM, MySQL
- **Entry Point:** `src/app/layout.tsx`
- **Architecture Pattern:** MVC with API Routes
- **Database:** MySQL with Prisma ORM
- **Authentication:** NextAuth.js with JWT
- **Real-time:** Custom WebSocket server

## Generated Documentation

### Core Documentation
- [Project Overview](./project-overview.md) - Executive summary and project information
- [Architecture Documentation](./architecture.md) - System architecture and design patterns
- [Source Tree Analysis](./source-tree-analysis.md) - Detailed project structure analysis
- [Component Inventory](./component-inventory.md) - UI component library documentation
- [Development Guide](./development-guide.md) - Development setup and workflow

### Technical Documentation
- [API Contracts](./api-contracts.md) - Complete API endpoint documentation
- [Data Models](./data-models.md) - Database schema and relationships

## Project Structure Summary

```
oalass/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── admin/             # Admin dashboard and management
│   │   ├── api/               # API routes and endpoints
│   │   ├── dean/              # Dean/Program Head interface
│   │   ├── finance/           # Finance department interface
│   │   ├── teacher/           # Teacher interface
│   │   └── non-teaching-staff/ # Non-teaching staff interface
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # shadcn/ui base components
│   │   └── [feature components] # Feature-specific components
│   ├── lib/                   # Utility functions and services
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── docs/                      # Documentation
```

## Key Features

### 1. Role-Based Access Control (RBAC)
- Comprehensive role hierarchy with department-specific access
- Dynamic route protection and component rendering
- Granular permission system

### 2. Real-time Communication
- WebSocket server for instant updates
- Real-time application status changes
- Live notification system
- Dashboard updates

### 3. Multi-stage Approval Workflow
- Teacher → Dean → Finance approval process
- Status tracking and notifications
- Comment and rejection handling
- Audit trail

### 4. Leave Management System
- Multiple leave types with configurable rules
- Date conflict detection and exemption
- Leave balance tracking
- Calendar integration

### 5. Comprehensive Reporting
- Role-based reports and analytics
- Data export functionality
- Department and leave type analysis
- Approval trend tracking

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Frontend | Next.js | 14 | React framework with App Router |
| UI | React | 19.1.0 | Component library |
| Styling | Tailwind CSS | 4 | Utility-first CSS framework |
| Components | shadcn/ui | Latest | Pre-built component library |
| Language | TypeScript | 5 | Type-safe JavaScript |
| Database | MySQL | 8.0+ | Relational database |
| ORM | Prisma | 6.13.0 | Database toolkit |
| Authentication | NextAuth.js | 4.24.11 | Authentication framework |
| Forms | React Hook Form | 7.62.0 | Form management |
| Validation | Zod | 4.0.15 | Schema validation |
| Notifications | React Hot Toast | 2.5.2 | Toast notifications |
| Email | NodeMailer | 6.10.1 | Email service |
| Real-time | WebSocket | 8.18.3 | Real-time communication |

## API Endpoints Overview

### Authentication
- `POST /api/auth/signin` - User authentication
- `POST /api/auth/signout` - User logout
- `POST /api/auth/forgot-password` - Password reset

### Admin Management
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Leave Applications
- `GET /api/teacher/leave-applications` - Get user applications
- `POST /api/teacher/leave-applications` - Create application
- `PUT /api/teacher/leave-applications/[id]` - Update application
- `DELETE /api/teacher/leave-applications/[id]` - Cancel application

### Approval Workflow
- `GET /api/dean/applications` - Get applications for review
- `POST /api/dean/applications/[id]/approve` - Approve application
- `POST /api/dean/applications/[id]/reject` - Reject application
- `GET /api/finance/applications` - Get applications for finance review

### Reporting
- `GET /api/dean/reports` - Dean reports and analytics
- `GET /api/finance/reports` - Finance reports and analytics
- `GET /api/finance/reports/export` - Export data

## Database Schema Overview

### Core Entities
- **User Management**: Users, Roles, Departments, Statuses
- **Leave System**: Leave Applications, Travel Orders, Leave Types
- **Balance System**: Leave Balances, Leave Limits
- **Calendar System**: Calendar Periods, Term Types
- **Notification System**: Notifications, Account Setup Requests

### Key Relationships
- User (1) ←→ (N) Leave Application
- User (1) ←→ (N) Travel Order
- Department (1) ←→ (N) User
- Role (1) ←→ (N) User
- Leave Type (1) ←→ (N) Leave Application

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm package manager

### Installation
```bash
# Clone repository
git clone <repository-url>
cd oalass

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
npm run db:generate
npm run db:push
npm run db:seed:admin

# Start development servers
npm run dev:full
```

### Environment Variables
```bash
# Database
DATABASE_URL="mysql://user:pass@host:port/db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Email Service
RESEND_API_KEY="your-resend-key"
FROM_EMAIL="noreply@yourdomain.com"

# WebSocket Server
WEBSOCKET_SERVER_URL="http://localhost:3001"
```

## Development Workflow

### Code Organization
- **Pages**: Route-based organization in `src/app/`
- **Components**: Feature-based organization in `src/components/`
- **API Routes**: Resource-based organization in `src/app/api/`
- **Utilities**: Service-based organization in `src/lib/`

### Development Commands
```bash
# Development
npm run dev              # Start Next.js dev server
npm run dev:full        # Start both Next.js and WebSocket server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:seed         # Seed database with test data

# Building
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
npm run lint            # Run ESLint
```

## Security Features

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

## Performance Features

### Optimization
- Next.js built-in caching
- Database query optimization
- API response caching
- Static asset optimization
- Code splitting and lazy loading

### Real-time Performance
- WebSocket connection pooling
- Efficient event broadcasting
- Minimal data transfer
- Connection management

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

## Deployment

### Production Environment
- **Frontend**: Vercel deployment
- **Database**: External MySQL service
- **WebSocket**: Separate server (Railway/Render)
- **Email**: Resend service

### Environment Configuration
- Production environment variables
- Database connection strings
- Email service configuration
- WebSocket server URL

## Support and Maintenance

### Code Quality
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

## Additional Resources

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Internal Resources
- Code review process
- Team coding standards
- Architecture decisions
- Performance benchmarks

---

**Last Updated**: 2025-01-27  
**Documentation Version**: 1.0  
**Project Version**: 0.1.0
