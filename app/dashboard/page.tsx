'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AttendanceRecord {
  _id: string;
  action: 'clock-in' | 'clock-out';
  timestamp: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface DayData {
  date: string;
  records: AttendanceRecord[];
  totalHours: number;
  isActive: boolean; // Has clock-in but no clock-out
  activeStart?: string;
}

interface WeekData {
  weekStart: string;
  weekEnd: string;
  days: DayData[];
  totalHours: number;
}

// Timer component for running time
function RunningTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = now - start;
      setElapsed(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const hours = Math.floor(elapsed / (1000 * 60 * 60));
  const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

  return (
    <span className="text-green-600" style={{fontFamily: 'var(--font-poppins)'}}>
      {hours.toString().padStart(2, '0')}:
      {minutes.toString().padStart(2, '0')}:
      {seconds.toString().padStart(2, '0')}
    </span>
  );
}

// Utility function for formatting hours
const formatHoursToHMS = (hours: number) => {
  const totalSeconds = Math.abs(hours) * 3600; // Convert hours to seconds
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Component for running hours display (daily/weekly totals)
function RunningHours({ baseHours, activeStart }: { baseHours: number; activeStart?: string }) {
  const [currentElapsed, setCurrentElapsed] = useState(0);

  useEffect(() => {
    if (!activeStart) {
      setCurrentElapsed(0);
      return;
    }

    const start = new Date(activeStart).getTime();
    
    const updateElapsed = () => {
      const now = new Date().getTime();
      const diff = now - start;
      setCurrentElapsed(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeStart]);

  const totalHoursWithCurrent = baseHours + (currentElapsed / (1000 * 60 * 60));
  return formatHoursToHMS(totalHoursWithCurrent);
}

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const token = localStorage?.getItem('token');
    const userType = localStorage?.getItem('userType');
    
    if (!token || userType !== 'user') {
      router.push('/');
      return;
    }

    // Decode user info from token (basic implementation)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({
        id: payload.userId,
        name: payload.name,
        email: payload.email
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/');
      return;
    }

    fetchAttendance();
  }, [router, currentMonth]);

  const fetchAttendance = async () => {
    try {
      const token = localStorage?.getItem('token');
      const response = await fetch(`/api/attendance?month=${currentMonth.getMonth() + 1}&year=${currentMonth.getFullYear()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage?.removeItem('token');
    localStorage?.removeItem('userType');
    router.push('/');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatHours = (milliseconds: number) => {
    const hours = Math.abs(milliseconds) / (1000 * 60 * 60); // Use Math.abs to prevent negative display
    return `${hours.toFixed(2)}h`;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const calculateDailyHours = (records: AttendanceRecord[]) => {
    // Sort records by timestamp to ensure proper order
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let totalMs = 0;
    let clockInTime = null;
    let activeStart = null;

    for (const record of sortedRecords) {
      if (record.action === 'clock-in') {
        clockInTime = new Date(record.timestamp);
      } else if (record.action === 'clock-out' && clockInTime) {
        const clockOutTime = new Date(record.timestamp);
        const sessionMs = clockOutTime.getTime() - clockInTime.getTime();
        if (sessionMs > 0) { // Only add positive time differences
          totalMs += sessionMs;
        }
        clockInTime = null; // Reset after successful clock-out
      }
    }

    // If there's still a clockInTime, it means the user is currently clocked in
    const hasActiveClockIn = clockInTime !== null;
    if (hasActiveClockIn && clockInTime) {
      activeStart = clockInTime.toISOString();
    }

    return { 
      totalMs: Math.max(0, totalMs), // Ensure non-negative hours
      hasActiveClockIn, 
      activeStart 
    };
  };

  const organizeAttendanceByWeeks = (records: AttendanceRecord[]): WeekData[] => {
    const sortedRecords = [...records].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const dayMap = new Map<string, AttendanceRecord[]>();
    
    sortedRecords.forEach(record => {
      const date = new Date(record.timestamp).toDateString();
      if (!dayMap.has(date)) {
        dayMap.set(date, []);
      }
      dayMap.get(date)!.push(record);
    });

    const weeks: WeekData[] = [];
    const processedDates = new Set<string>();

    // Get the most recent record to determine current status
    const mostRecentRecord = sortedRecords[0];
    const isCurrentlyActive = mostRecentRecord?.action === 'clock-in';
    const currentActiveStart = isCurrentlyActive ? mostRecentRecord.timestamp : null;

    Array.from(dayMap.keys()).forEach(dateStr => {
      if (processedDates.has(dateStr)) return;

      const date = new Date(dateStr);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekDays: DayData[] = [];
      let weekTotalMs = 0;

      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const dayStr = d.toDateString();
        const dayRecords = dayMap.get(dayStr) || [];
        
        if (dayRecords.length > 0) {
          processedDates.add(dayStr);
          const { totalMs, hasActiveClockIn, activeStart } = calculateDailyHours(dayRecords);
          
          // For today's date, use the global active status
          const isToday = dayStr === new Date().toDateString();
          const dayIsActive = isToday ? isCurrentlyActive : hasActiveClockIn;
          const dayActiveStart = isToday && isCurrentlyActive ? currentActiveStart : activeStart;
          
          weekDays.push({
            date: dayStr,
            records: dayRecords.sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            ),
            totalHours: totalMs / (1000 * 60 * 60),
            isActive: dayIsActive,
            activeStart: dayActiveStart || undefined
          });

          weekTotalMs += totalMs;
        }
      }

      if (weekDays.length > 0) {
        weeks.push({
          weekStart: weekStart.toDateString(),
          weekEnd: weekEnd.toDateString(),
          days: weekDays,
          totalHours: weekTotalMs / (1000 * 60 * 60)
        });
      }
    });

    return weeks;
  };

  const weeklyData = organizeAttendanceByWeeks(attendance);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="NCompass Logo" 
                className="w-8 h-8 object-contain"
              />
              <div>
                {user && (
                  <p className="text-md text-gray-600">Welcome, <b>{user.name}</b>!</p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex space-x-4">
            <a
              href="/attendance"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Clock In/Out
            </a>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Attendance History</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => changeMonth('prev')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ←
              </button>
              <span className="font-medium text-gray-900 min-w-[150px] text-center">
                {getMonthName(currentMonth)}
              </span>
              <button
                onClick={() => changeMonth('next')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={currentMonth.getMonth() >= new Date().getMonth() && currentMonth.getFullYear() >= new Date().getFullYear()}
              >
                →
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {weeklyData.map((week, weekIndex) => (
              <div key={`${week.weekStart}-${weekIndex}`} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Week Header */}
                <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {/* Week */}
                      {new Date(week.weekStart).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })} - {new Date(week.weekEnd).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </h3>
                    <span className="text-lg font-bold text-blue-600">
                      {(() => {
                        // Check if any day in this week has an active timer
                        const activeDayInWeek = week.days.find(day => day.isActive && day.activeStart);
                        return activeDayInWeek ? 
                          <RunningHours baseHours={week.totalHours} activeStart={activeDayInWeek.activeStart} /> :
                          formatHoursToHMS(week.totalHours);
                      })()}
                    </span>
                  </div>
                </div>

                {/* Days */}
                {week.days.map((day, dayIndex) => (
                  <div key={`${day.date}-${dayIndex}`} className="border-b border-gray-100 last:border-b-0">
                    {/* Day Header */}
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {day.isActive && day.activeStart && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-green-600">Active:</span>
                              <RunningTimer startTime={day.activeStart} />
                            </div>
                          )}
                          <span className="font-medium text-gray-700">
                            {day.isActive && day.activeStart ? 
                              <RunningHours baseHours={day.totalHours} activeStart={day.activeStart} /> :
                              formatHoursToHMS(day.totalHours)
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clock In/Out Records */}
                    <div className="px-6 py-4">
                      <div className="grid grid-cols-2 gap-8">
                        {/* Clock In Column */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                            Clock In
                          </h5>
                          <div className="space-y-2">
                            {day.records
                              .filter(record => record.action === 'clock-in')
                              .map((record, idx) => (
                                <div key={`${record._id}-in-${idx}`} className="flex items-center space-x-3">
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    IN
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatTime(record.timestamp)}
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        </div>

                        {/* Clock Out Column */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                            Clock Out
                          </h5>
                          <div className="space-y-2">
                            {day.records
                              .filter(record => record.action === 'clock-out')
                              .map((record, idx) => (
                                <div key={`${record._id}-out-${idx}`} className="flex items-center space-x-3">
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                    OUT
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatTime(record.timestamp)}
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {weeklyData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No attendance records found for {getMonthName(currentMonth)}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}