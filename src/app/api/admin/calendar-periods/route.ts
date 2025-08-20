import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/calendar-periods - Get all calendar periods
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const calendarPeriods = await prisma.calendarPeriod.findMany({
      include: {
        termType: true
      },
      orderBy: [
        { isCurrent: 'desc' },
        { startDate: 'desc' }
      ]
    })

    return NextResponse.json(calendarPeriods, { status: 200 })
  } catch (error) {
    console.error("Error fetching calendar periods:", error)
    return NextResponse.json(
      { error: "Failed to fetch calendar periods" },
      { status: 500 }
    )
  }
}

// POST /api/admin/calendar-periods - Create new calendar period
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { academicYear, term, startDate, endDate } = body

    // Validate required fields
    if (!academicYear || !term || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate term and convert old format to new format if needed
    let termName = term
    if (term === "ACADEMIC") {
      termName = "Academic"
    } else if (term === "SUMMER") {
      termName = "Summer"
    }
    
    if (!["Academic", "Summer"].includes(termName)) {
      return NextResponse.json(
        { error: "Invalid term type" },
        { status: 400 }
      )
    }

    // Get the term type ID
    const termType = await prisma.termType.findUnique({
      where: { name: termName }
    })

    if (!termType) {
      return NextResponse.json(
        { error: "Term type not found" },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      )
    }

    // Check for overlapping periods
    const overlapping = await prisma.calendarPeriod.findFirst({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              {
                AND: [
                  { startDate: { lte: start } },
                  { endDate: { gte: start } }
                ]
              },
              {
                AND: [
                  { startDate: { lte: end } },
                  { endDate: { gte: end } }
                ]
              },
              {
                AND: [
                  { startDate: { gte: start } },
                  { endDate: { lte: end } }
                ]
              }
            ]
          }
        ]
      }
    })

    if (overlapping) {
      return NextResponse.json(
        { error: "Calendar period overlaps with existing period" },
        { status: 400 }
      )
    }

    // Create the calendar period and set it as current
    const result = await prisma.$transaction(async (tx) => {
      // First, set all existing periods to not current
      await tx.calendarPeriod.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false }
      })

      // Then create the new period as current
      const calendarPeriod = await tx.calendarPeriod.create({
        data: {
          academicYear,
          startDate: start,
          endDate: end,
          isCurrent: true, // Automatically set as current
          isActive: true,
          termType: {
            connect: { term_type_id: termType.term_type_id }
          }
        }
      })

      return calendarPeriod
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating calendar period:", error)
    return NextResponse.json(
      { error: "Failed to create calendar period" },
      { status: 500 }
    )
  }
}
