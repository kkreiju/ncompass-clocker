'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Calculator, Calendar, DollarSign, User, Check, ChevronsUpDown, Search } from "lucide-react";
import { type DateRange } from "react-day-picker";
import Calendar04 from "./calendar-04";

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface RateCalculatorFormProps {
  users: User[];
  selectedUser: string;
  dateRange: DateRange | undefined;
  hourlyRate: string;
  onUserChange: (userId: string) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onHourlyRateChange: (rate: string) => void;
}

export function RateCalculatorForm({
  users,
  selectedUser,
  dateRange,
  hourlyRate,
  onUserChange,
  onDateRangeChange,
  onHourlyRateChange,
}: RateCalculatorFormProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUserData = users.find(user => user._id === selectedUser);

  return (
    <div className="bg-muted/30 rounded-lg border p-6 space-y-6 h-fit">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/50">
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
          <Calculator className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Rate Calculator</h3>
          <p className="text-sm text-muted-foreground">Configure calculation parameters</p>
        </div>
      </div>

      {/* Employee Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-md">
            <User className="h-4 w-4 text-primary" />
          </div>
          <Label className="text-sm font-medium">Select Employee</Label>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="h-11 w-full justify-between"
            >
              {selectedUserData ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">
                    {selectedUserData.name} ({selectedUserData.email})
                  </span>
                </div>
              ) : (
                "Choose an employee..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
            <ScrollArea className="h-48">
              <div className="p-1">
                {filteredUsers.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No employees found.
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-muted cursor-pointer"
                      onClick={() => {
                        onUserChange(user._id);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{user.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                      </div>
                      {selectedUser === user._id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Date Range and Hourly Rate - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date Range Calendar */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-md">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <Label className="text-sm font-medium">Select Date Range</Label>
          </div>
          <div className="flex justify-center p-4 bg-background/50 rounded-lg border">
            <Calendar04
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
            />
          </div>
          {dateRange?.from && dateRange?.to && (
            <div className="flex items-center justify-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Hourly Rate */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-md">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <Label htmlFor="hourly-rate" className="text-sm font-medium">Hourly Rate (PHP)</Label>
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="hourly-rate"
              type="number"
              value={hourlyRate}
              onChange={(e) => onHourlyRateChange(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="h-11 pl-10"
            />
          </div>

          {/* Spacer to align with calendar height */}
          <div className="h-12"></div>
        </div>
      </div>
    </div>
  );
}
