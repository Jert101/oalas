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
  DialogTrigger,
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
import { Clock, Plus, Edit, Trash2, Filter, Settings } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

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

const leaveLimitSchema = z.object({
  status_id: z.number().min(1, "Status is required"),
  term_type_id: z.number().min(1, "Term type is required"),
  leave_type_id: z.number().min(1, "Leave type is required"),
  daysAllowed: z.number().min(0, "Days allowed must be at least 0")
})

type LeaveLimitFormData = z.infer<typeof leaveLimitSchema>

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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<LeaveLimitFormData>({
    resolver: zodResolver(leaveLimitSchema)
  })

  // Authentication check
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      redirect("/auth/signin")
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

  // Add new leave limit
  const onSubmitAdd = async (data: LeaveLimitFormData) => {
    console.log("Form submission attempted with data:", data)
    console.log("Form errors:", errors)
    
    setIsSubmitting(true)
    try {
      console.log("Sending data to API:", data)
      const response = await fetch("/api/admin/leave-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      console.log("API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("API error response:", errorData)
        throw new Error(errorData.error || "Failed to add leave limit")
      }

      const newLeaveLimit = await response.json()
      console.log("Successfully added leave limit:", newLeaveLimit)
      setLeaveLimits(prev => [...prev, newLeaveLimit])
      toast.success("Leave limit added successfully")
      setIsAddDialogOpen(false)
      reset()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add leave limit"
      console.error("Error adding leave limit:", error)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit leave limit
  const onSubmitEdit = async (data: LeaveLimitFormData) => {
    if (!selectedLeaveLimit) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/leave-limits/${selectedLeaveLimit.leave_limit_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
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
      reset()
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
    setValue("status_id", leaveLimit.status_id)
    setValue("termType", leaveLimit.termType)
    setValue("leaveType", leaveLimit.leaveType)
    setValue("daysAllowed", leaveLimit.daysAllowed)
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (leaveLimit: LeaveLimit) => {
    setSelectedLeaveLimit(leaveLimit)
    setIsDeleteDialogOpen(true)
  }

  // Get display names
  const getTermDisplayName = (term: string) => {
    return term === "ACADEMIC" ? "Academic" : "Summer"
  }

  const getLeaveTypeDisplayName = (leaveType: string) => {
    switch (leaveType) {
      case "VACATION": return "Vacation"
      case "SICK": return "Sick"
      case "MATERNITY": return "Maternity"
      case "PATERNITY": return "Paternity"
      case "EMERGENCY": return "Emergency"
      default: return leaveType
    }
  }

  const getLeaveTypeBadgeVariant = (leaveType: string) => {
    switch (leaveType) {
      case "VACATION": return "default"
      case "SICK": return "secondary"
      case "MATERNITY": return "outline"
      case "PATERNITY": return "outline"
      case "EMERGENCY": return "destructive"
      default: return "outline"
    }
  }

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="mx-auto h-8 w-8 animate-spin text-[#1E293B]" />
          <p className="mt-2 text-sm text-gray-600">Loading leave limits...</p>
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Settings className="h-8 w-8 text-[#1E293B]" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#1E293B]">Manage Leave Limits</h1>
                <p className="text-gray-600">Configure leave allowances by status and term type</p>
              </div>
            </div>

            {/* Filters and Add Button */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="statusFilter">Status:</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="probation">Probation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="termFilter">Term Type:</Label>
                    <Select value={termFilter} onValueChange={setTermFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Terms</SelectItem>
                        <SelectItem value="ACADEMIC">Academic</SelectItem>
                        <SelectItem value="SUMMER">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="ml-auto">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#FF8C00] hover:bg-[#FF8C00]/90">
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Leave Limit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Add New Leave Limit</DialogTitle>
                          <DialogDescription>
                            Configure leave allowances for specific status and term combinations.
                          </DialogDescription>
                        </DialogHeader>
                        <form 
                          onSubmit={handleSubmit(onSubmitAdd, (errors) => {
                            console.log("Form validation failed with errors:", errors)
                            toast.error("Missing required fields")
                          })} 
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="status_id">Status *</Label>
                            <Select 
                              value={watch("status_id")?.toString() || ""} 
                              onValueChange={(value) => setValue("status_id", parseInt(value), { shouldValidate: true })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                {(statuses || []).map((status) => (
                                  <SelectItem key={status.status_id} value={status.status_id.toString()}>
                                    {status.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.status_id && (
                              <p className="text-sm text-red-600 mt-1">{errors.status_id.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="termType">Term Type *</Label>
                            <Select 
                              value={watch("termType") || ""} 
                              onValueChange={(value: "ACADEMIC" | "SUMMER") => setValue("termType", value, { shouldValidate: true })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select term type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ACADEMIC">Academic</SelectItem>
                                <SelectItem value="SUMMER">Summer</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.termType && (
                              <p className="text-sm text-red-600 mt-1">{errors.termType.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="leaveType">Leave Type *</Label>
                            <Select 
                              value={watch("leaveType") || ""} 
                              onValueChange={(value: "VACATION" | "SICK" | "MATERNITY" | "PATERNITY" | "EMERGENCY") => setValue("leaveType", value, { shouldValidate: true })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select leave type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VACATION">Vacation</SelectItem>
                                <SelectItem value="SICK">Sick</SelectItem>
                                <SelectItem value="MATERNITY">Maternity</SelectItem>
                                <SelectItem value="PATERNITY">Paternity</SelectItem>
                                <SelectItem value="EMERGENCY">Emergency</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.leaveType && (
                              <p className="text-sm text-red-600 mt-1">{errors.leaveType.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="daysAllowed">Days Allowed *</Label>
                            <Input
                              type="number"
                              min="0"
                              {...register("daysAllowed", { valueAsNumber: true })}
                              placeholder="Enter number of days"
                            />
                            {errors.daysAllowed && (
                              <p className="text-sm text-red-600 mt-1">{errors.daysAllowed.message}</p>
                            )}
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsAddDialogOpen(false)
                                reset()
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              className="bg-[#FF8C00] hover:bg-[#FF8C00]/90"
                            >
                              {isSubmitting ? "Adding..." : "Add Leave Limit"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Limits Table */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Limits</CardTitle>
                <CardDescription>
                  Current leave allowances configuration ({filteredLimits.length} items)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredLimits.length > 0 ? (
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
                      {filteredLimits.map((limit) => (
                        <TableRow key={limit.leave_limit_id}>
                          <TableCell>
                            <Badge variant="outline">
                              {limit.status.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getTermDisplayName(limit.termType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getLeaveTypeBadgeVariant(limit.leaveType)}>
                              {getLeaveTypeDisplayName(limit.leaveType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {limit.daysAllowed} days
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(limit)}
                              >
                                <Edit className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(limit)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-lg font-medium text-gray-900">No leave limits found</p>
                    <p className="text-sm text-gray-600">
                      {statusFilter !== "all" || termFilter !== "all" 
                        ? "Try adjusting your filters or add new leave limits"
                        : "Add new leave limits to get started"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Leave Limit</DialogTitle>
                  <DialogDescription>
                    Update the leave allowance configuration.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
                  <div>
                    <Label htmlFor="edit_status_id">Status *</Label>
                    <Select 
                      value={watch("status_id")?.toString() || ""} 
                      onValueChange={(value) => setValue("status_id", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(statuses || []).map((status) => (
                          <SelectItem key={status.status_id} value={status.status_id.toString()}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.status_id && (
                      <p className="text-sm text-red-600 mt-1">{errors.status_id.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="edit_termType">Term Type *</Label>
                    <Select 
                      value={watch("termType") || ""} 
                      onValueChange={(value: "ACADEMIC" | "SUMMER") => setValue("termType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACADEMIC">Academic</SelectItem>
                        <SelectItem value="SUMMER">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.termType && (
                      <p className="text-sm text-red-600 mt-1">{errors.termType.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="edit_leaveType">Leave Type *</Label>
                    <Select 
                      value={watch("leaveType") || ""} 
                      onValueChange={(value: "VACATION" | "SICK" | "MATERNITY" | "PATERNITY" | "EMERGENCY") => setValue("leaveType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VACATION">Vacation</SelectItem>
                        <SelectItem value="SICK">Sick</SelectItem>
                        <SelectItem value="MATERNITY">Maternity</SelectItem>
                        <SelectItem value="PATERNITY">Paternity</SelectItem>
                        <SelectItem value="EMERGENCY">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.leaveType && (
                      <p className="text-sm text-red-600 mt-1">{errors.leaveType.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="edit_daysAllowed">Days Allowed *</Label>
                    <Input
                      type="number"
                      min="0"
                      {...register("daysAllowed", { valueAsNumber: true })}
                    />
                    {errors.daysAllowed && (
                      <p className="text-sm text-red-600 mt-1">{errors.daysAllowed.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false)
                        setSelectedLeaveLimit(null)
                        reset()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#FF8C00] hover:bg-[#FF8C00]/90"
                    >
                      {isSubmitting ? "Updating..." : "Update Leave Limit"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Leave Limit</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this leave limit? This action cannot be undone.
                    {selectedLeaveLimit && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <strong>
                          {selectedLeaveLimit.status.name} - {getTermDisplayName(selectedLeaveLimit.termType)} - {getLeaveTypeDisplayName(selectedLeaveLimit.leaveType)} ({selectedLeaveLimit.daysAllowed} days)
                        </strong>
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isSubmitting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
