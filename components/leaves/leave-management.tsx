'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaveTable, LeaveFilters, LeaveForm } from '.';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Leave {
  _id: string;
  userId: string;
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

export function LeaveManagement() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchLeaves = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const userToken = localStorage.getItem('userToken');
      const token = adminToken || userToken;

      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      // Set admin status based on which token is present
      setIsAdmin(!!adminToken);

      const response = await fetch('/api/leaves', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaves(data.leaves);
        setFilteredLeaves(data.leaves);
      } else {
        console.error('Failed to fetch leaves:', response.status, response.statusText);
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

  useEffect(() => {
    let filtered = leaves;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(leave => leave.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(leave => leave.type === typeFilter);
    }

    setFilteredLeaves(filtered);
  }, [leaves, statusFilter, typeFilter]);

  const handleStatusUpdate = async (leaveId: string, status: 'approved' | 'rejected', adminComments?: string) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch('/api/leaves', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leaveId,
          status,
          adminComments,
        }),
      });

      if (response.ok) {
        await fetchLeaves(); // Refresh the list
      } else {
        console.error('Failed to update leave status:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error updating leave status:', error);
    }
  };

  const pendingLeaves = leaves.filter(leave => leave.status === 'pending').length;
  const approvedLeaves = leaves.filter(leave => leave.status === 'approved').length;
  const rejectedLeaves = leaves.filter(leave => leave.status === 'rejected').length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">
            Manage employee leave requests and approvals
          </p>
        </div>
        {!isAdmin && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Request Leave
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
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

        <LeaveFilters
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          onStatusChange={setStatusFilter}
          onTypeChange={setTypeFilter}
        />

        <TabsContent value="all" className="space-y-4">
          <LeaveTable leaves={filteredLeaves} onStatusUpdate={handleStatusUpdate} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <LeaveTable
            leaves={filteredLeaves.filter(leave => leave.status === 'pending')}
            onStatusUpdate={handleStatusUpdate}
          />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <LeaveTable
            leaves={filteredLeaves.filter(leave => leave.status === 'approved')}
            onStatusUpdate={handleStatusUpdate}
          />
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <LeaveTable
            leaves={filteredLeaves.filter(leave => leave.status === 'rejected')}
            onStatusUpdate={handleStatusUpdate}
          />
        </TabsContent>
      </Tabs>

      {showForm && !isAdmin && (
        <LeaveForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchLeaves();
          }}
        />
      )}
    </div>
  );
}
