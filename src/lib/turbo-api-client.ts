import { advancedCache } from './advanced-cache'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  notifications?: any[]
}

interface PendingRequest {
  promise: Promise<ApiResponse>
  resolve: (value: ApiResponse) => void
  reject: (reason: any) => void
}

class TurboApiClient {
  private baseUrl = '/api'
  private pendingRequests = new Map<string, PendingRequest>()
  private prefetchQueue: string[] = []
  private batchQueue: Array<{ endpoint: string; resolve: (value: any) => void }> = []
  private batchTimeout: NodeJS.Timeout | null = null

  // Smart caching with intelligent TTL
  private getCacheTTL(endpoint: string): number {
    if (endpoint.includes('dashboard')) return 30000 // 30s for dashboard
    if (endpoint.includes('notifications')) return 10000 // 10s for notifications
    if (endpoint.includes('applications')) return 60000 // 1min for applications
    if (endpoint.includes('user')) return 300000 // 5min for user data
    return 30000 // Default 30s
  }

  // Request deduplication
  private async deduplicateRequest<T>(endpoint: string, requestFn: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
    const cacheKey = `request:${endpoint}`
    
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!.promise as Promise<ApiResponse<T>>
    }

    let resolve: (value: ApiResponse<T>) => void
    let reject: (reason: any) => void
    
    const promise = new Promise<ApiResponse<T>>((res, rej) => {
      resolve = res
      reject = rej
    })

    this.pendingRequests.set(cacheKey, { promise, resolve: resolve!, reject: reject! })

    try {
      const result = await requestFn()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.pendingRequests.delete(cacheKey)
    }

    return promise
  }

  // Turbo GET with intelligent caching
  async get<T = any>(endpoint: string, useCache: boolean = true): Promise<ApiResponse<T>> {
    const cacheKey = `GET:${endpoint}`
    const ttl = this.getCacheTTL(endpoint)
    
    return this.deduplicateRequest(endpoint, async () => {
      // Check cache first
      if (useCache) {
        const cached = advancedCache.get<ApiResponse<T>>(cacheKey)
        if (cached) {
          return cached
        }
      }

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache', // Let our cache handle it
          },
        })

        const data = await response.json()

        // Cache successful responses
        if (useCache && response.ok) {
          advancedCache.set(cacheKey, data, ttl)
        }

        return data
      } catch (error) {
        console.error(`Turbo API GET Error (${endpoint}):`, error)
        return {
          success: false,
          error: 'Network error'
        }
      }
    })
  }

  // Batch requests for multiple endpoints
  async batchGet<T = any>(endpoints: string[]): Promise<Record<string, ApiResponse<T>>> {
    const results: Record<string, ApiResponse<T>> = {}
    const promises: Promise<void>[] = []

    endpoints.forEach(endpoint => {
      promises.push(
        this.get<T>(endpoint).then(result => {
          results[endpoint] = result
        })
      )
    })

    await Promise.all(promises)
    return results
  }

  // Prefetch data in background
  prefetch(endpoints: string[]): void {
    endpoints.forEach(endpoint => {
      if (!this.prefetchQueue.includes(endpoint)) {
        this.prefetchQueue.push(endpoint)
        // Prefetch in background
        setTimeout(() => {
          this.get(endpoint, true).catch(() => {
            // Silently fail prefetch
          })
        }, 100)
      }
    })
  }

  // Turbo POST with cache invalidation
  async post<T = any>(endpoint: string, body: any, invalidateCache: string[] = []): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      // Invalidate related cache entries
      invalidateCache.forEach(cacheKey => {
        advancedCache.delete(cacheKey)
      })

      // Also invalidate any cached requests for this endpoint
      advancedCache.delete(`GET:${endpoint}`)

      return data
    } catch (error) {
      console.error(`Turbo API POST Error (${endpoint}):`, error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

  // Turbo PUT
  async put<T = any>(endpoint: string, body: any, invalidateCache: string[] = []): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      // Invalidate related cache entries
      invalidateCache.forEach(cacheKey => {
        advancedCache.delete(cacheKey)
      })

      return data
    } catch (error) {
      console.error(`Turbo API PUT Error (${endpoint}):`, error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

  // Turbo DELETE
  async delete<T = any>(endpoint: string, invalidateCache: string[] = []): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      // Invalidate related cache entries
      invalidateCache.forEach(cacheKey => {
        advancedCache.delete(cacheKey)
      })

      return data
    } catch (error) {
      console.error(`Turbo API DELETE Error (${endpoint}):`, error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

  // Clear all cache
  clearCache(): void {
    advancedCache.clear()
  }

  // Get cache statistics
  getCacheStats() {
    return advancedCache.getStats()
  }

  // Optimize for specific endpoints
  optimizeFor(endpoint: string): void {
    // Prefetch related data
    if (endpoint.includes('dashboard')) {
      this.prefetch([
        '/api/notifications',
        '/api/user/current',
        '/api/calendar-period/current'
      ])
    }
    
    if (endpoint.includes('applications')) {
      this.prefetch([
        '/api/leave-types',
        '/api/calendar-period/current'
      ])
    }
  }
}

export const turboApiClient = new TurboApiClient()

