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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { LeaveForm } from "@/components/leaves/leave-form";
import { Plus, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Leave {
  _id: string;
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

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/leaves', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaves(data.leaves);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

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

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };


  const pendingLeaves = leaves.filter(leave => leave.status === 'pending').length;
  const approvedLeaves = leaves.filter(leave => leave.status === 'approved').length;
  const rejectedLeaves = leaves.filter(leave => leave.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading...
      </div>
    );
  }

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
                <BreadcrumbPage>Leaves</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Leaves</h1>
            <p className="text-muted-foreground">
              Manage your leave requests and track their status
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Request Leave
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingLeaves}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedLeaves}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedLeaves}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Requests ({leaves.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingLeaves})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedLeaves})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedLeaves})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <LeaveList leaves={leaves} onRefresh={fetchLeaves} />
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <LeaveList leaves={leaves.filter(leave => leave.status === 'pending')} onRefresh={fetchLeaves} />
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <LeaveList leaves={leaves.filter(leave => leave.status === 'approved')} onRefresh={fetchLeaves} />
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <LeaveList leaves={leaves.filter(leave => leave.status === 'rejected')} onRefresh={fetchLeaves} />
          </TabsContent>
        </Tabs>

        {showForm && (
          <LeaveForm
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              fetchLeaves();
            }}
          />
        )}
      </div>
    </>
  );
}

function LeaveList({ leaves, onRefresh }: { leaves: Leave[], onRefresh: () => void }) {
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

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (leaves.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No leave requests found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leaves.map((leave) => (
        <Card key={leave._id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg">{getTypeBadge(leave.type)}</CardTitle>
                <CardDescription className="mt-2">
                  {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  <span className="ml-2">({calculateDays(leave.startDate, leave.endDate)} {calculateDays(leave.startDate, leave.endDate) > 1 ? "days" : "day"})</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(leave.status)}
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
                        Submitted on {formatDate(leave.createdAt)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
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
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">{getStatusBadge(leave.status)}</div>
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {leave.reason}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
