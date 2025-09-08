'use client';

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AttendanceFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedUser: string;
  onSelectedUserChange: (value: string) => void;
  selectedPeriod: 'today' | 'week' | 'month';
  onSelectedPeriodChange: (value: 'today' | 'week' | 'month') => void;
  users: User[];
}

export function AttendanceFilters({
  searchTerm,
  onSearchTermChange,
  selectedUser,
  onSelectedUserChange,
  selectedPeriod,
  onSelectedPeriodChange,
  users
}: AttendanceFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center bg-muted/30 px-6 py-4 rounded-lg border">
      {/* Filter Icon */}
      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-md flex-shrink-0">
        <Filter className="h-4 w-4 text-primary" />
      </div>

      {/* Search Bar - Made larger by removing max-width constraint */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* User Filter */}
      <div className="w-[160px] flex-shrink-0">
        <Select value={selectedUser} onValueChange={onSelectedUserChange}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user._id} value={user._id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Period */}
      <div className="w-[130px] flex-shrink-0">
        <Select value={selectedPeriod} onValueChange={onSelectedPeriodChange}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
