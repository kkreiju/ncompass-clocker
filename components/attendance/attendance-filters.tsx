'use client';

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Search, X, Filter } from "lucide-react";

interface AttendanceFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedPeriod: 'today' | 'week' | 'month';
  onSelectedPeriodChange: (value: 'today' | 'week' | 'month') => void;
}

export function AttendanceFilters({
  searchTerm,
  onSearchTermChange,
  selectedPeriod,
  onSelectedPeriodChange
}: AttendanceFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-end">
        {/* Search Section */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          {/* Search Input Container */}
          <div className="flex gap-2 sm:gap-3 items-end">
            {/* Search Input */}
            <div className="flex-1 relative">
              {/* Search Icon */}
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>

              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10 pr-10 h-11 sm:h-12 text-sm sm:text-base bg-background border-2 focus:border-primary/50 transition-colors"
              />

              {/* Clear Button */}
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-muted"
                  onClick={() => onSearchTermChange("")}
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>

            {/* Filter Button - Mobile Layout */}
            <div className="flex-shrink-0 sm:hidden">
              <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 w-11 p-0 hover:bg-muted transition-colors"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="sr-only">Open filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Filter attendance records by time period
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-6 px-6 pb-6">
                    {/* Time Period Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="period-select">Time Period</Label>
                      <Select value={selectedPeriod} onValueChange={onSelectedPeriodChange}>
                        <SelectTrigger id="period-select" className="w-full">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clear Filters */}
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          onSelectedPeriodChange("today");
                        }}
                      >
                        Reset Period
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Search Results Info */}
          {searchTerm && (
            <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Search className="h-3 w-3" />
              <span>Searching for "{searchTerm}"</span>
            </div>
          )}
        </div>

        {/* Filter Button - Desktop Layout */}
        <div className="hidden sm:flex flex-shrink-0">
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 lg:h-11 lg:w-11 xl:h-12 xl:w-12 p-0 hover:bg-muted transition-colors"
              >
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
                <span className="sr-only">Open filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Filter attendance records by time period
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-6 pb-6">
                {/* Time Period Filter */}
                <div className="space-y-2">
                  <Label htmlFor="period-select">Time Period</Label>
                  <Select value={selectedPeriod} onValueChange={onSelectedPeriodChange}>
                    <SelectTrigger id="period-select" className="w-full">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      onSelectedPeriodChange("today");
                    }}
                  >
                    Reset Period
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
