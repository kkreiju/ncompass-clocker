"use client"

import { useRouter } from "next/navigation"
import { ClipboardList } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function AttendanceCard() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/attendance')
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="p-6 text-center">
        <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <h3 className="font-semibold mb-1">Attendance</h3>
        <p className="text-sm text-muted-foreground">Scan your QR code to clock in/out</p>
      </CardContent>
    </Card>
  )
}
