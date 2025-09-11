import { UserSidebar } from "@/components/sidebar/user-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <UserSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
