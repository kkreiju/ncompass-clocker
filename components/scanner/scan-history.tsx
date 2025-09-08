'use client';

import { Clock, CheckCircle, XCircle, ScanLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ScanResult {
  qrCode: string;
  timestamp: number;
  success: boolean;
  message: string;
  action?: 'clock-in' | 'clock-out';
}

interface ScanHistoryProps {
  scanHistory: ScanResult[];
  onClearHistory: () => void;
}

export function ScanHistory({ scanHistory, onClearHistory }: ScanHistoryProps) {
  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Scans ({scanHistory.length})
          </CardTitle>
          {scanHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearHistory}
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {scanHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ScanLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No scans yet</p>
            <p className="text-sm">Scan a QR code to see history here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-170 overflow-y-auto">
            {scanHistory.map((scan, index) => (
              <div key={`${scan.timestamp}-${index}`} className="p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(scan.success)}
                    <span className={`text-sm font-medium ${getStatusColor(scan.success)}`}>
                      {scan.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(scan.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{scan.message}</p>
                {scan.action && (
                  <Badge variant="outline" className="text-xs">
                    {scan.action === 'clock-in' ? 'Clock In' : 'Clock Out'}
                  </Badge>
                )}
                <Separator className="my-2" />
                <p className="font-mono text-xs break-all bg-background p-2 rounded border">
                  {scan.qrCode.length > 30 ? `${scan.qrCode.substring(0, 30)}...` : scan.qrCode}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
