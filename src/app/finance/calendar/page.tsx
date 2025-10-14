"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar,
  Clock,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface CalendarEvent {
  id: number
  title: string
  start: string
  end: string
  allDay: boolean
  status: string
  user: {
    name: string
    email: string
    profilePicture: string
    department: string
  }
  leaveType: string
  numberOfDays: number
  reason: string
  appliedAt: string
}

interface CalendarData {
  events: CalendarEvent[]
  summary: {
    totalEvents: number
    approvedEvents: number
    pendingEvents: number
    deniedEvents: number
    byLeaveType: Record<string, number>
    byDepartment: Record<string, number>
  }
  month: number
  year: number
}

export default function FinanceCalendarPage() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  const loadCalendarData = async (month?: number, year?: number) => {
    setIsLoading(true)
    try {
      const targetDate = month && year ? new Date(year, month - 1) : currentDate
      const url = `/api/finance/calendar?month=${targetDate.getMonth() + 1}&year=${targetDate.getFullYear()}`
      
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCalendarData()
  }, [])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
    loadCalendarData(newDate.getMonth() + 1, newDate.getFullYear())
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'DEAN_APPROVED': return 'bg-blue-100 text-blue-800'
      case 'DENIED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Calendar Overview</h1>
        <p className="text-muted-foreground">
          Calendar view of leave applications and important dates
        </p>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Current Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Month:</span>
                <span className="text-sm font-medium">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Events:</span>
                <span className="text-sm font-medium">{data?.summary.totalEvents || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Approved:</span>
                <Badge className="bg-green-100 text-green-800">{data?.summary.approvedEvents || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending:</span>
                <Badge className="bg-yellow-100 text-yellow-800">{data?.summary.pendingEvents || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              By Leave Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data && Object.keys(data.summary.byLeaveType).length > 0 ? (
                Object.entries(data.summary.byLeaveType).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-sm text-gray-600">{type}:</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No leave applications this month</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              By Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data && Object.keys(data.summary.byDepartment).length > 0 ? (
                Object.entries(data.summary.byDepartment).map(([dept, count]) => (
                  <div key={dept} className="flex justify-between">
                    <span className="text-sm text-gray-600">{dept}:</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No applications by department</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendar Events</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.events.length > 0 ? (
            <div className="space-y-4">
              {data.events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.user.department}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.start).toLocaleDateString()} - {new Date(event.end).toLocaleDateString()}
                      {event.numberOfDays > 1 && ` (${event.numberOfDays} days)`}
                    </p>
                  </div>
                  <Badge className={getStatusBadgeColor(event.status)}>
                    {event.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events this month</h3>
              <p className="mt-1 text-sm text-gray-500">
                No leave applications scheduled for {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
