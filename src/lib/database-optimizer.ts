import { PrismaClient } from '@prisma/client'

/**
 * Database Optimizer for OALA System
 * Provides optimized database operations with caching and connection pooling
 */

interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize: number // Maximum cache entries
}

class DatabaseOptimizer {
  private static instance: DatabaseOptimizer
  private prisma: PrismaClient
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>
  private cacheConfig: CacheConfig

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    this.cache = new Map()
    this.cacheConfig = {
      ttl: 5 * 60 * 1000, // 5 minutes default TTL
      maxSize: 1000 // Maximum 1000 cached entries
    }
  }

  public static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer()
    }
    return DatabaseOptimizer.instance
  }

  /**
   * Get cached data or fetch from database
   */
  private async getCachedOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Clean expired entries
    this.cleanExpiredCache()

    // Check cache first
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T
    }

    // Fetch from database
    const data = await fetcher()
    
    // Cache the result
    this.setCache(key, data, ttl)
    
    return data
  }

  /**
   * Set cache entry
   */
  private setCache(key: string, data: any, ttl?: number): void {
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
   * Optimized user lookup with caching
   */
  public async getUserByEmail(email: string, include?: any) {
    const cacheKey = `user:${email}:${JSON.stringify(include || {})}`
    
    return this.getCachedOrFetch(cacheKey, async () => {
      return this.prisma.user.findUnique({
        where: { email },
        include: include || {
          role: true,
          department: true,
          status: true
        }
      })
    })
  }

  /**
   * Optimized role lookup with caching
   */
  public async getRoles(categoryId?: number) {
    const cacheKey = `roles:${categoryId || 'all'}`
    
    return this.getCachedOrFetch(cacheKey, async () => {
      const whereClause = categoryId ? { category_id: categoryId } : {}
      
      return this.prisma.role.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
        include: {
          category: true
        }
      })
    })
  }

  /**
   * Optimized departments lookup with caching
   */
  public async getDepartments() {
    const cacheKey = 'departments:all'
    
    return this.getCachedOrFetch(cacheKey, async () => {
      return this.prisma.department.findMany({
        orderBy: { name: "asc" }
      })
    })
  }

  /**
   * Optimized leave types lookup with caching
   */
  public async getLeaveTypes() {
    const cacheKey = 'leave_types:active'
    
    return this.getCachedOrFetch(cacheKey, async () => {
      return this.prisma.leave_types.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" }
      })
    })
  }

  /**
   * Optimized dashboard stats with caching
   */
  public async getDashboardStats(userRole: string, userId?: string) {
    const cacheKey = `dashboard_stats:${userRole}:${userId || 'global'}`
    
    return this.getCachedOrFetch(cacheKey, async () => {
      switch (userRole) {
        case 'Admin':
          return this.getAdminDashboardStats()
        case 'Dean/Program Head':
        case 'Department Head':
          return this.getDeanDashboardStats(userId!)
        case 'Finance Department':
        case 'Finance Officer':
        case 'Finance Office Head':
          return this.getFinanceDashboardStats()
        case 'Teacher/Instructor':
        case 'Teacher':
          return this.getTeacherDashboardStats(userId!)
        default:
          return {}
      }
    }, 2 * 60 * 1000) // 2 minutes TTL for dashboard stats
  }

  /**
   * Admin dashboard stats
   */
  private async getAdminDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalApplications,
      pendingApplications,
      totalDepartments,
      recentActivities
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.leaveApplication.count(),
      this.prisma.leaveApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.department.count(),
      this.prisma.leaveApplication.findMany({
        take: 5,
        orderBy: { appliedAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          leaveType: { select: { name: true } }
        }
      })
    ])

    return {
      totalUsers,
      activeUsers,
      totalApplications,
      pendingApplications,
      totalDepartments,
      recentActivities
    }
  }

  /**
   * Dean dashboard stats
   */
  private async getDeanDashboardStats(userId: string) {
    const [
      pendingApplications,
      approvedApplications,
      facultyMembers,
      recentApplications
    ] = await Promise.all([
      this.prisma.leaveApplication.count({
        where: { status: 'PENDING' }
      }),
      this.prisma.leaveApplication.count({
        where: { status: 'DEAN_APPROVED' }
      }),
      this.prisma.user.count({
        where: {
          role: {
            name: { in: ['Teacher/Instructor', 'Non Teaching Personnel'] }
          }
        }
      }),
      this.prisma.leaveApplication.findMany({
        take: 5,
        orderBy: { appliedAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          leaveType: { select: { name: true } }
        }
      })
    ])

    return {
      pendingApplications,
      approvedApplications,
      facultyMembers,
      recentApplications
    }
  }

  /**
   * Finance dashboard stats
   */
  private async getFinanceDashboardStats() {
    const [
      deanApprovedApplications,
      approvedApplications,
      deniedApplications,
      totalDepartments
    ] = await Promise.all([
      this.prisma.leaveApplication.count({
        where: { status: 'DEAN_APPROVED' }
      }),
      this.prisma.leaveApplication.count({
        where: { status: 'APPROVED' }
      }),
      this.prisma.leaveApplication.count({
        where: { status: 'DENIED' }
      }),
      this.prisma.department.count()
    ])

    return {
      deanApprovedApplications,
      approvedApplications,
      deniedApplications,
      totalDepartments
    }
  }

  /**
   * Teacher dashboard stats
   */
  private async getTeacherDashboardStats(userId: string) {
    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      leaveBalance
    ] = await Promise.all([
      this.prisma.leaveApplication.count({
        where: { users_id: userId }
      }),
      this.prisma.leaveApplication.count({
        where: { users_id: userId, status: 'PENDING' }
      }),
      this.prisma.leaveApplication.count({
        where: { users_id: userId, status: 'APPROVED' }
      }),
      this.prisma.leaveBalance.findMany({
        where: { users_id: userId },
        include: { leaveType: true }
      })
    ])

    return {
      totalApplications,
      pendingApplications,
      approvedApplications,
      leaveBalance
    }
  }

  /**
   * Batch operations for better performance
   */
  public async batchUpdateLeaveBalances(updates: Array<{
    userId: string
    leaveTypeId: number
    balance: number
  }>) {
    const promises = updates.map(update =>
      this.prisma.leaveBalance.upsert({
        where: {
          users_id_leave_type_id: {
            users_id: update.userId,
            leave_type_id: update.leaveTypeId
          }
        },
        update: { balance: update.balance },
        create: {
          users_id: update.userId,
          leave_type_id: update.leaveTypeId,
          balance: update.balance,
          status_id: 1 // Active status
        }
      })
    )

    return Promise.all(promises)
  }

  /**
   * Optimized search with pagination
   */
  public async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 10,
    filters?: any
  ) {
    const skip = (page - 1) * limit
    const whereClause = {
      ...filters,
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { email: { contains: query, mode: 'insensitive' as const } }
      ]
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          role: true,
          department: true,
          status: true
        },
        orderBy: { name: 'asc' }
      }),
      this.prisma.user.count({ where: whereClause })
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Cleanup and close connections
   */
  public async cleanup(): Promise<void> {
    this.cache.clear()
    await this.prisma.$disconnect()
  }
}

// Export singleton instance
export const databaseOptimizer = DatabaseOptimizer.getInstance()

// Export class for testing
export { DatabaseOptimizer }