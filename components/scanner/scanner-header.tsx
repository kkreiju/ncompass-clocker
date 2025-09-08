'use client';

import { Camera, CameraOff } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface ScannerHeaderProps {
  scanning: boolean;
}

export function ScannerHeader({ scanning }: ScannerHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Attendance Scanner</h1>
        <p className="text-muted-foreground">Scan QR codes to record attendance</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={scanning ? "default" : "secondary"} className="gap-1">
          {scanning ? (
            <>
              <Camera className="h-3 w-3" />
              Scanning
            </>
          ) : (
            <>
              <CameraOff className="h-3 w-3" />
              Stopped
            </>
          )}
        </Badge>
      </div>
    </div>
  );
}
