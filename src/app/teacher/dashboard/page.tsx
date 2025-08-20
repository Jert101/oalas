"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  ArrowRight
} from "lucide-react"
import { useRouter } from "next/navigation"

interface DashboardStats {
  totalLeaveDays: number
  usedLeaveDays: number
  remainingLeaveDays: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
}

interface RecentApplication {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  appliedAt: string
}

export default function TeacherDashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalLeaveDays: 0,
    usedLeaveDays: 0,
    remainingLeaveDays: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0
  })
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [canApply, setCanApply] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      // Fetch dashboard statistics
      const statsResponse = await fetch('/api/teacher/dashboard')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch recent applications
      const applicationsResponse = await fetch('/api/teacher/recent-applications')
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json()
        setRecentApplications(applicationsData.applications || [])
      }

      // Check validation status
      const validationResponse = await fetch('/api/teacher/validation')
      if (validationResponse.ok) {
        const validationData = await validationResponse.json()
        setCanApply(validationData.canApply)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {session?.user?.name}</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your leave applications
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button 
            onClick={() => router.push('/teacher/leave/apply')}
            disabled={!canApply}
          >
            <Plus className="mr-2 h-4 w-4" />
            Apply for Leave
          </Button>
          {!canApply && (
            <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
              ⚠️ You have pending applications that need to be reviewed first
            </p>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leave Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeaveDays}</div>
            <p className="text-xs text-muted-foreground">
              Available this semester
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Leave Days</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usedLeaveDays}</div>
            <p className="text-xs text-muted-foreground">
              Days taken this semester
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Days</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.remainingLeaveDays}</div>
            <p className="text-xs text-muted-foreground">
              Days still available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Application Status Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.approvedApplications}</div>
            <p className="text-sm text-muted-foreground">Applications approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingApplications}</div>
            <p className="text-sm text-muted-foreground">Applications pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.rejectedApplications}</div>
            <p className="text-sm text-muted-foreground">Applications rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Applications</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/teacher/leave')}
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Your latest leave applications and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by applying for your first leave.
              </p>
                             <div className="mt-6 flex flex-col items-center gap-2">
                 <Button 
                   onClick={() => router.push('/teacher/leave/apply')}
                   disabled={!canApply}
                 >
                   <Plus className="mr-2 h-4 w-4" />
                   Apply for Leave
                 </Button>
                 {!canApply && (
                   <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-center">
                     ⚠️ You have pending applications that need to be reviewed first
                   </p>
                 )}
               </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {application.leaveType}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(application.startDate)} - {formatDate(application.endDate)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Applied on {formatDate(application.appliedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(application.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
