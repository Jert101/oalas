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
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [profilePicture, setProfilePicture] = useState<string>("ckcm.png")

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
      status: "PROBATION",
      isDepartmentHead: "no"
    }
  })

  const watchedRole = watch("role")

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
    setSelectedRole(watchedRole)
    // Clear department when role changes
    setValue("department", "")
  }, [watchedRole, setValue])

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
      } else {
        const error = await response.text()
        toast.error(error || "Failed to create account")
      }
    } catch (error) {
      console.error("Error creating account:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    reset()
    setProfilePicture("ckcm.png")
    setSelectedRole("")
    toast.success("Form reset successfully!")
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const showDepartmentField = selectedRole && selectedRole !== "ADMIN" && selectedRole !== "FINANCE_DEPARTMENT"
  const currentDepartmentOptions = selectedRole ? departmentOptions[selectedRole as keyof typeof departmentOptions] : []

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Add New Account</h2>
          </div>
          
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Create New User Account</CardTitle>
              <CardDescription>
                Fill out the form below to create a new user account in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Profile Picture */}
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Image 
                        src={`/${profilePicture}`} 
                        alt="Profile" 
                        width={80} 
                        height={80} 
                        className="rounded-full border-2 border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Picture
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Default: CKCM Logo. JPG, PNG up to 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-3">
                  <Label>Status</Label>
                  <RadioGroup
                    defaultValue="PROBATION"
                    onValueChange={(value: string) => setValue("status", value as "PROBATION" | "REGULAR")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PROBATION" id="probation" />
                      <Label htmlFor="probation">Probation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="REGULAR" id="regular" />
                      <Label htmlFor="regular">Regular</Label>
                    </div>
                  </RadioGroup>
                  {errors.status && (
                    <p className="text-sm text-red-500">{errors.status.message}</p>
                  )}
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="Jr., Sr., III, etc."
                      {...register("suffix")}
                    />
                  </div>
                </div>

                {/* Email Address */}
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

                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role">Select Role *</Label>
                  <Select onValueChange={(value) => setValue("role", value as "ADMIN" | "NON_TEACHING_PERSONNEL" | "DEAN_PROGRAM_HEAD" | "FINANCE_DEPARTMENT" | "TEACHER")}>
                    <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="NON_TEACHING_PERSONNEL">Non Teaching Personnel</SelectItem>
                      <SelectItem value="DEAN_PROGRAM_HEAD">Dean/Program Head</SelectItem>
                      <SelectItem value="FINANCE_DEPARTMENT">Finance Department</SelectItem>
                      <SelectItem value="TEACHER">Teacher/Instructor</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-500">{errors.role.message}</p>
                  )}
                </div>

                {/* Department (conditional) */}
                {showDepartmentField && currentDepartmentOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select onValueChange={(value) => setValue("department", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentDepartmentOptions.map((dept) => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Department Head */}
                {showDepartmentField && (
                  <div className="space-y-3">
                    <Label>Is Department Head?</Label>
                    <RadioGroup
                      defaultValue="no"
                      onValueChange={(value: string) => setValue("isDepartmentHead", value as "yes" | "no")}
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

                {/* Password Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Password *</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={generatePassword}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Generate Password
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          {...register("password")}
                          className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          {...register("confirmPassword")}
                          className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isLoading}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Register"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
