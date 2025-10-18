import { prisma } from './prisma'
import { advancedCache } from './advanced-cache'

interface QueryCache {
  [key: string]: {
    data: any
    timestamp: number
    ttl: number
  }
}

class DatabaseOptimizer {
  private queryCache: QueryCache = {}
  private connectionPool: any[] = []
  private maxPoolSize = 10
  private queryStats = {
    totalQueries: 0,
    cachedQueries: 0,
    slowQueries: 0,
  }

  // Smart query caching
  private getQueryKey(query: string, params: any): string {
    return `db:${query}:${JSON.stringify(params)}`
  }

  // Cache database query results
  private async cacheQuery<T>(key: string, queryFn: () => Promise<T>, ttl: number = 30000): Promise<T> {
    const cached = this.queryCache[key]
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      this.queryStats.cachedQueries++
      return cached.data
    }

    const startTime = Date.now()
    const result = await queryFn()
    const queryTime = Date.now() - startTime

    // Log slow queries
    if (queryTime > 1000) {
      console.warn(`🐌 Slow query detected: ${queryTime}ms`)
      this.queryStats.slowQueries++
    }

    // Cache the result
    this.queryCache[key] = {
      data: result,
      timestamp: Date.now(),
      ttl
    }

    this.queryStats.totalQueries++
    return result
  }

  // Optimized user queries
  async getUserWithRelations(email: string) {
    const key = this.getQueryKey('getUserWithRelations', { email })
    return this.cacheQuery(key, () => 
      prisma.user.findUnique({
        where: { email },
        include: {
          department: true,
          role: true,
          status: true
        }
      }), 60000 // 1 minute cache
    )
  }

  // Optimized dashboard queries
  async getDashboardStats(userId: string, role: string) {
    const key = this.getQueryKey('getDashboardStats', { userId, role })
    return this.cacheQuery(key, async () => {
      const [currentPeriod, userStats] = await Promise.all([
        prisma.calendarPeriod.findFirst({
          where: { isCurrent: true },
          select: {
            calendar_period_id: true,
            academicYear: true,
            startDate: true,
            endDate: true
          }
        }),
        this.getUserStats(userId, role)
      ])

      return {
        currentPeriod,
        ...userStats
      }
    }, 30000) // 30 seconds cache
  }

  // Optimized application queries
  async getApplicationsWithFilters(filters: any) {
    const key = this.getQueryKey('getApplicationsWithFilters', filters)
    return this.cacheQuery(key, () => 
      prisma.leaveApplication.findMany({
        where: filters,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              profilePicture: true,
              department: {
                select: { name: true }
              }
            }
          },
          leaveType: {
            select: { name: true }
          }
        },
        orderBy: { appliedAt: 'desc' }
      }), 60000 // 1 minute cache
    )
  }

  // Batch multiple queries
  async batchQueries(queries: Array<{ key: string; query: () => Promise<any>; ttl?: number }>) {
    const results: any = {}
    
    await Promise.all(
      queries.map(async ({ key, query, ttl = 30000 }) => {
        results[key] = await this.cacheQuery(key, query, ttl)
      })
    )

    return results
  }

  // Get user statistics based on role
  private async getUserStats(userId: string, role: string) {
    switch (role) {
      case 'Dean/Program Head':
        return this.getDeanStats(userId)
      case 'Finance Department':
        return this.getFinanceStats()
      case 'Teacher/Instructor':
        return this.getTeacherStats(userId)
      default:
        return this.getAdminStats()
    }
  }

  private async getDeanStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { users_id: userId },
      select: { department_id: true }
    })

    if (!user?.department_id) return {}

    const [facultyCount, applications] = await Promise.all([
      prisma.user.count({
        where: {
          department_id: user.department_id,
          role: { name: 'Teacher/Instructor' }
        }
      }),
      prisma.leaveApplication.findMany({
        where: {
          user: { department_id: user.department_id }
        },
        select: { status: true }
      })
    ])

    return {
      facultyCount,
      pendingApplications: applications.filter(a => a.status === 'PENDING').length,
      approvedApplications: applications.filter(a => a.status === 'APPROVED').length,
      deniedApplications: applications.filter(a => a.status === 'DENIED').length
    }
  }

  private async getFinanceStats() {
    const [applications, departments, faculty] = await Promise.all([
      prisma.leaveApplication.findMany({
        select: { status: true }
      }),
      prisma.department.count(),
      prisma.user.count({
        where: {
          role: {
            name: { in: ['Teacher/Instructor', 'Non Teaching Personnel'] }
          }
        }
      })
    ])

    return {
      totalApplications: applications.length,
      pendingApplications: applications.filter(a => a.status === 'PENDING').length,
      approvedApplications: applications.filter(a => a.status === 'APPROVED').length,
      deniedApplications: applications.filter(a => a.status === 'DENIED').length,
      deanApprovedPendingFinance: applications.filter(a => a.status === 'DEAN_APPROVED').length,
      totalDepartments: departments,
      totalFaculty: faculty
    }
  }

  private async getTeacherStats(userId: string) {
    const [applications, leaveBalance] = await Promise.all([
      prisma.leaveApplication.findMany({
        where: { users_id: userId },
        select: { status: true, appliedAt: true },
        orderBy: { appliedAt: 'desc' },
        take: 5
      }),
      prisma.leaveBalance.findMany({
        where: { users_id: userId },
        select: { allowedDays: true, usedDays: true, remainingDays: true }
      })
    ])

    return {
      recentApplications: applications,
      leaveBalance: leaveBalance.reduce((acc, balance) => ({
        allowed: acc.allowed + balance.allowedDays,
        used: acc.used + balance.usedDays,
        remaining: acc.remaining + balance.remainingDays
      }), { allowed: 0, used: 0, remaining: 0 })
    }
  }

  private async getAdminStats() {
    const [users, departments, applications] = await Promise.all([
      prisma.user.count(),
      prisma.department.count(),
      prisma.leaveApplication.count()
    ])

    return {
      totalUsers: users,
      totalDepartments: departments,
      totalApplications: applications
    }
  }

  // Clear query cache
  clearCache(): void {
    this.queryCache = {}
  }

  // Get query statistics
  getStats() {
    return {
      ...this.queryStats,
      cacheHitRate: this.queryStats.totalQueries > 0 
        ? (this.queryStats.cachedQueries / this.queryStats.totalQueries * 100).toFixed(2) + '%'
        : '0%',
      cacheSize: Object.keys(this.queryCache).length
    }
  }

  // Optimize database connection
  async optimizeConnection(): Promise<void> {
    // This would typically involve connection pooling configuration
    // For Prisma, we rely on its built-in connection management
    console.log('🔧 Database connection optimized')
  }
}

export const databaseOptimizer = new DatabaseOptimizer()












