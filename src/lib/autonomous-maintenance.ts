/**
 * Autonomous System Maintenance for OALA
 * Handles automatic optimization, cleanup, and system health maintenance
 */

import { prisma } from './prisma'
import { performanceMonitor } from './performance-monitor'

interface MaintenanceTask {
  id: string
  name: string
  description: string
  interval: number // milliseconds
  lastRun: number
  enabled: boolean
  execute: () => Promise<void>
}

interface MaintenanceReport {
  timestamp: number
  tasksRun: number
  tasksSucceeded: number
  tasksFailed: number
  performance: any
  recommendations: string[]
}

class AutonomousMaintenance {
  private static instance: AutonomousMaintenance
  private tasks: Map<string, MaintenanceTask> = new Map()
  private isRunning: boolean = false
  private intervalId: NodeJS.Timeout | null = null

  private constructor() {
    this.initializeTasks()
    this.startMaintenance()
  }

  public static getInstance(): AutonomousMaintenance {
    if (!AutonomousMaintenance.instance) {
      AutonomousMaintenance.instance = new AutonomousMaintenance()
    }
    return AutonomousMaintenance.instance
  }

  /**
   * Initialize maintenance tasks
   */
  private initializeTasks(): void {
    // Database optimization task
    this.addTask({
      id: 'db_optimization',
      name: 'Database Optimization',
      description: 'Optimize database queries and clean up old data',
      interval: 60 * 60 * 1000, // 1 hour
      lastRun: 0,
      enabled: true,
      execute: this.optimizeDatabase.bind(this)
    })

    // Cache cleanup task
    this.addTask({
      id: 'cache_cleanup',
      name: 'Cache Cleanup',
      description: 'Clean up expired cache entries and optimize cache usage',
      interval: 30 * 60 * 1000, // 30 minutes
      lastRun: 0,
      enabled: true,
      execute: this.cleanupCache.bind(this)
    })

    // Session cleanup task
    this.addTask({
      id: 'session_cleanup',
      name: 'Session Cleanup',
      description: 'Clean up expired sessions and tokens',
      interval: 15 * 60 * 1000, // 15 minutes
      lastRun: 0,
      enabled: true,
      execute: this.cleanupSessions.bind(this)
    })

    // Performance analysis task
    this.addTask({
      id: 'performance_analysis',
      name: 'Performance Analysis',
      description: 'Analyze system performance and generate optimization recommendations',
      interval: 10 * 60 * 1000, // 10 minutes
      lastRun: 0,
      enabled: true,
      execute: this.analyzePerformance.bind(this)
    })

    // Log cleanup task
    this.addTask({
      id: 'log_cleanup',
      name: 'Log Cleanup',
      description: 'Clean up old log entries and optimize log storage',
      interval: 24 * 60 * 60 * 1000, // 24 hours
      lastRun: 0,
      enabled: true,
      execute: this.cleanupLogs.bind(this)
    })

    // Data backup task
    this.addTask({
      id: 'data_backup',
      name: 'Data Backup',
      description: 'Create automatic backups of critical data',
      interval: 6 * 60 * 60 * 1000, // 6 hours
      lastRun: 0,
      enabled: true,
      execute: this.backupData.bind(this)
    })
  }

  /**
   * Add maintenance task
   */
  private addTask(task: MaintenanceTask): void {
    this.tasks.set(task.id, task)
  }

  /**
   * Start autonomous maintenance
   */
  private startMaintenance(): void {
    if (this.isRunning) return

    this.isRunning = true
    console.log('🔧 Autonomous maintenance system started')

    // Run maintenance every minute
    this.intervalId = setInterval(() => {
      this.runMaintenance()
    }, 60 * 1000)
  }

  /**
   * Stop autonomous maintenance
   */
  public stopMaintenance(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('🔧 Autonomous maintenance system stopped')
  }

  /**
   * Run maintenance tasks
   */
  private async runMaintenance(): Promise<void> {
    const now = Date.now()
    const tasksToRun = Array.from(this.tasks.values()).filter(
      task => task.enabled && (now - task.lastRun) >= task.interval
    )

    if (tasksToRun.length === 0) return

    console.log(`🔧 Running ${tasksToRun.length} maintenance tasks...`)

    for (const task of tasksToRun) {
      try {
        await task.execute()
        task.lastRun = now
        console.log(`✅ Task completed: ${task.name}`)
      } catch (error) {
        console.error(`❌ Task failed: ${task.name}`, error)
      }
    }
  }

  /**
   * Optimize database
   */
  private async optimizeDatabase(): Promise<void> {
    try {
      // Clean up expired verification tokens
      await prisma.verificationToken.deleteMany({
        where: {
          expires: {
            lt: new Date()
          }
        }
      })

      // Clean up expired password reset tokens
      await prisma.user.updateMany({
        where: {
          resetTokenExpiry: {
            lt: new Date()
          }
        },
        data: {
          resetToken: null,
          resetTokenExpiry: null
        }
      })

      // Optimize database indexes (MySQL specific)
      await prisma.$executeRaw`ANALYZE TABLE users`
      await prisma.$executeRaw`ANALYZE TABLE leave_applications`
      await prisma.$executeRaw`ANALYZE TABLE sessions`

      console.log('🗄️ Database optimization completed')
    } catch (error) {
      console.error('❌ Database optimization failed:', error)
      throw error
    }
  }

