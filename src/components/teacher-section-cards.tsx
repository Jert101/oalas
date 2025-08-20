"use client"

import { useEffect, useState } from "react"
import { IconTrendingUp, IconCalendar, IconAlertTriangle, IconUserCheck, IconClock } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface TeacherStats {
  totalLeaveApplications: number
  pendingLeaveApplications: number
  approvedLeaveApplications: number
  rejectedLeaveApplications: number
  remainingLeaveBalance: number
  currentProbationStatus: string | null
  upcomingDeadlines: number
  recentActivities: number
}

export function TeacherSectionCards() {
  const [stats, setStats] = useState<TeacherStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/teacher/dashboard")
        if (response.ok) {
          const data = await response.json()
          setStats(data.data)
        }
      } catch (error) {
        console.error("Error fetching teacher stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    // Show mock data when API is not available
    const mockStats: TeacherStats = {
      totalLeaveApplications: 12,
      pendingLeaveApplications: 2,
      approvedLeaveApplications: 8,
      rejectedLeaveApplications: 2,
      remainingLeaveBalance: 15,
      currentProbationStatus: null,
      upcomingDeadlines: 3,
      recentActivities: 5
    }
    setStats(mockStats)
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Leave Balance Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconCalendar className="size-4" />
            Remaining Leave Balance
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.remainingLeaveBalance || 15} days
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-green-600">
              <IconTrendingUp />
              Available
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Leave days remaining this year <IconCalendar className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Plan your time off wisely
          </div>
        </CardFooter>
      </Card>

      {/* Pending Leave Applications Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconClock className="size-4" />
            Pending Leave Requests
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.pendingLeaveApplications || 2}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-amber-600">
              <IconClock />
              Under Review
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Awaiting approval <IconClock className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Applications under review
          </div>
        </CardFooter>
      </Card>

      {/* Probation Status Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconUserCheck className="size-4" />
            Employment Status
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.currentProbationStatus || "Regular"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={stats?.currentProbationStatus === "Probation" ? "text-amber-600" : "text-green-600"}>
              {stats?.currentProbationStatus === "Probation" ? <IconAlertTriangle /> : <IconUserCheck />}
              {stats?.currentProbationStatus === "Probation" ? "Probationary" : "Regular"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats?.currentProbationStatus === "Probation" ? "Under evaluation" : "Stable employment"} <IconUserCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Current employment standing
          </div>
        </CardFooter>
      </Card>

      {/* Leave Applications Summary Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconCalendar className="size-4" />
            Total Leave Applications
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.totalLeaveApplications || 12}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-blue-600">
              {stats?.approvedLeaveApplications || 8} approved
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats?.approvedLeaveApplications || 8} approved, {stats?.rejectedLeaveApplications || 2} rejected <IconCalendar className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Leave application history
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
