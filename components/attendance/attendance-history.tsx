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
  lastActivity: string;
  weeklyHours: number;
  todayHours: number;
}

export function AttendanceHistory() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
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
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return users.map(user => {
      const userRecords = attendance.filter(record => record.userEmail === user.email);
      const todayRecords = userRecords.filter(record =>
        new Date(record.timestamp).toDateString() === today.toDateString()
      );
      const weekRecords = userRecords.filter(record =>
        new Date(record.timestamp) >= weekAgo
      );

      // Calculate hours (simplified - assuming 8 hours per day)
      const todayHours = (todayRecords.filter(r => r.action === 'clock-in').length +
                         todayRecords.filter(r => r.action === 'clock-out').length) * 4;
      const weeklyHours = weekRecords.length * 4; // Simplified calculation

      // Get last activity
      const lastRecord = userRecords.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];

      return {
        user,
        totalRecords: userRecords.length,
        thisWeekRecords: weekRecords.length,
        todayRecords: todayRecords.length,
        lastActivity: lastRecord ? new Date(lastRecord.timestamp).toLocaleDateString() : 'Never',
        weeklyHours,
        todayHours
      };
    }).filter(stats =>
      selectedUser === 'all' || stats.user._id === selectedUser
    ).filter(stats =>
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Attendance</h1>
          <p className="text-muted-foreground">Monitor user attendance and activity</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <AttendanceFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        selectedUser={selectedUser}
        onSelectedUserChange={setSelectedUser}
        selectedPeriod={selectedPeriod}
        onSelectedPeriodChange={setSelectedPeriod}
        users={users}
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
        attendance={attendance}
      />
    </div>
  );
}