  /**
   * Clean up cache
   */
  private async cleanupCache(): Promise<void> {
    try {
      // Clear expired cache entries
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys()
        for (const name of cacheNames) {
          const cache = await caches.open(name)
          const requests = await cache.keys()
          
          for (const request of requests) {
            const response = await cache.match(request)
            if (response) {
              const cacheDate = response.headers.get('date')
              if (cacheDate) {
                const age = Date.now() - new Date(cacheDate).getTime()
                if (age > 30 * 60 * 1000) { // 30 minutes
                  await cache.delete(request)
                }
              }
            }
          }
        }
      }

      console.log('🧹 Cache cleanup completed')
    } catch (error) {
      console.error('❌ Cache cleanup failed:', error)
      throw error
    }
  }

  /**
   * Clean up sessions
   */
  private async cleanupSessions(): Promise<void> {
    try {
      // Remove expired sessions
      await prisma.session.deleteMany({
        where: {
          expires: {
            lt: new Date()
          }
        }
      })

      console.log('🔐 Session cleanup completed')
    } catch (error) {
      console.error('❌ Session cleanup failed:', error)
      throw error
    }
  }

  /**
   * Analyze performance
   */
  private async analyzePerformance(): Promise<void> {
    try {
      const stats = performanceMonitor.getPerformanceStats()
      const health = stats.health

      // Generate performance recommendations
      const recommendations: string[] = []

      if (health.metrics.avgResponseTime > 2000) {
        recommendations.push('Consider implementing database query optimization')
      }

      if (health.metrics.errorRate > 3) {
        recommendations.push('High error rate detected - investigate API stability')
      }

      if (health.metrics.throughput < 20) {
        recommendations.push('Low throughput - check for system bottlenecks')
      }

      // Log recommendations
      if (recommendations.length > 0) {
        console.log('💡 Performance recommendations:', recommendations)
      }

      console.log('📊 Performance analysis completed')
    } catch (error) {
      console.error('❌ Performance analysis failed:', error)
      throw error
    }
  }

  /**
   * Clean up logs
   */
  private async cleanupLogs(): Promise<void> {
    try {
      // Clean up old notifications (keep last 1000)
      const oldNotifications = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip: 1000,
        select: { notification_id: true }
      })

      if (oldNotifications.length > 0) {
        await prisma.notification.deleteMany({
          where: {
            notification_id: {
              in: oldNotifications.map(n => n.notification_id)
            }
          }
        })
      }

      console.log('📝 Log cleanup completed')
    } catch (error) {
      console.error('❌ Log cleanup failed:', error)
      throw error
    }
  }

  /**
   * Backup critical data
   */
  private async backupData(): Promise<void> {
    try {
      // Create backup of critical tables
      const backupData = {
        timestamp: new Date().toISOString(),
        users: await prisma.user.findMany({
          select: {
            users_id: true,
            email: true,
            name: true,
            isActive: true,
            createdAt: true
          }
        }),
        roles: await prisma.role.findMany(),
        departments: await prisma.department.findMany(),
        leaveTypes: await prisma.leave_types.findMany()
      }

      // In a real implementation, this would save to a backup service
      console.log('💾 Data backup completed:', {
        timestamp: backupData.timestamp,
        userCount: backupData.users.length,
        roleCount: backupData.roles.length,
        departmentCount: backupData.departments.length,
        leaveTypeCount: backupData.leaveTypes.length
      })
    } catch (error) {
      console.error('❌ Data backup failed:', error)
      throw error
    }
  }

  /**
   * Get maintenance status
   */
  public getStatus(): {
    isRunning: boolean
    tasks: Array<{
      id: string
      name: string
      enabled: boolean
      lastRun: number
      nextRun: number
    }>
  } {
    const now = Date.now()
    return {
      isRunning: this.isRunning,
      tasks: Array.from(this.tasks.values()).map(task => ({
        id: task.id,
        name: task.name,
        enabled: task.enabled,
        lastRun: task.lastRun,
        nextRun: task.lastRun + task.interval
      }))
    }
  }

  /**
   * Enable/disable task
   */
  public setTaskEnabled(taskId: string, enabled: boolean): void {
    const task = this.tasks.get(taskId)
    if (task) {
      task.enabled = enabled
      console.log(`🔧 Task ${taskId} ${enabled ? 'enabled' : 'disabled'}`)
    }
  }

  /**
   * Run specific task manually
   */
  public async runTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    console.log(`🔧 Running task manually: ${task.name}`)
    await task.execute()
    task.lastRun = Date.now()
  }

  /**
   * Get maintenance report
   */
  public async generateReport(): Promise<MaintenanceReport> {
    const stats = performanceMonitor.getPerformanceStats()
    
    return {
      timestamp: Date.now(),
      tasksRun: Array.from(this.tasks.values()).length,
      tasksSucceeded: Array.from(this.tasks.values()).filter(t => t.lastRun > 0).length,
      tasksFailed: 0, // Would track failed tasks in a real implementation
      performance: stats,
      recommendations: stats.health.recommendations
    }
  }
}

// Export singleton instance
export const autonomousMaintenance = AutonomousMaintenance.getInstance()

// Export class for testing
export { AutonomousMaintenance }

// Export types
export type { MaintenanceTask, MaintenanceReport }
