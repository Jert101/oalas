import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { RowDataPacket } from "mysql2"

export const dynamic = 'force-dynamic'

export async function GET() {
  // Lazy import mysql2/promise to avoid bundling issues on edge (we're in node runtime)
  let mysqlOk = false
  let mysqlError: string | null = null
  let prismaOk = false
  let prismaError: string | null = null
  let envInfo: Record<string, any> = {}

  try {
    const mysql = await import("mysql2/promise")
    const hasDsn = !!process.env.DATABASE_URL
    const hasDiscrete = !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASS && process.env.DB_NAME)

    envInfo = {
      DATABASE_URL_set: hasDsn,
      PRISMA_URL_SOURCE: process.env.PRISMA_URL_SOURCE || "unknown",
      DB_HOST_set: !!process.env.DB_HOST,
      DB_PORT_set: !!process.env.DB_PORT,
      DB_USER_set: !!process.env.DB_USER,
      DB_NAME_set: !!process.env.DB_NAME
    }

    // Use the same logic as src/lib/db.ts for mysql2 test
    let pool
    if (hasDsn) {
      const dsn = process.env.DATABASE_URL!.includes("?")
        ? process.env.DATABASE_URL!
        : `${process.env.DATABASE_URL}?ssl=false`
      pool = mysql.createPool(dsn)
    } else if (hasDiscrete) {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 2,
      })
    } else {
      throw new Error("No DATABASE_URL or DB_* vars set")
    }

    const [rows] = await pool.query<RowDataPacket[]>("SELECT 1 AS ok")
    mysqlOk = Array.isArray(rows)
    await pool.end()
  } catch (e: any) {
    mysqlOk = false
    mysqlError = e?.message || String(e)
  }

  try {
    // Simple raw query avoids schema mismatch errors
    const rows: any = await prisma.$queryRawUnsafe("SELECT 1 AS ok")
    prismaOk = true
  } catch (e: any) {
    prismaOk = false
    prismaError = e?.message || String(e)
  }

  const status = mysqlOk && prismaOk ? 200 : 500
  return NextResponse.json({
    success: mysqlOk && prismaOk,
    mysql: { ok: mysqlOk, error: mysqlError },
    prisma: { ok: prismaOk, error: prismaError },
    env: envInfo,
    timestamp: new Date().toISOString()
  }, { status })
}
