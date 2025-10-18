"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRealtimeDashboard, useRealtimeNotifications } from '@/hooks/use-realtime'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react'

interface DashboardStats {
  totalUsers?: number
  totalApplications?: number
  pendingApplications?: number
  approvedApplications?: number
  deniedApplications?: number
  facultyCount?: number
  departments?: number
  recentActivity?: any[]
}

export function RealtimeDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({})
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  // Real-time hooks
  const { dashboardData, isConnected } = useRealtimeDashboard(session?.user?.users_id)
  const { notifications } = useRealtimeNotifications(session?.user?.users_id)

  // Fetch initial dashboard data
  useEffect(() => {
    fetchDashboardData()
  }, [session?.user?.users_id])

  // Update stats when real-time data arrives
  useEffect(() => {
    if (dashboardData) {
      setStats(dashboardData)
      setLastUpdate(new Date())
      setIsLoading(false)
    }
  }, [dashboardData])

  const fetchDashboardData = async () => {
    if (!session?.user?.users_id) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/${session.user.role.toLowerCase()}/dashboard-stats`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'DENIED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live Updates Active' : 'Offline Mode'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            Last update: {formatTime(lastUpdate)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <span>Recent Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(0, 3).map((notification, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-gray-600">{notification.message}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active system users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.totalApplications || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total leave applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {isLoading ? '...' : stats.pendingApplications || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.facultyCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Teaching staff
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Application Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Approved</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? '...' : stats.approvedApplications || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span>Denied</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {isLoading ? '...' : stats.deniedApplications || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Rejected applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span>Pending</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {isLoading ? '...' : stats.pendingApplications || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Under review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system updates and changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}












