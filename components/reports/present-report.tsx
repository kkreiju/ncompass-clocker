'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, Clock, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface User {
  _id: string;
  name: string;
  email: string;
  profileURL?: string;
}

interface AttendanceRecord {
  _id: string;
  userName: string;
  userEmail: string;
  action: 'clock-in' | 'clock-out';
  timestamp: string;
}

interface UserStatus {
  user: User;
  status: 'present' | 'absent';
  totalTime: number; // in minutes
  isCurrentlyClockedIn: boolean;
  lastClockIn?: Date;
  formattedTime: string;
  workplace?: 'office' | 'home';
}

export function PresentReport() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  // Update current time every minute for live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPresentData();
  }, [selectedDate]);

  const fetchPresentData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
        return;
      }

      const dateStr = selectedDate.toLocaleDateString('en-CA');

      const response = await fetch(
        `/api/reports/present?date=${dateStr}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        // Sort user statuses alphabetically by name
        const sortedStatuses = data.userStatuses.sort((a: any, b: any) =>
          a.user.name.toLowerCase().localeCompare(b.user.name.toLowerCase())
        );
        setUserStatuses(sortedStatuses);
      }
    } catch (error) {
      console.error('Error fetching present data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes}m`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    if (status.status === 'absent') {
      return (
        <Badge variant="destructive" className="w-24 justify-center">
          <UserX className="w-3 h-3 mr-1" />
          Absent
        </Badge>
      );
    }

    if (status.isCurrentlyClockedIn) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 w-24 justify-center">
          <Clock className="w-3 h-3 mr-1" />
          Clocked In
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 w-24 justify-center">
        <UserCheck className="w-3 h-3 mr-1" />
        Present
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarPath = (user: User) => {
    if (user.profileURL && user.profileURL.trim() !== '') {
      return user.profileURL;
    }
    return undefined;
  };

  const presentCount = userStatuses.filter(status => status.status === 'present').length;
  const absentCount = userStatuses.filter(status => status.status === 'absent').length;
  const clockedInCount = userStatuses.filter(status => status.isCurrentlyClockedIn).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStatuses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Clocked In</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clockedInCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
          <CardDescription>Choose the date to view attendance status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Status</CardTitle>
          <CardDescription>
            Employee attendance status for {selectedDate.toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading attendance data...</div>
            </div>
          ) : userStatuses.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No employee data available.</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Time</TableHead>
                  <TableHead>Workplace</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStatuses.map((status) => (
                  <TableRow key={status.user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-background">
                          <AvatarImage src={getAvatarPath(status.user)} alt={status.user.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                            {getInitials(status.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{status.user.name}</div>
                          <div className="text-sm text-muted-foreground">{status.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(status)}
                    </TableCell>
                    <TableCell>
                      {status.status === 'present' ? (
                        <div className="font-medium">
                          {status.isCurrentlyClockedIn ? (
                            <span className="text-green-600">{status.formattedTime}</span>
                          ) : (
                            status.formattedTime
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {status.workplace ? (
                        <Badge variant="outline">
                          {status.workplace === 'office' ? 'Office' : 'Home'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
