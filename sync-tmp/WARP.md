# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: OALASS (Online Application for Leave of Absence System)

Commands you’ll use often

- Install deps
  - npm install
- Start development
  - Next.js only: npm run dev
  - Next.js + WebSocket (recommended): npm run dev:full
  - Windows helper: start-dev.bat
  - Start WebSocket server manually: node websocket-server.js (port 3001)
- Build/serve
  - Build: npm run build
  - Start (prod): npm start
- Lint
  - npm run lint
- Database (Prisma + MySQL)
  - Generate Prisma Client: npm run db:generate
  - Push schema to DB: npm run db:push
  - Seed base data: npm run db:seed
  - Seed admin only: npm run db:seed:admin
  - Seed leave fields: npm run db:seed:leave-fields
  - Reset DB (destructive): npm run db:reset
- Environment switching (from README)
  - node scripts/switch-env.js localhost
  - node scripts/switch-env.js deployed
- Run a single test script
  - node test-db-connection.js
  - node test-login.js
  - Many endpoint checks are simple Node scripts (e.g., node test-leave-system.js). Some files like test-api.js are meant to be pasted/run in the browser console while the dev server is running.

Key environment variables

- DATABASE_URL for Prisma (MySQL). See XAMPP_SETUP.md for local MySQL config and examples.
- NEXT_PUBLIC_WS_URL (optional) for overriding WebSocket endpoint; defaults to ws://localhost:3001.
- OAuth credentials (e.g., GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET) are read when present.

High-level architecture

- Framework and runtime
  - Next.js (App Router) with TypeScript under src/app. Tailwind v4 and shadcn/ui used for UI components (see components/ui/* and components.json).
  - Build config lives in next.config.ts (performance/caching/headers/webpack splitChunks) with a simpler next.config.js that ignores type/lint errors during builds. tsconfig.json provides @/* path alias to ./src/*.

- Authentication and session
  - NextAuth with PrismaAdapter (src/lib/auth.ts).
    - Google OAuth enabled and constrained to ckcm.edu.ph domain in sign-in callback logic; GitHub optional if env vars are present; a Credentials provider supports email/password via bcrypt.
    - JWT sessions store role, isDepartmentHead, userId, and normalized profilePicture. Session callback re-reads profilePicture from DB each time to ensure freshness.
    - Custom redirect behavior preserves intended destination; custom pages map sign-in/error screens to the app.

- Database and data access
  - MySQL database via Prisma (prisma/schema.prisma; datasource db uses env(DATABASE_URL)). The schema models users/roles/departments/statuses, leave applications and balances, term types and leave limits, travel orders, notifications, probations, and setup requests. Important compound uniques and indexes exist on leave balances and limits for efficient lookups.
  - Prisma client wrapper at src/lib/prisma.ts (singleton across dev reloads).
  - A small mysql2/promise pool in src/lib/db.ts for direct SQL when needed.
  - Seeding: prisma/seed.ts plus focused seeders (admin-seeder.ts, leave-fields-seeder.ts). DB migrations are present under prisma/migrations.

- API boundaries (Next.js route handlers)
  - API routes live beneath src/app/api/**/route.ts using the App Router conventions. They’re organized by domain and role:
    - Admin: accounts, departments, roles/role-categories, term-types/leave-types, dashboards, calendar-periods, recent-activity, initialization.
    - Teacher: leave types/limits/balances, applications (create/list/detail), travel order, recent/archived/current views.
    - Dean/Finance: dashboards, approvals, per-application approve/reject flows, faculty and department data.
    - Auth: [...nextauth] for NextAuth, verify-email, setup-account, change-password, update-session, and small health/test routes.
  - Route files prefer Prisma; some helpers exist in src/lib for shared validation, caching, gmail/email services, API clients, and Zod validators.

- Real-time updates (WebSocket sidecar)
  - A standalone WebSocket/Express server (websocket-server.js) runs on port 3001.
    - Keeps a map of connected clients and per-user subscriptions; supports event types like notification, dashboard_update, application_update, user_update, leave_balance_update, faculty_update, department_update, calendar_update, account_approval_update.
    - Exposes HTTP endpoints (e.g., POST /api/realtime/notify) to broadcast events to specific users.
  - The browser client is src/lib/realtime-client.ts with a RealtimeProvider (src/components/realtime-provider.tsx) that connects using the authenticated user’s id and dispatches events to page-level callbacks. Basic heartbeat/ping/pong, reconnects with exponential backoff, and toast notifications via sonner.

- Frontend app structure
  - src/app contains multiple role-focused sections (admin, dean, finance, teacher), each with pages and nested segments. Shared UI lives in src/components (sidebars, nav, tables, dialogs) and components/ui/* (shadcn primitives). Zod schemas/types for forms are colocated (e.g., teacher/leave/_components/schemas.ts).
  - Middleware present (middleware.ts) to handle auth/redirects; some backups exist (middleware-new.ts, middleware-backup.ts).

- Email/notifications
  - EmailService (src/lib/email-service.ts) provides structured email builders and logs content in development. gmail-service.ts and real-email-service.ts exist for integration; notification-service coordinates DB notifications and optionally pushes real-time events.

- Deployment
  - vercel.json defines framework, install/build commands, and PRISMA_CLI_QUERY_ENGINE_TYPE=binary to align Prisma with Vercel builds.

Important references in-repo

- README.md: includes environment switching workflow using scripts/switch-env.js and basic Next.js dev instructions.
- WEBSOCKET_SETUP.md: details how to start both servers (npm run dev:full), status checks, and troubleshooting.
- XAMPP_SETUP.md: local MySQL setup, DATABASE_URL examples, and Prisma push/seed instructions.

Working notes for Warp

- Start both servers during local development for full functionality (npm run dev:full); the app will degrade gracefully without the WebSocket server, but real-time indicators won’t update.
- Many “tests” are simple Node scripts that assume http://localhost:3000. Ensure the dev server is running before invoking them. Some test files (e.g., test-api.js) are intended for the browser console rather than Node.
- Builds are configured to ignore TypeScript and ESLint errors via next.config.js. The main next.config.ts adds performance and caching headers and a splitChunks strategy.
