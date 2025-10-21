import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerformanceMonitor, ErrorTracker } from '@/lib/monitoring'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin access to monitoring data
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const monitor = PerformanceMonitor.getInstance()
    const errorTracker = ErrorTracker.getInstance()
    
    const metrics = monitor.getMetrics()
    const errors = errorTracker.getErrors()
    
    return NextResponse.json({
      success: true,
      data: {
        metrics,
        errors: errors.slice(-50), // Last 50 errors
        timestamp: new Date().toISOString(),
      }
    })
    
  } catch (error) {
    console.error('Error fetching monitoring data:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const monitor = PerformanceMonitor.getInstance()
    const errorTracker = ErrorTracker.getInstance()
    
    monitor.clearMetrics()
    errorTracker.clearErrors()
    
    return NextResponse.json({
      success: true,
      message: 'Monitoring data cleared'
    })
    
  } catch (error) {
    console.error('Error clearing monitoring data:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
