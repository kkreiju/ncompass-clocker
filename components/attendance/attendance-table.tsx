'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Users, Clock, Eye, AlertCircle } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

interface UserAttendanceStats {
  user: User;
  totalRecords: number;
  thisWeekRecords: number;
  todayRecords: number;
  lastActivity: string;
  weeklyHours: number;
  todayHours: number;
}

interface AttendanceTableProps {
  userStats: UserAttendanceStats[];
  loading: boolean;
  selectedPeriod: 'today' | 'week' | 'month';
  onViewHistory: (user: User) => void;
}

export function AttendanceTable({
  userStats,
  loading,
  selectedPeriod,
  onViewHistory
}: AttendanceTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarPath = (user: User) => {
    // Check if user has an avatar field
    if (user.avatar) {
      return user.avatar;
    }

    // Map user names to profile pictures
    const nameLower = user.name.toLowerCase();
    if (nameLower.includes('saguisa')) {
      return '/user-profile/saguisa.png';
    }
    if (nameLower.includes('albores')) {
      return '/user-profile/albores.png';
    }
    if (nameLower.includes('bernabe')) {
      return '/user-profile/bernabe.png';
    }
    if (nameLower.includes('busal')) {
      return '/user-profile/busal.png';
    }
    if (nameLower.includes('claro')) {
      return '/user-profile/claro.png';
    }
    if (nameLower.includes('mendez')) {
      return '/user-profile/mendez.png';
    }
    if (nameLower.includes('rubica')) {
      return '/user-profile/rubica.png';
    }

    // Default to no avatar (will show initials)
    return '';
  };

  // Calculate pagination
  const totalPages = Math.ceil(userStats.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUserStats = userStats.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="text-lg sm:text-xl">User Attendance ({userStats.length})</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Page {currentPage} of {totalPages || 1}
            </div>
          </CardTitle>
        </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/5"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <div className="w-full sm:w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : userStats.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No users found. Try adjusting your search or filters.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {currentUserStats.map((stats) => (
              <div key={stats.user._id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Avatar className="h-12 w-12 border-2 border-background flex-shrink-0">
                    <AvatarImage src={getAvatarPath(stats.user)} alt={stats.user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(stats.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base truncate">
                      {stats.user.name}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{stats.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Last activity: {stats.lastActivity}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center sm:justify-end">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="text-center sm:text-right">
                      {selectedPeriod === 'today' ? `${stats.todayHours}h today` :
                       selectedPeriod === 'week' ? `${stats.weeklyHours}h this week` :
                       `${stats.totalRecords} records`}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewHistory(stats.user)}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sm:inline">View History</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Pagination */}
    {totalPages > 1 && (
      <div className="flex justify-center">
        <Pagination>
          <PaginationContent className="gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={`cursor-pointer ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
              />
            </PaginationItem>

            {/* Mobile: Show fewer page numbers */}
            <div className="hidden sm:flex">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNumber)}
                      isActive={currentPage === pageNumber}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
            </div>

            {/* Mobile: Show current page and total */}
            <div className="flex sm:hidden items-center px-2 text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </div>

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={`cursor-pointer ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )}
  </div>
  );
}
