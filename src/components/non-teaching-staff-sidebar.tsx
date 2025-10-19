"use client"

import * as React from "react"
import {
  IconDashboard,
  IconFileText,
  IconCalendarPlus,
  IconArchive,
  IconClock,
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

const nonTeachingStaffNavigationItems = [
  {
    title: "Dashboard",
    url: "/non-teaching-staff/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Apply for Leave",
    url: "/non-teaching-staff/leave/apply",
    icon: IconCalendarPlus,
  },
  {
    title: "Leave Management",
    url: "/non-teaching-staff/leave",
    icon: IconFileText,
  },
  {
    title: "Current Application",
    url: "/non-teaching-staff/leave/current",
    icon: IconFileText,
  },
  {
    title: "View Archive",
    url: "/non-teaching-staff/leave/archived",
    icon: IconArchive,
  },
]

// Removed Account Settings from sidebar navigation; available via user dropdown
const commonNavigationItems: any[] = []

export function NonTeachingStaffSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const router = useRouter()

  const userData = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "user@example.com", 
    avatar: '/ckcm.png',
    userId: (session?.user as any)?.userId || (session?.user as any)?.users_id || session?.user?.id || "N/A",
  }

  const handleNavigation = (url: string) => {
    console.log('Navigation clicked:', url)
    if (url !== "#") {
      console.log('Navigating to:', url)
      router.push(url)
    } else {
      console.log('Navigation blocked - URL is #')
    }
  }

  const navigationItems = [...nonTeachingStaffNavigationItems, ...commonNavigationItems]

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Image
            src="/ckcm.png"
            alt="CKCM Logo"
            width={32}
            height={32}
            className="rounded"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">CKCM OALAS</span>
            <span className="text-xs text-muted-foreground">Non-Teaching Staff</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto">
        <NavUser 
          user={userData}
          displayRole={getUserDisplayRole(session?.user)}
        />
      </div>
    </Sidebar>
  )
}
