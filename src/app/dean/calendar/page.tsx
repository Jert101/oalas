"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, AlertCircle, CheckCircle, XCircle, CalendarDays } from "lucide-react"
import { toast } from "sonner"

interface LeaveApplication {
  id: string
  user: {
    name: string
    email: string
  }
  leave_type: {
    name: string
  }
  start_date: string
  end_date: string
  status: string
  reason: string
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'leave' | 'event' | 'deadline'
  status: string
  user?: string
}

export default function DeanCalendarPage() {
  const { data: session } = useSession()
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchLeaveApplications()
  }, [])

  const fetchLeaveApplications = async () => {
    try {
      const res = await fetch('/api/dean/leave-applications')
      if (res.ok) {
        const data = await res.json()
        setLeaveApplications(data.data?.applications || [])
      }
    } catch (error) {
      console.error('Error fetching leave applications:', error)
      toast.error('Failed to load leave applications')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getUpcomingLeaves = () => {
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
    
    return leaveApplications
      .filter(app => {
        const startDate = new Date(app.start_date)
        return startDate >= today && startDate <= nextMonth && app.status === 'Approved'
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 10)
  }

  const getPendingApplications = () => {
    return leaveApplications.filter(app => app.status === 'Pending').length
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntilLeave = (dateString: string) => {
    const leaveDate = new Date(dateString)
    const today = new Date()
    const diffTime = leaveDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Department Calendar</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage leave schedules and track department activities
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{getPendingApplications()}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Leaves</p>
                <p className="text-2xl font-bold">{getUpcomingLeaves().length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{leaveApplications.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Leaves */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Upcoming Approved Leaves
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : getUpcomingLeaves().length > 0 ? (
              <div className="space-y-3">
                {getUpcomingLeaves().map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{leave.user.name}</p>
                      <p className="text-sm text-muted-foreground">{leave.leave_type.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(leave.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(leave.status)}
                          {leave.status}
                        </div>
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getDaysUntilLeave(leave.start_date)} days
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming leaves</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No approved leaves scheduled for the next month.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : leaveApplications.length > 0 ? (
              <div className="space-y-3">
                {leaveApplications.slice(0, 5).map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{application.user.name}</p>
                      <p className="text-sm text-muted-foreground">{application.leave_type.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(application.start_date)} - {formatDate(application.end_date)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(application.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(application.status)}
                        {application.status}
                      </div>
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No leave applications found.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => window.location.href = '/dean/applications'}>
              <Users className="h-4 w-4 mr-2" />
              Review Applications
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dean/faculty'}>
              <Users className="h-4 w-4 mr-2" />
              View Faculty
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dean/leave/apply'}>
              <Calendar className="h-4 w-4 mr-2" />
              Apply for Leave
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
