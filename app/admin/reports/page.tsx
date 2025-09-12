'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LatesReport, AbsencesReport, PresentReport } from "@/components/reports"

export default function ReportsPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Reports</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Monitor attendance violations and absences</p>
          </div>

          {/* Reports Tabs */}
          <Tabs defaultValue="present" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="present">Present</TabsTrigger>
              <TabsTrigger value="lates">Late Entries</TabsTrigger>
              <TabsTrigger value="absences">Absences</TabsTrigger>
            </TabsList>

            <TabsContent value="present" className="space-y-6">
              <PresentReport />
            </TabsContent>

            <TabsContent value="lates" className="space-y-6">
              <LatesReport />
            </TabsContent>

            <TabsContent value="absences" className="space-y-6">
              <AbsencesReport />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
