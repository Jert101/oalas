// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTimer(label: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(value)
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {}
    
    this.metrics.forEach((values, label) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      
      result[label] = { avg, min, max, count: values.length }
    })
    
    return result
  }

  clearMetrics(): void {
    this.metrics.clear()
  }
}

// Error tracking
export class ErrorTracker {
  private static instance: ErrorTracker
  private errors: Array<{ message: string; stack?: string; timestamp: Date; context?: any }> = []

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  trackError(error: Error, context?: any): void {
    this.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      context,
    })
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', error.message, context)
    }
  }

  getErrors(): Array<{ message: string; stack?: string; timestamp: Date; context?: any }> {
    return [...this.errors]
  }

  clearErrors(): void {
    this.errors = []
  }
}

// API response time monitoring
export function withPerformanceMonitoring<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance()
  const endTimer = monitor.startTimer(label)
  
  return fn().finally(() => {
    endTimer()
  })
}
