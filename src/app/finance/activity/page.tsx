"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar
} from "lucide-react"

interface Activity {
  id: number
  type: string
  description: string
  timestamp: string
  user: {
    name: string
    email: string
    profilePicture: string
    department: string
  }
  application: {
    leaveType: string
    status: string
    startDate: string
    endDate: string
    numberOfDays: number
  }
}

interface ActivityData {
  activities: Activity[]
  summary: {
    totalActivities: number
    applicationsToday: number
    applicationsThisWeek: number
    byType: Record<string, number>
  }
}

export default function FinanceActivityPage() {
  const [data, setData] = useState<ActivityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const response = await fetch('/api/finance/activity')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setData(result.data)
          }
        }
      } catch (error) {
        console.error('Error loading activity:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadActivity()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'denied': return <XCircle className="h-4 w-4 text-red-600" />
      case 'dean_approved': return <Clock className="h-4 w-4 text-blue-600" />
      case 'applied': return <FileText className="h-4 w-4 text-gray-600" />
      default: return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'denied': return 'bg-red-100 text-red-800'
      case 'dean_approved': return 'bg-blue-100 text-blue-800'
      case 'applied': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Recent Activity</h1>
        <p className="text-muted-foreground">
          Recent activities and actions in the finance department
        </p>
      </div>

      {!data || data.activities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500">
              No recent activities have been recorded in the system.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {data.activities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Finance Department</span>
                        <Badge className={getActivityBadgeColor(activity.type)}>
                          {activity.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Application ID: #{activity.id} • {activity.application.numberOfDays} day{activity.application.numberOfDays > 1 ? 's' : ''} • {activity.application.leaveType}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Department: {activity.user.department}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.summary.totalActivities}</div>
                  <div className="text-sm text-gray-600">Total Activities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.summary.applicationsToday}</div>
                  <div className="text-sm text-gray-600">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{data.summary.applicationsThisWeek}</div>
                  <div className="text-sm text-gray-600">This Week</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{Object.keys(data.summary.byType).length}</div>
                  <div className="text-sm text-gray-600">Activity Types</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
