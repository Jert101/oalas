"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
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
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Filter, Settings } from "lucide-react"
import { toast } from "sonner"

interface LeaveLimit {
  leave_limit_id: number
  status_id: number
  term_type_id: number
  leave_type_id: number
  daysAllowed: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  status: {
    status_id: number
    name: string
  }
  termType: {
    term_type_id: number
    name: string
  }
  leaveType: {
    leave_type_id: number
    name: string
  }
}

interface Status {
  status_id: number
  name: string
}

interface TermType {
  term_type_id: number
  name: string
}

interface LeaveType {
  leave_type_id: number
  name: string
}

export default function ManageLeaveLimitsPage() {
  const { data: session, status: authStatus } = useSession()
  const [leaveLimits, setLeaveLimits] = useState<LeaveLimit[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [termTypes, setTermTypes] = useState<TermType[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [filteredLimits, setFilteredLimits] = useState<LeaveLimit[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [termFilter, setTermFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedLeaveLimit, setSelectedLeaveLimit] = useState<LeaveLimit | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    status_id: "",
    term_type_id: "",
    leave_type_id: "",
    daysAllowed: ""
  })

  // Authentication check
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      redirect("/login")
    }
    if (authStatus === "authenticated" && session?.user?.role !== "Admin") {
      redirect("/dashboard")
    }
  }, [authStatus, session])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leaveLimitsRes, statusesRes, termTypesRes, leaveTypesRes] = await Promise.all([
          fetch("/api/admin/leave-limits"),
          fetch("/api/admin/statuses"),
          fetch("/api/admin/term-types"),
          fetch("/api/admin/leave-types")
        ])

        if (!leaveLimitsRes.ok || !statusesRes.ok || !termTypesRes.ok || !leaveTypesRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const [leaveLimitsData, statusesData, termTypesData, leaveTypesData] = await Promise.all([
          leaveLimitsRes.json(),
          statusesRes.json(),
          termTypesRes.json(),
          leaveTypesRes.json()
        ])

        console.log("Leave limits data:", leaveLimitsData)
        console.log("Statuses data:", statusesData)
        console.log("Term types data:", termTypesData)
        console.log("Leave types data:", leaveTypesData)

        // Defensive programming - ensure data is arrays
        setLeaveLimits(Array.isArray(leaveLimitsData) ? leaveLimitsData : [])
        setStatuses(Array.isArray(statusesData) ? statusesData : [])
        setTermTypes(Array.isArray(termTypesData) ? termTypesData : [])
        setLeaveTypes(Array.isArray(leaveTypesData) ? leaveTypesData : [])
        setFilteredLimits(Array.isArray(leaveLimitsData) ? leaveLimitsData : [])
      } catch (error) {
        toast.error("Failed to load data")
        console.error("Error fetching data:", error)
        // Set empty arrays as fallback
        setLeaveLimits([])
        setStatuses([])
        setTermTypes([])
        setLeaveTypes([])
        setFilteredLimits([])
      } finally {
        setIsLoading(false)
      }
    }

    if (authStatus === "authenticated" && session?.user?.role === "Admin") {
      fetchData()
    }
  }, [authStatus, session])

  // Filter logic
  useEffect(() => {
    let filtered = leaveLimits

    if (statusFilter !== "all") {
      filtered = filtered.filter(limit => limit.status.name.toLowerCase() === statusFilter)
    }

    if (termFilter !== "all") {
      filtered = filtered.filter(limit => limit.termType.name === termFilter)
    }

    setFilteredLimits(filtered)
  }, [leaveLimits, statusFilter, termFilter])

  // Reset form
  const resetForm = () => {
    setFormData({
      status_id: "",
      term_type_id: "",
      leave_type_id: "",
      daysAllowed: ""
    })
  }

  // Add new leave limit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/admin/leave-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_id: parseInt(formData.status_id),
          term_type_id: parseInt(formData.term_type_id),
          leave_type_id: parseInt(formData.leave_type_id),
          daysAllowed: parseInt(formData.daysAllowed)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add leave limit")
      }

      const newLeaveLimit = await response.json()
      setLeaveLimits(prev => [...prev, newLeaveLimit])
      toast.success("Leave limit added successfully")
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add leave limit"
      toast.error(errorMessage)
      console.error("Error adding leave limit:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit leave limit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLeaveLimit) return

    console.log("Form data before submission:", formData)
    console.log("Selected leave limit:", selectedLeaveLimit)

    // Validate form data before sending
    if (!formData.status_id || !formData.term_type_id || !formData.leave_type_id || !formData.daysAllowed) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        status_id: parseInt(formData.status_id),
        term_type_id: parseInt(formData.term_type_id),
        leave_type_id: parseInt(formData.leave_type_id),
        daysAllowed: parseInt(formData.daysAllowed)
      }
      
      console.log("Sending payload:", payload)

      const response = await fetch(`/api/admin/leave-limits/${selectedLeaveLimit.leave_limit_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update leave limit")
      }

      const updatedLeaveLimit = await response.json()
      setLeaveLimits(prev => 
        prev.map(limit => 
          limit.leave_limit_id === selectedLeaveLimit.leave_limit_id 
            ? updatedLeaveLimit 
            : limit
        )
      )
      toast.success("Leave limit updated successfully")
      setIsEditDialogOpen(false)
      setSelectedLeaveLimit(null)
      resetForm()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update leave limit"
      toast.error(errorMessage)
      console.error("Error updating leave limit:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete leave limit
  const handleDelete = async () => {
    if (!selectedLeaveLimit) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/leave-limits/${selectedLeaveLimit.leave_limit_id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete leave limit")
      }

      setLeaveLimits(prev => 
        prev.filter(limit => limit.leave_limit_id !== selectedLeaveLimit.leave_limit_id)
      )
      toast.success("Leave limit deleted successfully")
      setIsDeleteDialogOpen(false)
      setSelectedLeaveLimit(null)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete leave limit"
      toast.error(errorMessage)
      console.error("Error deleting leave limit:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open edit dialog
  const openEditDialog = (leaveLimit: LeaveLimit) => {
    setSelectedLeaveLimit(leaveLimit)
    setFormData({
      status_id: leaveLimit.status_id.toString(),
      term_type_id: leaveLimit.term_type_id.toString(),
      leave_type_id: leaveLimit.leave_type_id.toString(),
      daysAllowed: leaveLimit.daysAllowed.toString()
    })
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (leaveLimit: LeaveLimit) => {
    setSelectedLeaveLimit(leaveLimit)
    setIsDeleteDialogOpen(true)
  }

  // Open add dialog
  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  if (authStatus === "loading" || isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col">
            <SiteHeader />
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <SiteHeader />
          <div className="flex-1 space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Manage Leave Limits</h1>
                <p className="text-muted-foreground">
                  Configure leave day limits for different statuses, terms, and leave types
                </p>
              </div>
              <Button onClick={openAddDialog} className="sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Leave Limit
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
                <CardDescription>
                  Filter leave limits by status and term type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="status-filter">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statuses.map((status) => (
                          <SelectItem key={status.status_id} value={status.name.toLowerCase()}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="term-filter">Term Type</Label>
                    <Select value={termFilter} onValueChange={setTermFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select term type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Terms</SelectItem>
                        {termTypes.map((termType) => (
                          <SelectItem key={termType.term_type_id} value={termType.name}>
                            {termType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Limits Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Leave Limits ({filteredLimits.length})
                </CardTitle>
                <CardDescription>
                  Current leave day limits configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Term Type</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Days Allowed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLimits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No leave limits found. Add a leave limit to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLimits.map((limit) => (
                          <TableRow key={limit.leave_limit_id}>
                            <TableCell>
                              <Badge variant="outline">
                                {limit.status.name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {limit.termType.name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge>
                                {limit.leaveType.name}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {limit.daysAllowed} days
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(limit)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteDialog(limit)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Leave Limit</DialogTitle>
                  <DialogDescription>
                    Set the number of allowed leave days for a specific combination
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="add-status">Status</Label>
                    <Select 
                      value={formData.status_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.status_id} value={status.status_id.toString()}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="add-term">Term Type</Label>
                    <Select 
                      value={formData.term_type_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, term_type_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select term type" />
                      </SelectTrigger>
                      <SelectContent>
                        {termTypes.map((termType) => (
                          <SelectItem key={termType.term_type_id} value={termType.term_type_id.toString()}>
                            {termType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="add-leave-type">Leave Type</Label>
                    <Select 
                      value={formData.leave_type_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, leave_type_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((leaveType) => (
                          <SelectItem key={leaveType.leave_type_id} value={leaveType.leave_type_id.toString()}>
                            {leaveType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="add-days">Days Allowed</Label>
                    <Input
                      id="add-days"
                      type="number"
                      min="0"
                      value={formData.daysAllowed}
                      onChange={(e) => setFormData(prev => ({ ...prev, daysAllowed: e.target.value }))}
                      placeholder="Enter number of days"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Leave Limit"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Leave Limit</DialogTitle>
                  <DialogDescription>
                    Update the leave limit configuration
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select 
                      value={formData.status_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.status_id} value={status.status_id.toString()}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-term">Term Type</Label>
                    <Select 
                      value={formData.term_type_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, term_type_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select term type" />
                      </SelectTrigger>
                      <SelectContent>
                        {termTypes.map((termType) => (
                          <SelectItem key={termType.term_type_id} value={termType.term_type_id.toString()}>
                            {termType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-leave-type">Leave Type</Label>
                    <Select 
                      value={formData.leave_type_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, leave_type_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((leaveType) => (
                          <SelectItem key={leaveType.leave_type_id} value={leaveType.leave_type_id.toString()}>
                            {leaveType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-days">Days Allowed</Label>
                    <Input
                      id="edit-days"
                      type="number"
                      min="0"
                      value={formData.daysAllowed}
                      onChange={(e) => setFormData(prev => ({ ...prev, daysAllowed: e.target.value }))}
                      placeholder="Enter number of days"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Updating..." : "Update Leave Limit"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Leave Limit</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this leave limit? This action cannot be undone.
                    {selectedLeaveLimit && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <strong>Limit:</strong> {selectedLeaveLimit.status.name} - {selectedLeaveLimit.termType.name} - {selectedLeaveLimit.leaveType.name} ({selectedLeaveLimit.daysAllowed} days)
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
