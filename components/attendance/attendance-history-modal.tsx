'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock } from "lucide-react";

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
  attendance: AttendanceRecord[];
}

export function AttendanceHistoryModal({
  isOpen,
  onClose,
  selectedUser,
  attendance
}: AttendanceHistoryModalProps) {
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

  const getUserDetailedAttendance = (userEmail: string) => {
    return attendance
      .filter(record => record.userEmail === userEmail)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50); // Show last 50 records
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
            {/* User Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {getUserDetailedAttendance(selectedUser.email).length}
                </div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {getUserDetailedAttendance(selectedUser.email)
                    .filter(record => record.action === 'clock-in').length}
                </div>
                <div className="text-sm text-muted-foreground">Clock-ins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {getUserDetailedAttendance(selectedUser.email)
                    .filter(record => record.action === 'clock-out').length}
                </div>
                <div className="text-sm text-muted-foreground">Clock-outs</div>
              </div>
            </div>

            {/* Attendance Records Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getUserDetailedAttendance(selectedUser.email).map((record) => (
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

              {getUserDetailedAttendance(selectedUser.email).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records found for this user.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
