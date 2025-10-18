"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { IconCalendar, IconUser, IconBell, IconCheck, IconX, IconClock } from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Activity {
  id: string
  type: "leave_application" | "status_update" | "notification" | "approval" | "rejection"
  title: string
  description: string
  timestamp: Date
  status?: "pending" | "approved" | "rejected"
  user?: {
    name: string
    avatar?: string
  }
}

export function TeacherRecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch("/api/teacher/activities")
        if (response.ok) {
          const data = await response.json()
          setActivities(data.data || [])
        }
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  // Mock data if API is not available
  const mockActivities: Activity[] = [
    {
      id: "1",
      type: "leave_application",
      title: "Leave Application Submitted",
      description: "Medical leave request for Dec 15-20, 2024",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: "pending",
    },
    {
      id: "2",
      type: "approval",
      title: "Leave Application Approved",
      description: "Vacation leave for Dec 5-7, 2024 has been approved",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: "approved",
      user: {
        name: "Dr. Maria Santos",
        avatar: "/placeholder-avatar.jpg"
      }
    },
    {
      id: "3",
      type: "status_update",
      title: "Employment Status Update",
      description: "Your probationary period has ended. Status updated to Regular Employee",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      user: {
        name: "HR Department",
      }
    },
    {
      id: "4",
      type: "notification",
      title: "Schedule Reminder",
      description: "You have classes tomorrow starting at 8:00 AM",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      id: "5",
      type: "rejection",
      title: "Leave Application Declined",
      description: "Emergency leave for Nov 28, 2024 was declined due to insufficient documentation",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      status: "rejected",
      user: {
        name: "Department Head",
      }
    },
  ]

  const displayActivities = activities.length > 0 ? activities : mockActivities

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "leave_application":
        return IconCalendar
      case "status_update":
        return IconUser
      case "notification":
        return IconBell
      case "approval":
        return IconCheck
      case "rejection":
        return IconX
      default:
        return IconClock
    }
  }

  const getStatusBadge = (status: Activity["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-amber-600">Pending</Badge>
      case "approved":
        return <Badge variant="outline" className="text-green-600">Approved</Badge>
      case "rejected":
        return <Badge variant="outline" className="text-red-600">Rejected</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest updates and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Your latest updates and notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.slice(0, 6).map((activity) => {
            const Icon = getActivityIcon(activity.type)
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {activity.user?.avatar ? (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                      <AvatarFallback>
                        {activity.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    {activity.status && getStatusBadge(activity.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {activity.user && (
                      <span className="text-xs text-muted-foreground">
                        by {activity.user.name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
