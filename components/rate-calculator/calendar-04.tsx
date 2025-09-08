"use client"

import * as React from "react"
import { type DateRange } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"

interface Calendar04Props {
  dateRange?: DateRange | undefined;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

export default function Calendar04({ dateRange, onDateRangeChange }: Calendar04Props) {
  const handleSelect = (range: DateRange | undefined) => {
    if (onDateRangeChange) {
      onDateRangeChange(range);
    }
  };

  return (
    <Calendar
      mode="range"
      defaultMonth={dateRange?.from}
      selected={dateRange}
      onSelect={handleSelect}
      className="rounded-lg border shadow-sm"
      numberOfMonths={1}
    />
  )
}
