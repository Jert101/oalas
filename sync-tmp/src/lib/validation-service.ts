import { prisma } from "@/lib/prisma"

export interface ValidationResult {
  canApply: boolean
  reason?: string
  pendingApplications?: any[]
  conflictingApplications?: any[]
}

export interface DateRange {
  startDate: Date
  endDate: Date
}

/**
 * Check if user has any pending applications (leave or travel orders)
 */
export async function checkPendingApplications(userId: string): Promise<ValidationResult> {
  try {
    console.log('🔍 Checking pending applications for user ID:', userId)
    
    // Check for pending or dean-approved leave applications (waiting for finance)
    const pendingLeaveApplications = await prisma.leaveApplication.findMany({
      where: {
        users_id: userId,
        status: { in: ['PENDING', 'DEAN_APPROVED'] }
      },
      select: {
        leave_application_id: true,
        startDate: true,
        endDate: true,
        reason: true,
        specificPurpose: true,
        descriptionOfSickness: true,
        appliedAt: true,
        leave_type_id: true
      }
    })

    console.log('Found pending leave applications:', pendingLeaveApplications.length)

    // Check for pending or dean-approved travel orders (waiting for finance)
    const pendingTravelOrders = await prisma.travelOrder.findMany({
      where: {
        users_id: userId,
        status: { in: ['PENDING', 'DEAN_APPROVED'] }
      },
      select: {
        travel_order_id: true,
        dateOfTravel: true,
        expectedReturn: true,
        purpose: true,
        appliedAt: true
      }
    })

    console.log('Found pending travel orders:', pendingTravelOrders.length)

    const hasPendingApplications = pendingLeaveApplications.length > 0 || pendingTravelOrders.length > 0

    if (hasPendingApplications) {
      console.log('User has pending applications, blocking new applications')
      
      // Get leave type names for pending applications
      const leaveTypeIds = pendingLeaveApplications.map(app => app.leave_type_id)
      const leaveTypes = await prisma.leave_types.findMany({
        where: { leave_type_id: { in: leaveTypeIds } }
      })
      
      const leaveTypeMap = new Map(leaveTypes.map(lt => [lt.leave_type_id, lt.name]))
      
      return {
        canApply: false,
        reason: "You already have applications pending review. Please wait for them to be fully approved or rejected before submitting a new application.",
        pendingApplications: [
          ...pendingLeaveApplications.map(app => ({
            ...app,
            type: 'leave',
            id: app.leave_application_id,
            leaveType: { name: leaveTypeMap.get(app.leave_type_id) || `Leave Type ${app.leave_type_id}` }
          })),
          ...pendingTravelOrders.map(order => ({
            ...order,
            type: 'travel',
            id: order.travel_order_id
          }))
        ]
      }
    }

    console.log('No pending applications found, user can apply')
    return {
      canApply: true
    }
  } catch (error) {
    console.error('❌ Error checking pending applications:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: userId
    })
    return {
      canApply: false,
      reason: "Error checking application status. Please try again."
    }
  }
}

/**
 * Check for date conflicts with approved applications
 */
export async function checkDateConflicts(
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<ValidationResult> {
  try {
    // Check for overlapping approved leave applications
    const conflictingLeaveApplications = await prisma.leaveApplication.findMany({
      where: {
        users_id: userId,
        status: 'APPROVED',
        OR: [
          // Case 1: New application starts during an existing approved application
          {
            startDate: { lte: startDate },
            endDate: { gte: startDate }
          },
          // Case 2: New application ends during an existing approved application
          {
            startDate: { lte: endDate },
            endDate: { gte: endDate }
          },
          // Case 3: New application completely contains an existing approved application
          {
            startDate: { gte: startDate },
            endDate: { lte: endDate }
          }
        ]
      },
      select: {
        leave_application_id: true,
        startDate: true,
        endDate: true,
        reason: true,
        specificPurpose: true,
        descriptionOfSickness: true,
        leave_type_id: true
      }
    })

    // Check for overlapping approved travel orders
    const conflictingTravelOrders = await prisma.travelOrder.findMany({
      where: {
        users_id: userId,
        status: 'APPROVED',
        OR: [
          // Case 1: New application starts during an existing approved travel
          {
            dateOfTravel: { lte: startDate },
            expectedReturn: { gte: startDate }
          },
          // Case 2: New application ends during an existing approved travel
          {
            dateOfTravel: { lte: endDate },
            expectedReturn: { gte: endDate }
          },
          // Case 3: New application completely contains an existing approved travel
          {
            dateOfTravel: { gte: startDate },
            expectedReturn: { lte: endDate }
          }
        ]
      },
      select: {
        travel_order_id: true,
        dateOfTravel: true,
        expectedReturn: true,
        purpose: true
      }
    })

    const hasConflicts = conflictingLeaveApplications.length > 0 || conflictingTravelOrders.length > 0

    if (hasConflicts) {
      // Get leave type names for conflicting applications
      const leaveTypeIds = conflictingLeaveApplications.map(app => app.leave_type_id)
      const leaveTypes = await prisma.leave_types.findMany({
        where: { leave_type_id: { in: leaveTypeIds } }
      })
      
      const leaveTypeMap = new Map(leaveTypes.map(lt => [lt.leave_type_id, lt.name]))
      
      return {
        canApply: false,
        reason: "You have approved applications that conflict with the selected dates. Please choose different dates.",
        conflictingApplications: [
          ...conflictingLeaveApplications.map(app => ({
            ...app,
            type: 'leave',
            id: app.leave_application_id,
            leaveType: { name: leaveTypeMap.get(app.leave_type_id) || `Leave Type ${app.leave_type_id}` }
          })),
          ...conflictingTravelOrders.map(order => ({
            ...order,
            type: 'travel',
            id: order.travel_order_id
          }))
        ]
      }
    }

    return {
      canApply: true
    }
  } catch (error) {
    console.error('Error checking date conflicts:', error)
    return {
      canApply: false,
      reason: "Error checking date conflicts. Please try again."
    }
  }
}

/**
 * Comprehensive validation for new applications
 */
export async function validateNewApplication(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ValidationResult> {
  try {
    // First check for pending applications
    const pendingCheck = await checkPendingApplications(userId)
    if (!pendingCheck.canApply) {
      return pendingCheck
    }

    // Then check for date conflicts
    const dateCheck = await checkDateConflicts(userId, startDate, endDate)
    if (!dateCheck.canApply) {
      return dateCheck
    }

    return {
      canApply: true
    }
  } catch (error) {
    console.error('Error validating new application:', error)
    return {
      canApply: false,
      reason: "Error validating application. Please try again."
    }
  }
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Get application type display name
 */
export function getApplicationTypeName(type: string): string {
  return type === 'leave' ? 'Leave Application' : 'Travel Order'
}
