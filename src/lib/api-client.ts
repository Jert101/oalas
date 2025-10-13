import { cache } from './cache'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  notifications?: any[]
}

class ApiClient {
  private baseUrl = '/api'

  async get<T = any>(endpoint: string, useCache: boolean = true, ttl: number = 30000): Promise<ApiResponse<T>> {
    const cacheKey = `GET:${endpoint}`
    
    // Check cache first
    if (useCache) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      // Cache successful responses
      if (useCache && response.ok) {
        cache.set(cacheKey, data, ttl)
      }

      return data
    } catch (error) {
      console.error(`API GET Error (${endpoint}):`, error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

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
        cache.delete(cacheKey)
      })

      return data
    } catch (error) {
      console.error(`API POST Error (${endpoint}):`, error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

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
        cache.delete(cacheKey)
      })

      return data
    } catch (error) {
      console.error(`API PUT Error (${endpoint}):`, error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

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
        cache.delete(cacheKey)
      })

      return data
    } catch (error) {
      console.error(`API DELETE Error (${endpoint}):`, error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

  // Clear all cache
  clearCache() {
    cache.clear()
  }

  // Clear specific cache entries
  clearCacheEntries(keys: string[]) {
    keys.forEach(key => cache.delete(key))
  }
}

export const apiClient = new ApiClient()












