"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { DataTable } from "@/components/data-table"
import { 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  ArrowRight
} from "lucide-react"

import dashboardData from "../../dashboard/data.json"

interface DashboardStats {
  pendingApplications: number
  approvedApplications: number
  deniedApplications: number
  totalApplications: number
  facultyMembers: number
  departmentName: string
  recentApplications: Array<{
    id: number
    userName: string
    userEmail: string
    leaveType: string
    status: string
    startDate: string
    endDate: string
    createdAt: string
  }>
}

interface PendingRejection {
  id: string
  type: 'leave' | 'travel'
  applicantName: string
  applicantEmail: string
  leaveType: string
  startDate: string
  endDate: string
  appliedAt: string
  updatedAt: string
  rejectionReason: string
  department: string
}

export default function DeanDashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    pendingApplications: 0,
    approvedApplications: 0,
    deniedApplications: 0,
    totalApplications: 0,
    facultyMembers: 0,
    departmentName: "",
    recentApplications: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [pendingRejections, setPendingRejections] = useState<PendingRejection[]>([])
  const [isAcknowledging, setIsAcknowledging] = useState<string | null>(null)
  const router = useRouter()

  // Redirect non-dean users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
      return
    }
    
    if (status === "loading") {
      return // Wait for session to load
    }
    
    // Allow Dean/Program Head, Department Head, and office heads (isDepartmentHead = true)
    const userRole = session?.user?.role
    const isDepartmentHead = (session?.user as any)?.isDepartmentHead
    
    const allowedRoles = ["Dean/Program Head", "Department Head", "Admin"]
    const isAllowedRole = allowedRoles.includes(userRole || "")
    const isOfficeHead = isDepartmentHead === true
    
    console.log("[DeanDashboard] Access check:", {
      userRole,
      isDepartmentHead,
      isAllowedRole,
      isOfficeHead,
      shouldAllow: isAllowedRole || isOfficeHead
    })
    
    if (!isAllowedRole && !isOfficeHead) {
      console.log("[DeanDashboard] Access denied, redirecting to main dashboard")
      router.push("/dashboard")
    } else {
      console.log("[DeanDashboard] Access granted for:", userRole)
    }
  }, [session, status, router])

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

    const loadPendingRejections = async () => {
      try {
        const res = await fetch('/api/dean/pending-rejections')
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setPendingRejections(data.pendingRejections || [])
          }
        }
      } catch (error) {
        console.error('Error loading pending rejections:', error)
      }
    }

    loadStats()
    loadPendingRejections()
  }, [])

  // Function to acknowledge rejection and notify teacher
  const handleAcknowledgeRejection = async (rejectionId: string) => {
    setIsAcknowledging(rejectionId)
    try {
      const response = await fetch(`/api/dean/applications/${rejectionId}/acknowledge-rejection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remove the acknowledged rejection from the list
        setPendingRejections(prev => prev.filter(rejection => rejection.id !== rejectionId))
        // Show success message (you can add toast notification here)
        alert('Rejection acknowledged and applicant notified successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error acknowledging rejection:', error)
      alert('Failed to acknowledge rejection. Please try again.')
    } finally {
      setIsAcknowledging(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600">      </div>

      {/* Role-based Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dean Management Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={dashboardData.dean} />
        </CardContent>
      </Card>
    </div>
  )
}

  return (
    <div className="space-y-6">

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
            <div className="text-2xl font-bold">{stats.facultyMembers}</div>
            <p className="text-xs text-muted-foreground">
              In your department
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Rejections Requiring Acknowledgment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Pending Rejections Requiring Acknowledgment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Applications that were rejected by Finance and require your acknowledgment before notifying the applicant.
          </div>
          <div className="space-y-3">
            {pendingRejections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pending rejections requiring acknowledgment</p>
              </div>
            ) : (
              pendingRejections.map((rejection) => (
                <div key={rejection.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive" className="text-xs">
                          {rejection.type === 'travel' ? 'Travel Order' : 'Leave Application'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ID: {rejection.id}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-1">
                        {rejection.applicantName} - {rejection.leaveType}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Applied: {new Date(rejection.appliedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        <strong>Finance Rejection Reason:</strong> {rejection.rejectionReason}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAcknowledgeRejection(rejection.id)}
                      disabled={isAcknowledging === rejection.id}
                      className="ml-4"
                    >
                      {isAcknowledging === rejection.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        'Acknowledge & Notify Teacher'
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

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
