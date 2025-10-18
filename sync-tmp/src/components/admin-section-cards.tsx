"use client"

import { useEffect, useState } from "react"
import { IconTrendingDown, IconTrendingUp, IconUsers, IconUserCheck, IconAlertTriangle, IconCalendar } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface DashboardStats {
  totalUsers: number
  recentUsers: number
  activeProbations: number
  pendingLeaveApplications: number
  monthlyLeaveApplications: number
  growthRate: number
  roles: { id: number; name: string; count: number }[]
  statuses: { id: number; name: string; count: number }[]
}

export function AdminSectionCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard")
        if (response.ok) {
          const data = await response.json()
          setStats(data.data)
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
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

  if (!stats) return null

  const regularUsers = stats.statuses.find(s => s.name === "Regular")?.count || 0
  const probationaryUsers = stats.statuses.find(s => s.name === "Probation")?.count || 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconUsers className="size-4" />
            Total Users
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.growthRate >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.recentUsers} new users this month{" "}
            {stats.growthRate >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            User growth tracking
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconUserCheck className="size-4" />
            Regular Status
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {regularUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-green-600">
              <IconTrendingUp />
              {regularUsers > 0 ? Math.round((regularUsers / stats.totalUsers) * 100) : 0}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Users with regular status <IconUserCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Stable workforce representation
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconAlertTriangle className="size-4" />
            Active Probations
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.activeProbations.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-amber-600">
              {probationaryUsers} users
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Requires monitoring <IconAlertTriangle className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Users under probationary review
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconCalendar className="size-4" />
            Leave Applications
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.pendingLeaveApplications.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-blue-600">
              {stats.monthlyLeaveApplications} this month
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Pending approval <IconCalendar className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Leave requests awaiting review
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
