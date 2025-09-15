'use client';

import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { type DateRange } from "react-day-picker";
import Calendar04 from "./calendar-04";

interface RateCalculatorDateRangeProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function RateCalculatorDateRange({
  dateRange,
  onDateRangeChange,
}: RateCalculatorDateRangeProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-md">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
        <Label className="text-sm font-medium">Select Date Range</Label>
      </div>
      <div className="flex justify-center">
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
  );
}
