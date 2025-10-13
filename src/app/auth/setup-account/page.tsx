"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, User, Mail, Building, Shield } from "lucide-react"
import { fetchGoogleProfilePicture } from "@/lib/google"

// Form validation rules
const setupSchema = {
  schoolId: { required: "School ID is required", minLength: { value: 3, message: "School ID must be at least 3 characters" } },
  department: { required: "Department is required" },
  role: { required: "Role is required" }
}

 type SetupInput = {
  schoolId: string
  department: string
  roleCategory: string
  role: string
  probationStatus: string
  isOfficeHead?: boolean
 }

 type Department = {
  department_id: string
  name: string
  description?: string
  // @ts-ignore
  category?: string
 }

 type Role = {
  role_id: string
  name: string
  description?: string
  category_id?: number
 }

 type RoleCategory = {
  category_id: number
  name: string
  description?: string
  color?: string
 }

 type Status = {
  status_id: number
  name: string
  description?: string
 }

 export default function SetupAccountPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [departments, setDepartments] = useState<Department[]>([])
  const [roleCategories, setRoleCategories] = useState<RoleCategory[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [userImage, setUserImage] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, update } = useSession()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SetupInput>({
    defaultValues: {
      schoolId: "",
      department: "",
      roleCategory: "",
      role: "",
      probationStatus: "",
      isOfficeHead: false
    }
  })

  const selectedRoleCategory = watch("roleCategory")
  const selectedRoleId = watch("role")

  useEffect(() => {
    // Get email from URL params
    const email = searchParams.get("email")
    if (email) {
      setUserEmail(email)
      // Extract name from email for display
      const nameParam = searchParams.get("name")
      const pictureParam = searchParams.get("picture")
      if (nameParam) setUserName(nameParam)
      if (pictureParam) {
        console.log("[setup-account] Setting userImage from URL param:", pictureParam)
        setUserImage(pictureParam)
      }
      if (!nameParam) {
        const name = email.split('@')[0]
        setUserName(name.charAt(0).toUpperCase() + name.slice(1))
      }
    }

    // Check if user already exists or has approved setup request
    checkUserStatus()
    
    // Fetch departments, role categories, and statuses
    fetchData()
  }, [searchParams])

  // Get user data from session if available
  useEffect(() => {
    if (session?.user) {
      // Only override with session data when there's no explicit email in the URL
      // or the session email matches the URL email. This avoids leaking a previous
      // admin session into this setup flow for a new Google user.
      const sessionEmail = session.user.email || ""
      const hasEmailParam = !!userEmail
      const emailsMatch = hasEmailParam ? sessionEmail.toLowerCase() === userEmail.toLowerCase() : true

      if (!hasEmailParam || emailsMatch) {
        setUserEmail(sessionEmail || userEmail)
        setUserName(session.user.name || userName)
        // Only set userImage from session if we don't already have one from URL params
        if (!userImage) {
          // Prefer profilePicture but fallback to image
          // @ts-ignore
          const img = (session.user as any).profilePicture || (session.user as any).image || ""
          setUserImage(img)
        }
      }
    }
  }, [session, userEmail, userName, userImage])

  // If we have a Google access token but no image yet, fetch a fresh picture
  useEffect(() => {
    const accessToken = (session as any)?.accessToken as string | undefined
    const idToken = (session as any)?.idToken as string | undefined
    if (!userImage && (accessToken || idToken)) {
      ;(async () => {
        const pic = await fetchGoogleProfilePicture({ accessToken, idToken, fallbackUrl: userImage })
        if (pic) setUserImage(pic)
      })()
    }
  }, [session, userImage, userName])

  const checkUserStatus = async () => {
    if (!userEmail) return
    
    try {
      // Check if user already exists in database
      const userResponse = await fetch(`/api/auth/check-user?email=${encodeURIComponent(userEmail)}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (userData.exists && userData.user.isActive) {
          // User exists and is active, redirect to dashboard
          toast.success("Account already exists! Redirecting to dashboard...")
          router.push("/dashboard")
          return
        }
      }

      // Check approval status
      const approvalResponse = await fetch(`/api/auth/check-approval?email=${encodeURIComponent(userEmail)}`)
      if (approvalResponse.ok) {
        const approvalData = await approvalResponse.json()
        if (approvalData.status === "approved") {
          // User has approved setup request but no user record - this is an edge case
          // We'll show a message and allow them to continue with setup
          toast.info("Your account was approved but needs to be finalized. Please complete the setup.")
        } else if (approvalData.status === "pending") {
          // User has pending request, redirect to pending approval page
          toast.info("You already have a pending account request.")
          router.push(`/auth/pending-approval?email=${encodeURIComponent(userEmail)}`)
          return
        }
      }
    } catch (error) {
      console.error("Error checking user status:", error)
    }
  }

  const fetchData = async () => {
    try {
      setIsDataLoading(true)
      
      // Fetch departments
      const deptResponse = await fetch("/api/departments")
      if (deptResponse.ok) {
        const deptData = await deptResponse.json()
        setDepartments(deptData.departments || [])
        console.log("✅ Departments loaded:", deptData.departments?.length || 0)
      } else {
        console.error("❌ Failed to fetch departments:", deptResponse.status)
      }

      // Fetch role categories
      const categoryResponse = await fetch("/api/role-categories")
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json()
        setRoleCategories(categoryData.categories || [])
        console.log("✅ Role categories loaded:", categoryData.categories?.length || 0)
      } else {
        console.error("❌ Failed to fetch role categories:", categoryResponse.status)
      }

      // Fetch statuses
      const statusResponse = await fetch("/api/statuses")
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setStatuses(statusData.statuses || [])
        console.log("✅ Statuses loaded:", statusData.statuses?.length || 0)
      } else {
        console.error("❌ Failed to fetch statuses:", statusResponse.status)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load form data")
    } finally {
      setIsDataLoading(false)
    }
  }

  // Fetch roles when role category changes
  useEffect(() => {
    if (!selectedRoleCategory) {
      setRoles([])
      setValue("role", "")
      return
    }

    const fetchRolesByCategory = async () => {
      try {
        const response = await fetch(`/api/roles?category_id=${selectedRoleCategory}`)
        if (response.ok) {
          const data = await response.json()
          setRoles(data.roles || [])
        }
      } catch (error) {
        console.error("Error fetching roles by category:", error)
        toast.error("Failed to load roles")
      }
    }

    fetchRolesByCategory()
  }, [selectedRoleCategory, setValue])

  // Auto-select role when role category changes
  useEffect(() => {
    if (!selectedRoleCategory || isDataLoading) {
      setValue("role", "")
      return
    }

    const selectedCategory = roleCategories.find(c => c.category_id.toString() === selectedRoleCategory)
    
    // Auto-select role for certain categories
    if (selectedCategory?.name === "Teaching Staff" && roles.length > 0) {
      const teacherRole = roles.find(r => r.name === "Teacher/Instructor")
      if (teacherRole) {
        setValue("role", teacherRole.role_id.toString())
      }
    } else if (selectedCategory?.name === "Department Head" && roles.length > 0) {
      const deptHeadRole = roles.find(r => r.name === "Department Head")
      if (deptHeadRole) {
        setValue("role", deptHeadRole.role_id.toString())
      }
    }

    // Clear department selection when role category changes
    setValue("department", "")
  }, [selectedRoleCategory, roles, setValue, roleCategories, isDataLoading])

  const onSubmit = async (data: SetupInput) => {
    // Check if department is required
    const selectedCategory = roleCategories.find(c => c.category_id.toString() === data.roleCategory)
    const requiresDepartment = selectedCategory?.name === "Teaching Staff" || selectedCategory?.name === "Department Head"
    
    // Validate required fields
    if (!data.schoolId || !data.roleCategory || !data.role || !data.probationStatus || (requiresDepartment && !data.department)) {
      toast.error("Please fill in all required fields")
      return
    }

    // Check routing logic for special roles
    const selectedRole = roles.find(r => r.role_id.toString() === data.role)
    
    if (selectedCategory?.name === "Non Teaching Staff" && !data.isOfficeHead) {
      // Non-teaching staff, not office head -> redirect to teacher page
      console.log("Non-teaching staff (not office head) will be redirected to teacher page")
    } else if (selectedCategory?.name === "Non Teaching Staff" && data.isOfficeHead) {
      // Non-teaching staff, office head -> redirect to dean page
      console.log("Non-teaching staff (office head) will be redirected to dean page")
    } else if (selectedCategory?.name === "Finance" && selectedRole?.name === "Finance Office Head") {
      // Finance office head -> redirect to finance page
      console.log("Finance office head will be redirected to finance page")
    } else if (selectedCategory?.name === "Finance" && selectedRole?.name === "Office Clerk") {
      // Finance office clerk -> redirect to teacher page
      console.log("Finance office clerk will be redirected to teacher page")
    }

    setIsLoading(true)
    
    try {
      const requestData = {
        email: userEmail,
        schoolId: data.schoolId,
        department: data.department || "", // Send empty string if no department
        role: data.role,
        probationStatus: data.probationStatus,
        isOfficeHead: data.isOfficeHead || false,
        // Prefer freshest values from session at submit time, fallback to state
        displayName: (session?.user as any)?.name || userName,
        picture: userImage || (session?.user as any)?.profilePicture || (session?.user as any)?.image || null,
        gender: (session?.user as any)?.gender || undefined,
        phone: (session?.user as any)?.phone || undefined,
        birthday: (session?.user as any)?.birthday || undefined,
        address: (session?.user as any)?.address || undefined,
      }
      
      console.log("[setup-account] Profile picture sources:", {
        userImage,
        sessionProfilePicture: (session?.user as any)?.profilePicture,
        sessionImage: (session?.user as any)?.image,
        finalPicture: requestData.picture,
        hasUserImage: !!userImage,
        userImageType: typeof userImage,
        userImageLength: userImage ? userImage.length : 0
      })
      console.log("[setup-account] Submitting request with data:", requestData)
      
      const endpoint = `${window.location.origin}/api/account/setup-request`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("[setup-account] Account created successfully:", result)
        
        // Decide explicit post-setup redirect based on selected role/category
        // This avoids relying on middleware to enrich the JWT immediately.
        const selectedCategory = roleCategories.find(c => c.category_id.toString() === (watch("roleCategory") || ""))
        const selectedRole = roles.find(r => r.role_id.toString() === (watch("role") || ""))
        const isOfficeHead = !!watch("isOfficeHead")

        let redirectPath = "/dashboard" // route through central dashboard; middleware maps by role

        // High-level routing rules
        // 1) Admin
        if (selectedRole?.name === "Admin") {
          redirectPath = "/admin/dashboard"
        }
        // 2) Department Head or Dean-like roles/categories
        else if (
          selectedRole?.name === "Dean/Program Head" ||
          selectedRole?.name === "Department Head" ||
          selectedCategory?.name === "Department Head" ||
          // Any non-teaching staff marked as office head goes to dean dashboard
          (selectedCategory?.name === "Non Teaching Staff" && isOfficeHead)
        ) {
          redirectPath = "/dean/dashboard"
        }
        // 3) Finance
        else if (
          selectedCategory?.name === "Finance" ||
          selectedRole?.name === "Finance Department" ||
          selectedRole?.name === "Finance Officer" ||
          selectedRole?.name === "Finance Office Head"
        ) {
          redirectPath = "/finance/dashboard"
        }
        // 4) Teacher and default staff
        else if (
          selectedCategory?.name === "Teaching Staff" ||
          selectedRole?.name === "Teacher/Instructor" ||
          selectedRole?.name === "Teacher" ||
          selectedRole?.name === "Office Clerk"
        ) {
          redirectPath = "/teacher/dashboard"
        }

        // Proactively update session token with role data so middleware can route correctly
        try {
          await (update as any)?.({
            role: selectedRole?.name,
            isDepartmentHead,
            // keep picture/name in sync when available
            profilePicture: userImage || (session?.user as any)?.profilePicture || (session?.user as any)?.image,
            name: (session?.user as any)?.name || userName,
            email: (session?.user as any)?.email || userEmail,
          })
        } catch (e) {
          console.warn("[setup-account] Session update failed, continuing with redirect", e)
        }

        toast.success("Account setup completed successfully! Redirecting to your dashboard...")
        router.replace("/dashboard")
      } else {
        let message = "Failed to submit account setup request"
        try {
          const err = await response.json()
          message = err.error || message
        } catch {}
        toast.error(message)
      }
    } catch (error) {
      console.error("Setup error:", error)
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Complete Your Account Setup
          </CardTitle>
          <CardDescription className="text-center">
            Welcome to CKCM OALAS! Please provide your school information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info Display */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center space-x-3">
              {userImage ? (
                <img 
                  src={userImage} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <p className="font-semibold">{userName || userEmail}</p>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isDataLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading form data...</span>
            </div>
          )}

          {/* Setup Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* School ID */}
            <div className="space-y-2">
              <Label htmlFor="schoolId">School ID *</Label>
              <Input
                id="schoolId"
                placeholder="Enter your school ID"
                {...register("schoolId", { required: "School ID is required" })}
                className={errors.schoolId ? "border-red-500" : ""}
                disabled={isDataLoading}
              />
              {errors.schoolId && (
                <p className="text-sm text-red-500">{errors.schoolId.message}</p>
              )}
            </div>

            {/* Employment Status */}
            <div className="space-y-2">
              <Label htmlFor="probationStatus">Employment Status *</Label>
              <Select onValueChange={(value) => setValue("probationStatus", value)} disabled={isDataLoading}>
                <SelectTrigger className={errors.probationStatus ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select your employment status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.status_id} value={status.status_id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span>{status.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.probationStatus && (
                <p className="text-sm text-red-500">Employment status is required</p>
              )}
            </div>

            {/* Role Category first */}
            <div className="space-y-2">
              <Label htmlFor="roleCategory">Role Category *</Label>
              <Select onValueChange={(value) => setValue("roleCategory", value)} disabled={isDataLoading}>
                <SelectTrigger className={errors.roleCategory ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select your role category" />
                </SelectTrigger>
                <SelectContent>
                  {roleCategories
                    .filter(category => category.name !== "Administration")
                    .map((category) => (
                      <SelectItem key={category.category_id} value={category.category_id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.roleCategory && (
                <p className="text-sm text-red-500">Role category is required</p>
              )}
            </div>

            {/* Specific Role (depends on category) - only show for categories that need role selection */}
            {selectedRoleCategory && (() => {
              const selectedCategory = roleCategories.find(c => c.category_id.toString() === selectedRoleCategory)
              
              // Don't show role selection for Teaching Staff and Department Head (auto-selected)
              if (selectedCategory?.name === "Teaching Staff" || selectedCategory?.name === "Department Head") {
                return null
              }
              
              // Show role selection for other categories
              return (
                <div className="space-y-2">
                  <Label htmlFor="role">Specific Role *</Label>
                  <Select onValueChange={(value) => setValue("role", value)}>
                    <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select your specific role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.role_id} value={role.role_id.toString()}>
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4" />
                            <span>{role.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-500">Specific role is required</p>
                  )}
                </div>
              )
            })()}

            {/* Department (only when applicable and filtered by role) */}
            {selectedRoleCategory && (() => {
              const selectedCategory = roleCategories.find(c => c.category_id.toString() === selectedRoleCategory)
              
              // Show department selection for Teaching Staff and Department Head
              if (selectedCategory?.name === "Teaching Staff" || selectedCategory?.name === "Department Head") {
                return (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select onValueChange={(value) => setValue("department", value)} disabled={isDataLoading}>
                      <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4" />
                              <span>{dept.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.department && (
                      <p className="text-sm text-red-500">Department is required</p>
                    )}
                  </div>
                )
              }
              
              return null
            })()}

            {/* Additional Information based on role category */}
            {(() => {
              const selectedCategory = roleCategories.find(c => c.category_id.toString() === selectedRoleCategory)
              
              if (selectedCategory?.name === "Non Teaching Staff") {
                return (
                  <div className="space-y-2">
                    <Label htmlFor="isOfficeHead">Are you an Office Head?</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isOfficeHead"
                        {...register("isOfficeHead")}
                        className="rounded"
                      />
                      <Label htmlFor="isOfficeHead" className="text-sm font-normal">
                        Yes, I am an Office Head
                      </Label>
                    </div>
                  </div>
                )
              }
              
              if (selectedCategory?.name === "Finance") {
                const selectedRole = roles.find(r => r.role_id.toString() === selectedRoleId)
                if (selectedRole?.name === "Finance Office Head") {
                  return (
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> As Finance Office Head, you will be redirected to the Finance dashboard.
                        </p>
                      </div>
                    </div>
                  )
                } else if (selectedRole?.name === "Office Clerk") {
                  return (
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> As Office Clerk, you will be redirected to the Teacher dashboard.
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              }
              
              return null
            })()}

            <Button 
              type="submit" 
              disabled={isLoading || isDataLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Your account will be created immediately after form submission.</p>
            <p>You will be redirected to your dashboard.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
