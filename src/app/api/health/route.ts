import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`
    const dbStatus = 'connected'
    
    // Check application status
    const appStatus = 'healthy'
    
    // Get system information
    const uptime = process.uptime()
    const memoryUsage = process.memoryUsage()
    const timestamp = new Date().toISOString()
    
    const responseTime = Date.now() - startTime
    
    const healthData = {
      status: 'healthy',
      timestamp,
      uptime: Math.floor(uptime),
      responseTime: `${responseTime}ms`,
      services: {
        database: dbStatus,
        application: appStatus
      },
      system: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        nodeVersion: process.version,
        platform: process.platform
      }
    }
    
    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: 'disconnected',
        application: 'error'
      }
    }
    
    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}