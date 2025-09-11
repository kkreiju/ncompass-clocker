"use client"

import { Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function ViewHistoryCard() {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-6 text-center">
        <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <h3 className="font-semibold mb-1">View History</h3>
        <p className="text-sm text-muted-foreground">Check past attendance</p>
      </CardContent>
    </Card>
  )
}
