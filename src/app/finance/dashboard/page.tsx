"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Building,
  ArrowRight,
  Calendar,
  Eye,
  TrendingUp
} from "lucide-react"
import { useRouter } from "next/navigation"

interface FinanceStats {
  totalApplications: number
  pendingApplications: number
  deanApprovedApplications: number
  approvedApplications: number
  deniedApplications: number
  totalDepartments: number
  totalFaculty: number
  recentApplications: Array<{
    id: number
    userName: string
    userEmail: string
    departmentName: string
    leaveType: string
    status: string
    startDate: string
    endDate: string
    appliedAt: string
  }>
  applicationsByStatus: Array<{
    status: string
    count: number
  }>
  applicationsByDepartment: Array<{
    departmentName: string
    count: number
  }>
}

export default function FinanceDashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<FinanceStats>({
    totalApplications: 0,
    pendingApplications: 0,
    deanApprovedApplications: 0,
    approvedApplications: 0,
    deniedApplications: 0,
    totalDepartments: 0,
    totalFaculty: 0,
    recentApplications: [],
    applicationsByStatus: [],
    applicationsByDepartment: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/finance/dashboard-stats')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStats(data.data)
          }
        }
      } catch (error) {
        console.error('Error loading finance stats:', error)
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'DEAN_APPROVED': return 'bg-blue-100 text-blue-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'DENIED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome back, {session?.user?.name}. Review and approve leave applications.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => router.push('/finance/applications')} variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            View Applications
          </Button>
          <Button onClick={() => router.push('/finance/reports')}>
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </Button>
        </div>
      </div>

      {/* Leave Application Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              All time applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting dean approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Finance</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deanApprovedApplications}</div>
            <p className="text-xs text-muted-foreground">
              Dean approved, awaiting finance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedApplications}</div>
            <p className="text-xs text-muted-foreground">
              Fully approved applications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Application Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied Applications</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deniedApplications}</div>
            <p className="text-xs text-muted-foreground">
              Rejected applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              Active departments
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
              Faculty members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Applications */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/finance/applications')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Review Applications
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/finance/reports')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Reports
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/finance/calendar')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentApplications.length > 0 ? (
                stats.recentApplications.slice(0, 3).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{app.userName}</p>
                      <p className="text-xs text-muted-foreground">{app.leaveType}</p>
                      <p className="text-xs text-muted-foreground">{app.departmentName}</p>
                    </div>
                    <Badge className={getStatusBadgeColor(app.status)}>
                      {app.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent applications
                </p>
              )}
              {stats.recentApplications.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push('/finance/applications')}
                >
                  View All Applications
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
