'use client';

import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScannerStatusProps {
  message: string;
  messageType: 'success' | 'error' | 'warning' | '';
}

export function ScannerStatus({ message, messageType }: ScannerStatusProps) {
  if (!message) return null;

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Alert className={`${
      messageType === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800' :
      messageType === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800' :
      messageType === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800' :
      ''
    }`}>
      {getStatusIcon(messageType)}
      <AlertDescription className={getStatusColor(messageType)}>
        {message}
      </AlertDescription>
    </Alert>
  );
}
