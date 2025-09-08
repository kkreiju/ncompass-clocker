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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Activity, QrCode, Calculator } from "lucide-react"

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
  const router = useRouter();

  useEffect(() => {
    fetchAttendance();
    checkCurrentStatus();
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
    // Check if user is currently clocked in
    const lastRecord = attendance[attendance.length - 1];
    if (lastRecord && lastRecord.action === 'clock-in') {
      setCurrentStatus('clocked-in');
    } else {
      setCurrentStatus('clocked-out');
    }
  };

  const handleClockAction = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const action = currentStatus === 'clocked-in' ? 'clock-out' : 'clock-in';

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      if (data.success) {
        // Refresh attendance data
        fetchAttendance();
        setCurrentStatus(action === 'clock-in' ? 'clocked-in' : 'clocked-out');
      }
    } catch (error) {
      console.error('Error clocking in/out:', error);
    }
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayRecords = attendance.filter(record =>
      new Date(record.timestamp).toDateString() === today
    );

    const clockInRecord = todayRecords.find(record => record.action === 'clock-in');
    const clockOutRecord = todayRecords.find(record => record.action === 'clock-out');

    return {
      clockInTime: clockInRecord ? new Date(clockInRecord.timestamp).toLocaleTimeString() : null,
      clockOutTime: clockOutRecord ? new Date(clockOutRecord.timestamp).toLocaleTimeString() : null,
      totalRecords: todayRecords.length
    };
  };

  const stats = getTodayStats();

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
        {/* Status and Clock Action */}
        <div className="grid gap-4 md:grid-cols-2">
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
                <Button
                  onClick={handleClockAction}
                  className="w-full"
                  size="lg"
                >
                  {currentStatus === 'clocked-in' ? 'Clock Out' : 'Clock In'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Clock In:</span>
                  <span className="text-sm font-medium">{stats.clockInTime || 'Not yet'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Clock Out:</span>
                  <span className="text-sm font-medium">{stats.clockOutTime || 'Not yet'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Records:</span>
                  <span className="text-sm font-medium">{stats.totalRecords}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading activity...</p>
            ) : (
              <div className="space-y-2">
                {attendance.slice(0, 10).map((record) => (
                  <div key={record._id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <Badge variant={record.action === 'clock-in' ? 'default' : 'secondary'}>
                        {record.action}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {attendance.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No attendance records yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
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

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/rates')}>
            <CardContent className="p-6 text-center">
              <Calculator className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-semibold mb-1">Rate Calculator</h3>
              <p className="text-sm text-muted-foreground">Calculate employee pay rates</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
