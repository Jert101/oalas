import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'Finance Officer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current calendar period
    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: {
        isCurrent: true
      },
      select: {
        academicYear: true,
        startDate: true,
        endDate: true
      }
    })

    // Get all applications in current period
    const applications = await prisma.leaveApplication.findMany({
      where: {
        calendar_period_id: currentPeriod?.id
      },
      select: {
        status: true
      }
    })

    // Get department and faculty counts
    const totalDepartments = await prisma.department.count()
    const totalFaculty = await prisma.user.count({
      where: {
        role: {
          name: {
            in: ['Teacher/Instructor', 'Non Teaching Personnel']
          }
        }
      }
    })

    // Calculate statistics
    const totalApplications = applications.length
    const pendingApplications = applications.filter(app => app.status === 'PENDING').length
    const approvedApplications = applications.filter(app => app.status === 'APPROVED').length
    const deniedApplications = applications.filter(app => app.status === 'DENIED').length
    const deanApprovedPendingFinance = applications.filter(app => app.status === 'DEAN_APPROVED').length

    const stats = {
      pendingApplications,
      approvedApplications,
      deniedApplications,
      totalApplications,
      totalDepartments,
      totalFaculty,
      deanApprovedPendingFinance,
      currentPeriod: currentPeriod || {
        academicYear: 'N/A',
        startDate: 'N/A',
        endDate: 'N/A'
      }
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching finance dashboard stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
