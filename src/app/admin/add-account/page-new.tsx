"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "react-hot-toast"
import { Eye, EyeOff, Key, Upload } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { z } from "zod"
import Image from "next/image"

// Database types
interface Role {
  role_id: number
  name: string
  description: string
}

interface Department {
  department_id: number
  name: string
  description: string
  category: 'NON_TEACHING_PERSONNEL' | 'ACADEMIC_DEPARTMENT'
}

interface Status {
  status_id: number
  name: string
  description: string
}

// Form validation schema
const addAccountSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  role_id: z.string().min(1, "Role is required"),
  department_id: z.string().optional(),
  isDepartmentHead: z.enum(["yes", "no"]),
  status_id: z.string().min(1, "Status is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type AddAccountInput = z.infer<typeof addAccountSchema>

export default function AddAccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [profilePicture, setProfilePicture] = useState<string>("ckcm.png")
  
  // State for dynamic data
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<AddAccountInput>({
    resolver: zodResolver(addAccountSchema),
    defaultValues: {
      status_id: "",
      isDepartmentHead: "no"
    }
  })

  const watchedRoleId = watch("role_id")

  // Fetch reference data on component mount
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const response = await fetch("/api/admin/reference-data")
        if (response.ok) {
          const data = await response.json()
          setRoles(data.roles)
          setDepartments(data.departments)
          setStatuses(data.statuses)
        } else {
          toast.error("Failed to load reference data")
        }
      } catch (error) {
        console.error("Error fetching reference data:", error)
        toast.error("Failed to load reference data")
      }
    }

    fetchReferenceData()
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/admin/console")
    } else {
      setIsLoading(false)
    }
  }, [session, status, router])

  useEffect(() => {
    setSelectedRoleId(watchedRoleId)
    // Clear department when role changes
    setValue("department_id", "")
    
    // Filter departments based on selected role
    if (watchedRoleId && departments.length > 0) {
      const selectedRole = roles.find(r => r.role_id.toString() === watchedRoleId)
      if (selectedRole) {
        let filteredDepartments: Department[] = []
        
        if (selectedRole.name === "Non Teaching Personnel" || selectedRole.name === "Finance Officer") {
          filteredDepartments = departments.filter(d => d.category === "NON_TEACHING_PERSONNEL")
        } else if (selectedRole.name === "Teacher/Instructor" || selectedRole.name === "Dean/Program Head") {
          filteredDepartments = departments.filter(d => d.category === "ACADEMIC_DEPARTMENT")
        }
        
        setAvailableDepartments(filteredDepartments)
      }
    } else {
      setAvailableDepartments([])
    }
  }, [watchedRoleId, setValue, departments, roles])

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setValue("password", password)
    setValue("confirmPassword", password)
    toast.success("Password generated successfully!")
  }

  const onSubmit = async (data: AddAccountInput) => {
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      
      // Append all form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          formData.append(key, value.toString())
        }
      })
      
      formData.append("profilePicture", profilePicture)

      const response = await fetch("/api/admin/add-account", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        toast.success("Account created successfully!")
        reset()
        setProfilePicture("ckcm.png")
        setSelectedRoleId("")
        setAvailableDepartments([])
      } else {
        const error = await response.text()
        toast.error(error || "Failed to create account")
      }
    } catch (error) {
      console.error("Error creating account:", error)
      toast.error("An error occurred while creating the account")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const requiresDepartment = selectedRoleId && roles.find(r => r.role_id.toString() === selectedRoleId)?.name !== "Admin"

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">Add New Account</h1>
          </div>
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
            <nav className="grid gap-4 text-sm text-muted-foreground">
              <a href="#" className="font-semibold text-primary">Add New Account</a>
            </nav>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create User Account</CardTitle>
                  <CardDescription>
                    Fill in the form below to create a new user account for the OALASS system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Status Section */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Employment Status</Label>
                      <Select onValueChange={(value: string) => setValue("status_id", value)}>
                        <SelectTrigger className={errors.status_id ? "border-red-500" : ""}>
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
                      {errors.status_id && (
                        <p className="text-sm text-red-500">{errors.status_id.message}</p>
                      )}
                    </div>

                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Personal Information</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            {...register("firstName")}
                            className={errors.firstName ? "border-red-500" : ""}
                          />
                          {errors.firstName && (
                            <p className="text-sm text-red-500">{errors.firstName.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            {...register("lastName")}
                            className={errors.lastName ? "border-red-500" : ""}
                          />
                          {errors.lastName && (
                            <p className="text-sm text-red-500">{errors.lastName.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="middleName">Middle Name</Label>
                          <Input
                            id="middleName"
                            {...register("middleName")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="suffix">Suffix</Label>
                          <Input
                            id="suffix"
                            {...register("suffix")}
                            placeholder="e.g., Jr., Sr., III"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Role and Department */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Role & Department</h3>
                      <div className="space-y-2">
                        <Label>Role *</Label>
                        <Select onValueChange={(value) => setValue("role_id", value)}>
                          <SelectTrigger className={errors.role_id ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.role_id} value={role.role_id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.role_id && (
                          <p className="text-sm text-red-500">{errors.role_id.message}</p>
                        )}
                      </div>

                      {requiresDepartment && availableDepartments.length > 0 && (
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Select onValueChange={(value) => setValue("department_id", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableDepartments.map((dept) => (
                                <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Department Head Option */}
                      {requiresDepartment && (
                        <div className="space-y-3">
                          <Label className="text-base font-medium">Is this user a Department Head?</Label>
                          <RadioGroup
                            defaultValue="no"
                            onValueChange={(value: string) => setValue("isDepartmentHead", value as "yes" | "no")}
                            className="flex gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="dept-head-yes" />
                              <Label htmlFor="dept-head-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="dept-head-no" />
                              <Label htmlFor="dept-head-no">No</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </div>

                    {/* Password Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Account Password</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generatePassword}
                          className="flex items-center gap-2"
                        >
                          <Key className="h-4 w-4" />
                          Generate Password
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              {...register("password")}
                              className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              {...register("confirmPassword")}
                              className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Profile Picture Section */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-gray-200">
                          <Image
                            src={`/images/${profilePicture}`}
                            alt="Profile"
                            fill
                            className="object-cover object-top"
                          />
                        </div>
                        <div className="space-y-2">
                          <Select value={profilePicture} onValueChange={setProfilePicture}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ckcm.png">Default (CKCM Logo)</SelectItem>
                              <SelectItem value="avatar-1.png">Avatar 1</SelectItem>
                              <SelectItem value="avatar-2.png">Avatar 2</SelectItem>
                              <SelectItem value="avatar-3.png">Avatar 3</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-gray-500">Choose a profile picture for the user</p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#FF8C00] hover:bg-[#E67E00] text-white"
                      >
                        {isLoading ? "Creating Account..." : "Create Account"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
