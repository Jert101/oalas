import { NextResponse } from "next/server"

// GET /api/db-test - Test database connection
export async function GET() {
  try {
    // Try to import and use Prisma
    const { prisma } = await import("@/lib/prisma")
    
    // Simple query to test connection
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      status: "Database connection successful",
      userCount,
      timestamp: new Date().toISOString()
    }, { status: 200 })

  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json({
      status: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
