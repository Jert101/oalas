import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const leaveTypes = await prisma.leave_types.findMany({
      select: {
        leave_type_id: true,
        name: true
      },
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(leaveTypes)

  } catch (error) {
    console.error('Error fetching leave types:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
