'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

interface User {
  _id: string;
  name: string;
  email: string;
  profileURL?: string;
  createdAt: string;
}

interface AttendanceRecord {
  _id: string;
  userName: string;
  userEmail: string;
  action: 'clock-in' | 'clock-out';
  timestamp: string;
}

interface AttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: User | null;
}

export function AttendanceHistoryModal({
  isOpen,
  onClose,
  selectedUser
}: AttendanceHistoryModalProps) {
  const [userAttendance, setUserAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMonths, setHasMoreMonths] = useState(true);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  const router = useRouter();

  // Load initial attendance data when modal opens
  useEffect(() => {
    if (isOpen && selectedUser) {
      loadInitialAttendance();
    } else if (!isOpen) {
      // Reset state when modal closes
      setUserAttendance([]);
      setCurrentMonthOffset(0);
      setHasMoreMonths(true);
    }
  }, [isOpen, selectedUser]);

  const loadInitialAttendance = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      // Load current month first
      await loadAttendanceForMonth(0);
    } catch (error) {
      console.error('Error loading initial attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForMonth = async (monthOffset: number) => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
        return;
      }

      // Calculate the target month/year
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - monthOffset);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      const response = await fetch(`/api/attendance?month=${month}&year=${year}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Filter records for the selected user
        const userRecords = data.attendance.filter((record: AttendanceRecord) =>
          record.userEmail === selectedUser.email
        );

        if (monthOffset === 0) {
          // Initial load - replace existing records
          setUserAttendance(userRecords);
        } else {
          // Loading more - append to existing records
          setUserAttendance(prev => [...prev, ...userRecords]);
        }

        // Check if there are more months to load (stop if we go back more than 2 years)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        setHasMoreMonths(targetDate > twoYearsAgo);
      }
    } catch (error) {
      console.error('Error loading attendance for month:', error);
    }
  };

  const loadMoreMonths = async () => {
    setLoadingMore(true);
    try {
      const nextOffset = currentMonthOffset + 1;

      // Load the month data
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
        return;
      }

      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - nextOffset);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      const response = await fetch(`/api/attendance?month=${month}&year=${year}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Filter records for the selected user
        const userRecords = data.attendance.filter((record: AttendanceRecord) =>
          record.userEmail === selectedUser?.email
        );

        // Only append records and increment offset if there are records found
        if (userRecords.length > 0) {
          setUserAttendance(prev => [...prev, ...userRecords]);
          setCurrentMonthOffset(nextOffset);

          // Check if there are more months to load (stop if we go back more than 2 years)
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
          setHasMoreMonths(targetDate > twoYearsAgo);
        } else {
          // Show toast if no records found for this month and don't increment offset
          const monthName = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });
          toast.info(`No attendance records found for ${monthName}`, {
            style: { fontFamily: 'var(--font-poppins)' }
          });
        }
      }
    } catch (error) {
      console.error('Error loading more months:', error);
    } finally {
      setLoadingMore(false);
    }
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
    // Check if user has a profileURL field
    if (user.profileURL && user.profileURL.trim() !== '') {
      return user.profileURL;
    }

    // Default to no avatar (will show initials)
    return undefined;
  };

  const getUserDetailedAttendance = () => {
    return userAttendance
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {selectedUser && (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarPath(selectedUser)} alt={selectedUser.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <span>{selectedUser.name}'s Attendance History</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {selectedUser && (
          <div className="space-y-4">
            {/* Attendance Records Table */}
            <div className="border rounded-lg">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading attendance records...</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getUserDetailedAttendance().map((record) => (
                        <TableRow key={record._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {record.action === 'clock-in' ? (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              ) : (
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                              <span className="capitalize">{record.action.replace('-', ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(record.timestamp).toLocaleString([], {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              record.action === 'clock-in'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {record.action === 'clock-in' ? 'In' : 'Out'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Load More Button */}
                  {hasMoreMonths && (
                    <div className="p-4 border-t">
                      <Button
                        onClick={loadMoreMonths}
                        disabled={loadingMore}
                        variant="outline"
                        className="w-full"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading more records...
                          </>
                        ) : (
                          `Load Previous Month (${new Date(new Date().getFullYear(), new Date().getMonth() - currentMonthOffset - 1).toLocaleString('default', { month: 'long', year: 'numeric' })})`
                        )}
                      </Button>
                    </div>
                  )}

                  {getUserDetailedAttendance().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No attendance records found for this user.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
