'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Leave {
  _id: string;
  userId: string | { profileURL?: string }; // Can be string or populated object
  userName: string;
  userEmail: string;
  userProfileURL?: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComments?: string;
  reviewedBy?: {
    _id: string;
    name: string;
  };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface LeaveTableProps {
  leaves: Leave[];
  onStatusUpdate: (leaveId: string, status: 'approved' | 'rejected', adminComments?: string) => void;
}

export function LeaveTable({ leaves, onStatusUpdate }: LeaveTableProps) {
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [adminComments, setAdminComments] = useState('');
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      vacation: 'bg-blue-100 text-blue-800',
      sick: 'bg-orange-100 text-orange-800',
      personal: 'bg-purple-100 text-purple-800',
      emergency: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge variant="secondary" className={typeColors[type] || typeColors.other}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const handleAction = (leave: Leave, action: 'approved' | 'rejected') => {
    setSelectedLeave(leave);
    setActionType(action);
    setAdminComments('');
  };

  const confirmAction = () => {
    if (selectedLeave && actionType) {
      onStatusUpdate(selectedLeave._id, actionType, adminComments.trim() || undefined);
      setSelectedLeave(null);
      setActionType(null);
      setAdminComments('');
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    return diffDays;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarPath = (leave: Leave) => {
    // First, try to get from the stored userProfileURL field
    if (leave.userProfileURL && leave.userProfileURL.trim() !== '') {
      return leave.userProfileURL;
    }

    // Fallback: Try to get from populated userId.profileURL
    const userId = (leave as any).userId;
    if (userId && userId.profileURL && userId.profileURL.trim() !== '') {
      return userId.profileURL;
    }

    // Default to no avatar (will show initials)
    return undefined;
  };

  if (leaves.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No leave requests found.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.map((leave) => (
              <TableRow key={leave._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border-2 border-background flex-shrink-0">
                      <AvatarImage src={getAvatarPath(leave)} alt={leave.userName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {getInitials(leave.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{leave.userName}</div>
                      <div className="text-sm text-muted-foreground truncate">{leave.userEmail}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getTypeBadge(leave.type)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </div>
                </TableCell>
                <TableCell>{calculateDays(leave.startDate, leave.endDate)}</TableCell>
                <TableCell>{getStatusBadge(leave.status)}</TableCell>
                <TableCell>{formatDate(leave.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Leave Request Details</DialogTitle>
                          <DialogDescription>
                            Request from {leave.userName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-background flex-shrink-0">
                              <AvatarImage src={getAvatarPath(leave)} alt={leave.userName} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {getInitials(leave.userName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{leave.userName}</div>
                              <div className="text-sm text-muted-foreground">{leave.userEmail}</div>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Type</Label>
                            <div className="mt-1">{getTypeBadge(leave.type)}</div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Duration</Label>
                            <div className="mt-1 text-sm">
                              {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                              <span className="ml-2 text-muted-foreground">
                                ({calculateDays(leave.startDate, leave.endDate)} days)
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Reason</Label>
                            <div className="mt-1 text-sm bg-muted p-3 rounded-md">
                              {leave.reason}
                            </div>
                          </div>
                          {leave.adminComments && (
                            <div>
                              <Label className="text-sm font-medium">Admin Comments</Label>
                              <div className="mt-1 text-sm bg-muted p-3 rounded-md">
                                {leave.adminComments}
                              </div>
                            </div>
                          )}
                          {leave.reviewedBy && (
                            <div>
                              <Label className="text-sm font-medium">Reviewed by</Label>
                              <div className="mt-1 text-sm">
                                {leave.reviewedBy.name} on {leave.reviewedAt ? formatDate(leave.reviewedAt) : 'N/A'}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {leave.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleAction(leave, 'approved')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleAction(leave, 'rejected')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedLeave} onOpenChange={() => setSelectedLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approved' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
            <DialogDescription>
              {selectedLeave && (
                <>
                  {actionType === 'approved' ? 'Approve' : 'Reject'} leave request from {selectedLeave.userName}
                  <br />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comments">Admin Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Add any comments for this decision..."
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLeave(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              className={actionType === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {actionType === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
