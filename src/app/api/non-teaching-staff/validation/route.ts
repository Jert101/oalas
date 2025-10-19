import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkPendingApplications, checkDateConflicts } from "@/lib/validation-service"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Validation API called')
    
    const session = await getServerSession(authOptions)
    console.log('Session found:', !!session)
    console.log('Session user email:', session?.user?.email)
    
    if (!session?.user?.email) {
      console.log('❌ No session or user email found')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    console.log('Query params - startDate:', startDate, 'endDate:', endDate)

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    console.log('User found:', !!user)
    if (user) {
      console.log('User ID:', user.users_id)
      console.log('User name:', user.name)
    }

    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check for pending applications
    console.log('🔍 Calling checkPendingApplications...')
    const pendingCheck = await checkPendingApplications(user.users_id)
    console.log('Pending check result:', pendingCheck)

    // If there are pending applications, return that result
    if (!pendingCheck.canApply) {
      console.log('❌ User cannot apply due to pending applications or error')
      return NextResponse.json(pendingCheck)
    }

    // If dates are provided, check for date conflicts
    if (startDate && endDate) {
      console.log('🔍 Checking date conflicts...')
      const dateCheck = await checkDateConflicts(
        user.users_id,
        new Date(startDate),
        new Date(endDate)
      )
      console.log('Date check result:', dateCheck)
      return NextResponse.json(dateCheck)
    }

    // If no dates provided, just return pending check result
    console.log('✅ User can apply - no pending applications')
    return NextResponse.json(pendingCheck)

  } catch (error) {
    console.error('❌ Error checking validation:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
