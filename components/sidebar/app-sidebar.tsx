"use client"

import * as React from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Calculator,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// ----- ATTENDANCE APP DATA -----
const data = {
  user: {
    name: "N-Compass Admin",
    email: "team@n-compass.biz",
    avatar: "/ncompass-logo.svg",
  },
  teams: [
    { name: "N-Compass TV", logo: GalleryVerticalEnd, plan: "Enterprise" },
    { name: "Field Ops", logo: AudioWaveform, plan: "Internal" },
    { name: "Sandbox", logo: Command, plan: "Dev" },
  ],
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
      title: "Users",
      url: "/admin/people",
      icon: Users,
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
        <TeamSwitcher teams={data.teams} />
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
