'use client';

import { Camera, CameraOff } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ScannerControlsProps {
  scanning: boolean;
  loading: boolean;
  onStartScanning: () => void;
  onStopScanning: () => void;
}

export function ScannerControls({
  scanning,
  loading,
  onStartScanning,
  onStopScanning
}: ScannerControlsProps) {
  return (
    <div className="flex gap-2">
      {!scanning && !loading && (
        <Button
          onClick={onStartScanning}
          className="flex-1 gap-2"
        >
          <Camera className="h-4 w-4" />
          Start Scanning
        </Button>
      )}

      {scanning && (
        <Button
          onClick={onStopScanning}
          variant="outline"
          className="flex-1 gap-2"
        >
          <CameraOff className="h-4 w-4" />
          Stop Scanning
        </Button>
      )}
    </div>
  );
}
