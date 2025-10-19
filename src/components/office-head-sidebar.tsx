"use client"

import * as React from "react"
import {
  IconDashboard,
  IconSettings,
  IconUsers,
  IconFileText,
  IconChecklist,
  IconCalendar,
  IconChartBar,
  IconUserCheck,
  IconClock,
  IconPlus,
} from "@tabler/icons-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { NavUser } from "@/components/nav-user"
import { getUserDisplayRole } from "@/lib/role-display"
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

const officeHeadNavigationItems = [
  {
    title: "Office Head Dashboard",
    url: "/office-head/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Leave Applications",
    url: "/office-head/applications",
    icon: IconFileText,
  },
  {
    title: "Apply for Leave/Travel",
    url: "/office-head/leave/apply",
    icon: IconPlus,
  },
  {
    title: "Leave Management",
    url: "/office-head/leave",
    icon: IconFileText,
  },
  {
    title: "Faculty Members",
    url: "/office-head/faculty",
    icon: IconUsers,
  },
  {
    title: "Calendar Overview",
    url: "/office-head/calendar",
    icon: IconCalendar,
  },
  {
    title: "Recent Activity",
    url: "/office-head/activity",
    icon: IconClock,
  },
]

// Removed Account Settings from sidebar navigation; available via user dropdown
const commonNavigationItems: any[] = []

export function OfficeHeadSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const router = useRouter()
  
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
        console.log("[OfficeHeadSidebar] Decoded URL:", { original: raw, decoded: url })
      } catch (e) {
        console.warn("[OfficeHeadSidebar] Failed to decode URL:", raw, e)
        url = raw || ""
      }
    }
    
    // Ensure URL is valid
    if (url && (url.startsWith('http') || url.startsWith('/'))) {
      console.log("[OfficeHeadSidebar] Using profile picture:", url)
      return url
    }
    
    console.log("[OfficeHeadSidebar] Using fallback picture for:", fallbackName)
    return '/ckcm.png'
  }

  const userData = {
    name: session?.user?.name || "Office Head",
    email: session?.user?.email || "office-head@example.com", 
    avatar: '/ckcm.png', // GoogleAvatar will handle the real avatar fetching
    userId: (session?.user as any)?.userId || session?.user?.id || "N/A",
  }

  const navigationItems = [...officeHeadNavigationItems, ...commonNavigationItems]

  const handleNavigation = (url: string) => {
    console.log('Navigation clicked:', url)
    if (url !== "#") {
      console.log('Navigating to:', url)
      router.push(url)
    } else {
      console.log('Navigation blocked - URL is #')
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:!p-1.5 cursor-pointer"
              onClick={() => handleNavigation("/office-head/dashboard")}
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
          {/* User Profile Section */}
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
