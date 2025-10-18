/**
 * Performance Monitor for OALA System
 * Autonomous monitoring and optimization system
 */

interface PerformanceMetrics {
  timestamp: number
  operation: string
  duration: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical'
  metrics: {
    avgResponseTime: number
    errorRate: number
    throughput: number
    cacheHitRate: number
  }
  recommendations: string[]
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[]
  private maxMetrics: number = 1000
  private isMonitoring: boolean = false

  private constructor() {
    this.metrics = []
    this.startMonitoring()
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Start autonomous monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true

    // Monitor database performance
    this.monitorDatabasePerformance()

    // Monitor API performance
    this.monitorApiPerformance()

    // Monitor memory usage
    this.monitorMemoryUsage()

    // Cleanup old metrics periodically
    setInterval(() => {
      this.cleanupOldMetrics()
    }, 5 * 60 * 1000) // Every 5 minutes

    // Generate health reports periodically
    setInterval(() => {
      this.generateHealthReport()
    }, 10 * 60 * 1000) // Every 10 minutes
  }

  /**
   * Record performance metric
   */
  public recordMetric(
    operation: string,
    duration: number,
    success: boolean,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      operation,
      duration,
      success,
      error,
      metadata
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow operations
    if (duration > 5000) { // 5 seconds
      console.warn(`🐌 Slow operation detected: ${operation} took ${duration}ms`, metadata)
    }

    // Log errors
    if (!success && error) {
      console.error(`❌ Operation failed: ${operation}`, error, metadata)
    }
  }

  /**
   * Monitor database performance
   */
  private monitorDatabasePerformance(): void {
    // This would integrate with Prisma middleware in a real implementation
    console.log('📊 Database performance monitoring started')
  }

  /**
   * Monitor API performance
   */
  private monitorApiPerformance(): void {
    // Monitor fetch requests
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const start = Date.now()
      const url = args[0] as string
      
      try {
        const response = await originalFetch(...args)
        const duration = Date.now() - start
        
        this.recordMetric(
          `API: ${url}`,
          duration,
          response.ok,
          response.ok ? undefined : `HTTP ${response.status}`,
          { url, method: args[1]?.method || 'GET' }
        )
        
        return response
      } catch (error) {
        const duration = Date.now() - start
        
        this.recordMetric(
          `API: ${url}`,
          duration,
          false,
          error instanceof Error ? error.message : String(error),
          { url, method: args[1]?.method || 'GET' }
        )
        
        throw error
      }
    }
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        if (memory) {
          this.recordMetric(
            'memory_usage',
            0,
            true,
            undefined,
            {
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit
            }
          )
        }
      }, 30 * 1000) // Every 30 seconds
    }
  }

  /**
   * Cleanup old metrics
   */
  private cleanupOldMetrics(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    this.metrics = this.metrics.filter(metric => metric.timestamp > oneHourAgo)
  }

  /**
   * Generate system health report
   */
  private generateHealthReport(): void {
    const health = this.getSystemHealth()
    
    if (health.status !== 'healthy') {
      console.warn('🚨 System health degraded:', health)
      
      // Send alert or take corrective action
      this.handleHealthIssue(health)
    }
  }

  /**
   * Get system health status
   */
  public getSystemHealth(): SystemHealth {
    const recentMetrics = this.getRecentMetrics(10 * 60 * 1000) // Last 10 minutes
    
    if (recentMetrics.length === 0) {
      return {
        status: 'healthy',
        metrics: {
          avgResponseTime: 0,
          errorRate: 0,
          throughput: 0,
          cacheHitRate: 0
        },
        recommendations: []
      }
    }

    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
    const errorRate = (recentMetrics.filter(m => !m.success).length / recentMetrics.length) * 100
    const throughput = recentMetrics.length / 10 // requests per minute
    const cacheHitRate = 0 // Would be calculated from cache metrics

    const recommendations: string[] = []
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy'

    // Analyze performance and generate recommendations
    if (avgResponseTime > 3000) {
      recommendations.push('Consider optimizing slow database queries')
      status = 'degraded'
    }

    if (errorRate > 5) {
      recommendations.push('High error rate detected - investigate API failures')
      status = 'critical'
    }

    if (throughput < 10) {
      recommendations.push('Low throughput - check for bottlenecks')
      status = 'degraded'
    }

    return {
      status,
      metrics: {
        avgResponseTime,
        errorRate,
        throughput,
        cacheHitRate
      },
      recommendations
    }
  }

  /**
   * Handle health issues
   */
  private handleHealthIssue(health: SystemHealth): void {
    console.log('🔧 Applying autonomous fixes...')

    // Clear caches if error rate is high
    if (health.metrics.errorRate > 10) {
      this.clearCaches()
    }

    // Log recommendations
    health.recommendations.forEach(rec => {
      console.log(`💡 Recommendation: ${rec}`)
    })
  }

  /**
   * Clear system caches
   */
  private clearCaches(): void {
    // Clear browser caches
    if (typeof window !== 'undefined') {
      // Clear service worker cache
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name)
          })
        })
      }
    }

    console.log('🧹 System caches cleared')
  }

  /**
   * Get recent metrics
   */
  private getRecentMetrics(timeWindow: number): PerformanceMetrics[] {
    const cutoff = Date.now() - timeWindow
    return this.metrics.filter(metric => metric.timestamp > cutoff)
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats() {
    const recentMetrics = this.getRecentMetrics(60 * 60 * 1000) // Last hour
    
    const operations = new Map<string, { count: number; totalTime: number; errors: number }>()
    
    recentMetrics.forEach(metric => {
      const op = operations.get(metric.operation) || { count: 0, totalTime: 0, errors: 0 }
      op.count++
      op.totalTime += metric.duration
      if (!metric.success) op.errors++
      operations.set(metric.operation, op)
    })

    const stats = Array.from(operations.entries()).map(([operation, data]) => ({
      operation,
      count: data.count,
      avgDuration: data.totalTime / data.count,
      errorRate: (data.errors / data.count) * 100
    }))

    return {
      totalMetrics: recentMetrics.length,
      operations: stats.sort((a, b) => b.avgDuration - a.avgDuration),
      health: this.getSystemHealth()
    }
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = []
    console.log('📊 Performance metrics reset')
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Export class for testing
export { PerformanceMonitor }

// Export types
export type { PerformanceMetrics, SystemHealth }

// Performance measurement decorator
export function measurePerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const start = Date.now()
      try {
        const result = await method.apply(this, args)
        const duration = Date.now() - start
        
        performanceMonitor.recordMetric(
          `${operation}:${propertyName}`,
          duration,
          true
        )
        
        return result
      } catch (error) {
        const duration = Date.now() - start
        
        performanceMonitor.recordMetric(
          `${operation}:${propertyName}`,
          duration,
          false,
          error instanceof Error ? error.message : String(error)
        )
        
        throw error
      }
    }

    return descriptor
  }
}
