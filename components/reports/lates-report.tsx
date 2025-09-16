'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LateEntry {
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  clockInTime: Date;
  lateMinutes: number;
}

export function LatesReport() {
  const [lateEntries, setLateEntries] = useState<LateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const router = useRouter();

  useEffect(() => {
    // Set default date range (current week)
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1); // Monday of current week

    setStartDate(monday);
    setEndDate(today);
  }, []);

  // Validate date ranges
  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      setEndDate(startDate);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchLates();
    }
  }, [startDate, endDate]);

  const fetchLates = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
        return;
      }

      const startDateStr = startDate?.toLocaleDateString('en-CA');
      const endDateStr = endDate?.toLocaleDateString('en-CA');

      const response = await fetch(
        `/api/reports/lates?startDate=${startDateStr}&endDate=${endDateStr}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        // Convert clockInTime strings back to Date objects
        const processedData = data.lateEntries.map((entry: any) => ({
          ...entry,
          clockInTime: new Date(entry.clockInTime)
        }));
        setLateEntries(processedData);
      }
    } catch (error) {
      console.error('Error fetching lates:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatLateTime = (minutes: number) => {
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

  const getLateSeverity = (minutes: number) => {
    if (minutes <= 30) return { color: 'bg-yellow-100 text-yellow-800', label: 'Minor' };
    if (minutes <= 60) return { color: 'bg-orange-100 text-orange-800', label: 'Moderate' };
    return { color: 'bg-red-100 text-red-800', label: 'Severe' };
  };

  const totalLateMinutes = lateEntries.reduce((sum, entry) => sum + entry.lateMinutes, 0);
  const uniqueLateUsers = new Set(lateEntries.map(entry => entry.userId)).size;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Late Entries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lateEntries.length}</div>
            <p className="text-xs text-muted-foreground">
              Instances this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Late Users</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueLateUsers}</div>
            <p className="text-xs text-muted-foreground">
              Different employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Late Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLateTime(totalLateMinutes)}</div>
            <p className="text-xs text-muted-foreground">
              Cumulative lateness
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select the date range for the late entries report</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Late Entries Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Late Entries</CardTitle>
            <CardDescription>
              Employees who clocked in after 10:00 AM
            </CardDescription>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading late entries...</div>
            </div>
          ) : lateEntries.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No late entries found for the selected period.</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In Time</TableHead>
                  <TableHead>Late Time</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lateEntries.map((entry, index) => {
                  const severity = getLateSeverity(entry.lateMinutes);
                  return (
                    <TableRow key={`${entry.userId}-${entry.date}-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.userName}</div>
                          <div className="text-sm text-muted-foreground">{entry.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>{formatTime(entry.clockInTime)}</TableCell>
                      <TableCell>{formatLateTime(entry.lateMinutes)}</TableCell>
                      <TableCell>
                        <Badge className={severity.color}>
                          {severity.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
