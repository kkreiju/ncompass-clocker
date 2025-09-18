"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Calculator,
  FileText,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
  Settings,
  UserCheck,
  UsersRound,
  CalendarDays,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// ----- ATTENDANCE APP DATA -----
const data: {
  user: {
    name: string
    email: string
    profileURL?: string
  }
  navMain: {
    title: string
    url?: string
    icon?: any
    isActive?: boolean
    items?: { title: string; url: string }[]
  }[]
} = {
  user: {
    name: "User",
    email: "user@example.com",
    profileURL: undefined,
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Attendance",
      url: "/admin/attendance",
      icon: ClipboardCheck,
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: FileText,
    },
    {
      title: "Leaves",
      url: "/admin/leaves",
      icon: CalendarDays,
    },
    {
      title: "Team",
      icon: Settings,
      items: [
        {
          title: "Users",
          url: "/admin/users",
        },
        {
          title: "Departments",
          url: "/admin/departments",
        },
      ],
    },
    {
      title: "Rate Calculator",
      url: "/admin/rates",
      icon: Calculator,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                <Image src="/ncompass-logo.svg" alt="N-Compass TV" width={32} height={32} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">N-Compass TV</span>
                <span className="truncate text-xs">Attendance System</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
