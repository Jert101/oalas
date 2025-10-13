This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment switching

Use separate env presets for local vs deployed:

- `.env.localhost` – points to local DB/services
- `.env.deployed` – points to deployed DB/services

Back up current `.env` and switch:

```bash
node scripts/switch-env.js localhost
# or
node scripts/switch-env.js deployed
```

The script will back up the existing `.env` to `.env.backup-YYYYMMDDHHmmss` and then copy the chosen preset into `.env`.

---

## Deployment and Operations

### Prerequisites
- Node.js 18+ and npm
- MySQL database (DATABASE_URL in .env)
- GitHub repository (this repo)

### Required environment variables
Create a .env file with at least:

```bash
# Database (MySQL)
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DB_NAME"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="{{NEXTAUTH_SECRET}}"

# Google OAuth (CKCM domain restriction implemented in code)
GOOGLE_CLIENT_ID="{{GOOGLE_CLIENT_ID}}"
GOOGLE_CLIENT_SECRET="{{GOOGLE_CLIENT_SECRET}}"
# Optional: override consent behavior
GOOGLE_OAUTH_PROMPT="select_account"

# Optional GitHub OAuth
GITHUB_CLIENT_ID="{{GITHUB_CLIENT_ID}}"
GITHUB_CLIENT_SECRET="{{GITHUB_CLIENT_SECRET}}"

# Emails (Resend)
RESEND_API_KEY="{{RESEND_API_KEY}}"
FROM_EMAIL="noreply@your-domain"

# Realtime/WebSocket server
WEBSOCKET_SERVER_URL="http://localhost:3001"
```

### Local setup
```bash
# 1) Install dependencies
npm install

# 2) Generate Prisma client and sync schema
npm run db:generate
npm run db:push

# 3) (Optional) Seed baseline data
npm run db:seed:admin
npm run db:seed:leave-fields

# 4) Run app + websocket server together (dev)
npm run dev:full
# App: http://localhost:3000
# WS API: http://localhost:3001/api/realtime
```

### Production deployment (Vercel + external WebSocket)
Vercel does not host persistent WebSocket servers. Deploy websocket-server.js to a separate host (e.g., Railway/Render/VPS):

```bash
# On your WS host
PORT=3001 node websocket-server.js
```

- Set WEBSOCKET_SERVER_URL in your app environment to the deployed WS URL
- In Vercel, configure environment variables listed above
- Build command: prisma generate && next build
- Start command (Vercel uses next start automatically)

### Database migrations
- During development: npm run db:push
- For stricter change control, create migrations and run via Prisma migrate

### Troubleshooting
- Authentication: ensure NEXTAUTH_URL matches your deployed domain
- Google OAuth: redirect URIs must include /api/auth/callback/google
- Emails: verify RESEND_API_KEY and FROM_EMAIL
- Realtime: ensure websocket server is reachable and WEBSOCKET_SERVER_URL is set
