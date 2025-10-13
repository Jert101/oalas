"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Users,
  UserPlus,
  Building,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  Activity,
  TrendingUp,
  Calendar,
  Plus,
  ArrowRight
} from "lucide-react"

import data from "../../dashboard/data.json"

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    totalRoles: 0,
    totalLeaveTypes: 0,
    totalLeaveApplications: 0,
    pendingLeaveApplications: 0,
    approvedLeaveApplications: 0,
    rejectedLeaveApplications: 0,
    systemStatus: "Loading...",
    userCountByRole: [],
    userCountByDepartment: []
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load dashboard stats
        const statsResponse = await fetch('/api/admin/dashboard-stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          if (statsData.success) {
            setStats(statsData.data)
          }
        }

        // Load recent activities
        const activitiesResponse = await fetch('/api/admin/recent-activities')
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json()
          if (activitiesData.success) {
            setRecentActivities(activitiesData.data)
          }
        }
      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "Admin") {
      router.push("/dashboard")
    } else {
      loadData()
    }
  }, [status, session, router])

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "Admin") {
    return null
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {/* Admin Dashboard Header */}
            <div className="border-b bg-background px-4 py-4 lg:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Welcome back, {session.user.name}. Manage the OALASS system and user accounts.
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button onClick={() => router.push('/admin/add-account')} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>

                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Admin-Specific Statistics Cards */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                                     <CardContent>
                     <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                     <p className="text-xs text-muted-foreground">
                       Registered accounts
                     </p>
                   </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                                     <CardContent>
                     <div className="text-2xl font-bold">{stats.pendingLeaveApplications}</div>
                     <p className="text-xs text-muted-foreground">
                       Pending leave applications
                     </p>
                   </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Departments</CardTitle>
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
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                                     <CardContent>
                     <div className="text-2xl font-bold">{stats.systemStatus}</div>
                     <p className="text-xs text-muted-foreground">
                       All systems operational
                     </p>
                   </CardContent>
                                 </Card>
               </div>

               {/* Additional Real Data Cards */}
               <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                 <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                     <FileText className="h-4 w-4 text-orange-600" />
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold">{stats.totalLeaveApplications}</div>
                     <p className="text-xs text-muted-foreground">
                       Leave applications
                     </p>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium">Approved</CardTitle>
                     <CheckCircle className="h-4 w-4 text-green-600" />
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold">{stats.approvedLeaveApplications}</div>
                     <p className="text-xs text-muted-foreground">
                       Approved applications
                     </p>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                     <AlertTriangle className="h-4 w-4 text-red-600" />
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold">{stats.rejectedLeaveApplications}</div>
                     <p className="text-xs text-muted-foreground">
                       Rejected applications
                     </p>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium">Leave Types</CardTitle>
                     <Settings className="h-4 w-4 text-indigo-600" />
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold">{stats.totalLeaveTypes}</div>
                     <p className="text-xs text-muted-foreground">
                       Configured types
                     </p>
                   </CardContent>
                 </Card>
               </div>

              {/* Admin Quick Actions */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push('/admin/add-account')}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add New User
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Button>

                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push('/admin/manage-accounts')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage All Accounts
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push('/admin/manage-leave-limits')}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configure Leave Limits
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Overview</CardTitle>
                    <CardDescription>Current system status and metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                                         <div className="space-y-2">
                       <div className="flex justify-between">
                         <span className="text-sm text-muted-foreground">Total Users:</span>
                         <span className="font-medium">{stats.totalUsers.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm text-muted-foreground">Pending Applications:</span>
                         <span className="font-medium text-yellow-600">{stats.pendingLeaveApplications}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm text-muted-foreground">Departments:</span>
                         <span className="font-medium">{stats.totalDepartments}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm text-muted-foreground">Total Applications:</span>
                         <span className="font-medium">{stats.totalLeaveApplications}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm text-muted-foreground">Status:</span>
                         <Badge variant="outline" className="text-green-600 border-green-600">
                           {stats.systemStatus}
                         </Badge>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm text-muted-foreground">Approved:</span>
                         <span className="font-medium text-green-600">{stats.approvedLeaveApplications}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm text-muted-foreground">Rejected:</span>
                         <span className="font-medium text-red-600">{stats.rejectedLeaveApplications}</span>
                       </div>
                     </div>
                  </CardContent>
                </Card>
              </div>

                             {/* Recent Activities */}
               <Card>
                 <CardHeader>
                   <CardTitle>Recent Activities</CardTitle>
                   <CardDescription>Latest system activities and administrative actions</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     {recentActivities.length > 0 ? (
                       recentActivities.map((activity) => (
                         <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                           <div className="flex-shrink-0">
                             {activity.type === 'leave_application' && (
                               <FileText className="h-5 w-5 text-blue-600" />
                             )}
                             {activity.type === 'account_setup' && (
                               <UserPlus className="h-5 w-5 text-green-600" />
                             )}
                             {activity.type === 'user_creation' && (
                               <Users className="h-5 w-5 text-purple-600" />
                             )}
                             {activity.type === 'notification' && (
                               <AlertTriangle className="h-5 w-5 text-orange-600" />
                             )}
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                             <p className="text-sm text-gray-500">{activity.description}</p>
                             <div className="flex items-center space-x-2 mt-1">
                               <span className="text-xs text-gray-400">
                                 {new Date(activity.timestamp).toLocaleString()}
                               </span>
                               <Badge 
                                 variant="outline" 
                                 className={`text-xs ${
                                   activity.status === 'PENDING' ? 'text-yellow-600 border-yellow-600' :
                                   activity.status === 'APPROVED' ? 'text-green-600 border-green-600' :
                                   activity.status === 'DENIED' ? 'text-red-600 border-red-600' :
                                   'text-gray-600 border-gray-600'
                                 }`}
                               >
                                 {activity.status}
                               </Badge>
                             </div>
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="text-center py-8">
                         <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                         <p className="text-gray-500">No recent activities found</p>
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
