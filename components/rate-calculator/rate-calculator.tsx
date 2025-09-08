'use client';

import { useState, useEffect } from 'react';
import { RateCalculatorForm } from './rate-calculator-form';
import { RateCalculatorResults } from './rate-calculator-results';
import { useUsers } from '../../hooks/use-users';
import { type DateRange } from "react-day-picker";

interface AttendanceRecord {
  _id: string;
  userName: string;
  userEmail: string;
  action: 'clock-in' | 'clock-out';
  timestamp: string;
}

interface RateCalculation {
  totalHours: number;
  totalPay: number;
  workingDays: number;
}

export function RateCalculator() {
  const { users, loading: usersLoading } = useUsers();

  // Form state
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [hourlyRate, setHourlyRate] = useState<string>('');

  // Calculation state
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [calculation, setCalculation] = useState<RateCalculation | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch attendance data on component mount
  useEffect(() => {
    fetchAttendance();
  }, []);

  // Auto-calculate when all fields are filled
  useEffect(() => {
    if (selectedUser && dateRange?.from && dateRange?.to && hourlyRate && parseFloat(hourlyRate) > 0 && attendance.length > 0) {
      calculateRate();
    } else {
      setCalculation(null);
    }
  }, [selectedUser, dateRange, hourlyRate, attendance]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch('/api/attendance', {
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

  const calculateRate = () => {
    try {
      if (!dateRange?.from || !dateRange?.to) return;

      // Create start and end date objects for proper comparison
      const startDateTime = new Date(dateRange.from);
      startDateTime.setHours(0, 0, 0, 0); // Start of start date

      const endDateTime = new Date(dateRange.to);
      endDateTime.setHours(23, 59, 59, 999); // End of end date

      const userAttendance = attendance.filter(record => {
        const recordDate = new Date(record.timestamp);
        return record.userEmail === users.find(u => u._id === selectedUser)?.email &&
               recordDate >= startDateTime &&
               recordDate <= endDateTime;
      });

      // Group records by date
      const dateGroups: { [date: string]: AttendanceRecord[] } = {};
      userAttendance.forEach(record => {
        const date = new Date(record.timestamp).toDateString();
        if (!dateGroups[date]) {
          dateGroups[date] = [];
        }
        dateGroups[date].push(record);
      });

      let totalHours = 0;
      let workingDays = 0;

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
          workingDays++;
        }
      });

      const hourlyRateNum = parseFloat(hourlyRate);
      const totalPay = totalHours * hourlyRateNum;

      setCalculation({
        totalHours: Math.round(totalHours * 100) / 100,
        totalPay: Math.round(totalPay * 100) / 100,
        workingDays
      });
    } catch (error) {
      console.error('Rate calculation error:', error);
      setCalculation(null);
    }
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading rate calculator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rate Calculator</h1>
          <p className="text-muted-foreground">
            Calculate employee pay based on attendance records and hourly rates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RateCalculatorForm
          users={users}
          selectedUser={selectedUser}
          dateRange={dateRange}
          hourlyRate={hourlyRate}
          onUserChange={setSelectedUser}
          onDateRangeChange={setDateRange}
          onHourlyRateChange={setHourlyRate}
        />

        <RateCalculatorResults
          calculation={calculation}
          selectedUser={selectedUser}
          dateRange={dateRange}
          hourlyRate={hourlyRate}
          users={users}
        />
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Calculating...</p>
        </div>
      )}
    </div>
  );
}
