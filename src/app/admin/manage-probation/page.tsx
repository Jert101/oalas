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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Clock, Plus, Calendar, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format, differenceInDays, isAfter } from "date-fns"

interface ProbationaryUser {
  users_id: string
  name: string
  email: string
  profilePicture?: string
  department?: {
    name: string
  }
}

interface Probation {
  probation_id: number
  users_id: string
  startDate: string
  endDate: string
  probationDays: number
  status: "ACTIVE" | "COMPLETED"
  isEmailSent: boolean
  createdAt: string
  updatedAt: string
  user: {
    users_id: string
    name: string
    email: string
    profilePicture?: string
    department?: {
      name: string
    }
  }
}

const probationSchema = z.object({
  users_id: z.string().min(1, "Employee is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["ACTIVE", "COMPLETED"])
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return end > start
}, {
  message: "End date must be after start date",
  path: ["endDate"]
})

type ProbationFormData = z.infer<typeof probationSchema>

export default function ManageProbationPage() {
  const { data: session, status: authStatus } = useSession()
  const [probationaryUsers, setProbationaryUsers] = useState<ProbationaryUser[]>([])
  const [probations, setProbations] = useState<Probation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [probationDays, setProbationDays] = useState<number>(0)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProbationFormData>({
    resolver: zodResolver(probationSchema),
    defaultValues: {
      status: "ACTIVE"
    }
  })

  const watchStartDate = watch("startDate")
  const watchEndDate = watch("endDate")

  // Calculate probation days automatically
  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const start = new Date(watchStartDate)
      const end = new Date(watchEndDate)
      if (end > start) {
        const days = differenceInDays(end, start)
        setProbationDays(days)
      } else {
        setProbationDays(0)
      }
    } else {
      setProbationDays(0)
    }
  }, [watchStartDate, watchEndDate])

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
        const [usersRes, probationsRes] = await Promise.all([
          fetch("/api/admin/probationary-users"),
          fetch("/api/admin/probations")
        ])

        if (!usersRes.ok || !probationsRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const [usersData, probationsData] = await Promise.all([
          usersRes.json(),
          probationsRes.json()
        ])

        setProbationaryUsers(Array.isArray(usersData) ? usersData : [])
        setProbations(Array.isArray(probationsData) ? probationsData : [])
      } catch (error) {
        toast.error("Failed to load data")
        console.error("Error fetching data:", error)
        setProbationaryUsers([])
        setProbations([])
      } finally {
        setIsLoading(false)
      }
    }

    if (authStatus === "authenticated" && session?.user?.role === "Admin") {
      fetchData()
    }
  }, [authStatus, session])

  // Add new probation
  const onSubmit = async (data: ProbationFormData) => {
    setIsSubmitting(true)
    try {
      const probationData = {
        ...data,
        probationDays
      }

      const response = await fetch("/api/admin/probations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(probationData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add probation")
      }

      const newProbation = await response.json()
      setProbations(prev => [...prev, newProbation])
      
      // Remove user from probationary users list since they now have probation period
      setProbationaryUsers(prev => 
        prev.filter(user => user.users_id !== data.users_id)
      )
      
      toast.success("Probation period added successfully")
      setIsAddDialogOpen(false)
      reset()
      setProbationDays(0)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add probation"
      toast.error(errorMessage)
      console.error("Error adding probation:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check for expired probations
  const checkExpiredProbations = async () => {
    try {
      const response = await fetch("/api/admin/probations/check-expired", {
        method: "POST"
      })

      if (!response.ok) {
        throw new Error("Failed to check expired probations")
      }

      const result = await response.json()
      if (result.updatedUsers && result.updatedUsers.length > 0) {
        toast.success(`${result.updatedUsers.length} probation(s) completed and users promoted to regular status`)
        // Refresh the data
        window.location.reload()
      }
    } catch (error) {
      console.error("Error checking expired probations:", error)
    }
  }

  // Run expired check on component mount
  useEffect(() => {
    if (authStatus === "authenticated" && session?.user?.role === "Admin") {
      checkExpiredProbations()
    }
  }, [authStatus, session])

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default"
      case "COMPLETED":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Check if probation is overdue
  const isProbationOverdue = (endDate: string, status: string) => {
    if (status === "COMPLETED") return false
    return isAfter(new Date(), new Date(endDate))
  }

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="mx-auto h-8 w-8 animate-spin text-[#1E293B]" />
          <p className="mt-2 text-sm text-gray-600">Loading probation data...</p>
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
              <UserCheck className="h-8 w-8 text-[#1E293B]" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#1E293B]">Manage Probation</h1>
                <p className="text-gray-600">Track and manage employee probation periods</p>
              </div>
            </div>

            {/* Add New Probation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Probation Period
                </CardTitle>
                <CardDescription>
                  Assign probation periods to employees with probationary status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#FF8C00] hover:bg-[#FF8C00]/90">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Probation Period
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add Probation Period</DialogTitle>
                      <DialogDescription>
                        Set probation period dates for an employee. The system will automatically promote them to regular status when the period ends.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="users_id">Employee *</Label>
                        <Select 
                          value={watch("users_id") || ""} 
                          onValueChange={(value) => setValue("users_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {(probationaryUsers || []).map((user) => (
                              <SelectItem key={user.users_id} value={user.users_id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{user.name}</span>
                                  <span className="text-sm text-gray-600">{user.email}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.users_id && (
                          <p className="text-sm text-red-600 mt-1">{errors.users_id.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                          type="date"
                          {...register("startDate")}
                        />
                        {errors.startDate && (
                          <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="endDate">End Date *</Label>
                        <Input
                          type="date"
                          {...register("endDate")}
                        />
                        {errors.endDate && (
                          <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
                        )}
                      </div>

                      {probationDays > 0 && (
                        <div className="p-3 bg-blue-50 rounded-md">
                          <Label className="text-sm font-medium text-blue-800">Probation Duration</Label>
                          <p className="text-lg font-semibold text-blue-900">{probationDays} days</p>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="status">Status *</Label>
                        <Select 
                          value={watch("status") || "ACTIVE"} 
                          onValueChange={(value: "ACTIVE" | "COMPLETED") => setValue("status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.status && (
                          <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddDialogOpen(false)
                            reset()
                            setProbationDays(0)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-[#FF8C00] hover:bg-[#FF8C00]/90"
                        >
                          {isSubmitting ? "Saving..." : "Save Probation"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Probation Records */}
            <Card>
              <CardHeader>
                <CardTitle>Probation Records</CardTitle>
                <CardDescription>
                  Employees with assigned probation periods ({probations.length} records)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {probations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Email Sent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {probations.map((probation) => (
                        <TableRow key={probation.probation_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={probation.user.profilePicture || "/ckcm.png"} 
                                  alt={probation.user.name}
                                />
                                <AvatarFallback>
                                  {probation.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{probation.user.name}</div>
                                <div className="text-sm text-gray-600">{probation.user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {probation.user.department?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(probation.startDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {format(new Date(probation.endDate), "MMM dd, yyyy")}
                              {isProbationOverdue(probation.endDate, probation.status) && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{probation.probationDays} days</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(probation.status)}>
                              {probation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={probation.isEmailSent ? "default" : "outline"}>
                              {probation.isEmailSent ? "Sent" : "Pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-lg font-medium text-gray-900">No probation records</p>
                    <p className="text-sm text-gray-600">
                      Add probation periods for employees with probationary status
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Probationary Users */}
            {probationaryUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Available Probationary Employees</CardTitle>
                  <CardDescription>
                    Employees with probationary status who don&apos;t have probation periods assigned yet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {probationaryUsers.map((user) => (
                        <TableRow key={user.users_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={user.profilePicture || "/ckcm.png"} 
                                  alt={user.name}
                                />
                                <AvatarFallback>
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.department?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Probationary</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
