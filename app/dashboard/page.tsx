'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Activity, QrCode } from "lucide-react"

interface AttendanceRecord {
  _id: string;
  userName: string;
  userEmail: string;
  action: 'clock-in' | 'clock-out';
  timestamp: string;
}

export default function UserDashboard() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<'clocked-in' | 'clocked-out' | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Check current status whenever attendance data changes
  useEffect(() => {
    if (attendance.length > 0) {
      checkCurrentStatus();
    }
  }, [attendance]);

  // Update current time every second for real-time clock display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/attendance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAttendance(data.attendance);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentStatus = () => {
    // Check if user is currently clocked in by finding unpaired clock-in
    const sortedRecords = [...attendance].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let activeClockIn: AttendanceRecord | null = null;

    // Process records to find any unpaired clock-in
    sortedRecords.forEach(record => {
      if (record.action === 'clock-in') {
        activeClockIn = record;
      } else if (record.action === 'clock-out' && activeClockIn) {
        // Found a completed session, reset active clock-in
        activeClockIn = null;
      }
    });

    setCurrentStatus(activeClockIn ? 'clocked-in' : 'clocked-out');
  };



  // Helper function to format time in HH:MM:SS
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper function to calculate current session time if clocked in
  const getCurrentSessionTime = (): string => {
    if (currentStatus !== 'clocked-in') return '00:00:00';

    // Find the most recent clock-in that doesn't have a corresponding clock-out
    const sortedRecords = [...attendance].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let activeClockIn: AttendanceRecord | null = null;

    // Process records to find the last unpaired clock-in
    sortedRecords.forEach((record: AttendanceRecord) => {
      if (record.action === 'clock-in') {
        activeClockIn = record;
      } else if (record.action === 'clock-out' && activeClockIn) {
        // Found a completed session, reset active clock-in
        activeClockIn = null;
      }
    });

    if (!activeClockIn) return '00:00:00';

    const sessionTime = currentTime.getTime() - new Date((activeClockIn as AttendanceRecord).timestamp).getTime();
    return formatTime(sessionTime);
  };

  const getWeeklyActivity = () => {
    // Group records by week
    const weekGroups: { [key: string]: AttendanceRecord[] } = {};

    attendance.forEach(record => {
      const date = new Date(record.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = [];
      }
      weekGroups[weekKey].push(record);
    });

    // Process each week
    const weeklyData = Object.keys(weekGroups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Most recent first
      .slice(0, 4) // Show last 4 weeks
      .map(weekKey => {
        const weekRecords = weekGroups[weekKey];
        const weekStart = new Date(weekKey);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        // Group by day within the week
        const dayGroups: { [key: string]: AttendanceRecord[] } = {};
        weekRecords.forEach(record => {
          const dayKey = new Date(record.timestamp).toDateString();
          if (!dayGroups[dayKey]) {
            dayGroups[dayKey] = [];
          }
          dayGroups[dayKey].push(record);
        });

        // Calculate daily totals
        const dailyData = Object.keys(dayGroups)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          .map(dayKey => {
            const dayRecords = dayGroups[dayKey];
            const clockIn = dayRecords.find(r => r.action === 'clock-in');
            const clockOut = dayRecords.find(r => r.action === 'clock-out');

            let dailyTotal = 0;
            let isTodayAndClockedIn = false;

            // Sort records by timestamp (oldest first for proper pairing)
            const sortedRecords = dayRecords.sort((a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            const isToday = dayKey === new Date().toDateString();

            // Calculate total time for all completed sessions
            let completedTime = 0;
            let activeClockIn: AttendanceRecord | null = null;

            // Process all records to find completed sessions and active session
            sortedRecords.forEach((record: AttendanceRecord) => {
              if (record.action === 'clock-in') {
                activeClockIn = record;
              } else if (record.action === 'clock-out' && activeClockIn) {
                // Found a completed session
                const sessionTime = new Date(record.timestamp).getTime() - new Date(activeClockIn.timestamp).getTime();
                completedTime += sessionTime;
                activeClockIn = null; // Reset for next session
              }
            });

            // Check if currently clocked in (last record is clock-in and no matching clock-out)
            if (activeClockIn && isToday) {
              isTodayAndClockedIn = true;
              const currentSessionTime = currentTime.getTime() - new Date((activeClockIn as AttendanceRecord).timestamp).getTime();
              dailyTotal = completedTime + currentSessionTime;
            } else {
              // All sessions completed
              dailyTotal = completedTime;
            }

            // Create detailed session breakdown
            const sessions: Array<{
              clockIn: Date;
              clockOut: Date | null;
              duration: number;
              isActive: boolean;
            }> = [];

            let tempClockIn: AttendanceRecord | null = null;
            const daySortedRecords = dayRecords.sort((a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            daySortedRecords.forEach((record: AttendanceRecord) => {
              if (record.action === 'clock-in') {
                tempClockIn = record;
              } else if (record.action === 'clock-out' && tempClockIn) {
                // Completed session
                const sessionDuration = new Date(record.timestamp).getTime() - new Date(tempClockIn.timestamp).getTime();
                sessions.push({
                  clockIn: new Date(tempClockIn.timestamp),
                  clockOut: new Date(record.timestamp),
                  duration: sessionDuration,
                  isActive: false
                });
                tempClockIn = null;
              }
            });

            // Add current active session if exists
            if (tempClockIn && isToday) {
              const currentSessionDuration = currentTime.getTime() - new Date((tempClockIn as AttendanceRecord).timestamp).getTime();
              sessions.push({
                clockIn: new Date((tempClockIn as AttendanceRecord).timestamp),
                clockOut: null,
                duration: currentSessionDuration,
                isActive: true
              });
            }

            // Sort sessions by latest first (most recent session appears first)
            sessions.sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime());

            return {
              date: new Date(dayKey),
              totalTime: dailyTotal,
              isLive: isTodayAndClockedIn,
              sessions: sessions
            };
          });

        // Calculate weekly total
        const weeklyTotal = dailyData.reduce((total, day) => total + day.totalTime, 0);

        return {
          weekStart,
          weekEnd,
          weekTotal: weeklyTotal,
          dailyData
        };
      });

    return weeklyData;
  };

  // Recalculate weekly activity when current time changes and user is clocked in
  const [weeklyActivityData, setWeeklyActivityData] = useState<any[]>([]);

  useEffect(() => {
    setWeeklyActivityData(getWeeklyActivity());
  }, [attendance]);

  // Update weekly activity every second to handle real-time updates
  useEffect(() => {
    setWeeklyActivityData(getWeeklyActivity());
  }, [currentTime, attendance]);

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
                <BreadcrumbPage>User Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Current Status */}
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

        {/* Recent Activity */}
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

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <QrCode className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-semibold mb-1">QR Scanner</h3>
              <p className="text-sm text-muted-foreground">Use mobile device to scan</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-semibold mb-1">View History</h3>
              <p className="text-sm text-muted-foreground">Check past attendance</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
