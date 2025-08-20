"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  ArrowRight
} from "lucide-react"

interface DashboardStats {
  pendingApplications: number
  approvedApplications: number
  deniedApplications: number
  totalFaculty: number
}

export default function DeanDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingApplications: 0,
    approvedApplications: 0,
    deniedApplications: 0,
    totalFaculty: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/dean/dashboard-stats')
        if (!res.ok) throw new Error('Failed to load stats')
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dean Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your department&apos;s leave applications and faculty
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => router.push('/dean/applications')} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            View Applications
          </Button>
          <Button onClick={() => router.push('/dean/leave')}>
            <Calendar className="mr-2 h-4 w-4" />
            Leave Management
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Applications</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedApplications}</div>
            <p className="text-xs text-muted-foreground">
              In current period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied Applications</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deniedApplications}</div>
            <p className="text-xs text-muted-foreground">
              In current period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFaculty}</div>
            <p className="text-xs text-muted-foreground">
              In your department
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/dean/applications')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Review Applications
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/dean/faculty')}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Faculty
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/dean/leave')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Leave Management
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Applications:</span>
                <span className="font-medium">{stats.pendingApplications + stats.approvedApplications + stats.deniedApplications}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Approval Rate:</span>
                <span className="font-medium">
                  {stats.approvedApplications + stats.deniedApplications > 0 
                    ? Math.round((stats.approvedApplications / (stats.approvedApplications + stats.deniedApplications)) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
