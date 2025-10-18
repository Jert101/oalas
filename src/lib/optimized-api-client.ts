/**
 * Optimized API Client for OALA System
 * Provides intelligent caching, error handling, and performance optimization
 */

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface CacheConfig {
  ttl: number
  maxSize: number
}

interface RequestConfig {
  cache?: boolean
  cacheTTL?: number
  retries?: number
  timeout?: number
}

class OptimizedApiClient {
  private static instance: OptimizedApiClient
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>
  private cacheConfig: CacheConfig
  private baseUrl: string

  private constructor() {
    this.cache = new Map()
    this.cacheConfig = {
      ttl: 5 * 60 * 1000, // 5 minutes default TTL
      maxSize: 500 // Maximum 500 cached entries
    }
    this.baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXTAUTH_URL || 'http://localhost:3000'
  }

  public static getInstance(): OptimizedApiClient {
    if (!OptimizedApiClient.instance) {
      OptimizedApiClient.instance = new OptimizedApiClient()
    }
    return OptimizedApiClient.instance
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cached response
   */
  private getCachedResponse<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T
    }
    return null
  }

  /**
   * Set cache response
   */
  private setCachedResponse<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.cacheConfig.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.cacheConfig.ttl
    })
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      cache = false,
      cacheTTL,
      retries = 3,
      timeout = 10000
    } = config

    // Check cache first
    if (cache) {
      this.cleanExpiredCache()
      const cacheKey = this.generateCacheKey(url, options)
      const cached = this.getCachedResponse<ApiResponse<T>>(cacheKey)
      if (cached) {
        return cached
      }
    }

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(`${this.baseUrl}${url}`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        const result: ApiResponse<T> = {
          success: true,
          data: data.data || data,
          message: data.message
        }

        // Cache successful response
        if (cache) {
          const cacheKey = this.generateCacheKey(url, options)
          this.setCachedResponse(cacheKey, result, cacheTTL)
        }

        return result

      } catch (error) {
        lastError = error as Error
        console.warn(`API request attempt ${attempt} failed:`, error)

        if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Request failed after all retries'
    }
  }

  /**
   * GET request
   */
  public async get<T>(
    url: string,
    config: RequestConfig = { cache: true }
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { method: 'GET' }, config)
  }

  /**
   * POST request
   */
  public async post<T>(
    url: string,
    data?: any,
    config: RequestConfig = { cache: false }
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }, config)
  }

  /**
   * PUT request
   */
  public async put<T>(
    url: string,
    data?: any,
    config: RequestConfig = { cache: false }
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }, config)
  }

  /**
   * DELETE request
   */
  public async delete<T>(
    url: string,
    config: RequestConfig = { cache: false }
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { method: 'DELETE' }, config)
  }

  /**
   * Batch requests for better performance
   */
  public async batch<T>(
    requests: Array<{
      url: string
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
      data?: any
      config?: RequestConfig
    }>
  ): Promise<Array<ApiResponse<T>>> {
    const promises = requests.map(req => {
      const method = req.method || 'GET'
      const options: RequestInit = { method }
      
      if (req.data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(req.data)
      }

      return this.makeRequest<T>(req.url, options, req.config || { cache: method === 'GET' })
    })

    return Promise.all(promises)
  }

  /**
   * Clear cache by pattern
   */
  public clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Optimized API methods for OALA system
   */

  /**
   * Get user dashboard data
   */
  public async getDashboardData(role: string, userId?: string) {
    return this.get(`/api/${role.toLowerCase()}/dashboard`, {
      cache: true,
      cacheTTL: 2 * 60 * 1000 // 2 minutes
    })
  }

  /**
   * Get user profile
   */
  public async getUserProfile() {
    return this.get('/api/user/profile', {
      cache: true,
      cacheTTL: 5 * 60 * 1000 // 5 minutes
    })
  }

  /**
   * Get leave applications
   */
  public async getLeaveApplications(filters?: any) {
    const queryString = filters ? `?${new URLSearchParams(filters).toString()}` : ''
    return this.get(`/api/teacher/leave-applications${queryString}`, {
      cache: true,
      cacheTTL: 1 * 60 * 1000 // 1 minute
    })
  }

  /**
   * Get notifications
   */
  public async getNotifications() {
    return this.get('/api/notifications', {
      cache: true,
      cacheTTL: 30 * 1000 // 30 seconds
    })
  }

  /**
   * Submit leave application
   */
  public async submitLeaveApplication(data: any) {
    const result = await this.post('/api/teacher/leave/apply', data, {
      cache: false
    })

    // Clear related cache entries
    if (result.success) {
      this.clearCache('leave-applications')
      this.clearCache('dashboard')
      this.clearCache('notifications')
    }

    return result
  }

  /**
   * Approve/reject application
   */
  public async processApplication(id: string, action: 'approve' | 'reject', data?: any) {
    const result = await this.post(`/api/dean/applications/${id}/${action}`, data, {
      cache: false
    })

    // Clear related cache entries
    if (result.success) {
      this.clearCache('applications')
      this.clearCache('dashboard')
      this.clearCache('notifications')
    }

    return result
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const [_, entry] of this.cache.entries()) {
      if (now - entry.timestamp < entry.ttl) {
        validEntries++
      } else {
        expiredEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: this.cache.size > 0 ? (validEntries / this.cache.size) * 100 : 0
    }
  }
}

// Export singleton instance
export const apiClient = OptimizedApiClient.getInstance()

// Export class for testing
export { OptimizedApiClient }

// Export types
export type { ApiResponse, RequestConfig }
