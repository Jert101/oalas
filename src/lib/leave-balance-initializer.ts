import { prisma } from "@/lib/prisma"

/**
 * Automatically creates leave balances for a new user based on their status and current calendar period
 * This should be called when a new user is created or when a calendar period changes
 */
export async function initializeLeaveBalancesForUser(userId: string): Promise<{
  success: boolean
  created: number
  skipped: number
  errors: string[]
}> {
  const errors: string[] = []
  let created = 0
  let skipped = 0

  try {
    console.log(`🚀 Initializing leave balances for user: ${userId}`)

    // 1. Get user details
    const user = await prisma.user.findUnique({
      where: { users_id: userId },
      include: { status: true }
    })

    if (!user) {
      errors.push(`User not found: ${userId}`)
      return { success: false, created, skipped, errors }
    }

    if (!user.status_id) {
      errors.push(`No status assigned to user: ${user.name}`)
      return { success: false, created, skipped, errors }
    }

    // 2. Get current calendar period
    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: { isCurrent: true },
      include: { termType: true }
    })

    if (!currentPeriod) {
      errors.push("No current calendar period found")
      return { success: false, created, skipped, errors }
    }

    console.log(`📅 Using period: ${currentPeriod.academicYear} (${currentPeriod.termType?.name})`)

    // 3. Get all leave types (excluding Travel Order)
    const leaveTypes = await prisma.leave_types.findMany({
      where: { 
        name: { not: 'Travel Order' }
      }
    })

    // 4. Create leave balances for each leave type
    for (const leaveType of leaveTypes) {
      try {
        // Check if balance already exists
        const existingBalance = await prisma.leaveBalance.findFirst({
          where: {
            users_id: userId,
            calendar_period_id: currentPeriod.calendar_period_id,
            leave_type_id: leaveType.leave_type_id
          }
        })

        if (existingBalance) {
          console.log(`   ⏭️ Skipping ${leaveType.name} - balance already exists`)
          skipped++
          continue
        }

        // Get leave limit for this user's status and leave type
        const leaveLimit = await prisma.leaveLimit.findFirst({
          where: {
            status_id: user.status_id,
            term_type_id: currentPeriod.term_type_id,
            leave_type_id: leaveType.leave_type_id,
            isActive: true
          }
        })

        if (!leaveLimit) {
          console.log(`   ⚠️ No leave limit found for ${leaveType.name} (Status: ${user.status?.name})`)
          continue
        }

        // Create leave balance
        await prisma.leaveBalance.create({
          data: {
            users_id: userId,
            calendar_period_id: currentPeriod.calendar_period_id,
            status_id: user.status_id,
            term_type_id: currentPeriod.term_type_id,
            leave_type_id: leaveType.leave_type_id,
            allowedDays: leaveLimit.daysAllowed,
            usedDays: 0,
            remainingDays: leaveLimit.daysAllowed
          }
        })

        console.log(`   ✅ Created ${leaveType.name} balance: ${leaveLimit.daysAllowed} days allowed`)
        created++

      } catch (error) {
        const errorMsg = `Failed to create ${leaveType.name} balance: ${error.message}`
        console.error(`   ❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    console.log(`✅ Leave balance initialization complete for ${user.name}: ${created} created, ${skipped} skipped`)

    return {
      success: errors.length === 0,
      created,
      skipped,
      errors
    }

  } catch (error) {
    const errorMsg = `Failed to initialize leave balances for user ${userId}: ${error.message}`
    console.error(errorMsg)
    errors.push(errorMsg)
    
    return {
      success: false,
      created,
      skipped,
      errors
    }
  }
}

/**
 * Initialize leave balances for all active users
 * Useful for system maintenance or when setting up a new calendar period
 */
export async function initializeLeaveBalancesForAllUsers(): Promise<{
  success: boolean
  totalCreated: number
  totalSkipped: number
  userResults: Array<{
    userId: string
    name: string
    created: number
    skipped: number
    errors: string[]
  }>
}> {
  const userResults: Array<{
    userId: string
    name: string
    created: number
    skipped: number
    errors: string[]
  }> = []

  let totalCreated = 0
  let totalSkipped = 0

  try {
    console.log('🚀 Initializing leave balances for all users...')

    // Get all active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: { status: true }
    })

    console.log(`👥 Found ${users.length} active users`)

    // Process each user
    for (const user of users) {
      const result = await initializeLeaveBalancesForUser(user.users_id)
      
      userResults.push({
        userId: user.users_id,
        name: user.name,
        created: result.created,
        skipped: result.skipped,
        errors: result.errors
      })

      totalCreated += result.created
      totalSkipped += result.skipped
    }

    console.log(`🎉 Leave balance initialization complete: ${totalCreated} created, ${totalSkipped} skipped`)

    return {
      success: true,
      totalCreated,
      totalSkipped,
      userResults
    }

  } catch (error) {
    console.error('❌ Error initializing leave balances for all users:', error)
    
    return {
      success: false,
      totalCreated,
      totalSkipped,
      userResults
    }
  }
}

