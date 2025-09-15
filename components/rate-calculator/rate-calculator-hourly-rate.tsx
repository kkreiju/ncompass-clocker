'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

interface RateCalculatorHourlyRateProps {
  hourlyRate: string;
  onHourlyRateChange: (rate: string) => void;
}

export function RateCalculatorHourlyRate({
  hourlyRate,
  onHourlyRateChange,
}: RateCalculatorHourlyRateProps) {
  return (
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
  );
}
