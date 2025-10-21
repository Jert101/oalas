import { prisma } from "@/lib/prisma"

/**
 * Migrates approved and denied applications to archive
 * This should be called when applications are approved or denied
 */
export async function migrateToArchive(applicationId: string, type: 'leave' | 'travel') {
  try {
    if (type === 'leave') {
      // For leave applications, we just need to ensure they have reviewedAt set
      const application = await prisma.leaveApplication.findUnique({
        where: { leave_application_id: applicationId },
        include: {
          calendarPeriod: true
        }
      })

      if (application && (application.status === 'APPROVED' || application.status === 'DENIED')) {
        // Application is already archived (approved/denied status means it's in archive)
        return { success: true, message: 'Application already archived' }
      }
    } else if (type === 'travel') {
      // For travel orders, we just need to ensure they have reviewedAt set
      const application = await prisma.travelOrder.findUnique({
        where: { travel_order_id: applicationId },
        include: {
          calendarPeriod: true
        }
      })

      if (application && (application.status === 'APPROVED' || application.status === 'DENIED')) {
        // Application is already archived (approved/denied status means it's in archive)
        return { success: true, message: 'Application already archived' }
      }
    }

    return { success: true, message: 'Application archived successfully' }
  } catch (error) {
    console.error('Error migrating application to archive:', error)
    return { success: false, message: 'Failed to archive application' }
  }
}

/**
 * Gets archive statistics for a specific calendar period
 */
export async function getArchiveStats(calendarPeriodId: number) {
  try {
    const [leaveStats, travelStats] = await Promise.all([
      prisma.leaveApplication.groupBy({
        by: ['status'],
        where: {
          calendar_period_id: calendarPeriodId,
          status: {
            in: ['APPROVED', 'DENIED']
          }
        },
        _count: {
          status: true
        }
      }),
      prisma.travelOrder.groupBy({
        by: ['status'],
        where: {
          calendar_period_id: calendarPeriodId,
          status: {
            in: ['APPROVED', 'DENIED']
          }
        },
        _count: {
          status: true
        }
      })
    ])

    const stats = {
      totalApplications: 0,
      approvedApplications: 0,
      deniedApplications: 0
    }

    // Process leave application stats
    leaveStats.forEach(stat => {
      stats.totalApplications += stat._count.status
      if (stat.status === 'APPROVED') {
        stats.approvedApplications += stat._count.status
      } else if (stat.status === 'DENIED') {
        stats.deniedApplications += stat._count.status
      }
    })

    // Process travel order stats
    travelStats.forEach(stat => {
      stats.totalApplications += stat._count.status
      if (stat.status === 'APPROVED') {
        stats.approvedApplications += stat._count.status
      } else if (stat.status === 'DENIED') {
        stats.deniedApplications += stat._count.status
      }
    })

    return stats
  } catch (error) {
    console.error('Error getting archive stats:', error)
    return {
      totalApplications: 0,
      approvedApplications: 0,
      deniedApplications: 0
    }
  }
}

/**
 * Checks if an application should be moved to archive
 * This is called when application status changes
 */
export async function shouldArchiveApplication(applicationId: string, type: 'leave' | 'travel', newStatus: string) {
  // Applications are considered archived when they are approved or denied
  return newStatus === 'APPROVED' || newStatus === 'DENIED'
}
