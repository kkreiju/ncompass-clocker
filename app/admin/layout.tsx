import type { Metadata } from "next"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"

export const metadata: Metadata = {
  title: "Admin | N-Compass Attendance",
  description: "Admin panel for attendance management",
}

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
        <div className="fixed bottom-4 right-4 z-50">
          <ModeToggle />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
