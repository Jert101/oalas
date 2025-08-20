"use client"

import { useEffect, useState } from "react"
import { 
  IconUser, 
  IconAlertTriangle, 
  IconCalendar,
  IconClock
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface RecentActivity {
  id: string
  type: 'user_created' | 'probation_started' | 'leave_submitted' | 'leave_approved'
  description: string
  user?: {
    name: string
    profilePicture?: string
  }
  timestamp: string
}

export function AdminRecentActivity() {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for now - in a real app, this would come from an API
    const mockActivities: RecentActivity[] = [
      {
        id: '1',
        type: 'user_created',
        description: 'New user account created',
        user: { name: 'John Doe' },
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
      },
      {
        id: '2',
        type: 'probation_started',
        description: 'Probationary period initiated',
        user: { name: 'Jane Smith' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
      },
      {
        id: '3',
        type: 'leave_submitted',
        description: 'Leave application submitted',
        user: { name: 'Mike Johnson' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
      },
      {
        id: '4',
        type: 'leave_approved',
        description: 'Leave application approved',
        user: { name: 'Sarah Wilson' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() // 8 hours ago
      }
    ]

    setTimeout(() => {
      setActivities(mockActivities)
      setLoading(false)
    }, 500)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created':
        return <IconUser className="size-4 text-green-600" />
      case 'probation_started':
        return <IconAlertTriangle className="size-4 text-amber-600" />
      case 'leave_submitted':
      case 'leave_approved':
        return <IconCalendar className="size-4 text-blue-600" />
      default:
        return <IconClock className="size-4 text-gray-600" />
    }
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'user_created':
        return <Badge variant="outline" className="text-green-600 border-green-600">New User</Badge>
      case 'probation_started':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Probation</Badge>
      case 'leave_submitted':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Leave Request</Badge>
      case 'leave_approved':
        return <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>
      default:
        return <Badge variant="outline">Activity</Badge>
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconClock className="size-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest system activities and user actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="size-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No recent activity to display
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                <Avatar className="size-10">
                  <AvatarImage src={activity.user?.profilePicture || "/ckcm.png"} />
                  <AvatarFallback>
                    {activity.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.type)}
                      <p className="text-sm font-medium">
                        {activity.user?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getActivityBadge(activity.type)}
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
