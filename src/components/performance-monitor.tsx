"use client"

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  pageLoadTime: number
  apiResponseTime: number
  memoryUsage: number
  cacheHitRate: number
  networkSpeed: number
  serviceWorkerStatus: string
  databaseQueryTime: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    networkSpeed: 0,
    serviceWorkerStatus: 'Unknown',
    databaseQueryTime: 0
  })

  useEffect(() => {
    // Monitor page load performance
    const measurePageLoad = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart
          setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }))
        }
      }
    }

    // Monitor memory usage
    const measureMemory = () => {
      if (typeof window !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
        setMetrics(prev => ({ ...prev, memoryUsage: usedMB }))
      }
    }

    // Monitor network speed
    const measureNetworkSpeed = async () => {
      try {
        const startTime = Date.now()
        await fetch('/api/user/current', { cache: 'no-cache' })
        const endTime = Date.now()
        const responseTime = endTime - startTime
        
        // Estimate network speed (rough calculation)
        const estimatedSpeed = Math.round(1000 / responseTime) // KB/s estimate
        setMetrics(prev => ({ ...prev, networkSpeed: estimatedSpeed }))
      } catch (error) {
        // Network test failed
      }
    }

    // Check service worker status
    const checkServiceWorker = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          setMetrics(prev => ({ 
            ...prev, 
            serviceWorkerStatus: registration.active ? 'Active' : 'Inactive' 
          }))
        }).catch(() => {
          setMetrics(prev => ({ ...prev, serviceWorkerStatus: 'Error' }))
        })
      } else {
        setMetrics(prev => ({ ...prev, serviceWorkerStatus: 'Not Supported' }))
      }
    }

    // Set up performance monitoring
    const interval = setInterval(() => {
      measureMemory()
      measureNetworkSpeed()
      checkServiceWorker()
    }, 10000) // Check every 10 seconds

    // Initial measurements
    measurePageLoad()
    measureMemory()
    measureNetworkSpeed()
    checkServiceWorker()

    return () => clearInterval(interval)
  }, [])

  // Log performance warnings
  useEffect(() => {
    if (metrics.pageLoadTime > 3000) {
      console.warn('⚠️ Slow page load detected:', metrics.pageLoadTime, 'ms')
    }
    if (metrics.memoryUsage > 100) {
      console.warn('⚠️ High memory usage detected:', metrics.memoryUsage, 'MB')
    }
    if (metrics.networkSpeed < 50) {
      console.warn('⚠️ Slow network detected:', metrics.networkSpeed, 'KB/s')
    }
    if (metrics.serviceWorkerStatus === 'Error') {
      console.warn('⚠️ Service Worker error detected')
    }
  }, [metrics])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
      <div>Load: {metrics.pageLoadTime}ms</div>
      <div>Memory: {metrics.memoryUsage}MB</div>
      <div>Network: {metrics.networkSpeed}KB/s</div>
      <div>SW: {metrics.serviceWorkerStatus}</div>
    </div>
  )
}
