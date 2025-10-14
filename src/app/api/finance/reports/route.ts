import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'Finance Department' && session.user.role !== 'Finance Officer' && session.user.role !== 'Finance Office Head')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get('type') || 'summary'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateFilter = {}
    if (startDate && endDate) {
      dateFilter = {
        appliedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    }

    // Get all applications with filters
    const applications = await prisma.leaveApplication.findMany({
      where: dateFilter,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        leaveType: {
          select: {
            name: true,
            description: true
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Generate different report types
    let reportData = {}

    switch (reportType) {
      case 'summary':
        reportData = {
          totalApplications: applications.length,
          approvedApplications: applications.filter(app => app.status === 'APPROVED').length,
          pendingApplications: applications.filter(app => app.status === 'PENDING' || app.status === 'DEAN_APPROVED').length,
          deniedApplications: applications.filter(app => app.status === 'DENIED').length,
          byLeaveType: applications.reduce((acc, app) => {
            const type = app.leaveType?.name || 'Unknown'
            if (!acc[type]) {
              acc[type] = { total: 0, approved: 0, pending: 0, denied: 0 }
            }
            acc[type].total++
            if (app.status === 'APPROVED') acc[type].approved++
            else if (app.status === 'PENDING' || app.status === 'DEAN_APPROVED') acc[type].pending++
            else if (app.status === 'DENIED') acc[type].denied++
            return acc
          }, {} as Record<string, { total: number; approved: number; pending: number; denied: number }>),
          byDepartment: applications.reduce((acc, app) => {
            const dept = app.user.department?.name || 'Not assigned'
            if (!acc[dept]) {
              acc[dept] = { total: 0, approved: 0, pending: 0, denied: 0 }
            }
            acc[dept].total++
            if (app.status === 'APPROVED') acc[dept].approved++
            else if (app.status === 'PENDING' || app.status === 'DEAN_APPROVED') acc[dept].pending++
            else if (app.status === 'DENIED') acc[dept].denied++
            return acc
          }, {} as Record<string, { total: number; approved: number; pending: number; denied: number }>),
          monthlyTrends: applications.reduce((acc, app) => {
            const month = new Date(app.appliedAt).toISOString().substring(0, 7) // YYYY-MM
            if (!acc[month]) {
              acc[month] = { total: 0, approved: 0, pending: 0, denied: 0 }
            }
            acc[month].total++
            if (app.status === 'APPROVED') acc[month].approved++
            else if (app.status === 'PENDING' || app.status === 'DEAN_APPROVED') acc[month].pending++
            else if (app.status === 'DENIED') acc[month].denied++
            return acc
          }, {} as Record<string, { total: number; approved: number; pending: number; denied: number }>)
        }
        break

      case 'detailed':
        reportData = {
          applications: applications.map(app => ({
            id: app.leave_application_id,
            user: {
              name: app.user.name,
              email: app.user.email,
              department: app.user.department?.name || 'Not assigned'
            },
            leaveType: app.leaveType?.name || 'Unknown',
            status: app.status,
            startDate: app.startDate,
            endDate: app.endDate,
            numberOfDays: app.numberOfDays,
            reason: app.reason,
            appliedAt: app.appliedAt,
            reviewedAt: app.reviewedAt,
            reviewer: app.reviewer?.name || null
          }))
        }
        break

      case 'approval-trends':
        const monthlyData = applications.reduce((acc, app) => {
          const month = new Date(app.appliedAt).toISOString().substring(0, 7)
          if (!acc[month]) {
            acc[month] = { month, applied: 0, approved: 0, denied: 0, pending: 0 }
          }
          acc[month].applied++
          if (app.status === 'APPROVED') acc[month].approved++
          else if (app.status === 'DENIED') acc[month].denied++
          else acc[month].pending++
          return acc
        }, {} as Record<string, { month: string; applied: number; approved: number; denied: number; pending: number }>)

        reportData = {
          trends: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)),
          approvalRate: applications.length > 0 ? 
            (applications.filter(app => app.status === 'APPROVED').length / applications.length * 100).toFixed(2) : 0,
          averageProcessingTime: applications.filter(app => app.reviewedAt).length > 0 ?
            applications
              .filter(app => app.reviewedAt)
              .reduce((sum, app) => {
                const applied = new Date(app.appliedAt)
                const reviewed = new Date(app.reviewedAt!)
                return sum + (reviewed.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24) // days
              }, 0) / applications.filter(app => app.reviewedAt).length : 0
        }
        break

      default:
        reportData = { error: 'Invalid report type' }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        reportType,
        generatedAt: new Date().toISOString(),
        dateRange: startDate && endDate ? { startDate, endDate } : null,
        ...reportData
      }
    })
  } catch (error) {
    console.error("Error generating finance report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}
