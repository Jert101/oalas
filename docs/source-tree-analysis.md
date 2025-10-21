# Source Tree Analysis - OALASS

## Project Structure Overview

```
oalass/
├── src/                          # Source code directory
│   ├── app/                      # Next.js App Router pages and API routes
│   │   ├── (auth)/               # Authentication pages (grouped)
│   │   ├── admin/                # Admin dashboard and management
│   │   ├── api/                  # API routes and endpoints
│   │   ├── dean/                 # Dean/Program Head interface
│   │   ├── finance/              # Finance department interface
│   │   ├── non-teaching-staff/   # Non-teaching staff interface
│   │   ├── teacher/              # Teacher interface
│   │   ├── dashboard/            # Main dashboard
│   │   ├── leave-application/    # Leave application form
│   │   └── login/                # Login page
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── admin/                # Admin-specific components
│   │   └── [shared components]   # Shared components
│   ├── lib/                      # Utility functions and services
│   ├── hooks/                    # Custom React hooks
│   └── types/                    # TypeScript type definitions
├── prisma/                       # Database schema and migrations
├── public/                       # Static assets
├── docs/                         # Documentation
└── [config files]                # Configuration files
```

## Critical Directories Analysis

### `/src/app/` - Next.js App Router

**Purpose**: Contains all pages and API routes using Next.js 14 App Router architecture.

**Key Subdirectories**:

#### `/src/app/api/` - API Routes
```
api/
├── account/                      # Account management endpoints
├── admin/                        # Admin management endpoints
│   ├── users/                    # User CRUD operations
│   ├── departments/              # Department management
│   ├── roles/                    # Role management
│   ├── leave-types/              # Leave type configuration
│   ├── term-types/               # Term type management
│   ├── manage-leave-limits/      # Leave limits configuration
│   └── manage-probation/         # Probation management
├── auth/                         # Authentication endpoints
│   ├── [...nextauth]/           # NextAuth.js configuration
│   ├── signin/                   # Sign in endpoint
│   ├── signout/                  # Sign out endpoint
│   └── [password reset routes]   # Password reset functionality
├── dean/                         # Dean/Program Head endpoints
│   ├── applications/             # Application management
│   ├── reports/                  # Reporting and analytics
│   ├── archive/                  # Archived applications
│   └── pending-rejections/       # Pending rejection handling
├── finance/                      # Finance department endpoints
│   ├── applications/              # Application processing
│   ├── reports/                  # Financial reports
│   ├── archive/                  # Archived applications
│   └── export/                   # Data export functionality
├── teacher/                      # Teacher endpoints
│   ├── leave-applications/       # Leave application management
│   ├── travel-orders/           # Travel order management
│   └── dashboard/                # Teacher dashboard data
├── leave-balance/                # Leave balance management
├── notifications/                # Notification system
├── files/                        # File upload and serving
└── websocket/                    # WebSocket communication
```

#### `/src/app/admin/` - Admin Interface
```
admin/
├── dashboard/                    # Admin dashboard
├── manage-accounts/              # User account management
├── departments/                  # Department management
├── roles/                        # Role management
├── leave-types/                  # Leave type configuration
├── term-types/                   # Term type management
├── manage-leave-limits/          # Leave limits configuration
├── manage-probation/             # Probation management
├── calendar-settings/            # Calendar configuration
└── debug/                        # Debug tools
```

#### `/src/app/dean/` - Dean Interface
```
dean/
├── dashboard/                    # Dean dashboard
├── applications/                 # Application management
├── approvals/                    # Approval workflow
├── reports/                      # Reporting and analytics
├── archive/                      # Archived applications
├── faculty/                      # Faculty management
├── calendar/                     # Calendar view
└── activity/                     # Activity tracking
```

#### `/src/app/finance/` - Finance Interface
```
finance/
├── dashboard/                    # Finance dashboard
├── applications/                 # Application processing
├── approvals/                    # Approval workflow
├── reports/                      # Financial reports
├── archive/                      # Archived applications
├── departments/                  # Department management
├── faculty/                      # Faculty management
└── calendar/                     # Calendar view
```

#### `/src/app/teacher/` - Teacher Interface
```
teacher/
├── dashboard/                    # Teacher dashboard
├── leave/                        # Leave management
│   ├── applications/             # Leave applications
│   ├── history/                  # Application history
│   ├── balance/                  # Leave balance
│   └── calendar/                 # Personal calendar
└── layout.tsx                    # Teacher layout
```

### `/src/components/` - UI Components

**Purpose**: Reusable React components organized by functionality.

**Key Subdirectories**:

#### `/src/components/ui/` - shadcn/ui Components
```
ui/
├── button.tsx                    # Button component
├── input.tsx                     # Input component
├── form.tsx                      # Form components
├── table.tsx                     # Table component
├── dialog.tsx                    # Dialog component
├── dropdown-menu.tsx             # Dropdown menu
├── toast.tsx                     # Toast notifications
└── [other shadcn components]     # Additional UI components
```

