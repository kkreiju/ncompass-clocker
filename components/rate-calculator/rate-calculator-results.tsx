'use client';

import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { type DateRange } from "react-day-picker";

interface RateCalculation {
  totalHours: number;
  totalPay: number;
  workingDays: number;
}

interface RateCalculatorResultsProps {
  calculation: RateCalculation | null;
  selectedUser: string;
  dateRange: DateRange | undefined;
  hourlyRate: string;
  users: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
}

export function RateCalculatorResults({
  calculation,
  selectedUser,
  dateRange,
  hourlyRate,
  users,
}: RateCalculatorResultsProps) {
  const selectedUserData = users.find(user => user._id === selectedUser);

  if (!calculation) {
    return (
      <div className="bg-muted/30 rounded-lg border p-6 space-y-6 h-fit">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border/50">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Calculation Results</h3>
            <p className="text-sm text-muted-foreground">View your rate calculation summary</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-muted/50 rounded-lg mb-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No Calculation Yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Fill in all fields above to see automatic rate calculation results
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-lg border p-6 space-y-6 h-fit">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/50">
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Calculation Results</h3>
          <p className="text-sm text-muted-foreground">View your rate calculation summary</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">
              {calculation.workingDays}
            </div>
            <div className="text-xs text-muted-foreground">
              Working Days
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">
              {calculation.totalHours.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Hours
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium">Working Days</span>
            <Badge variant="secondary">{calculation.workingDays} day{calculation.workingDays !== 1 ? 's' : ''}</Badge>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium">Total Hours</span>
            <span className="font-semibold">{calculation.totalHours.toFixed(2)} hrs</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium">Hourly Rate</span>
            <span className="font-semibold">PHP {parseFloat(hourlyRate).toFixed(2)}</span>
          </div>

          {/* Total Pay - Highlighted */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mt-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">Total Pay</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                PHP {calculation.totalPay.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Period Summary */}
        <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Period:</span>
          </div>
          <p>
            {dateRange?.from?.toLocaleDateString()} - {dateRange?.to?.toLocaleDateString()}
          </p>

          {selectedUserData && (
            <>
              <div className="flex items-center gap-2 mt-2 mb-1">
                <span className="font-medium">Employee:</span>
              </div>
              <p>{selectedUserData.name} ({selectedUserData.email})</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
