import { PrismaClient } from '@prisma/client'

// Build DATABASE_URL from discrete DB_* environment variables if not provided.
// This helps in VPS deployments where only DB_HOST/DB_USER/DB_PASS/DB_NAME are set.
function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    const host = process.env.DB_HOST || '127.0.0.1'
    const port = process.env.DB_PORT || '3306'
    const user = process.env.DB_USER
    const pass = process.env.DB_PASS
    const db   = process.env.DB_NAME

    if (user && pass && db) {
      const enc = encodeURIComponent
      const url = `mysql://${enc(user)}:${enc(pass)}@${host}:${port}/${db}`
      process.env.DATABASE_URL = url
      process.env.PRISMA_URL_SOURCE = 'db_vars'
      // Safe log (no secrets)
      console.log('[Prisma] DATABASE_URL synthesized from DB_* vars:', {
        host,
        port,
        db
      })
    } else {
      process.env.PRISMA_URL_SOURCE = 'missing'
      console.warn('[Prisma] DATABASE_URL is not set and DB_* vars are incomplete. Expected DB_HOST, DB_USER, DB_PASS, DB_NAME.')
    }
  } else {
    process.env.PRISMA_URL_SOURCE = 'database_url'
  }
}

ensureDatabaseUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
