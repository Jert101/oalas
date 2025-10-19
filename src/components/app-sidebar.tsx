"use client"

import * as React from "react"
import {
  IconDashboard,
  IconSettings,
  IconUsers,
  IconCalendarPlus,
  IconUserPlus,
  IconCalendar,
  IconClock,
  IconArchive,
  IconFileText,
} from "@tabler/icons-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { fetchGoogleProfilePicture } from "@/lib/google"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { NavUser } from "@/components/nav-user"
import { getUserDisplayRole } from "@/lib/role-display"
import GoogleAvatar from "./GoogleAvatar"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const adminNavigationItems = [
  {
    title: "Admin Dashboard",
    url: "/admin/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Add New Account",
    url: "/admin/add-account",
    icon: IconUserPlus,
  },
  {
    title: "Manage Accounts",
    url: "/admin/manage-accounts",
    icon: IconUsers,
  },
  {
    title: "Calendar Settings",
    url: "/admin/calendar-settings",
    icon: IconCalendar,
  },
  {
    title: "Manage Leave Limits",
    url: "/admin/manage-leave-limits",
    icon: IconSettings,
  },
  {
    title: "Manage Probation",
    url: "/admin/manage-probation",
    icon: IconClock,
  },
  {
    title: "Leave Types",
    url: "/admin/leave-types",
    icon: IconSettings,
  },
  {
    title: "Term Types",
    url: "/admin/term-types",
    icon: IconCalendarPlus,
  },
  {
    title: "Departments",
    url: "/admin/departments",
    icon: IconSettings,
  },
  {
    title: "Roles",
    url: "/admin/roles",
    icon: IconSettings,
  },
]

const teacherNavigationItems = [
  {
    title: "Teacher Dashboard",
    url: "/teacher/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Apply for Leave",
    url: "/teacher/leave/apply",
    icon: IconCalendarPlus,
  },
  {
    title: "Leave Management",
    url: "/teacher/leave",
    icon: IconFileText,
  },
  {
    title: "Current Application",
    url: "/teacher/leave/current",
    icon: IconFileText,
  },
  {
    title: "View Archive",
    url: "/teacher/leave/archived",
    icon: IconArchive,
  },
]

// Removed Account Settings from sidebar navigation; available via user dropdown
const commonNavigationItems: any[] = []

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  
  const getAvatarUrl = (raw?: string | null, fallbackName?: string) => {
    // If it looks URL-encoded, safely decode once or twice if needed
    let url = raw || ""
    if (url.includes("%")) {
      try { 
        url = decodeURIComponent(url)
        // Check if it's still encoded (double encoding)
        if (url.includes("%")) {
          url = decodeURIComponent(url)
        }
        console.log("[AppSidebar] Decoded URL:", { original: raw, decoded: url })
      } catch (e) {
        console.warn("[AppSidebar] Failed to decode URL:", raw, e)
        url = raw || ""
      }
    }
    
    // Ensure URL is valid
    if (url && (url.startsWith('http') || url.startsWith('/'))) {
      console.log("[AppSidebar] Using profile picture:", url)
      return url
    }
    
    console.log("[AppSidebar] Using fallback picture for:", fallbackName)
    return '/ckcm.png'
  }

  const userData = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "user@example.com", 
    avatar: '/ckcm.png', // GoogleAvatar will handle the real avatar fetching
    userId: (session?.user as any)?.userId || (session?.user as any)?.users_id || session?.user?.id || "N/A", // Try multiple sources for userId
  }
  
  // Debug logging for user data
  console.log("[AppSidebar] Session data:", {
    sessionUser: session?.user,
    userId: userData.userId,
    profilePicture: (session?.user as any)?.profilePicture,
    role: (session?.user as any)?.role
  })

  // Last-resort: if no avatar in session, try to fetch from Google userinfo using access token
  useEffect(() => {
    const accessToken = (session as any)?.accessToken as string | undefined
    const current = (session?.user as any)?.profilePicture || (session?.user as any)?.image
    if (!current && accessToken && !avatarUrl) {
      ;(async () => {
        const pic = await fetchGoogleProfilePicture({ accessToken })
        if (pic) setAvatarUrl(pic)
      })()
    }
  }, [session, avatarUrl])

  // Determine navigation items based on user role
  const getNavigationItems = () => {
    const userRole = session?.user?.role
    
    let roleBasedItems: typeof adminNavigationItems = []
    
    if (userRole === "Admin") {
      roleBasedItems = adminNavigationItems
    } else if (["Teacher/Instructor", "Non Teaching Personnel"].includes(userRole || "")) {
      roleBasedItems = teacherNavigationItems
    } else if (["Office Clerk", "Maintenance Office", "Guidance Office", "Registrar Office", "Administrative Assistant", "Library Staff", "IT Support", "Security Office", "Clinic Staff", "Accounting Office", "HR Department", "Registrar"].includes(userRole || "")) {
      // Non-teaching staff roles use teacher navigation items but with non-teaching-staff URLs
      roleBasedItems = teacherNavigationItems.map(item => ({
        ...item,
        url: item.url.replace('/teacher/', '/non-teaching-staff/'),
        title: item.title.replace('Teacher Dashboard', 'Non-Teaching Staff Dashboard')
      }))
    }
    // Note: Dean/Program Head should use DeanSidebar, not AppSidebar
    
    return [...roleBasedItems, ...commonNavigationItems]
  }

  const navigationItems = getNavigationItems()

  const handleNavigation = (url: string) => {
    console.log('Navigation clicked:', url)
    if (url !== "#") {
      console.log('Navigating to:', url)
      router.push(url)
    } else {
      console.log('Navigation blocked - URL is #')
    }
  }

  // Get dashboard URL based on role
  const getDashboardUrl = () => {
    const userRole = session?.user?.role
    if (userRole === "Admin") {
      return "/admin/dashboard"
    } else if (["Teacher/Instructor", "Non Teaching Personnel"].includes(userRole || "")) {
      return "/teacher/dashboard"
    }
    return "/teacher/dashboard" // Changed fallback to prevent loops
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:!p-1.5 cursor-pointer"
              onClick={() => handleNavigation(getDashboardUrl())}
            >
              <Image 
                src="/ckcm.png" 
                alt="CKCM Logo" 
                width={20} 
                height={20} 
                className="!size-5" 
              />
              <span className="text-base font-semibold group-data-[collapsible=icon]:hidden">CKCM OALAS</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col h-full">
          {/* User Profile Section - Moved to top */}
          <div className="p-2">
            <NavUser user={userData} />
          </div>
          
          {/* Navigation Items */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      tooltip={item.title}
                      className="cursor-pointer"
                      asChild
                    >
                      <button 
                        onClick={() => handleNavigation(item.url)}
                        className="w-full flex items-center gap-2"
                      >
                        {item.icon && <item.icon />}
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {/* Footer */}
          <div className="mt-auto p-2">
            <div className="text-xs text-muted-foreground">
              <div className="group-data-[collapsible=icon]:hidden leading-snug whitespace-nowrap">
                <div className="font-medium">POWERED BY CKCM TECH</div>
                <div>© 2025 CKCM Technologies, LLC</div>
                <div>All Rights Reserved</div>
              </div>
              <div className="hidden group-data-[collapsible=icon]:block font-medium text-[10px] leading-tight break-words whitespace-normal">
                POWERED BY CKCM TECH
              </div>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
