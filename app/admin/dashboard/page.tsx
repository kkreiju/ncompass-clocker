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
import { QuickActions, RecentActivity } from "@/components/dashboard"
import { Users as UsersIcon, Clock as ClockIcon, BarChart3 as BarChartIcon } from "lucide-react"

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AttendanceRecord {
  _id: string;
  userName: string;
  userEmail: string;
  action: 'clock-in' | 'clock-out';
  timestamp: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
    fetchAttendance();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
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


  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, or remove users',
      icon: UsersIcon,
      action: () => router.push('/admin/people'),
      color: 'bg-gradient-to-br from-violet-500 to-purple-600'
    },
    {
      title: 'View Attendance',
      description: 'Monitor attendance records',
      icon: ClockIcon,
      action: () => router.push('/admin/attendance'),
      color: 'bg-gradient-to-br from-cyan-500 to-blue-600'
    },
    {
      title: 'Rate Calculator',
      description: 'Calculate employee pay rates',
      icon: BarChartIcon,
      action: () => router.push('/admin/rates'),
      color: 'bg-gradient-to-br from-amber-500 to-orange-600'
    }
  ];

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
                <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <QuickActions actions={quickActions} />
        <RecentActivity attendance={attendance} loading={loading} />
      </div>
    </>
  )
}