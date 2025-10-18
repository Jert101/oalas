import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Test database connection
    const roleCount = await prisma.role.count()
    const departmentCount = await prisma.department.count()
    const statusCount = await prisma.status.count()
    
    return NextResponse.json({
      message: "Database connection successful",
      data: {
        roles: roleCount,
        departments: departmentCount,
        statuses: statusCount
      }
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      { error: "Database connection failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
