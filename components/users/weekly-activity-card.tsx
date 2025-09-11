"use client"

import { Activity, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AttendanceRecord {
  _id: string
  userName: string
  userEmail: string
  action: 'clock-in' | 'clock-out'
  timestamp: string
}

interface Session {
  clockIn: Date
  clockOut: Date | null
  duration: number
  isActive: boolean
}

interface DayData {
  date: Date
  totalTime: number
  isLive: boolean
  sessions: Session[]
}

interface WeekData {
  weekStart: Date
  weekEnd: Date
  weekTotal: number
  dailyData: DayData[]
}

interface WeeklyActivityCardProps {
  loading: boolean
  weeklyActivityData: WeekData[]
  formatTime: (milliseconds: number) => string
}

export function WeeklyActivityCard({ loading, weeklyActivityData, formatTime }: WeeklyActivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Weekly Activity Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading activity...</p>
        ) : weeklyActivityData.length > 0 ? (
          <div className="space-y-6">
            {weeklyActivityData.map((week, weekIndex) => (
              <div key={weekIndex} className="space-y-3">
                {/* Week Header */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">
                      Week of {week.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {week.weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Total: {formatTime(week.weekTotal)}
                  </div>
                </div>

                {/* Daily Activity */}
                <div className="space-y-2 ml-4">
                  {week.dailyData.map((day: any, dayIndex: number) => (
                    <div key={dayIndex} className="border rounded-lg p-3">
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {day.date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                          })}
                          {day.isLive && <span className="ml-2 text-green-600 text-sm">(Active)</span>}
                        </span>
                        <span className={`text-sm ${day.isLive ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                          {formatTime(day.totalTime)}
                        </span>
                      </div>

                      {/* Session Details */}
                      <div className="space-y-2">
                        {day.sessions && day.sessions.length > 0 ? (
                          <>
                            {/* Header Row */}
                            <div className="grid grid-cols-3 gap-4 text-xs font-medium text-muted-foreground border-b border-muted-foreground/30 pb-1">
                              <div>In</div>
                              <div>Out</div>
                              <div>Timer</div>
                            </div>

                            {/* Session Rows */}
                            {day.sessions.map((session: any, sessionIndex: number) => (
                              <div key={sessionIndex} className="grid grid-cols-3 gap-4 text-xs">
                                <div className="font-medium">
                                  {session.clockIn.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </div>
                                <div className={`font-medium ${session.isActive ? 'text-green-600' : ''}`}>
                                  {session.isActive ? 'Now' : session.clockOut ? session.clockOut.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  }) : '--:--'}
                                </div>
                                <div className={`font-medium ${session.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                                  {formatTime(session.duration)}
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">No sessions recorded</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No attendance records yet</p>
        )}
      </CardContent>
    </Card>
  )
}
