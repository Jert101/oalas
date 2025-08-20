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

const deanNavigationItems = [
  {
    title: "Dean Dashboard",
    url: "/dean/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Leave Applications",
    url: "/dean/applications",
    icon: IconFileText,
  },
  {
    title: "Apply for Leave/Travel",
    url: "/dean/leave/apply",
    icon: IconPlus,
  },
  {
    title: "Leave Management",
    url: "/dean/leave",
    icon: IconFileText,
  },
  {
    title: "Faculty Members",
    url: "/dean/faculty",
    icon: IconUsers,
  },
  {
    title: "Approval Queue",
    url: "/dean/approvals",
    icon: IconChecklist,
  },
  {
    title: "Department Reports",
    url: "/dean/reports",
    icon: IconChartBar,
  },
  {
    title: "Faculty Status",
    url: "/dean/faculty-status",
    icon: IconUserCheck,
  },
  {
    title: "Calendar Overview",
    url: "/dean/calendar",
    icon: IconCalendar,
  },
  {
    title: "Recent Activity",
    url: "/dean/activity",
    icon: IconClock,
  },
]

// Removed Account Settings from sidebar navigation; available via user dropdown
const commonNavigationItems: any[] = []

export function DeanSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const router = useRouter()
  
  const userData = {
    name: session?.user?.name || "Dean",
    email: session?.user?.email || "dean@example.com", 
    avatar: session?.user?.profilePicture?.startsWith('/') 
      ? session?.user?.profilePicture 
      : `/${session?.user?.profilePicture || 'ckcm.png'}`,
    userId: session?.user?.id || "N/A",
  }

  const navigationItems = [...deanNavigationItems, ...commonNavigationItems]

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
              onClick={() => handleNavigation("/dean/dashboard")}
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
