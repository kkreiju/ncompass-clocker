"use client"

import { Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CurrentStatusCardProps {
  currentStatus: 'clocked-in' | 'clocked-out' | null
}

export function CurrentStatusCard({ currentStatus }: CurrentStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Current Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={currentStatus === 'clocked-in' ? 'default' : 'secondary'}>
              {currentStatus === 'clocked-in' ? 'Clocked In' : 'Clocked Out'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
