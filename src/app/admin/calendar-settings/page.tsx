"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CalendarDays, Plus, Eye, Clock, GraduationCap } from "lucide-react"
import { format } from "date-fns"

interface CalendarPeriod {
  calendar_period_id: number
  academicYear: string
  termType: {
    term_type_id: number
    name: string
  }
  startDate: string
  endDate: string
  isCurrent: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface LeaveApplication {
  leave_application_id: number
  users_id: string
  leaveType: string
  startDate: string
  endDate: string
  reason?: string
  status: "PENDING" | "APPROVED" | "DENIED" | "CANCELLED"
  appliedAt: string
  user: {
    users_id: string
    name: string
    email: string
    department?: {
      name: string
    }
  }
}

interface NewPeriodForm {
  academicYear: string
  term: "Academic" | "Summer"
  startDate: string
  endDate: string
}

export default function CalendarSettingsPage() {
  const { data: session, status } = useSession()
  const [currentPeriod, setCurrentPeriod] = useState<CalendarPeriod | null>(null)
  const [calendarArchive, setCalendarArchive] = useState<CalendarPeriod[]>([])
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<CalendarPeriod | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [newPeriod, setNewPeriod] = useState<NewPeriodForm>({
    academicYear: "",
    term: "Academic",
    startDate: "",
    endDate: ""
  })

  // Fetch calendar periods
  const fetchCalendarPeriods = async () => {
    try {
      const response = await fetch("/api/admin/calendar-periods")
      if (!response.ok) throw new Error("Failed to fetch calendar periods")
      const data = await response.json()
      
      const current = data.find((period: CalendarPeriod) => period.isCurrent)
      const archive = data.filter((period: CalendarPeriod) => !period.isCurrent)
      
      setCurrentPeriod(current || null)
      setCalendarArchive(archive)
    } catch (error) {
      toast.error("Failed to load calendar periods")
      console.error("Error fetching calendar periods:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch leave applications for a specific period
  const fetchLeaveApplications = async (periodId: number) => {
    try {
      const response = await fetch(`/api/admin/leave-applications?periodId=${periodId}`)
      if (!response.ok) throw new Error("Failed to fetch leave applications")
      const data = await response.json()
      setLeaveApplications(data)
    } catch (error) {
      toast.error("Failed to load leave applications")
      console.error("Error fetching leave applications:", error)
    }
  }

  // Add new calendar period
  const handleAddPeriod = async () => {
    if (!newPeriod.academicYear || !newPeriod.startDate || !newPeriod.endDate) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/calendar-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPeriod)
      })

      if (!response.ok) throw new Error("Failed to add calendar period")
      
      toast.success("Calendar period added and set as current successfully")
      setIsAddDialogOpen(false)
      setNewPeriod({
        academicYear: "",
        term: "Academic",
        startDate: "",
        endDate: ""
      })
      fetchCalendarPeriods()
    } catch (error) {
      toast.error("Failed to add calendar period")
      console.error("Error adding calendar period:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Set period as current
  const handleSetCurrent = async (periodId: number) => {
    try {
      const response = await fetch(`/api/admin/calendar-periods/${periodId}/set-current`, {
        method: "PATCH"
      })

      if (!response.ok) throw new Error("Failed to set current period")
      
      toast.success("Current period updated successfully")
      fetchCalendarPeriods()
    } catch (error) {
      toast.error("Failed to update current period")
      console.error("Error setting current period:", error)
    }
  }

  // View leave applications
  const handleViewApplications = (period: CalendarPeriod) => {
    setSelectedPeriod(period)
    fetchLeaveApplications(period.calendar_period_id)
    setIsViewDialogOpen(true)
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default"
      case "PENDING":
        return "secondary"
      case "DENIED":
        return "destructive"
      case "CANCELLED":
        return "outline"
      default:
        return "outline"
    }
  }

  // Get term display name
  const getTermDisplayName = (term: string) => {
    return term === "Academic" ? "Academic" : "Summer"
  }

  useEffect(() => {
    fetchCalendarPeriods()
  }, [])

  // Authentication check
  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (status === "unauthenticated") {
    redirect("/auth/signin")
  }

  if (session?.user?.role !== "Admin") {
    redirect("/dashboard")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="mx-auto h-8 w-8 animate-spin text-[#1E293B]" />
          <p className="mt-2 text-sm text-gray-600">Loading calendar settings...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "16rem",
        "--header-height": "3.5rem",
      } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
              <CalendarDays className="h-8 w-8 text-[#1E293B]" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#1E293B]">Calendar Settings</h1>
                <p className="text-gray-600">Manage academic calendar periods and view leave applications</p>
              </div>
            </div>

      {/* Current Calendar Period */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Current Calendar Period
          </CardTitle>
          <CardDescription>
            The active calendar period for leave applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPeriod ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Academic Year</Label>
                  <p className="text-lg font-semibold">{currentPeriod.academicYear}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Term</Label>
                  <p className="text-lg font-semibold">{getTermDisplayName(currentPeriod.termType.name)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Start Date</Label>
                  <p className="text-lg font-semibold">
                    {format(new Date(currentPeriod.startDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">End Date</Label>
                  <p className="text-lg font-semibold">
                    {format(new Date(currentPeriod.endDate), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <Badge className="w-fit bg-green-100 text-green-800 hover:bg-green-100">
                Current Period
              </Badge>
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-lg font-medium text-gray-900">No current period set</p>
              <p className="text-sm text-gray-600">Add a new calendar period to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Calendar Period */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Calendar Period
          </CardTitle>
          <CardDescription>
            Create a new academic calendar period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF8C00] hover:bg-[#FF8C00]/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Calendar Period
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Calendar Period</DialogTitle>
                <DialogDescription>
                  Create a new calendar period. It will automatically be set as the current active period.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Input
                    id="academicYear"
                    placeholder="e.g., 2024-2025"
                    value={newPeriod.academicYear}
                    onChange={(e) => setNewPeriod({ ...newPeriod, academicYear: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="term">Term *</Label>
                  <Select 
                    value={newPeriod.term} 
                    onValueChange={(value: "Academic" | "Summer") => 
                      setNewPeriod({ ...newPeriod, term: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newPeriod.startDate}
                    onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newPeriod.endDate}
                    onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddPeriod}
                    disabled={isSubmitting}
                    className="bg-[#FF8C00] hover:bg-[#FF8C00]/90"
                  >
                    {isSubmitting ? "Adding..." : "Add Period"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Calendar Archive */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Archive</CardTitle>
          <CardDescription>
            Previous and upcoming calendar periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calendarArchive.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calendarArchive.map((period) => (
                  <TableRow key={period.calendar_period_id}>
                    <TableCell className="font-medium">
                      {period.academicYear}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTermDisplayName(period.termType.name)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(period.startDate), "MMM dd, yyyy")} - {" "}
                      {format(new Date(period.endDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewApplications(period)}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetCurrent(period.calendar_period_id)}
                          className="bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-white border-[#FF8C00]"
                        >
                          Set as Current
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-lg font-medium text-gray-900">No archived periods</p>
              <p className="text-sm text-gray-600">Archived periods will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Applications Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Leave Applications - {selectedPeriod?.academicYear} {" "}
              ({getTermDisplayName(selectedPeriod?.termType.name || "ACADEMIC")})
            </DialogTitle>
            <DialogDescription>
              All leave applications for this calendar period
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {leaveApplications.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveApplications.map((application) => (
                    <TableRow key={application.leave_application_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{application.user.name}</div>
                          <div className="text-sm text-gray-600">{application.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {application.user.department?.name || "N/A"}
                      </TableCell>
                      <TableCell>{application.leaveType}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(application.startDate), "MMM dd")} - {" "}
                          {format(new Date(application.endDate), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(application.status)}>
                          {application.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(application.appliedAt), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-lg font-medium text-gray-900">No applications found</p>
                <p className="text-sm text-gray-600">
                  No leave applications for this period
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
