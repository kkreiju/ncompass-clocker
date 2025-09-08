'use client';

import { Clock } from 'lucide-react';

interface ScannerResultProps {
  result: string;
}

export function ScannerResult({ result }: ScannerResultProps) {
  if (!result) return null;

  return (
    <div className="p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Scanned QR Code</span>
      </div>
      <p className="font-mono text-sm break-all">{result}</p>
    </div>
  );
}
