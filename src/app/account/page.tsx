"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { 
  IconUser, 
  IconKey, 
  IconCamera,
  IconDeviceFloppy
} from "@tabler/icons-react"

import { AppSidebar } from "@/components/app-sidebar"
import { DeanSidebar } from "@/components/dean-sidebar"
import { FinanceSidebar } from "@/components/finance-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

interface UserDetails {
  users_id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  middleName?: string
  suffix?: string
  profilePicture?: string
  isActive: boolean
  createdAt: string
  role?: { name: string }
  department?: { name: string }
  status?: { name: string }
}

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function AccountSettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      email: "",
    }
  })

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  })

  // Check authentication
  useEffect(() => {
    const loadUserData = async () => {
      if (status === "unauthenticated") {
        router.push("/login")
      } else if (status === "authenticated") {
        setIsLoading(false)
        await fetchUserDetails()
      }
    }
    
    loadUserData()
  }, [status, router])

  const fetchUserDetails = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const data = await response.json()
        setUserDetails(data.user)
        
        // Populate form with user data
        profileForm.reset({
          name: data.user.name || "",
          firstName: data.user.firstName || "",
          middleName: data.user.middleName || "",
          lastName: data.user.lastName || "",
          suffix: data.user.suffix || "",
          email: data.user.email || "",
        })
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
      toast.error("Failed to load user details")
    }
  }

  const onUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Profile updated successfully!")
        fetchUserDetails()
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const onChangePassword = async (data: PasswordFormData) => {
    setIsChangingPassword(true)
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (response.ok) {
        toast.success("Password changed successfully!")
        passwordForm.reset()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to change password")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file (JPG, PNG, or GIF)")
      return
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB")
      return
    }

    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch("/api/user/upload-avatar", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Avatar updated successfully!")
        
        // Update user details with new avatar
        setUserDetails(prev => prev ? {
          ...prev,
          profilePicture: result.profilePicture
        } : null)
        
        // Update the NextAuth session
        await update({
          profilePicture: result.profilePicture
        })
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to upload avatar")
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast.error("Failed to upload avatar")
    } finally {
      setIsUploadingAvatar(false)
      // Reset the input value to allow re-selecting the same file
      event.target.value = ''
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading account settings...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const user = session.user
  const initials = user?.name?.split(' ').map(n => n[0]).join('') || 'U'

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "3.5rem",
        } as React.CSSProperties
      }
    >
      {user.role === "Dean/Program Head" ? (
        <DeanSidebar variant="inset" />
      ) : user.role === "Finance Officer" ? (
        <FinanceSidebar variant="inset" />
      ) : (
        <AppSidebar variant="inset" />
      )}
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {/* Page Header */}
            <div className="border-b bg-background px-4 py-4 lg:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Account Settings</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Manage your account information and preferences
                  </p>
                </div>
                <Badge variant="outline" className="text-sm w-fit">
                  {user.role}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col gap-6 p-4 lg:p-6">
              {/* Profile Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconUser className="size-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Avatar className="size-20">
                      <AvatarImage src={userDetails?.profilePicture || "/ckcm.png"} />
                      <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      {user.role === "Admin" ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-2"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                          disabled={isUploadingAvatar}
                          type="button"
                        >
                          <IconCamera className="size-4" />
                          {isUploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                        </Button>
                      ) : (
                        <Button asChild variant="outline" size="sm" className="relative overflow-hidden group">
                          <a href={userDetails?.profilePicture || "/ckcm.png"} download>
                            <span className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4 mr-2">
                              <path d="M12 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L11 12.586V4a1 1 0 011-1z" />
                              <path d="M5 20a2 2 0 002 2h10a2 2 0 002-2v-3a1 1 0 112 0v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 112 0v3z" />
                            </svg>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-400">
                              Download current picture
                            </span>
                          </a>
                        </Button>
                      )}
                      <p className="text-sm text-muted-foreground">
                        JPG, PNG or GIF. Max size 2MB.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Profile Form */}
                  <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          {...profileForm.register("name")}
                        />
                        {profileForm.formState.errors.name && (
                          <p className="text-sm text-red-500">{profileForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...profileForm.register("email")}
                          error={profileForm.formState.errors.email?.message}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          {...profileForm.register("firstName")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="middleName">Middle Name</Label>
                        <Input
                          id="middleName"
                          {...profileForm.register("middleName")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          {...profileForm.register("lastName")}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="suffix">Suffix</Label>
                      <Input
                        id="suffix"
                        {...profileForm.register("suffix")}
                        placeholder="e.g., Jr., Sr., III"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdatingProfile}
                        className="flex items-center gap-2"
                      >
                        <IconDeviceFloppy className="size-4" />
                        {isUpdatingProfile ? "Updating..." : "Update Profile"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Security Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconKey className="size-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Change your password and manage security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.role === "Admin" ? (
                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password *</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...passwordForm.register("currentPassword")}
                        error={passwordForm.formState.errors.currentPassword?.message}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password *</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...passwordForm.register("newPassword")}
                          error={passwordForm.formState.errors.newPassword?.message}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...passwordForm.register("confirmPassword")}
                          error={passwordForm.formState.errors.confirmPassword?.message}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isChangingPassword}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <IconKey className="size-4" />
                        {isChangingPassword ? "Changing..." : "Change Password"}
                      </Button>
                    </div>
                  </form>
                  ) : (
                    <p className="text-sm text-muted-foreground">Password changes are managed by the administration.</p>
                  )}
                </CardContent>
              </Card>

              {/* Account Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    View your account details and status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">User ID</Label>
                      <p className="font-medium">{userDetails?.users_id || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Role</Label>
                      <p className="font-medium">{user.role}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Department</Label>
                      <p className="font-medium">{userDetails?.department?.name || "Not assigned"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant={userDetails?.status?.name === "Regular" ? "default" : "secondary"}>
                          {userDetails?.status?.name || "Unknown"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Account Created</Label>
                      <p className="font-medium">
                        {userDetails?.createdAt ? new Date(userDetails.createdAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Account Status</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant={userDetails?.isActive ? "default" : "destructive"}>
                          {userDetails?.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
