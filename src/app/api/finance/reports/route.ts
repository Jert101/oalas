import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Enhanced validation schema for report parameters
const reportParamsSchema = z.object({
  type: z.enum(['summary', 'detailed', 'approval-trends', 'department-analysis', 'leave-type-analysis']).default('summary'),
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
  try {
    const session = await getServerSession(authOptions)
    
    // Enhanced role-based access control
    const allowedRoles = ['Finance Department', 'Finance Officer', 'Finance Office Head', 'Admin']
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const params = reportParamsSchema.parse({
      type: searchParams.get('type') || 'summary',
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

    // Build comprehensive filter object
    const filters: any = {}
    
    // Date range filter
    if (params.startDate && params.endDate) {
      filters.appliedAt = {
        gte: new Date(params.startDate),
        lte: new Date(params.endDate)
      }
    }

    // Department filter
    if (params.department && params.department !== 'all') {
      filters.user = {
        ...filters.user,
        department: {
          name: params.department
        }
      }
    }

    // Leave type filter - filter by leave type ID
    if (params.leaveType && params.leaveType !== 'all') {
      filters.leave_type_id = parseInt(params.leaveType)
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
        // This will be handled separately for travel orders
        filters._applicationType = 'travel'
      } else {
        filters._applicationType = 'leave'
      }
    }

    // Remove custom properties from Prisma query
    const prismaFilters = { ...filters }
    delete prismaFilters._applicationType

    // Create separate filters for leave applications and travel orders
    const leaveAppFilters = { ...prismaFilters }
    const travelOrderFilters = { ...prismaFilters }
    
    // Remove leave_type_id from travel order filters since it doesn't have this field
    if (travelOrderFilters.leave_type_id) {
      delete travelOrderFilters.leave_type_id
    }

    // Get all applications with enhanced filters and includes
    const applications = await prisma.leaveApplication.findMany({
      where: leaveAppFilters,
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
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Also get travel orders for comprehensive reporting
    const travelOrders = await prisma.travelOrder.findMany({
      where: travelOrderFilters,
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
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Combine leave applications and travel orders for comprehensive reporting
    let allApplications = [
      ...applications.map(app => ({ ...app, type: 'leave' })),
      ...travelOrders.map(order => ({ ...order, type: 'travel' }))
    ]

    // Apply application type filter if specified
    if (filters._applicationType) {
      allApplications = allApplications.filter(app => app.type === filters._applicationType)
    }

    // Generate different report types with enhanced analytics
    let reportData = {}

    switch (params.type) {
      case 'summary':
        const totalApplications = allApplications.length
        const approvedApplications = allApplications.filter(app => app.status === 'APPROVED').length
        const pendingApplications = allApplications.filter(app => ['PENDING', 'DEAN_APPROVED'].includes(app.status)).length
        const deniedApplications = allApplications.filter(app => app.status === 'DENIED').length

        reportData = {
          totalApplications,
          approvedApplications,
          pendingApplications,
          deniedApplications,
          approvalRate: totalApplications > 0 ? ((approvedApplications / totalApplications) * 100).toFixed(2) : 0,
          mostActiveDepartment: getMostActiveDepartment(allApplications),
          monthOverMonthChange: calculateMonthOverMonthChange(allApplications),
          byLeaveType: generateLeaveTypeAnalysis(allApplications),
          byDepartment: generateDepartmentAnalysis(allApplications),
          byApplicationType: generateApplicationTypeAnalysis(allApplications),
          monthlyTrends: generateMonthlyTrends(allApplications),
          summaryStats: {
            averageProcessingTime: calculateAverageProcessingTime(allApplications),
            totalDaysRequested: calculateTotalDaysRequested(allApplications),
            mostCommonLeaveType: getMostCommonLeaveType(allApplications),
            peakApplicationMonth: getPeakApplicationMonth(allApplications)
          }
        }
        break

      case 'detailed':
        // Calculate pagination
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
            // Additional fields for travel orders
            ...(app.type === 'travel' && {
              destination: app.destination,
              purpose: app.purpose,
              totalCashRequested: app.totalCashRequested,
              transportationFee: app.transportationFee,
              seminarConferenceFee: app.seminarConferenceFee,
              mealsAccommodations: app.mealsAccommodations
            })
          })),
          totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: skip + limit < totalCount,
          hasPreviousPage: page > 1
        }
        break

      case 'approval-trends':
        reportData = {
          trends: generateMonthlyTrends(allApplications),
          approvalRate: allApplications.length > 0 ? 
            ((allApplications.filter(app => app.status === 'APPROVED').length / allApplications.length) * 100).toFixed(2) : 0,
          averageProcessingTime: calculateAverageProcessingTime(allApplications),
          peakApplicationPeriods: getPeakApplicationPeriods(allApplications),
          seasonalPatterns: analyzeSeasonalPatterns(allApplications)
        }
        break

      case 'department-analysis':
        reportData = {
          departmentStats: generateDepartmentAnalysis(allApplications),
          departmentComparison: compareDepartments(allApplications),
          departmentTrends: generateDepartmentTrends(allApplications),
          topDepartments: getTopDepartments(allApplications, 5)
        }
        break

      case 'leave-type-analysis':
        reportData = {
          leaveTypeStats: generateLeaveTypeAnalysis(allApplications),
          leaveTypeTrends: generateLeaveTypeTrends(allApplications),
          costAnalysis: generateCostAnalysis(allApplications),
          leaveTypeComparison: compareLeaveTypes(allApplications)
        }
        break

      default:
        reportData = { error: 'Invalid report type' }
    }

    return NextResponse.json({
      reportType: params.type,
      generatedAt: new Date().toISOString(),
      dateRange: params.startDate && params.endDate ? { startDate: params.startDate, endDate: params.endDate } : null,
      filters: {
        department: params.department,
        leaveType: params.leaveType,
        status: params.status,
        calendarPeriod: params.calendarPeriod
      },
      ...reportData
    })
  } catch (error) {
    console.error("Error generating finance report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}

// Helper functions for enhanced analytics
function getMostActiveDepartment(applications: any[]) {
  const deptCounts = applications.reduce((acc, app) => {
    const dept = app.user.department?.name || 'Not assigned'
    acc[dept] = (acc[dept] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(deptCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
}

function calculateMonthOverMonthChange(applications: any[]) {
  const currentMonth = new Date().toISOString().substring(0, 7)
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 7)
  
  const currentCount = applications.filter(app => 
    new Date(app.appliedAt).toISOString().substring(0, 7) === currentMonth
  ).length
  
  const lastCount = applications.filter(app => 
    new Date(app.appliedAt).toISOString().substring(0, 7) === lastMonth
  ).length
  
  if (lastCount === 0) return currentCount > 0 ? 100 : 0
  return (((currentCount - lastCount) / lastCount) * 100).toFixed(1)
}

function generateLeaveTypeAnalysis(applications: any[]) {
  return applications.reduce((acc, app) => {
    const type = app.type === 'leave' ? (app.leaveType?.name || 'Unknown') : 'Travel Order'
    if (!acc[type]) {
      acc[type] = { total: 0, approved: 0, pending: 0, denied: 0 }
    }
    acc[type].total++
    if (app.status === 'APPROVED') acc[type].approved++
    else if (['PENDING', 'DEAN_APPROVED'].includes(app.status)) acc[type].pending++
    else if (app.status === 'DENIED') acc[type].denied++
    return acc
  }, {} as Record<string, { total: number; approved: number; pending: number; denied: number }>)
}

function generateDepartmentAnalysis(applications: any[]) {
  return applications.reduce((acc, app) => {
    const dept = app.user.department?.name || 'Not assigned'
    if (!acc[dept]) {
      acc[dept] = { total: 0, approved: 0, pending: 0, denied: 0 }
    }
    acc[dept].total++
    if (app.status === 'APPROVED') acc[dept].approved++
    else if (['PENDING', 'DEAN_APPROVED'].includes(app.status)) acc[dept].pending++
    else if (app.status === 'DENIED') acc[dept].denied++
    return acc
  }, {} as Record<string, { total: number; approved: number; pending: number; denied: number }>)
}

function generateApplicationTypeAnalysis(applications: any[]) {
  return applications.reduce((acc, app) => {
    const type = app.type
    if (!acc[type]) {
      acc[type] = { total: 0, approved: 0, pending: 0, denied: 0 }
    }
    acc[type].total++
    if (app.status === 'APPROVED') acc[type].approved++
    else if (['PENDING', 'DEAN_APPROVED'].includes(app.status)) acc[type].pending++
    else if (app.status === 'DENIED') acc[type].denied++
    return acc
  }, {} as Record<string, { total: number; approved: number; pending: number; denied: number }>)
}

function generateMonthlyTrends(applications: any[]) {
  return applications.reduce((acc, app) => {
    const month = new Date(app.appliedAt).toISOString().substring(0, 7)
    if (!acc[month]) {
      acc[month] = { total: 0, approved: 0, pending: 0, denied: 0 }
    }
    acc[month].total++
    if (app.status === 'APPROVED') acc[month].approved++
    else if (['PENDING', 'DEAN_APPROVED'].includes(app.status)) acc[month].pending++
    else if (app.status === 'DENIED') acc[month].denied++
    return acc
  }, {} as Record<string, { total: number; approved: number; pending: number; denied: number }>)
}

function calculateAverageProcessingTime(applications: any[]) {
  const reviewedApps = applications.filter(app => app.reviewedAt)
  if (reviewedApps.length === 0) return 0
  
  const totalDays = reviewedApps.reduce((sum, app) => {
    const applied = new Date(app.appliedAt)
    const reviewed = new Date(app.reviewedAt)
    return sum + (reviewed.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24)
  }, 0)
  
  return (totalDays / reviewedApps.length).toFixed(1)
}

function calculateTotalDaysRequested(applications: any[]) {
  return applications.reduce((sum, app) => {
    if (app.type === 'leave') {
      return sum + (app.numberOfDays || 0)
    } else {
      return sum + calculateDaysDifference(app.dateOfTravel, app.expectedReturn)
    }
  }, 0)
}

function getMostCommonLeaveType(applications: any[]) {
  const typeCounts = applications.reduce((acc, app) => {
    const type = app.type === 'leave' ? (app.leaveType?.name || 'Unknown') : 'Travel Order'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
}

function getPeakApplicationMonth(applications: any[]) {
  const monthCounts = applications.reduce((acc, app) => {
    const month = new Date(app.appliedAt).toISOString().substring(0, 7)
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(monthCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
}

function calculateDaysDifference(startDate: Date, endDate: Date) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

// Additional helper functions for new report types
function getPeakApplicationPeriods(applications: any[]) {
  // Implementation for peak periods analysis
  return []
}

function analyzeSeasonalPatterns(applications: any[]) {
  // Implementation for seasonal pattern analysis
  return {}
}

function compareDepartments(applications: any[]) {
  // Implementation for department comparison
  return []
}

function generateDepartmentTrends(applications: any[]) {
  // Implementation for department trends
  return {}
}

function getTopDepartments(applications: any[], limit: number) {
  const deptCounts = applications.reduce((acc, app) => {
    const dept = app.user.department?.name || 'Not assigned'
    acc[dept] = (acc[dept] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(deptCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([dept, count]) => ({ department: dept, count }))
}

function generateLeaveTypeTrends(applications: any[]) {
  // Implementation for leave type trends
  return {}
}

function generateCostAnalysis(applications: any[]) {
  // Implementation for cost analysis
  return {}
}

function compareLeaveTypes(applications: any[]) {
  // Implementation for leave type comparison
  return []
}
