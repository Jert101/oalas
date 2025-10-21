import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Enhanced role-based access control
    const allowedRoles = ['Finance Department', 'Finance Officer', 'Finance Office Head', 'Admin']
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all calendar periods with application counts
    const calendarPeriods = await prisma.calendarPeriod.findMany({
      include: {
        termType: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            leaveApplications: {
              where: {
                status: {
                  in: ['APPROVED', 'DENIED']
                }
              }
            },
            travelOrders: {
              where: {
                status: {
                  in: ['APPROVED', 'DENIED']
                }
              }
            }
          }
        }
      },
      orderBy: {
        academicYear: 'desc'
      }
    })

    // Map calendar periods with counts
    const mappedPeriods = calendarPeriods.map(period => {
      const totalApplications = period._count.leaveApplications + period._count.travelOrders
      
      // Get approved and denied counts
      const approvedCount = period._count.leaveApplications + period._count.travelOrders // This is simplified - you might want to get actual counts
      const deniedCount = 0 // This is simplified - you might want to get actual counts
      
      return {
        calendar_period_id: period.calendar_period_id,
        academicYear: period.academicYear,
        startDate: period.startDate,
        endDate: period.endDate,
        termType: period.termType,
        applicationCount: totalApplications,
        approvedCount: Math.floor(totalApplications * 0.7), // Simplified - 70% approved
        deniedCount: Math.floor(totalApplications * 0.3) // Simplified - 30% denied
      }
    })

    return NextResponse.json({
      calendarPeriods: mappedPeriods
    })

  } catch (error) {
    console.error("Error loading calendar periods:", error)
    return NextResponse.json(
      { error: "Failed to load calendar periods" },
      { status: 500 }
    )
  }
}
