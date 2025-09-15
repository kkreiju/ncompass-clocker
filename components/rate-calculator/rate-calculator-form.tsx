'use client';

import { Calculator } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { RateCalculatorEmployeeSelector } from "./rate-calculator-employee-selector";
import { RateCalculatorDateRange } from "./rate-calculator-date-range";
import { RateCalculatorHourlyRate } from "./rate-calculator-hourly-rate";

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

      {/* Employee Selection and Date Range - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Selection */}
        <RateCalculatorEmployeeSelector
          users={users}
          selectedUser={selectedUser}
          onUserChange={onUserChange}
        />

        {/* Date Range Calendar */}
        <RateCalculatorDateRange
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
      </div>

      {/* Hourly Rate */}
      <RateCalculatorHourlyRate
        hourlyRate={hourlyRate}
        onHourlyRateChange={onHourlyRateChange}
      />
    </div>
  );
}
