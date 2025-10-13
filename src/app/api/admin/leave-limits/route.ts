import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/leave-limits - Get all leave limits
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leaveLimits = await prisma.leaveLimit.findMany({
      include: {
        status: {
          select: {
            status_id: true,
            name: true
          }
        },
        leaveType: {
          select: {
            leave_type_id: true,
            name: true
          }
        },
        termType: {
          select: {
            term_type_id: true,
            name: true
          }
        }
      },
      orderBy: [
        { status_id: 'asc' },
        { term_type_id: 'asc' },
        { leave_type_id: 'asc' }
      ]
    })

    return NextResponse.json(leaveLimits, { status: 200 })
  } catch (error) {
    console.error("Error fetching leave limits:", error)
    return NextResponse.json(
      { error: "Failed to fetch leave limits" },
      { status: 500 }
    )
  }
}

// POST /api/admin/leave-limits - Create new leave limit
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status_id, term_type_id, leave_type_id, daysAllowed } = body

    // Validate required fields
    if (!status_id || !term_type_id || !leave_type_id || daysAllowed === undefined || daysAllowed === null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate days allowed
    if (daysAllowed < 0) {
      return NextResponse.json(
        { error: "Days allowed must be at least 0" },
        { status: 400 }
      )
    }

    // Check if status exists
    const status = await prisma.status.findUnique({
      where: { status_id: parseInt(status_id) }
    })

    if (!status) {
      return NextResponse.json(
        { error: "Status not found" },
        { status: 404 }
      )
    }

    // Check if term type exists
    const termType = await prisma.termType.findUnique({
      where: { term_type_id: parseInt(term_type_id) }
    })

    if (!termType) {
      return NextResponse.json(
        { error: "Term type not found" },
        { status: 404 }
      )
    }

    // Check if leave type exists
    const leaveType = await prisma.leave_types.findUnique({
      where: { leave_type_id: parseInt(leave_type_id) }
    })

    if (!leaveType) {
      return NextResponse.json(
        { error: "Leave type not found" },
        { status: 404 }
      )
    }

    // Check for duplicate combination
    const existingLimit = await prisma.leaveLimit.findFirst({
      where: {
        status_id: parseInt(status_id),
        term_type_id: parseInt(term_type_id),
        leave_type_id: parseInt(leave_type_id)
      }
    })

    if (existingLimit) {
      return NextResponse.json(
        { error: "Leave limit already exists for this combination" },
        { status: 400 }
      )
    }

    // Create the leave limit
    const leaveLimit = await prisma.leaveLimit.create({
      data: {
        status_id: parseInt(status_id),
        term_type_id: parseInt(term_type_id),
        leave_type_id: parseInt(leave_type_id),
        daysAllowed: parseInt(daysAllowed),
        isActive: true
      },
      include: {
        status: {
          select: {
            status_id: true,
            name: true
          }
        },
        leaveType: {
          select: {
            leave_type_id: true,
            name: true
          }
        },
        termType: {
          select: {
            term_type_id: true,
            name: true
          }
        }
      }
    })

    // Automatically create/update leave balances for all users with this status
    console.log(`🔄 Creating leave balances for users with status: ${status.name}`)
    try {
      // Get current calendar period
      const currentPeriod = await prisma.calendarPeriod.findFirst({
        where: { isCurrent: true }
      })

      if (currentPeriod) {
        // Get all active users with this status
        const usersWithStatus = await prisma.user.findMany({
          where: {
            status_id: parseInt(status_id),
            isActive: true
          }
        })

        console.log(`👥 Found ${usersWithStatus.length} users with status: ${status.name}`)

        // Create or update leave balances for each user
        for (const user of usersWithStatus) {
          try {
            // Check if balance already exists
            const existingBalance = await prisma.leaveBalance.findFirst({
              where: {
                users_id: user.users_id,
                calendar_period_id: currentPeriod.calendar_period_id,
                leave_type_id: parseInt(leave_type_id)
              }
            })

            if (existingBalance) {
              // Update existing balance
              await prisma.leaveBalance.update({
                where: {
                  leave_balance_id: existingBalance.leave_balance_id
                },
                data: {
                  allowedDays: parseInt(daysAllowed),
                  remainingDays: parseInt(daysAllowed) - existingBalance.usedDays
                }
              })
              console.log(`   ✅ Updated leave balance for ${user.name}`)
            } else {
              // Create new balance
              await prisma.leaveBalance.create({
                data: {
                  users_id: user.users_id,
                  calendar_period_id: currentPeriod.calendar_period_id,
                  status_id: parseInt(status_id),
                  term_type_id: parseInt(term_type_id),
                  leave_type_id: parseInt(leave_type_id),
                  allowedDays: parseInt(daysAllowed),
                  usedDays: 0,
                  remainingDays: parseInt(daysAllowed)
                }
              })
              console.log(`   ✅ Created leave balance for ${user.name}`)
            }
          } catch (error) {
            console.error(`   ❌ Failed to update leave balance for ${user.name}:`, error.message)
          }
        }
      } else {
        console.log('⚠️ No current calendar period found - leave balances not updated')
      }
    } catch (error) {
      console.error('❌ Error updating leave balances:', error)
      // Don't fail the leave limit creation if balance update fails
    }

    return NextResponse.json(leaveLimit, { status: 201 })
  } catch (error) {
    console.error("Error creating leave limit:", error)
    return NextResponse.json(
      { error: "Failed to create leave limit" },
      { status: 500 }
    )
  }
}
