import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { PrismaClient } from "@prisma/client"

// PATCH /api/admin/calendar-periods/[id]/set-current - Set period as current
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const periodId = parseInt(id)
    
    if (isNaN(periodId)) {
      return NextResponse.json(
        { error: "Invalid period ID" },
        { status: 400 }
      )
    }

    // Check if the period exists
    const period = await prisma.calendarPeriod.findUnique({
      where: { calendar_period_id: periodId }
    })

    if (!period) {
      return NextResponse.json(
        { error: "Calendar period not found" },
        { status: 404 }
      )
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      // First, set all periods to not current
      await tx.calendarPeriod.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false }
      })

      // Then set the specified period as current
      const updatedPeriod = await tx.calendarPeriod.update({
        where: { calendar_period_id: periodId },
        data: { isCurrent: true }
      })

      return updatedPeriod
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error setting current period:", error)
    return NextResponse.json(
      { error: "Failed to set current period" },
      { status: 500 }
    )
  }
}
