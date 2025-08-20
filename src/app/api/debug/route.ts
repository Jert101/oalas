import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all statuses
    const statuses = await prisma.status.findMany()
    console.log('All statuses:', statuses)

    // Get all users with their status info
    const users = await prisma.user.findMany({
      select: {
        users_id: true,
        name: true,
        status_id: true,
        status: {
          select: {
            status_id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      statuses,
      users,
      debug: {
        statusCount: statuses.length,
        userCount: users.length,
        usersWithStatus: users.filter(u => u.status).length
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
