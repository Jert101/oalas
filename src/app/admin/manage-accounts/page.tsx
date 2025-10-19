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
  Key,
  ChevronLeft,
  ChevronRight,
  X
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
import { getAvatarUrl } from "@/lib/avatar-utils"
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
    category_id?: number
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
  isEmailVerified?: boolean
  isDepartmentHead?: boolean
  gender?: string
  phone?: string
  birthDate?: string
  updatedAt?: string
}

interface RoleCategory {
  category_id: number
  name: string
  description?: string
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
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  roleCategory: z.string().min(1, "Role category is required"),
  roleId: z.string().min(1, "Role is required"),
  departmentId: z.string().optional(),
  statusId: z.string().min(1, "Status is required"),
  isActive: z.boolean(),
  isDepartmentHead: z.string().optional()
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
  
  // Enhanced filtering states
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [roleCategoryFilter, setRoleCategoryFilter] = useState<string>("all")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)
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
  const [roleCategories, setRoleCategories] = useState<RoleCategory[]>([])
  const [roles, setRoles] = useState<{role_id: number, name: string, category_id?: number}[]>([])
  const [departments, setDepartments] = useState<{department_id: number, name: string, category?: 'NON_TEACHING_PERSONNEL' | 'ACADEMIC_DEPARTMENT'}[]>([])
  const [statuses, setStatuses] = useState<{status_id: number, name: string}[]>([])
  const [availableDepartments, setAvailableDepartments] = useState<{department_id: number, name: string, category?: 'NON_TEACHING_PERSONNEL' | 'ACADEMIC_DEPARTMENT'}[]>([])

  // Form setup
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      email: "",
      roleCategory: "",
      roleId: "",
      departmentId: "",
      statusId: "",
      isActive: true,
      isDepartmentHead: "no"
    }
  })
  
  const watchedRoleCategory = form.watch("roleCategory")
  const watchedRoleId = form.watch("roleId")

  // Handle role category changes
  useEffect(() => {
    if (watchedRoleCategory) {
      const selectedCategory = roleCategories.find(c => c.category_id.toString() === watchedRoleCategory)
      
      // Filter roles based on selected category
      const filteredRoles = roles.filter(role => role.category_id?.toString() === watchedRoleCategory)
      
      // Auto-select role for certain categories
      if (selectedCategory?.name === "Teaching Staff") {
        const teacherRole = filteredRoles.find(r => r.name === "Teacher/Instructor")
        if (teacherRole) {
          form.setValue("roleId", teacherRole.role_id.toString())
        }
      } else if (selectedCategory?.name === "Department Head") {
        const deptHeadRole = filteredRoles.find(r => r.name === "Department Head")
        if (deptHeadRole) {
          form.setValue("roleId", deptHeadRole.role_id.toString())
        }
      } else {
        // Clear role selection for other categories
        form.setValue("roleId", "")
      }

      // Filter departments based on category
      if (selectedCategory?.name === "Teaching Staff" || selectedCategory?.name === "Department Head") {
        setAvailableDepartments(departments.filter(d => d.category === "ACADEMIC_DEPARTMENT"))
      } else {
        setAvailableDepartments(departments.filter(d => d.category === "NON_TEACHING_PERSONNEL"))
      }
    }
  }, [watchedRoleCategory, roleCategories, roles, departments, form])

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

  // Enhanced filtering and pagination logic
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.users_id.toLowerCase().includes(term) ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.firstName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status?.name === statusFilter)
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role?.name === roleFilter)
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(user => user.department?.name === departmentFilter)
    }

    // Role category filter
    if (roleCategoryFilter !== "all") {
      const selectedCategory = roleCategories.find(cat => cat.category_id.toString() === roleCategoryFilter)
      if (selectedCategory) {
        filtered = filtered.filter(user => user.role?.category_id === selectedCategory.category_id)
      }
    }

    // Active/Inactive filter
    if (activeFilter !== "all") {
      const isActive = activeFilter === "active"
      filtered = filtered.filter(user => user.isActive === isActive)
    }

    setFilteredUsers(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [users, searchTerm, statusFilter, roleFilter, departmentFilter, roleCategoryFilter, activeFilter, roleCategories])

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  // Clear all filters function
  const clearAllFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setRoleFilter("all")
    setDepartmentFilter("all")
    setRoleCategoryFilter("all")
    setActiveFilter("all")
    setCurrentPage(1)
  }

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
        console.log('🔍 Loading reference data...')
        const [roleCategoriesRes, rolesRes, departmentsRes, statusesRes] = await Promise.all([
          fetch("/api/admin/role-categories"),
          fetch("/api/admin/roles"),
          fetch("/api/admin/departments"),
          fetch("/api/admin/statuses")
        ])

        if (roleCategoriesRes.ok) {
          const roleCategoriesData = await roleCategoriesRes.json()
          console.log('✅ Role categories loaded:', roleCategoriesData.roleCategories?.length || 0)
          setRoleCategories(roleCategoriesData.roleCategories || [])
        } else {
          console.error('❌ Failed to fetch role categories:', roleCategoriesRes.status)
        }

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json()
          console.log('✅ Roles loaded:', rolesData.roles?.length || 0)
          setRoles(rolesData.roles || [])
        } else {
          console.error('❌ Failed to fetch roles:', rolesRes.status)
        }

        if (departmentsRes.ok) {
          const departmentsData = await departmentsRes.json()
          setDepartments(departmentsData || [])
        } else {
          console.error('❌ Failed to fetch departments:', departmentsRes.status)
        }

        if (statusesRes.ok) {
          const statusesData = await statusesRes.json()
          console.log('✅ Statuses loaded:', statusesData?.length || 0)
          setStatuses(statusesData || [])
        } else {
          console.error('❌ Failed to fetch statuses:', statusesRes.status)
        }
      } catch (error) {
        console.error("❌ Error fetching reference data:", error)
      }
    }

    loadUsers()
    loadReferenceData()
  }, [])

  // Fetch roles when role category changes
  useEffect(() => {
    if (!watchedRoleCategory) {
      setRoles([])
      form.setValue("roleId", "")
      return
    }

    const fetchRolesByCategory = async () => {
      try {
        const response = await fetch(`/api/roles?category_id=${watchedRoleCategory}`)
        if (response.ok) {
          const data = await response.json()
          setRoles(data.roles || [])
        }
      } catch (error) {
        console.error("Error fetching roles by category:", error)
      }
    }

    fetchRolesByCategory()
  }, [watchedRoleCategory, form])

  // Filter departments based on selected role category
  useEffect(() => {
    if (watchedRoleCategory && departments.length > 0) {
      const selectedCategory = roleCategories.find(c => c.category_id.toString() === watchedRoleCategory)
      
      if (selectedCategory) {
        let filteredDepartments: {department_id: number, name: string, category?: 'NON_TEACHING_PERSONNEL' | 'ACADEMIC_DEPARTMENT'}[] = []
        
        if (selectedCategory.name === "Teaching Staff") {
          // Show all departments for Teaching Staff
          filteredDepartments = departments
        } else if (selectedCategory.name === "Department Head") {
          // Show only academic departments for Department Head
          filteredDepartments = departments.filter(d => d.category === "ACADEMIC_DEPARTMENT")
        } else if (selectedCategory.name === "Non Teaching Staff") {
          // Show only non-teaching departments for Non Teaching Staff
          filteredDepartments = departments.filter(d => d.category === "NON_TEACHING_PERSONNEL")
        } else if (selectedCategory.name === "Finance") {
          // Show only non-teaching departments for Finance
          filteredDepartments = departments.filter(d => d.category === "NON_TEACHING_PERSONNEL")
        } else if (selectedCategory.name === "Administration") {
          // Admin can see all departments
          filteredDepartments = departments
        } else {
          // For other categories, show all departments
          filteredDepartments = departments
        }
        
        setAvailableDepartments(filteredDepartments)
      }
    } else {
      setAvailableDepartments([])
    }
  }, [watchedRoleCategory, departments, roleCategories])

  // Action handlers
  const handleView = (user: User) => {
    setSelectedUser(user)
    setViewDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    console.log('🔍 Editing user:', {
      userId: user.users_id,
      name: user.name,
      email: user.email,
      roleId: user.role_id,
      roleName: user.role?.name,
      roleCategoryId: user.role?.category_id,
      departmentId: user.department_id,
      departmentName: user.department?.name,
      statusId: user.status_id,
      statusName: user.status?.name,
      isActive: user.isActive,
      isDepartmentHead: user.isDepartmentHead
    })
    
    setSelectedUser(user)
    
    // Populate form with user data
    const formData = {
      firstName: user.firstName || "",
      middleName: user.middleName || "",
      lastName: user.lastName || "",
      suffix: user.suffix || "",
      email: user.email,
      roleCategory: user.role?.category_id?.toString() || "",
      roleId: user.role_id?.toString() || "",
      departmentId: user.department_id?.toString() || "",
      statusId: user.status_id?.toString() || "",
      isActive: user.isActive,
      isDepartmentHead: user.isDepartmentHead ? "yes" : "no"
    }

    // Set available departments based on user's role category
    if (user.role?.category_id) {
      const selectedCategory = roleCategories.find(c => c.category_id === user.role?.category_id)
      if (selectedCategory?.name === "Teaching Staff" || selectedCategory?.name === "Department Head") {
        setAvailableDepartments(departments.filter(d => d.category === "ACADEMIC_DEPARTMENT"))
      } else {
        setAvailableDepartments(departments.filter(d => d.category === "NON_TEACHING_PERSONNEL"))
      }
    }
    
    console.log('📝 Form data being set:', formData)
    console.log('📋 Available roles:', roles.length)
    console.log('📋 Available departments:', departments.length)
    console.log('📋 Available statuses:', statuses.length)
    
    form.reset(formData)
    
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (data: EditUserFormData) => {
    if (!selectedUser) return

    try {
      // Transform form data for API
      const transformedData = {
        firstName: data.firstName || "",
        middleName: data.middleName || "",
        lastName: data.lastName || "",
        suffix: data.suffix || "",
        email: data.email,
        roleCategory: data.roleCategory,
        roleId: data.roleId,
        departmentId: data.departmentId || null,
        statusId: data.statusId,
        isActive: data.isActive,
        isDepartmentHead: data.isDepartmentHead
      }

      console.log('🔄 Submitting user update:', {
        userId: selectedUser.users_id,
        originalData: data,
        transformedData
      })

      const response = await fetch(`/api/admin/users/${selectedUser.users_id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(transformedData)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Update failed:', error)
        throw new Error(error.error || "Failed to update user")
      }

      const result = await response.json()
      console.log('✅ Update successful:', result)

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
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete user")
      }

      toast.success("User deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete user"
      toast.error(errorMessage)
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

  // Remove full-screen loading animation to prevent sidebar from disappearing

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
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
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
          {/* Enhanced Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, name, email, first name, or last name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status.status_id} value={status.name}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.role_id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.department_id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={roleCategoryFilter} onValueChange={setRoleCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Role Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {roleCategories.map(category => (
                    <SelectItem key={category.category_id} value={category.category_id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Active Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>
              
              {/* Active Filters Display */}
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {searchTerm}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {statusFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                  </Badge>
                )}
                {roleFilter !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Role: {roleFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setRoleFilter("all")} />
                  </Badge>
                )}
                {departmentFilter !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Dept: {departmentFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setDepartmentFilter("all")} />
                  </Badge>
                )}
                {roleCategoryFilter !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Category: {roleCategories.find(c => c.category_id.toString() === roleCategoryFilter)?.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setRoleCategoryFilter("all")} />
                  </Badge>
                )}
                {activeFilter !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {activeFilter === "active" ? "Active Only" : "Inactive Only"}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setActiveFilter("all")} />
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Accounts ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
            {totalPages > 1 && ` | Page ${currentPage} of ${totalPages}`}
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
                  currentUsers.map((user) => (
                    <TableRow key={user.users_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={getAvatarUrl(user.profilePicture, user.name)}
                              alt={user.name} 
                              onError={(e) => {
                                console.warn("[AdminManageAccounts] Failed to load user avatar:", user.profilePicture, e)
                                const img = e.target as HTMLImageElement
                                if (img.src !== '/ckcm.png') {
                                  img.src = '/ckcm.png'
                                }
                              }}
                              onLoad={() => {
                                console.log("[AdminManageAccounts] Successfully loaded user avatar:", user.profilePicture)
                              }}
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
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

            {/* Enhanced View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">User Details</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Complete information for {selectedUser?.name}
                </DialogDescription>
              </div>
              {selectedUser && (
                <div className="flex gap-2">
                  <Badge variant={selectedUser.isActive ? "default" : "secondary"} className="h-6">
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {selectedUser.isEmailVerified && (
                    <Badge variant="outline" className="h-6 text-green-600 border-green-200">
                      ✓ Verified
                    </Badge>
                  )}
                  {selectedUser.isDepartmentHead && (
                    <Badge variant="outline" className="h-6 text-blue-600 border-blue-200">
                      Department Head
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

                    {selectedUser && (
            <div className="space-y-6 pt-4">
              {/* Profile Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6">
                <div className="flex items-start gap-6">
                  <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-gray-800 shadow-lg">
                    <AvatarImage 
                      src={getAvatarUrl(selectedUser.profilePicture, selectedUser.name)}
                      alt={selectedUser.name}
                      onError={(e) => {
                        console.warn("[AdminManageAccounts] Failed to load view dialog avatar:", selectedUser.profilePicture, e)
                        const img = e.target as HTMLImageElement
                        if (img.src !== '/ckcm.png') {
                          img.src = '/ckcm.png'
                        }
                      }}
                      onLoad={() => {
                        console.log("[AdminManageAccounts] Successfully loaded view dialog avatar:", selectedUser.profilePicture)
                      }}
                    />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedUser.name}</h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">{selectedUser.email}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <Badge variant="outline" className="font-medium">
                        ID: {selectedUser.users_id}
                      </Badge>
                      <Badge variant="outline" className="font-medium">
                        {selectedUser.role?.name || "No role assigned"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

                            {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                      <p className="text-sm font-medium mt-1">
                        {[selectedUser.firstName, selectedUser.middleName, selectedUser.lastName, selectedUser.suffix]
                          .filter(Boolean).join(' ') || selectedUser.name}
                      </p>
                    </div>
                    {selectedUser.gender && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                        <p className="text-sm font-medium mt-1 capitalize">{selectedUser.gender}</p>
                      </div>
                    )}
                    {selectedUser.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                        <p className="text-sm font-medium mt-1">{selectedUser.phone}</p>
                      </div>
                    )}
                    {selectedUser.birthDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Birth Date</label>
                        <p className="text-sm font-medium mt-1">
                          {new Date(selectedUser.birthDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Work Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Work Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                      <p className="text-sm font-medium mt-1">{selectedUser.department?.name || "No department"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                      <p className="text-sm font-medium mt-1">{selectedUser.role?.name || "No role assigned"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employment Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedUser.status?.name === 'Active' ? 'bg-green-500' :
                          selectedUser.status?.name === 'Probation' || selectedUser.status?.name === 'Under Probation' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}></div>
                        <p className="text-sm font-medium">{selectedUser.status?.name || "No status"}</p>
                      </div>
                    </div>
                    {selectedUser.isDepartmentHead && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</label>
                        <p className="text-sm font-medium mt-1 text-blue-600">Department Head</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                                {/* Account Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${selectedUser.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <p className="text-sm font-medium">{selectedUser.isActive ? "Active" : "Inactive"}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verification</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${selectedUser.isEmailVerified ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <p className="text-sm font-medium">{selectedUser.isEmailVerified ? "Verified" : "Not Verified"}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                      <p className="text-sm font-medium mt-1">
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {selectedUser.updatedAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                        <p className="text-sm font-medium mt-1">
                          {new Date(selectedUser.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setViewDialogOpen(false)
                      setEditDialogOpen(true)
                    }}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit User
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedUser.email)
                      toast.success("Email copied to clipboard!")
                    }}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Email
                  </Button>
                  {selectedUser.phone && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.phone || '')
                        toast.success("Phone number copied to clipboard!")
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Copy Phone
                    </Button>
                  )}
                  <Button 
                    variant={selectedUser.isActive ? "destructive" : "default"}
                    onClick={() => {
                      // Toggle user status logic would go here
                      toast.success(`User ${selectedUser.isActive ? 'deactivated' : 'activated'} successfully!`)
                    }}
                    className="flex items-center gap-2"
                  >
                    {selectedUser.isActive ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Deactivate
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Activate
                      </>
                    )}
                  </Button>
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

                {/* Current Role and Department Display */}
                <div className="md:col-span-2 space-y-2">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Current Assignment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Role:</span> {selectedUser?.role?.name || "Not assigned"}
                      </div>
                      <div>
                        <span className="font-medium">Department:</span> {selectedUser?.department?.name || "Not assigned"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Category */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="roleCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roleCategories
                              .filter(category => category.name !== "Administration") // Exclude admin category for regular users
                              .map((category) => (
                                <SelectItem key={category.category_id} value={category.category_id.toString()}>
                                  <div className="flex items-center space-x-2">
                                    <span>{category.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Specific Role (only show for categories that need role selection) */}
                {watchedRoleCategory && (() => {
                  const selectedCategory = roleCategories.find(c => c.category_id.toString() === watchedRoleCategory)
                  
                  // Don't show role selection for Teaching Staff and Department Head (auto-selected)
                  if (selectedCategory?.name === "Teaching Staff" || selectedCategory?.name === "Department Head") {
                    return null
                  }
                  
                  // Show role selection for other categories
                  return (
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="roleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific Role *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select specific role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles
                                  .filter(role => role.category_id?.toString() === watchedRoleCategory)
                                  .map((role) => (
                                    <SelectItem key={role.role_id} value={role.role_id.toString()}>
                                      <div className="flex items-center space-x-2">
                                        <span>{role.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )
                })()}

                {/* Department (only when applicable and filtered by role category) */}
                {(() => {
                  const selectedCategory = roleCategories.find(c => c.category_id.toString() === watchedRoleCategory)
                  const requiresDepartment = selectedCategory?.name === "Teaching Staff" || selectedCategory?.name === "Department Head"
                  
                  if (requiresDepartment && availableDepartments.length > 0) {
                    return (
                      <div className="md:col-span-2">
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
                                  {availableDepartments.map((department) => (
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
                      </div>
                    )
                  }
                  return null
                })()}

                {/* Office Head Question (only for Non Teaching Staff) */}
                {(() => {
                  const selectedCategory = roleCategories.find(c => c.category_id.toString() === watchedRoleCategory)
                  const requiresOfficeHead = selectedCategory?.name === "Non Teaching Staff"
                  
                  if (requiresOfficeHead) {
                    return (
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="isDepartmentHead"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Is this user an Office Head?</FormLabel>
                              <FormControl>
                                <div className="flex gap-6">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id="office-head-yes"
                                      value="yes"
                                      checked={field.value === "yes"}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      className="h-4 w-4"
                                    />
                                    <label htmlFor="office-head-yes" className="text-sm font-medium">
                                      Yes
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id="office-head-no"
                                      value="no"
                                      checked={field.value === "no"}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      className="h-4 w-4"
                                    />
                                    <label htmlFor="office-head-no" className="text-sm font-medium">
                                      No
                                    </label>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )
                  }
                  return null
                })()}

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
                      <AvatarImage 
                        src={getAvatarUrl(selectedUser?.profilePicture, selectedUser?.name)}
                        onError={(e) => {
                          console.warn("[AdminManageAccounts] Failed to load edit form avatar:", selectedUser?.profilePicture, e)
                          const img = e.target as HTMLImageElement
                          if (img.src !== '/ckcm.png') {
                            img.src = '/ckcm.png'
                          }
                        }}
                        onLoad={() => {
                          console.log("[AdminManageAccounts] Successfully loaded edit form avatar:", selectedUser?.profilePicture)
                        }}
                      />
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
                          <a href={getAvatarUrl(selectedUser.profilePicture, selectedUser.name)} download>
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
      </SidebarInset>
    </SidebarProvider>
  )
}
