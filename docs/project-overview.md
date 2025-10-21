# OALASS - Project Overview

## Project Information

- **Project Name:** OALASS (Online Academic Leave Application System)
- **Type:** Web Application (Next.js 14)
- **Architecture:** Monolith with comprehensive RBAC system
- **Primary Language:** TypeScript
- **Framework:** Next.js 14 with App Router

## Executive Summary

The Online Academic Leave Application System (OALASS) is a comprehensive web-based platform built with Next.js 14 that manages academic leave applications for the College of Knowledge and Computer Management (CKCM). The system implements role-based access control (RBAC) with multiple user roles including Admin, Dean/Program Head, Department Head, Teacher/Instructor, Non-Teaching Personnel, and various specialized staff roles.

## Technology Stack Summary

| Category | Technology | Version | Notes |
|----------|------------|---------|-------|
| Frontend Framework | Next.js | 14 | App Router architecture |
| UI Framework | React | 19.1.0 | With TypeScript |
| Styling | Tailwind CSS | 4 | With shadcn/ui components |
| Authentication | NextAuth.js | 4.24.11 | With bcryptjs and JWT |
| Database | MySQL | - | Via Prisma ORM |
| Validation | Zod | 4.0.15 | Schema validation |
| Forms | React Hook Form | 7.62.0 | Form management |
| Notifications | React Hot Toast | 2.5.2 | + Custom WebSocket system |
| Email Service | NodeMailer | 6.10.1 | With Gmail SMTP |
| State Management | Zustand | - | Optional |
| Real-time | WebSocket | 8.18.3 | Custom Node.js server |
| File Handling | Formidable | - | Multipart uploads |

## Architecture Type Classification

- **Repository Structure:** Monolith
- **Package Manager:** npm
- **Architecture Pattern:** MVC with API Routes
- **Database Pattern:** Relational with Prisma ORM
- **Authentication Pattern:** JWT with NextAuth.js
- **Real-time Pattern:** WebSocket with custom server

## Key Features

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

## Repository Structure

```
oalass/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin dashboard and management
│   │   ├── api/               # API routes
│   │   ├── dean/              # Dean/Program Head interface
│   │   ├── finance/           # Finance department interface
│   │   ├── teacher/           # Teacher interface
│   │   └── non-teaching-staff/ # Non-teaching staff interface
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utility functions and services
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── docs/                      # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL database
- npm package manager

### Installation
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed baseline data (optional)
npm run db:seed:admin
npm run db:seed:leave-fields

# Start development server
npm run dev:full
```

### Environment Variables
```bash
# Database
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DB_NAME"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Email Service
RESEND_API_KEY="your-resend-key"
FROM_EMAIL="noreply@your-domain"

# WebSocket Server
WEBSOCKET_SERVER_URL="http://localhost:3001"
```

## Links to Detailed Documentation

- [Architecture Documentation](./architecture.md)
- [API Contracts](./api-contracts.md)
- [Database Schema](./data-models.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Source Tree Analysis](./source-tree-analysis.md)
