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
import { CurrentStatusCard } from "@/components/users/current-status-card"
import { WeeklyActivityCard } from "@/components/users/weekly-activity-card"
import { ViewHistoryCard } from "@/components/users/view-history-card"

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
        <CurrentStatusCard currentStatus={currentStatus} />

        {/* Recent Activity */}
        <WeeklyActivityCard
          loading={loading}
          weeklyActivityData={weeklyActivityData}
          formatTime={formatTime}
        />

        {/* Quick Actions */}
        <div className="grid gap-4">
          <ViewHistoryCard />
        </div>
      </div>
    </>
  )
}
