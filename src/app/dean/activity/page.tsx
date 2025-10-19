"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, Users, CheckCircle, XCircle, AlertCircle, FileText, Calendar, TrendingUp, UserPlus, UserMinus } from "lucide-react"
import { toast } from "sonner"

interface ActivityItem {
  id: string
  type: 'approval' | 'rejection' | 'application' | 'leave_start' | 'leave_end' | 'user_action'
  title: string
  description: string
  user: string
  timestamp: string
  status?: string
  metadata?: any
}

interface ActivityStats {
  todayApplications: number
  thisWeekApplications: number
  pendingCount: number
  approvedCount: number
  rejectedCount: number
}

export default function DeanActivityPage() {
  const { data: session } = useSession()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [stats, setStats] = useState<ActivityStats>({
    todayApplications: 0,
    thisWeekApplications: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivityData()
  }, [])

  const fetchActivityData = async () => {
    try {
      // Fetch recent applications and generate activity feed
      const res = await fetch('/api/dean/leave-applications')
      if (res.ok) {
        const data = await res.json()
        const applications = data.data?.applications || []
        
        // Generate activity items from applications
        const activityItems = generateActivityFeed(applications)
        setActivities(activityItems)
        
        // Calculate stats
        const today = new Date()
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        setStats({
          todayApplications: applications.filter((app: any) => 
            new Date(app.created_at || app.start_date) >= today.setHours(0,0,0,0)
          ).length,
          thisWeekApplications: applications.filter((app: any) => 
            new Date(app.created_at || app.start_date) >= weekAgo
          ).length,
          pendingCount: applications.filter((app: any) => app.status === 'Pending').length,
          approvedCount: applications.filter((app: any) => app.status === 'Approved').length,
          rejectedCount: applications.filter((app: any) => app.status === 'Rejected').length
        })
      }
    } catch (error) {
      console.error('Error fetching activity data:', error)
      toast.error('Failed to load activity data')
    } finally {
      setLoading(false)
    }
  }

  const generateActivityFeed = (applications: any[]): ActivityItem[] => {
    const activities: ActivityItem[] = []
    
    applications.forEach((app) => {
      // Add application submission
      activities.push({
        id: `${app.id}-submission`,
        type: 'application',
        title: 'Leave Application Submitted',
        description: `${app.user.name} submitted a ${app.leave_type.name} application`,
        user: app.user.name,
        timestamp: app.created_at || app.start_date,
        status: app.status,
        metadata: { applicationId: app.id, leaveType: app.leave_type.name }
      })

      // Add status-specific activities
      if (app.status === 'Approved') {
        activities.push({
          id: `${app.id}-approved`,
          type: 'approval',
          title: 'Leave Application Approved',
          description: `${app.user.name}'s ${app.leave_type.name} application was approved`,
          user: 'Dean/Program Head',
          timestamp: app.updated_at || app.start_date,
          status: 'Approved',
          metadata: { applicationId: app.id, leaveType: app.leave_type.name }
        })
      } else if (app.status === 'Rejected') {
        activities.push({
          id: `${app.id}-rejected`,
          type: 'rejection',
          title: 'Leave Application Rejected',
          description: `${app.user.name}'s ${app.leave_type.name} application was rejected`,
          user: 'Dean/Program Head',
          timestamp: app.updated_at || app.start_date,
          status: 'Rejected',
          metadata: { applicationId: app.id, leaveType: app.leave_type.name }
        })
      }
    })

    // Sort by timestamp (newest first)
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejection':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'application':
        return <FileText className="h-5 w-5 text-blue-600" />
      case 'leave_start':
        return <Calendar className="h-5 w-5 text-purple-600" />
      case 'leave_end':
        return <Calendar className="h-5 w-5 text-gray-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'approval':
        return 'border-l-green-500 bg-green-50'
      case 'rejection':
        return 'border-l-red-500 bg-red-50'
      case 'application':
        return 'border-l-blue-500 bg-blue-50'
      case 'leave_start':
        return 'border-l-purple-500 bg-purple-50'
      case 'leave_end':
        return 'border-l-gray-500 bg-gray-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Activity Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track recent activities and department updates
        </p>
      </div>

      {/* Activity Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Applications</p>
                <p className="text-2xl font-bold">{stats.todayApplications}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats.thisWeekApplications}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading activities...</p>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className={`border-l-4 p-4 rounded-r-lg ${getActivityColor(activity.type)}`}>
                    <div className="flex items-start gap-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{activity.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        {activity.status && (
                          <Badge variant="outline" className="mt-2">
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No recent activities to display.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dean/applications'}>
                  <FileText className="h-4 w-4 mr-2" />
                  Review Applications
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dean/faculty'}>
                  <Users className="h-4 w-4 mr-2" />
                  View Faculty
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dean/calendar'}>
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Applications</span>
                  <Badge variant="outline">{activities.filter(a => a.type === 'application').length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Approved</span>
                  <Badge className="bg-green-100 text-green-800">{stats.approvedCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending</span>
                  <Badge className="bg-yellow-100 text-yellow-800">{stats.pendingCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rejected</span>
                  <Badge className="bg-red-100 text-red-800">{stats.rejectedCount}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