#### `/src/components/admin/` - Admin Components
```
admin/
├── term-type-form.tsx            # Term type form
├── term-type-table.tsx           # Term type table
└── [other admin components]     # Admin-specific components
```

#### Shared Components
```
├── app-sidebar.tsx               # Main application sidebar
├── session-provider.tsx          # Session context provider
├── realtime-provider.tsx         # Real-time updates provider
├── notification-bell.tsx         # Notification component
├── data-table.tsx                # Data table component
├── chart-area-interactive.tsx    # Interactive charts
├── login-form.tsx                # Login form
├── theme-toggle.tsx              # Theme switcher
└── [other shared components]     # Additional shared components
```

### `/src/lib/` - Utility Functions and Services

**Purpose**: Core business logic, utilities, and service functions.

**Key Files**:

#### Authentication & Authorization
```
├── auth.ts                       # NextAuth configuration
├── actions/auth.ts               # Authentication actions
└── validators/auth.ts            # Authentication validators
```

#### Database & ORM
```
├── prisma.ts                     # Prisma client configuration
├── db.ts                         # Database utilities
└── seed.ts                       # Database seeding
```

#### Services
```
├── email-service.ts              # Email service
├── gmail-service.ts              # Gmail integration
├── notification-service.ts       # Notification system
├── leave-balance-initializer.ts  # Leave balance calculations
├── validation-service.ts         # Validation utilities
└── realtime-client.ts            # Real-time communication
```

#### Utilities
```
├── utils.ts                      # General utilities
├── api-client.ts                 # API client
├── cache.ts                      # Caching utilities
├── performance-monitor.ts        # Performance monitoring
└── role-display.ts               # Role display utilities
```

### `/src/hooks/` - Custom React Hooks

**Purpose**: Reusable React hooks for common functionality.

```
hooks/
├── use-mobile.ts                 # Mobile detection hook
├── use-realtime.ts               # Real-time updates hook
└── useGoogleAvatar.ts            # Google avatar hook
```

### `/src/types/` - TypeScript Definitions

**Purpose**: TypeScript type definitions and interfaces.

```
types/
└── next-auth.d.ts                # NextAuth type extensions
```

## Entry Points

### Main Application Entry
- **File**: `src/app/layout.tsx`
- **Purpose**: Root layout with providers and global configuration
- **Key Features**: Session provider, theme provider, real-time provider

### Authentication Entry
- **File**: `src/app/api/auth/[...nextauth]/route.ts`
- **Purpose**: NextAuth.js configuration and authentication routes
- **Key Features**: Google OAuth, JWT tokens, session management

### WebSocket Server Entry
- **File**: `websocket-server.js`
- **Purpose**: Real-time communication server
- **Key Features**: WebSocket connections, real-time updates, notification broadcasting

## Critical Files for Understanding the System

### Configuration Files
- **`package.json`** - Dependencies and scripts
- **`next.config.js`** - Next.js configuration
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`tsconfig.json`** - TypeScript configuration
- **`prisma/schema.prisma`** - Database schema

### Core Business Logic
- **`src/lib/auth.ts`** - Authentication configuration
- **`src/lib/prisma.ts`** - Database connection
- **`src/lib/notification-service.ts`** - Notification system
- **`src/lib/leave-balance-initializer.ts`** - Leave balance calculations

### API Routes
- **`src/app/api/teacher/leave-applications/`** - Teacher leave management
- **`src/app/api/dean/applications/`** - Dean approval workflow
- **`src/app/api/finance/applications/`** - Finance approval workflow
- **`src/app/api/notifications/`** - Notification system

### Database Models
- **`prisma/schema.prisma`** - Complete database schema
- **`prisma/seed.ts`** - Database seeding
- **`prisma/admin-seeder.ts`** - Admin user seeding

## Integration Points

### Frontend-Backend Integration
- **API Routes**: Next.js API routes handle backend logic
- **Database**: Prisma ORM for database operations
- **Authentication**: NextAuth.js for session management
- **Real-time**: WebSocket server for live updates

### External Service Integration
- **Email**: NodeMailer with Gmail SMTP
- **Authentication**: Google OAuth
- **File Storage**: Local file system with secure serving
- **Real-time**: Custom WebSocket server

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database
npm run db:seed

# Start development server
npm run dev:full
```

### File Organization Patterns
- **Pages**: Route-based organization in `src/app/`
- **Components**: Feature-based organization in `src/components/`
- **API Routes**: Resource-based organization in `src/app/api/`
- **Utilities**: Service-based organization in `src/lib/`

### Code Structure Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Git Hooks**: Pre-commit quality checks

## Security Considerations

### Authentication Flow
```
User Login → NextAuth.js → JWT Token → API Authorization
```

### File Access
```
File Upload → Authentication Check → Secure Storage → Authenticated Serving
```

### API Protection
```
API Request → Middleware → Role Check → Route Access
```

## Performance Optimization

### Code Splitting
- Route-based code splitting with Next.js
- Component-level lazy loading
- Dynamic imports for heavy components

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
