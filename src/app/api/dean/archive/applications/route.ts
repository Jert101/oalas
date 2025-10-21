import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for archive parameters
const archiveParamsSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  calendarPeriod: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  type: z.string().nullable().optional()
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Enhanced role-based access control
    const allowedRoles = ['Dean/Program Head', 'Department Head', 'Admin']
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get dean's department
    const dean = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { department: true }
    })

    if (!dean?.department_id) {
      return NextResponse.json({ error: "Dean department not found" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const params = archiveParamsSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      calendarPeriod: searchParams.get('calendarPeriod') || null,
      status: searchParams.get('status') || null,
      type: searchParams.get('type') || null
    })

    // Build filter object
    const filters: any = {
      status: {
        in: ['APPROVED', 'DENIED']
      },
      user: {
        department_id: dean.department_id
      }
    }

    // Calendar period filter
    if (params.calendarPeriod && params.calendarPeriod !== 'all') {
      filters.calendar_period_id = parseInt(params.calendarPeriod)
    }

    // Status filter
    if (params.status && params.status !== 'all') {
      filters.status = params.status
    }

    // Application type filter (for leave applications)
    if (params.type && params.type !== 'all') {
      if (params.type === 'leave') {
        filters._applicationType = 'leave'
      } else if (params.type === 'travel') {
        filters._applicationType = 'travel'
      }
    }

    // Get leave applications with filters
    const leaveApplications = await prisma.leaveApplication.findMany({
      where: {
        ...filters,
        status: filters.status
      },
      include: {
        user: {
          select: {
            users_id: true,
            name: true,
            email: true,
            profilePicture: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        leaveType: {
          select: {
            name: true
          }
        },
        reviewer: {
          select: {
            name: true
          }
        },
        calendarPeriod: {
          select: {
            calendar_period_id: true,
            academicYear: true,
            startDate: true,
            endDate: true,
            termType: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        reviewedAt: 'desc'
      }
    })

    // Get travel orders with filters
    const travelOrders = await prisma.travelOrder.findMany({
      where: {
        ...filters,
        status: filters.status
      },
      include: {
        user: {
          select: {
            users_id: true,
            name: true,
            email: true,
            profilePicture: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        reviewer: {
          select: {
            name: true
          }
        },
        calendarPeriod: {
          select: {
            calendar_period_id: true,
            academicYear: true,
            startDate: true,
            endDate: true,
            termType: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        reviewedAt: 'desc'
      }
    })

    // Combine applications
    let allApplications = [
      ...leaveApplications.map(app => ({ ...app, type: 'leave' })),
      ...travelOrders.map(order => ({ ...order, type: 'travel' }))
    ]

    // Apply application type filter if specified
    if (filters._applicationType) {
      allApplications = allApplications.filter(app => app.type === filters._applicationType)
    }

    // Calculate pagination
    const page = parseInt(params.page)
    const limit = parseInt(params.limit)
    const skip = (page - 1) * limit
    const totalCount = allApplications.length
    const paginatedApplications = allApplications.slice(skip, skip + limit)

    // Map applications to response format
    const mappedApplications = paginatedApplications.map(app => ({
      id: app.type === 'leave' ? app.leave_application_id : app.travel_order_id,
      type: app.type,
      user: {
        users_id: app.user.users_id,
        name: app.user.name,
        email: app.user.email,
        department: app.user.department?.name || 'Not assigned',
        profilePicture: app.user.profilePicture
      },
      leaveType: app.type === 'leave' ? (app.leaveType?.name || 'Unknown') : 'Travel Order',
      startDate: app.startDate || app.dateOfTravel,
      endDate: app.endDate || app.expectedReturn,
      status: app.status,
      appliedAt: app.appliedAt,
      reviewedAt: app.reviewedAt,
      reviewedBy: app.reviewer?.name || '',
      days: app.numberOfDays || calculateDaysDifference(app.dateOfTravel, app.expectedReturn),
      reason: app.reason || app.purpose,
      calendarPeriod: app.calendarPeriod,
      // Travel order specific fields
      ...(app.type === 'travel' && {
        destination: app.destination,
        purpose: app.purpose,
        dateOfTravel: app.dateOfTravel,
        expectedReturn: app.expectedReturn,
        transportationFee: app.transportationFee,
        seminarConferenceFee: app.seminarConferenceFee,
        mealsAccommodations: app.mealsAccommodations,
        totalCashRequested: app.totalCashRequested
      })
    }))

    return NextResponse.json({
      applications: mappedApplications,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: skip + limit < totalCount,
      hasPreviousPage: page > 1
    })

  } catch (error) {
    console.error("Error loading archived applications:", error)
    return NextResponse.json(
      { error: "Failed to load archived applications" },
      { status: 500 }
    )
  }
}

function calculateDaysDifference(startDate: Date, endDate: Date) {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}
