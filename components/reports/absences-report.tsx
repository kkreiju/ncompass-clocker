'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, UserX } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Absence {
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  weekday: string;
}

export function AbsencesReport() {
  const [absences, setAbsences] = useState<Absence[]>([]);
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
      fetchAbsences();
    }
  }, [startDate, endDate]);

  const fetchAbsences = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
        return;
      }

      const startDateStr = startDate?.toLocaleDateString('en-CA');
      const endDateStr = endDate?.toLocaleDateString('en-CA');

      const response = await fetch(
        `/api/reports/absences?startDate=${startDateStr}&endDate=${endDateStr}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setAbsences(data.absences);
      }
    } catch (error) {
      console.error('Error fetching absences:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Group absences by user and count them
  const absencesByUser = absences.reduce((acc, absence) => {
    const key = absence.userId;
    if (!acc[key]) {
      acc[key] = {
        userName: absence.userName,
        userEmail: absence.userEmail,
        count: 0,
        absences: []
      };
    }
    acc[key].count++;
    acc[key].absences.push(absence);
    return acc;
  }, {} as Record<string, { userName: string; userEmail: string; count: number; absences: Absence[] }>);

  const totalAbsences = absences.length;
  const uniqueAbsentUsers = Object.keys(absencesByUser).length;
  const mostAbsentUser = Object.values(absencesByUser).reduce((prev, curr) =>
    curr.count > prev.count ? curr : prev, { count: 0, userName: '', userEmail: '', absences: [] });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAbsences}</div>
            <p className="text-xs text-muted-foreground">
              Instances this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Absent Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueAbsentUsers}</div>
            <p className="text-xs text-muted-foreground">
              Different employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Absences</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostAbsentUser.count}</div>
            <p className="text-xs text-muted-foreground">
              {mostAbsentUser.userName || 'No absences'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select the date range for the absences report</CardDescription>
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

      {/* Absences Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Absences</CardTitle>
            <CardDescription>
              Employees with no attendance records on weekdays (excluding weekends)
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
              <div className="text-muted-foreground">Loading absences...</div>
            </div>
          ) : absences.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No absences found for the selected period.</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absences.map((absence, index) => (
                  <TableRow key={`${absence.userId}-${absence.date}-${index}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{absence.userName}</div>
                        <div className="text-sm text-muted-foreground">{absence.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(absence.date)}</TableCell>
                    <TableCell>{absence.weekday}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        Absent
                      </Badge>
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
