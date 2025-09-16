'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { AttendanceFilters } from "./attendance-filters";
import { AttendanceTable } from "./attendance-table";
import { AttendanceHistoryModal } from "./attendance-history-modal";

interface AttendanceRecord {
  _id: string;
  userName: string;
  userEmail: string;
  action: 'clock-in' | 'clock-out';
  timestamp: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface UserAttendanceStats {
  user: User;
  totalRecords: number;
  thisWeekRecords: number;
  todayRecords: number;
  weeklyHours: number;
  todayHours: number;
}

export function AttendanceHistory() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
    fetchAttendance();
  }, [selectedPeriod]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
        return;
      }

      // Get date range based on selected period
      const now = new Date();
      let startDate: Date;

      switch (selectedPeriod) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          // Start of current week (Sunday)
          startDate = new Date(now);
          const dayOfWeek = now.getDay();
          startDate.setDate(now.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          // Start of current week (Sunday)
          startDate = new Date(now);
          const defaultDayOfWeek = now.getDay();
          startDate.setDate(now.getDate() - defaultDayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          break;
      }

      const month = startDate.getMonth() + 1;
      const year = startDate.getFullYear();
      const url = `/api/attendance?month=${month}&year=${year}`;

      const response = await fetch(url, {
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

  const calculateUserStats = (): UserAttendanceStats[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate start of current week (Sunday)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    return users.map(user => {
      const userRecords = attendance.filter(record => record.userEmail === user.email);
      const todayRecords = userRecords.filter(record =>
        new Date(record.timestamp).toDateString() === today.toDateString()
      );
      const weekRecords = userRecords.filter(record =>
        new Date(record.timestamp) >= startOfWeek
      );

      // Calculate actual worked hours based on clock-in/out pairs (following rate calculator logic)
      const calculateHours = (records: AttendanceRecord[]): number => {
        if (records.length === 0) return 0;

        console.log(`🔍 Calculating hours for ${user.email} with ${records.length} records:`, records);

        // Group records by date (YYYY-MM-DD)
        const dateGroups: { [key: string]: AttendanceRecord[] } = {};
        records.forEach(record => {
          const dateKey = new Date(record.timestamp).toISOString().split('T')[0];
          if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = [];
          }
          dateGroups[dateKey].push(record);
        });

        let totalHours = 0;

        // Calculate hours for each day
        Object.values(dateGroups).forEach(dayRecords => {
          const sortedRecords = dayRecords.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          let dayHours = 0;
          let clockInTime: Date | null = null;

          sortedRecords.forEach(record => {
            if (record.action === 'clock-in') {
              clockInTime = new Date(record.timestamp);
            } else if (record.action === 'clock-out' && clockInTime) {
              const clockOutTime = new Date(record.timestamp);
              const sessionHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
              dayHours += sessionHours;
              clockInTime = null;
            }
          });

          if (dayHours > 0) {
            totalHours += dayHours;
          }
        });

        // Round to one decimal place
        const finalHours = Math.round(totalHours * 10) / 10;
        console.log(`✅ Final hours for ${user.email}: ${finalHours}h (from ${Object.keys(dateGroups).length} days)`);
        return finalHours;
      };
      
      const todayHours = calculateHours(todayRecords);
      const weeklyHours = calculateHours(weekRecords);

      // Get last activity
      const lastRecord = userRecords.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];

      return {
        user,
        totalRecords: userRecords.length,
        thisWeekRecords: weekRecords.length,
        todayRecords: todayRecords.length,
        weeklyHours,
        todayHours
      };
    }).filter(stats =>
      stats.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stats.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'clock-in': return 'bg-green-100 text-green-800 border-green-200';
      case 'clock-out': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleString();
  };

  const handleViewHistory = (user: User) => {
    setSelectedUserForHistory(user);
    setHistoryModalOpen(true);
  };

  const getUserDetailedAttendance = (userEmail: string) => {
    return attendance
      .filter(record => record.userEmail === userEmail)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50); // Show last 50 records
  };

  const userStats = calculateUserStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">User Attendance</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Monitor user attendance and activity</p>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <AttendanceFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        selectedPeriod={selectedPeriod}
        onSelectedPeriodChange={setSelectedPeriod}
      />

      {/* User Attendance Table */}
      <AttendanceTable
        userStats={userStats}
        loading={loading}
        selectedPeriod={selectedPeriod}
        onViewHistory={handleViewHistory}
      />

      {/* Attendance History Modal */}
      <AttendanceHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        selectedUser={selectedUserForHistory}
      />
    </div>
  );
}
