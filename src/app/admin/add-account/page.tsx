"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Eye, EyeOff, Key, Upload, X } from "lucide-react"
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
  category_id?: number
}

interface Department {
  department_id: number
  name: string
  description: string
  category: 'NON_TEACHING_PERSONNEL' | 'ACADEMIC_DEPARTMENT'
}

interface RoleCategory {
  category_id: number
  name: string
  description?: string
  color?: string
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
  roleCategory: z.string().min(1, "Role category is required"),
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
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [profilePicture, setProfilePicture] = useState<string>("/ckcm.png")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("/ckcm.png")
  const [isUploading, setIsUploading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  
  // State for dynamic data
  const [roleCategories, setRoleCategories] = useState<RoleCategory[]>([])
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

  const watchedRoleCategory = watch("roleCategory")
  const watchedRoleId = watch("role_id")

  // Fetch reference data on component mount
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setIsDataLoading(true)
        console.log('🔍 Loading reference data...')
        
        const [referenceResponse, categoriesResponse, departmentsResponse, statusesResponse] = await Promise.all([
          fetch("/api/admin/reference-data"),
          fetch("/api/role-categories"),
          fetch("/api/admin/departments"),
          fetch("/api/admin/statuses")
        ])

        if (referenceResponse.ok) {
          const data = await referenceResponse.json()
          setRoles(data.roles || [])
          console.log('✅ Roles loaded:', data.roles?.length || 0)
        } else {
          console.error('❌ Failed to fetch roles:', referenceResponse.status)
        }

        if (categoriesResponse.ok) {
          const categoryData = await categoriesResponse.json()
          setRoleCategories(categoryData.categories || [])
          console.log('✅ Role categories loaded:', categoryData.categories?.length || 0)
        } else {
          console.error('❌ Failed to fetch role categories:', categoriesResponse.status)
        }

        if (departmentsResponse.ok) {
          const deptData = await departmentsResponse.json()
          setDepartments(deptData || [])
          console.log('✅ Departments loaded:', deptData?.length || 0)
        } else {
          console.error('❌ Failed to fetch departments:', departmentsResponse.status)
        }

        if (statusesResponse.ok) {
          const statusData = await statusesResponse.json()
          setStatuses(statusData || [])
          console.log('✅ Statuses loaded:', statusData?.length || 0)
        } else {
          console.error('❌ Failed to fetch statuses:', statusesResponse.status)
        }
      } catch (error) {
        console.error("Error fetching reference data:", error)
        toast.error("Failed to load reference data")
      } finally {
        setIsDataLoading(false)
      }
    }

    fetchReferenceData()
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "Admin") {
              router.push("/admin/dashboard")
    }
  }, [session, status, router])

  // Fetch roles when role category changes
  useEffect(() => {
    if (!watchedRoleCategory) {
      setRoles([])
      setValue("role_id", "")
      return
    }

    const fetchRolesByCategory = async () => {
      try {
        const response = await fetch(`/api/roles?category_id=${watchedRoleCategory}`)
        if (response.ok) {
          const data = await response.json()
          setRoles(data.roles || [])
          console.log('✅ Roles loaded for category:', data.roles?.length || 0)
        }
      } catch (error) {
        console.error("Error fetching roles by category:", error)
        toast.error("Failed to load roles")
      }
    }

    fetchRolesByCategory()
  }, [watchedRoleCategory, setValue])

  // Auto-select role when role category changes
  useEffect(() => {
    if (!watchedRoleCategory || isDataLoading) {
      setValue("role_id", "")
      return
    }

    const selectedCategory = roleCategories.find(c => c.category_id.toString() === watchedRoleCategory)
    
    // Auto-select role for certain categories
    if (selectedCategory?.name === "Teaching Staff" && roles.length > 0) {
      const teacherRole = roles.find(r => r.name === "Teacher/Instructor")
      if (teacherRole) {
        setValue("role_id", teacherRole.role_id.toString())
      }
    } else if (selectedCategory?.name === "Department Head" && roles.length > 0) {
      const deptHeadRole = roles.find(r => r.name === "Department Head")
      if (deptHeadRole) {
        setValue("role_id", deptHeadRole.role_id.toString())
      }
    }

    // Clear department selection when role category changes
    setValue("department_id", "")
  }, [watchedRoleCategory, roles, setValue, roleCategories, isDataLoading])

  useEffect(() => {
    setSelectedRoleId(watchedRoleId)
    
    // Filter departments based on selected role category
    if (watchedRoleCategory && departments.length > 0) {
      const selectedCategory = roleCategories.find(c => c.category_id.toString() === watchedRoleCategory)
      if (selectedCategory) {
        let filteredDepartments: Department[] = []
        
        // Show all departments for Teaching Staff
        if (selectedCategory.name === "Teaching Staff") {
          filteredDepartments = departments
        } 
        // Show only academic departments for Department Head
        else if (selectedCategory.name === "Department Head") {
          filteredDepartments = departments.filter(d => d.category === "ACADEMIC_DEPARTMENT")
        } 
        // Show only non-teaching departments for Non Teaching Staff
        else if (selectedCategory.name === "Non Teaching Staff") {
          filteredDepartments = departments.filter(d => d.category === "NON_TEACHING_PERSONNEL")
        }
        // Show only non-teaching departments for Finance
        else if (selectedCategory.name === "Finance") {
          filteredDepartments = departments.filter(d => d.category === "NON_TEACHING_PERSONNEL")
        }
        // Admin can see all departments
        else if (selectedCategory.name === "Administration") {
          filteredDepartments = departments
        }
        // For other categories, show all departments
        else {
          filteredDepartments = departments
        }
        
        setAvailableDepartments(filteredDepartments)
      }
    } else {
      setAvailableDepartments([])
    }
  }, [watchedRoleCategory, departments, roleCategories])

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB')
        return
      }

      setSelectedFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewUrl(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setPreviewUrl("/ckcm.png")
    setProfilePicture("/ckcm.png")
    // Reset file input
    const fileInput = document.getElementById('profile-picture') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const uploadProfilePicture = async (file: File): Promise<string> => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const result = await response.json()
      return result.url
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: AddAccountInput) => {
    // Prevent double submission
    if (isLoading) return
    
    setIsLoading(true)
    
    try {
      let profilePictureUrl = profilePicture
      
      // Upload profile picture if a file was selected
      if (selectedFile) {
        try {
          profilePictureUrl = await uploadProfilePicture(selectedFile)
        } catch (error) {
          console.error('Upload error:', error)
          toast.error("Failed to upload profile picture. Using default image.")
          profilePictureUrl = "/ckcm.png"
        }
      }
      
      // Use JSON instead of FormData to avoid potential issues
      const requestData = {
        ...data,
        profilePicture: profilePictureUrl,
        isDepartmentHead: data.isDepartmentHead === "yes" // Convert string to boolean
      }

      const response = await fetch("/api/admin/add-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        toast.success("Account created successfully!", {
          duration: 4000,
        })
        reset()
        setProfilePicture("/ckcm.png")
        setSelectedFile(null)
        setPreviewUrl("/ckcm.png")
        setSelectedRoleId("")
        setAvailableDepartments([])
        // Reset file input
        const fileInput = document.getElementById('profile-picture') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }
      } else {
        const error = await response.text()
        toast.error(error || "Failed to create account", {
          duration: 4000,
        })
      }
    } catch (error) {
      console.error("Error creating account:", error)
      toast.error("An error occurred while creating the account", {
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Remove full-screen loading animation to prevent sidebar from disappearing

  const requiresDepartment = watchedRoleCategory && (() => {
    const selectedCategory = roleCategories.find(c => c.category_id.toString() === watchedRoleCategory)
    return selectedCategory?.name === "Teaching Staff" || selectedCategory?.name === "Department Head"
  })()

  const requiresOfficeHead = watchedRoleCategory && (() => {
    const selectedCategory = roleCategories.find(c => c.category_id.toString() === watchedRoleCategory)
    return selectedCategory?.name === "Non Teaching Staff"
  })()

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
          <div className="mx-auto w-full max-w-4xl">
            <h1 className="text-3xl font-semibold mb-8">Add New Account</h1>
            
            <Card>
              <CardHeader>
                <CardTitle>Create User Account</CardTitle>
                <CardDescription>
                  Fill in the form below to create a new user account for the OALASS system.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8C00]"></div>
                      <span className="text-sm font-medium">Creating account...</span>
                    </div>
                  </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Employment Status */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Employment Status *</Label>
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

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Personal Information</h3>
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

                  {/* Role & Department */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Role & Department</h3>
                    <div className="space-y-4">
                      {/* Role Category */}
                      <div className="space-y-2">
                        <Label>Role Category *</Label>
                        <Select onValueChange={(value) => setValue("roleCategory", value)} disabled={isDataLoading}>
                          <SelectTrigger className={errors.roleCategory ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select role category" />
                          </SelectTrigger>
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
                        {errors.roleCategory && (
                          <p className="text-sm text-red-500">{errors.roleCategory.message}</p>
                        )}
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
                          <div className="space-y-2">
                            <Label>Specific Role *</Label>
                            <Select onValueChange={(value) => setValue("role_id", value)} disabled={isDataLoading}>
                              <SelectTrigger className={errors.role_id ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select specific role" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role.role_id} value={role.role_id.toString()}>
                                    <div className="flex items-center space-x-2">
                                      <span>{role.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.role_id && (
                              <p className="text-sm text-red-500">{errors.role_id.message}</p>
                            )}
                          </div>
                        )
                      })()}

                      {/* Department (only when applicable and filtered by role category) */}
                      {requiresDepartment && availableDepartments.length > 0 && (
                        <div className="space-y-2">
                          <Label>Department *</Label>
                          <Select onValueChange={(value) => setValue("department_id", value)} disabled={isDataLoading}>
                            <SelectTrigger className={errors.department_id ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableDepartments.map((dept) => (
                                <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                                  <div className="flex items-center space-x-2">
                                    <span>{dept.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.department_id && (
                            <p className="text-sm text-red-500">Department is required</p>
                          )}
                        </div>
                      )}

                      {requiresOfficeHead && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Is this user an Office Head?</Label>
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
                  </div>

                  {/* Account Password */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {/* Profile Picture */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Profile Picture</h3>
                    <div className="space-y-4">
                      {/* Current/Preview Image */}
                      <div className="flex items-center gap-4">
                        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100">
                          <Image
                            src={previewUrl}
                            alt="Profile Preview"
                            fill
                            className="object-cover object-top"
                          />
                        </div>
                        <div className="flex-1">
                          {selectedFile ? (
                            <div>
                              <p className="text-sm font-medium text-green-600">Custom Image Selected</p>
                              <p className="text-sm text-gray-500">{selectedFile.name}</p>
                              <p className="text-xs text-gray-400">
                                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium">Default Profile Picture</p>
                              <p className="text-sm text-gray-500">CKCM Logo will be used as the default</p>
                            </div>
                          )}
                        </div>
                        {selectedFile && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeSelectedFile}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>

                      {/* Upload Section */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <input
                            id="profile-picture"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('profile-picture')?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            {selectedFile ? 'Change Picture' : 'Upload Picture'}
                          </Button>
                          {isUploading && (
                            <span className="text-sm text-gray-500">Uploading...</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Supported formats: JPG, PNG, GIF. Maximum size: 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6 border-t">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#FF8C00] hover:bg-[#E67E00] text-white px-8 py-2"
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
