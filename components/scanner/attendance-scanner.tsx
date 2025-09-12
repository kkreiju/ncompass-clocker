'use client';

import { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ScannerVideo } from './scanner-video';
import { ScannerStatus } from './scanner-status';
import { ScannerControls } from './scanner-controls';
import { ScanHistory } from './scan-history';
import { ScannerResult } from './scanner-result';
import { ScannerInstructions } from './scanner-instructions';
import { ScannerHeader } from './scanner-header';

interface ScanResult {
  qrCode: string;
  timestamp: number;
  success: boolean;
  message: string;
  action?: 'clock-in' | 'clock-out';
}

interface AttendanceScannerProps {
  className?: string;
  onScanResult?: (result: ScanResult) => void;
}

export function AttendanceScanner({ className, onScanResult }: AttendanceScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | ''>('');
  const [loading, setLoading] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const processingRef = useRef(false);
  const lastProcessedCodeRef = useRef<string>('');

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setScanning(true);
      setMessage('');

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          // Handle both string and ScanResult types
          const qrData = typeof result === 'string' ? result : result.data;
          handleScanResult(qrData);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 50, // Increased scan frequency for faster detection
          preferredCamera: 'environment', // Use back camera on mobile for better performance
          calculateScanRegion: (video) => ({
            // Optimize scan region for better performance and speed
            x: 0.1 * video.videoWidth,
            y: 0.1 * video.videoHeight,
            width: 0.8 * video.videoWidth,
            height: 0.8 * video.videoHeight,
          }),
        }
      );

      // Set camera preferences for better performance
      await qrScannerRef.current.start();

      // Optimize camera settings for speed and reliability
      if (qrScannerRef.current) {
        // Set higher resolution for better detection but balance with performance
        await qrScannerRef.current.setCamera('environment').catch(() => {
          // Fallback to default camera if environment camera fails
          console.log('Environment camera not available, using default');
        });
      }
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      setMessage('Failed to start camera. Please check permissions.');
      setMessageType('error');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanResult = async (qrCode: string) => {
    const currentTime = Date.now();

    // Debounce: prevent scanning the same code within 3 seconds
    if ((qrCode === lastScannedCode && currentTime - lastScanTime < 3000) ||
        qrCode === lastProcessedCodeRef.current) {
      return;
    }

    // Prevent multiple simultaneous scans and API calls
    if (loading || processingRef.current) return;

    processingRef.current = true;
    lastProcessedCodeRef.current = qrCode;

    setLastScannedCode(qrCode);
    setLastScanTime(currentTime);
    setResult(qrCode);
    setLoading(true);
    setMessage('Processing attendance...');
    setMessageType('warning');

    // Stop scanning temporarily
    stopScanning();

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCodeData: qrCode }),
      });

      const data = await response.json();
      const scanResult: ScanResult = {
        qrCode,
        timestamp: currentTime,
        success: response.ok,
        message: data.message || data.error,
        action: data.attendance?.action
      };

      if (response.ok) {
        setMessage(data.message);
        setMessageType('success');
        setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]); // Keep last 10 scans
      } else {
        setMessage(data.error || 'Failed to process attendance');
        setMessageType('error');
        setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]);
      }

      // Notify parent component
      onScanResult?.(scanResult);

      // Show result for 3 seconds, then restart scanning
      setTimeout(() => {
        setMessage('');
        setResult('');
        startScanning();
      }, 3000);
    } catch (error) {
      const scanResult: ScanResult = {
        qrCode,
        timestamp: currentTime,
        success: false,
        message: 'Network error. Please try again.'
      };

      setMessage('Network error. Please try again.');
      setMessageType('error');
      setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]);

      // Notify parent component
      onScanResult?.(scanResult);

      // Do not auto-restart scanning on error - let user manually restart
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  const handleManualRestart = () => {
    setMessage('');
    setResult('');
    setMessageType('');
    startScanning();
  };

  const clearHistory = () => {
    setScanHistory([]);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <ScannerHeader scanning={scanning} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">📱</span>
              QR Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScannerVideo
              ref={videoRef}
              scanning={scanning}
              loading={loading}
            />

            <ScannerStatus
              message={message}
              messageType={messageType}
            />

            <ScannerResult result={result} />

            <ScannerControls
              scanning={scanning}
              loading={loading}
              onStartScanning={handleManualRestart}
              onStopScanning={stopScanning}
            />

            <ScannerInstructions />
          </CardContent>
        </Card>

        <ScanHistory
          scanHistory={scanHistory}
          onClearHistory={clearHistory}
        />
      </div>
    </div>
  );
}
