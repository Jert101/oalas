"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  UserCheck, 
  UserX,
  MoreHorizontal,
  ImagePlus,
  RefreshCcw,
  Copy,
  Check,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Loader2,
  Key
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

interface User {
  users_id: string
  email: string
  name: string
  profilePicture?: string
  role_id: number
  department_id: number
  status_id: number
  role?: {
    role_id: number
    name: string
  }
  status?: {
    status_id: number
    name: string
  }
  department?: {
    department_id: number
    name: string
  }
  isActive: boolean
  createdAt: string
  firstName?: string
  lastName?: string
  middleName?: string
  suffix?: string
}

interface UserStats {
  total: number
  admin: number
  teacher: number
  nonTeaching: number
  dean: number
  finance: number
  probationary: number
  regular: number
}

// Validation schema for editing users
const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
  departmentId: z.string().min(1, "Department is required"),
  statusId: z.string().min(1, "Status is required"),
  isActive: z.boolean()
})

type EditUserFormData = z.infer<typeof editUserSchema>

export default function ManageAccountsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    admin: 0,
    teacher: 0,
    nonTeaching: 0,
    dean: 0,
    finance: 0,
    probationary: 0,
    regular: 0
  })
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [copyOk, setCopyOk] = useState(false)
  const [isResettingPwd, setIsResettingPwd] = useState(false)

  // Reference data for dropdowns
  const [roles, setRoles] = useState<{role_id: number, name: string}[]>([])
  const [departments, setDepartments] = useState<{department_id: number, name: string}[]>([])
  const [statuses, setStatuses] = useState<{status_id: number, name: string}[]>([])

  // Form setup
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      email: "",
      roleId: "",
      departmentId: "",
      statusId: "",
      isActive: true
    }
  })

  // Authentication check
  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/login")
      return
    }
    
    if (session.user.role !== "Admin") {
      router.push("/dashboard")
      toast.error("Access denied. Admin privileges required.")
      return
    }
  }, [session, status, router])

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users")
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }
      const data = await response.json()
      setUsers(data.users || [])
      calculateStats(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  // Calculate user statistics
  const calculateStats = (usersData: User[]) => {
    const stats = usersData.reduce((acc, user) => {
      acc.total++
      
      // Role counts
      switch (user.role?.name) {
        case "Admin":
          acc.admin++
          break
        case "Teacher/Instructor":
          acc.teacher++
          break
        case "Non Teaching Personnel":
          acc.nonTeaching++
          break
        case "Dean/Program Head":
          acc.dean++
          break
        case "Finance Officer":
          acc.finance++
          break
      }
      
      // Status counts
      switch (user.status?.name) {
        case "Probation":
          acc.probationary++
          break
        case "Regular":
          acc.regular++
          break
      }
      
      return acc
    }, {
      total: 0,
      admin: 0,
      teacher: 0,
      nonTeaching: 0,
      dean: 0,
      finance: 0,
      probationary: 0,
      regular: 0
    })
    
    setUserStats(stats)
  }

  // Real-time search and filter
  useEffect(() => {
    let filtered = users

    // Debug: Log the users and their statuses
    console.log('All users:', users.map(user => ({ 
      name: user.name, 
      status: user.status?.name,
      statusId: user.status_id 
    })))
    console.log('Current statusFilter:', statusFilter)

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.users_id.toLowerCase().includes(term) ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      console.log('Filtering by status:', statusFilter)
      const beforeFilter = filtered.length
      filtered = filtered.filter(user => {
        const matches = user.status?.name === statusFilter
        console.log(`User ${user.name}: status="${user.status?.name}", matches=${matches}`)
        return matches
      })
      console.log(`Filter result: ${beforeFilter} -> ${filtered.length}`)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter])

  // Load data on component mount
  // Initial data loading
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/users')
        
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        
        const data = await response.json()
        setUsers(data.users || [])
        calculateStats(data.users || [])
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    const loadReferenceData = async () => {
      try {
        const [rolesRes, departmentsRes, statusesRes] = await Promise.all([
          fetch("/api/admin/roles"),
          fetch("/api/admin/departments"),
          fetch("/api/admin/statuses")
        ])

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json()
          setRoles(rolesData.roles || [])
        }

        if (departmentsRes.ok) {
          const departmentsData = await departmentsRes.json()
          setDepartments(departmentsData.departments || [])
        }

        if (statusesRes.ok) {
          const statusesData = await statusesRes.json()
          setStatuses(statusesData || [])
        }
      } catch (error) {
        console.error("Error fetching reference data:", error)
      }
    }

    loadUsers()
    loadReferenceData()
  }, [])

  // Action handlers
  const handleView = (user: User) => {
    setSelectedUser(user)
    setViewDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    
    // Populate form with user data
    form.reset({
      name: user.name,
      firstName: user.firstName || "",
      middleName: user.middleName || "",
      lastName: user.lastName || "",
      suffix: user.suffix || "",
      email: user.email,
      roleId: user.role_id?.toString() || "",
      departmentId: user.department_id?.toString() || "",
      statusId: user.status_id?.toString() || "",
      isActive: user.isActive
    })
    
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (data: EditUserFormData) => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.users_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      toast.success("User updated successfully")
      setEditDialogOpen(false)
      setSelectedUser(null)
      fetchUsers() // Refresh the user list
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.users_id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      toast.success("User deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "regular":
        return "default"
      case "probation":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "destructive"
      case "dean/program head":
        return "default"
      default:
        return "outline"
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading users...</p>
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
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="container mx-auto py-6 px-4">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Manage Accounts</h1>
              <p className="text-muted-foreground">
                View, edit, and manage all user accounts in the system
              </p>
            </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Active accounts in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.admin}</div>
            <p className="text-xs text-muted-foreground">
              System administrators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Status</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.regular}</div>
            <p className="text-xs text-muted-foreground">
              Regular employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Probationary</CardTitle>
            <UserX className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.probationary}</div>
            <p className="text-xs text-muted-foreground">
              Probationary employees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Probation">Probation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Accounts ({filteredUsers.length})</CardTitle>
          <CardDescription>
            {searchTerm && `Showing results for "${searchTerm}"`}
            {statusFilter !== "all" && ` | Status: ${statusFilter}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.users_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={user.profilePicture?.startsWith('/') 
                                ? user.profilePicture 
                                : `/${user.profilePicture || 'ckcm.png'}`
                              } 
                              alt={user.name} 
                            />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.department?.name || "No department"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {user.users_id}
                        </code>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role?.name || "")}>
                          {user.role?.name || "No role"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status?.name || "")}>
                          {user.status?.name || "No status"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedUser(user)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage 
                      src={selectedUser.profilePicture?.startsWith('/') 
                        ? selectedUser.profilePicture 
                        : `/${selectedUser.profilePicture || 'ckcm.png'}`
                      } 
                      alt={selectedUser.name} 
                    />
                    <AvatarFallback className="text-lg">
                      {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">User ID</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.users_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <p className="text-sm text-muted-foreground">
                      {[selectedUser.firstName, selectedUser.middleName, selectedUser.lastName, selectedUser.suffix]
                        .filter(Boolean).join(' ') || selectedUser.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.role?.name || "No role assigned"}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.department?.name || "No department"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.status?.name || "No status"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Account Status</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Created</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Edit user information for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Field */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Full display name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* First Name */}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="First name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Last name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Middle Name */}
                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Middle name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Suffix */}
                <FormField
                  control={form.control}
                  name="suffix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suffix</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Jr., Sr., III, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="user@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Role */}
                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.role_id} value={role.role_id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Department */}
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem key={department.department_id} value={department.department_id.toString()}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="statusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.status_id} value={status.status_id.toString()}>
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Active Status */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active Account</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            User can log in and access the system
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Admin-only: Avatar upload and password reset */}
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Avatar management */}
                <div className="space-y-3 p-3 rounded-md border">
                  <FormLabel className="text-sm font-medium">Profile Picture</FormLabel>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedUser?.profilePicture?.startsWith('/') ? selectedUser?.profilePicture : `/${selectedUser?.profilePicture || 'ckcm.png'}`} />
                      <AvatarFallback>{selectedUser?.name?.[0] ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-wrap gap-2">
                      <input id="admin-avatar-upload" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file || !selectedUser) return
                        setIsUploadingAvatar(true)
                        const fd = new FormData()
                        fd.append('file', file)
                        const res = await fetch(`/api/admin/users/${selectedUser.users_id}/avatar`, { method: 'POST', body: fd })
                        setIsUploadingAvatar(false)
                        if (res.ok) {
                          toast.success('Profile picture updated')
                          fetchUsers()
                        } else {
                          toast.error('Failed to update picture')
                        }
                      }} />
                      <Button type="button" variant="outline" onClick={() => document.getElementById('admin-avatar-upload')?.click()} disabled={isUploadingAvatar} className="flex items-center gap-2">
                        {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                        {isUploadingAvatar ? 'Uploading...' : 'Upload New'}
                      </Button>
                      {selectedUser?.profilePicture && (
                        <Button asChild variant="outline">
                          <a href={selectedUser.profilePicture.startsWith('/') ? selectedUser.profilePicture : `/${selectedUser.profilePicture}`} download>
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG or GIF. Max 5MB.</p>
                </div>

                {/* Password reset */}
                <div className="space-y-3 p-3 rounded-md border">
                  <FormLabel className="text-sm font-medium">Reset Password</FormLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setShowPwd((s) => !s)}>
                      {showPwd ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" className="flex items-center gap-2" onClick={() => {
                      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
                      const pwd = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
                      setNewPassword(pwd)
                      toast.success('Generated a strong password')
                    }}>
                      <RefreshCcw className="h-4 w-4" /> Generate
                    </Button>
                    <Button type="button" variant="outline" className="flex items-center gap-2" onClick={async () => {
                      if (!newPassword) { toast.error('Nothing to copy'); return }
                      try { await navigator.clipboard.writeText(newPassword); setCopyOk(true); setTimeout(() => setCopyOk(false), 1500) } catch {}
                    }}>
                      {copyOk ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />} {copyOk ? 'Copied' : 'Copy'}
                    </Button>
                    <Button type="button" disabled={isResettingPwd || newPassword.length < 8 || !selectedUser} className="flex items-center gap-2" onClick={async () => {
                      if (!selectedUser) return
                      if (newPassword.length < 8) { toast.error('Min 8 characters'); return }
                      setIsResettingPwd(true)
                      const res = await fetch(`/api/admin/users/${selectedUser.users_id}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }) })
                      setIsResettingPwd(false)
                      if (res.ok) {
                        toast.success('Password set successfully')
                        setNewPassword("")
                      } else {
                        toast.error('Failed to set password')
                      }
                    }}>
                      {isResettingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />} {isResettingPwd ? 'Setting...' : 'Set password'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 8 characters. Use the Generate button for a secure random password.</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the account for {selectedUser?.name}? 
              This action cannot be undone and will permanently remove all user data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Account
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
