import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for report parameters
const reportParamsSchema = z.object({
  type: z.enum(['summary', 'detailed']).default('detailed'),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  leaveType: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  calendarPeriod: z.string().nullable().optional(),
  applicationType: z.string().nullable().optional(),
  exportFormat: z.enum(['json', 'csv', 'pdf']).default('json'),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20')
})

export async function GET(req: NextRequest) {
  console.log('🚀 DEAN REPORTS API CALLED - URL:', req.url)
  try {
    const session = await getServerSession(authOptions)
    
    console.log('🔍 Dean Reports API - Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role,
      userId: session?.user?.id
    })
    
    if (!session?.user?.email) {
      console.log('❌ No session or user email found')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user with role information
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        department: true,
        role: true
      }
    })

    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has dean, admin, or department head role
    const allowedRoles = ['Dean', 'Admin', 'Dean/Program Head', 'Department Head']
    if (!allowedRoles.includes(user.role.name)) {
      console.log('❌ Access denied. User role:', user.role.name)
      return NextResponse.json({ error: "Access denied. Dean or Department Head role required." }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    console.log('🔍 All search params:', Object.fromEntries(searchParams.entries()))
    console.log('🔍 Leave type param specifically:', searchParams.get('leaveType'))
    
    const params = reportParamsSchema.parse({
      type: searchParams.get('type') || 'detailed',
      startDate: searchParams.get('startDate') || null,
      endDate: searchParams.get('endDate') || null,
      department: searchParams.get('department') || null,
      leaveType: searchParams.get('leaveType') || null,
      status: searchParams.get('status') || null,
      calendarPeriod: searchParams.get('calendarPeriod') || null,
      applicationType: searchParams.get('applicationType') || null,
      exportFormat: searchParams.get('exportFormat') || 'json',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20'
    })
    
    console.log('🔍 Parsed params:', params)

    // Get dean's department (user already fetched above)
    if (!user.department) {
      console.log('❌ Dean department not found')
      return NextResponse.json({ error: "Dean department not found" }, { status: 404 })
    }

    const deanDepartmentId = user.department.department_id

    // Build filter object
    const filters: any = {
      user: {
        department_id: deanDepartmentId // Only applications from dean's department
      }
    }

    // Date range filter
    if (params.startDate) {
      filters.appliedAt = {
        ...filters.appliedAt,
        gte: new Date(params.startDate)
      }
    }
    if (params.endDate) {
      filters.appliedAt = {
        ...filters.appliedAt,
        lte: new Date(params.endDate)
      }
    }

    // Department filter (should be dean's department only)
    if (params.department && params.department !== 'all') {
      filters.user.department_id = parseInt(params.department)
    }

    // Leave type filter - filter by leave type ID
    if (params.leaveType && params.leaveType !== 'all') {
      console.log('🔍 Applying leave type filter:', params.leaveType)
      console.log('🔍 Leave type filter type:', typeof params.leaveType)
      console.log('🔍 Parsed leave type ID:', parseInt(params.leaveType))
      filters.leave_type_id = parseInt(params.leaveType)
      console.log('🔍 Leave type filter applied (direct field):', filters.leave_type_id)
      console.log('🔍 Full filters object after leave type:', JSON.stringify(filters, null, 2))
    }

    // Status filter
    if (params.status && params.status !== 'all') {
      filters.status = params.status
    }

    // Calendar period filter
    if (params.calendarPeriod && params.calendarPeriod !== 'all') {
      filters.calendar_period_id = parseInt(params.calendarPeriod)
    }

    // Application type filter
    if (params.applicationType && params.applicationType !== 'all') {
      if (params.applicationType === 'travel') {
        filters._applicationType = 'travel'
      } else {
        filters._applicationType = 'leave'
      }
    }

    // Remove custom properties from Prisma query
    const prismaFilters = { ...filters }
    delete prismaFilters._applicationType

    console.log('🔍 Final filters for Prisma query:', JSON.stringify(prismaFilters, null, 2))

    // Get leave applications with filters
    console.log('🔍 Executing Prisma query for leave applications...')
    console.log('🔍 Prisma filters:', JSON.stringify(prismaFilters, null, 2))
    
    let applications
    try {
      applications = await prisma.leaveApplication.findMany({
        where: prismaFilters,
        include: {
          user: {
            select: {
              users_id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              department: {
                select: {
                  department_id: true,
                  name: true,
                  category: true
                }
              },
              status: {
                select: {
                  name: true
                }
              }
            }
          },
          leaveType: {
            select: {
              leave_type_id: true,
              name: true,
              description: true
            }
          },
          reviewer: {
            select: {
              name: true,
              email: true
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
        orderBy: { appliedAt: 'desc' }
      })
    } catch (prismaError) {
      console.error('🔍 Prisma query error for leave applications:', prismaError)
      console.error('🔍 Error details:', {
        message: prismaError.message,
        code: prismaError.code,
        meta: prismaError.meta
      })
      
      // Return empty results instead of throwing error
      console.log('🔍 Returning empty applications due to Prisma error')
      applications = []
    }

    // Get travel orders with filters
    let travelOrders
    try {
      travelOrders = await prisma.travelOrder.findMany({
      where: prismaFilters,
      include: {
        user: {
          select: {
            users_id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            department: {
              select: {
                department_id: true,
                name: true,
                category: true
              }
            },
            status: {
              select: {
                name: true
              }
            }
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
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
      orderBy: { appliedAt: 'desc' }
    })
    } catch (travelError) {
      console.error('🔍 Prisma query error for travel orders:', travelError)
      console.error('🔍 Travel error details:', {
        message: travelError.message,
        code: travelError.code,
        meta: travelError.meta
      })
      
      // Return empty results instead of throwing error
      console.log('🔍 Returning empty travel orders due to Prisma error')
      travelOrders = []
    }

    // Combine applications
    let allApplications = [
      ...applications.map(app => ({ ...app, type: 'leave' })),
      ...travelOrders.map(order => ({ ...order, type: 'travel' }))
    ]

    // Apply application type filter if specified
    if (filters._applicationType) {
      allApplications = allApplications.filter(app => app.type === filters._applicationType)
    }

    let reportData: any = {}

    switch (params.type) {
      case 'detailed':
        const page = parseInt(params.page)
        const limit = parseInt(params.limit)
        const skip = (page - 1) * limit
        const totalCount = allApplications.length
        const paginatedApplications = allApplications.slice(skip, skip + limit)

        reportData = {
          applications: paginatedApplications.map(app => ({
            id: app.type === 'leave' ? app.leave_application_id : app.travel_order_id,
            type: app.type,
            user: {
              users_id: app.user.users_id,
              name: app.user.name,
              email: app.user.email,
              department: app.user.department?.name || 'Not assigned',
              status: app.user.status?.name || 'Unknown',
              profilePicture: app.user.profilePicture
            },
            leaveType: app.type === 'leave' ? (app.leaveType?.name || 'Unknown') : 'Travel Order',
            status: app.status,
            startDate: app.startDate || app.dateOfTravel,
            endDate: app.endDate || app.expectedReturn,
            days: app.numberOfDays || calculateDaysDifference(app.dateOfTravel, app.expectedReturn),
            reason: app.reason || app.purpose,
            appliedAt: app.appliedAt,
            reviewedAt: app.reviewedAt,
            reviewedBy: app.reviewer?.name || null,
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
          })),
          totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: skip + limit < totalCount,
          hasPreviousPage: page > 1
        }
        break

      case 'summary':
        const totalApplications = allApplications.length
        const approvedApplications = allApplications.filter(app => app.status === 'APPROVED').length
        const deniedApplications = allApplications.filter(app => app.status === 'DENIED').length
        const pendingApplications = allApplications.filter(app => app.status === 'PENDING').length
        const deanApprovedApplications = allApplications.filter(app => app.status === 'DEAN_APPROVED').length
        const deanRejectedApplications = allApplications.filter(app => app.status === 'DEAN_REJECTED').length

        reportData = {
          summary: {
            totalApplications,
            approvedApplications,
            deniedApplications,
            pendingApplications,
            deanApprovedApplications,
            deanRejectedApplications
          },
          department: user.department.name,
          generatedAt: new Date().toISOString()
        }
        break
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error("Error generating dean report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
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
