'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Clock,
  UserCheck,
  UserX,
  Activity,
  AlertCircle,
  RefreshCw
} from "lucide-react"

interface User {
  _id: string
  name: string
  email: string
  profileURL?: string
  createdAt: string
}

interface AttendanceRecord {
  _id: string
  userName: string
  userEmail: string
  action: 'clock-in' | 'clock-out'
  timestamp: string
}

interface RecentActivityProps {
  attendance: AttendanceRecord[]
  users: User[]
  loading: boolean
}

// Export the renderAllActivities function for external use
export const getAllActivitiesList = (attendance: AttendanceRecord[], users: User[]) => {
  // Helper functions needed for rendering
  const getActionIcon = (action: string) => {
    return action === 'clock-in' ? UserCheck : UserX
  }

  const getActionColor = (action: string) => {
    return action === 'clock-in'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarPath = (userEmail: string) => {
    const user = users.find(u => u.email === userEmail);
    if (user && user.profileURL && user.profileURL.trim() !== '') {
      return user.profileURL;
    }
    return undefined;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString()
  }

  const allActivities = attendance
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return {
    activities: allActivities,
    totalCount: allActivities.length,
    renderList: () => (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">All Activities</h3>
          <p className="text-sm text-muted-foreground">
            Total: {allActivities.length} activities
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto border rounded-lg">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[300px]">Employee</TableHead>
                <TableHead className="w-[120px]">Action</TableHead>
                <TableHead className="w-[140px] text-right">Time</TableHead>
                <TableHead className="w-[120px] text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allActivities.map((record) => {
                const ActionIcon = getActionIcon(record.action)
                return (
                  <TableRow key={record._id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-background">
                          <AvatarImage src={getAvatarPath(record.userEmail)} alt={record.userName} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                            {getInitials(record.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{record.userName}</p>
                          <p className="text-xs text-muted-foreground truncate">{record.userEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 ${getActionColor(record.action)}`}
                      >
                        <ActionIcon className="h-3 w-3 mr-1" />
                        {record.action === 'clock-in' ? 'Clock In' : 'Clock Out'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {new Date(record.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(record.timestamp)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-sm">
                        {new Date(record.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  };
};

export function RecentActivity({ attendance, users, loading }: RecentActivityProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [allAttendanceData, setAllAttendanceData] = useState<AttendanceRecord[]>([])
  const [loadingAllActivities, setLoadingAllActivities] = useState(false)
  const [allActivitiesLoaded, setAllActivitiesLoaded] = useState(false)

  // Function to load all attendance data from multiple months
  const loadAllAttendanceData = async () => {
    if (allActivitiesLoaded) return; // Already loaded

    setLoadingAllActivities(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      // Get data from the last 6 months to avoid loading too much data at once
      const allAttendance: AttendanceRecord[] = [];
      const currentDate = new Date();

      // Load data month by month, starting from current month going backwards
      for (let i = 0; i < 6; i++) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = targetDate.getMonth() + 1;
        const year = targetDate.getFullYear();
        const url = `/api/attendance?month=${month}&year=${year}`;

        try {
          const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.attendance) {
              allAttendance.push(...data.attendance);
            }
          }
        } catch (error) {
          console.warn(`Failed to load attendance data for ${month}/${year}:`, error);
        }
      }

      // Remove duplicates based on _id and sort by timestamp
      const uniqueAttendance = allAttendance.filter((record, index, self) =>
        index === self.findIndex(r => r._id === record._id)
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setAllAttendanceData(uniqueAttendance);
      setAllActivitiesLoaded(true);

    } catch (error) {
      console.error('Error loading all attendance data:', error);
    } finally {
      setLoadingAllActivities(false);
    }
  };

  const getActionIcon = (action: string) => {
    return action === 'clock-in' ? UserCheck : UserX
  }

  const getActionColor = (action: string) => {
    return action === 'clock-in'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarPath = (userEmail: string) => {
    console.log(`🔍 Looking up avatar for: "${userEmail}"`);
    // Find user by email to get profile URL (case-insensitive)
    const user = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
    if (user && user.profileURL && user.profileURL.trim() !== '') {
      console.log(`✅ Found profile for ${userEmail}: ${user.profileURL}`);
      return user.profileURL;
    }

    // Debug: Log when profile is not found
    if (user) {
      console.log(`❌ User ${userEmail} found but no profileURL:`, user.profileURL);
    } else {
      console.log(`❌ User ${userEmail} not found in users array. Available emails:`, users.map(u => u.email));
    }

    // Default to no avatar (will show initials)
    return undefined;
  };


  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    return date.toLocaleDateString()
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {showAllActivities ? 'All Activities' : 'Recent Activity'}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 pb-2">
        {loading || (showAllActivities && loadingAllActivities && allAttendanceData.length === 0) ? (
          <div className="p-4">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-border/50 last:border-b-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-[120px]">
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex-shrink-0 w-[100px]">
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex-shrink-0 w-[140px] text-right">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-12 ml-auto" />
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-6">
            <Alert className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No recent activity found. Attendance records will appear here once employees start clocking in/out.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Employee</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[140px] text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(showAllActivities ? (allAttendanceData.length > 0 ? allAttendanceData : attendance) : attendance.slice(0, 8)).map((record) => {
                  const ActionIcon = getActionIcon(record.action)
                  return (
                    <TableRow key={record._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-background">
                            <AvatarImage src={getAvatarPath(record.userEmail)} alt={record.userName} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                              {getInitials(record.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{record.userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{record.userEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-0.5 ${getActionColor(record.action)}`}
                        >
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {record.action === 'clock-in' ? 'In' : 'Out'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {formatTime(record.timestamp)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {attendance.length > 8 && (
              <div className="px-4 py-2 text-center border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80"
                  onClick={async () => {
                    if (!showAllActivities && !allActivitiesLoaded) {
                      // Load all activities data when first clicking "View all"
                      await loadAllAttendanceData();
                    }
                    setShowAllActivities(!showAllActivities);
                  }}
                  disabled={loadingAllActivities}
                >
                  {loadingAllActivities ? (
                    <>Loading all activities...</>
                  ) : showAllActivities ? (
                    `Show recent activities (${attendance.length > 8 ? '8' : attendance.length})`
                  ) : (
                    `View all activities${allActivitiesLoaded ? ` (${allAttendanceData.length})` : ''} →`
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
