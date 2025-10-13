// Advanced Multi-Layer Caching System
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  hits: number
  lastAccessed: number
}

class AdvancedCache {
  private memoryCache = new Map<string, CacheEntry>()
  private localStorageCache = new Map<string, CacheEntry>()
  private maxMemorySize = 100 // Max entries in memory
  private maxLocalStorageSize = 50 // Max entries in localStorage

  // Memory Cache (Fastest - 30 seconds TTL)
  setMemory<T>(key: string, data: T, ttl: number = 30000): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 1,
      lastAccessed: Date.now()
    })

    // Evict oldest entries if cache is full
    if (this.memoryCache.size > this.maxMemorySize) {
      this.evictOldest(this.memoryCache)
    }
  }

  getMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key)
      return null
    }

    // Update access stats
    entry.hits++
    entry.lastAccessed = Date.now()
    return entry.data
  }

  // LocalStorage Cache (Medium - 5 minutes TTL)
  setLocalStorage<T>(key: string, data: T, ttl: number = 300000): void {
    if (typeof window === 'undefined') return

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 1,
      lastAccessed: Date.now()
    }

    try {
      const existing = this.localStorageCache.get(key)
      if (existing) {
        entry.hits = existing.hits + 1
      }

      this.localStorageCache.set(key, entry)
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry))

      // Evict oldest entries if cache is full
      if (this.localStorageCache.size > this.maxLocalStorageSize) {
        this.evictOldestLocalStorage()
      }
    } catch (error) {
      console.warn('LocalStorage cache failed:', error)
    }
  }

  getLocalStorage<T>(key: string): T | null {
    if (typeof window === 'undefined') return null

    try {
      const cached = localStorage.getItem(`cache_${key}`)
      if (!cached) return null

      const entry: CacheEntry<T> = JSON.parse(cached)
      
      if (Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(`cache_${key}`)
        this.localStorageCache.delete(key)
        return null
      }

      // Update access stats
      entry.hits++
      entry.lastAccessed = Date.now()
      this.localStorageCache.set(key, entry)
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry))

      return entry.data
    } catch (error) {
      console.warn('LocalStorage cache read failed:', error)
      return null
    }
  }

  // Smart Cache (Auto-selects best layer)
  set<T>(key: string, data: T, ttl: number = 30000): void {
    // Always set in memory first (fastest)
    this.setMemory(key, data, ttl)
    
    // If TTL > 60 seconds, also cache in localStorage
    if (ttl > 60000) {
      this.setLocalStorage(key, data, ttl)
    }
  }

  get<T>(key: string): T | null {
    // Try memory first (fastest)
    const memoryResult = this.getMemory<T>(key)
    if (memoryResult !== null) {
      return memoryResult
    }

    // Try localStorage (slower but persistent)
    const localStorageResult = this.getLocalStorage<T>(key)
    if (localStorageResult !== null) {
      // Promote to memory cache
      this.setMemory(key, localStorageResult, 30000)
      return localStorageResult
    }

    return null
  }

  // Cache invalidation
  delete(key: string): void {
    this.memoryCache.delete(key)
    this.localStorageCache.delete(key)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`cache_${key}`)
    }
  }

  clear(): void {
    this.memoryCache.clear()
    this.localStorageCache.clear()
    
    if (typeof window !== 'undefined') {
      // Clear all cache entries from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key)
        }
      })
    }
  }

  // Cache statistics
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      localStorageSize: this.localStorageCache.size,
      memoryHits: Array.from(this.memoryCache.values()).reduce((sum, entry) => sum + entry.hits, 0),
      localStorageHits: Array.from(this.localStorageCache.values()).reduce((sum, entry) => sum + entry.hits, 0),
    }
  }

  // Eviction strategies
  private evictOldest(cache: Map<string, CacheEntry>): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey)
    }
  }

  private evictOldestLocalStorage(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.localStorageCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.localStorageCache.delete(oldestKey)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`cache_${oldestKey}`)
      }
    }
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key)
      }
    }

    // Clean localStorage cache
    for (const [key, entry] of this.localStorageCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.localStorageCache.delete(key)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`cache_${key}`)
        }
      }
    }
  }
}

export const advancedCache = new AdvancedCache()

// Auto-cleanup every 2 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    advancedCache.cleanup()
  }, 120000)
}












