"use client"

import * as React from "react"
import {
  IconDashboard,
  IconClock,
  IconCalendar,
  IconFileText,
  IconHistory,
  IconSettings,
  IconPlus,
  IconArchive
} from "@tabler/icons-react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"

import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
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

const teacherNavigationItems = [
  {
    title: "Dashboard",
    url: "/teacher/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Apply for Leave",
    url: "/teacher/leave/apply",
    icon: IconPlus,
  },
  {
    title: "Leave Management",
    url: "/teacher/leave",
    icon: IconFileText,
  },
  {
    title: "View Archive",
    url: "/teacher/leave/archived",
    icon: IconArchive,
  },
  {
    title: "Calendar",
    url: "/teacher/calendar",
    icon: IconCalendar,
  },
  {
    title: "Account Settings",
    url: "/account",
    icon: IconSettings,
  },
]

export function TeacherSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  if (!session?.user) return null

  // Format user data for NavUser component
  const userData = {
    name: session.user.name || "User",
    email: session.user.email || "user@example.com",
    avatar: session.user.profilePicture?.startsWith('/') 
      ? session.user.profilePicture 
      : `/${session.user.profilePicture || 'ckcm.png'}`,
    userId: session.user.id || "N/A",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:!p-1.5 cursor-pointer"
              onClick={() => router.push("/teacher/dashboard")}
            >
              <Image 
                src="/ckcm.png" 
                alt="CKCM Logo" 
                width={20} 
                height={20} 
                className="!size-5" 
              />
              <span className="text-base font-semibold">CKCM OALAS</span>
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
                {teacherNavigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      tooltip={item.title}
                      className="cursor-pointer"
                      asChild
                    >
                      <button 
                        onClick={() => router.push(item.url)}
                        className="w-full flex items-center gap-2"
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
