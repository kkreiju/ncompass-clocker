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
          console.log('QR Scanner detected:', qrData);
          handleScanResult(qrData);
        },
        {
          highlightScanRegion: false,  // Remove yellow scan region highlight
          highlightCodeOutline: false, // Remove yellow QR code outline
          maxScansPerSecond: 25,
          preferredCamera: 'environment',
          calculateScanRegion: (video) => ({
            // Center the scan region and make it more focused
            x: 0.2 * video.videoWidth,
            y: 0.2 * video.videoHeight,
            width: 0.6 * video.videoWidth,
            height: 0.6 * video.videoHeight,
          }),
          // Improve visual feedback
          onDecodeError: (error) => {
            // Silently handle decode errors to prevent noise
            console.debug('QR decode error (normal):', error);
          },
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

    // Debounce: prevent scanning the same code within 2 seconds (reduced from 3)
    if (qrCode === lastScannedCode && currentTime - lastScanTime < 2000) {
      return;
    }

    // Prevent multiple simultaneous scans and API calls
    if (loading || processingRef.current) {
      console.log('Scan blocked: loading or processing in progress');
      return;
    }

    processingRef.current = true;
    console.log('Processing QR code:', qrCode);

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

      if (response.ok) {
        const scanResult: ScanResult = {
          qrCode,
          timestamp: currentTime,
          success: true,
          message: data.message,
          action: data.attendance?.action
        };

        setMessage(data.message);
        setMessageType('success');
        setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]); // Keep last 10 scans
      } else {
        // Handle different error types without adding to failed scan history
        let scanResult: ScanResult | undefined;

        if (response.status === 404 && data.error?.includes('User not found')) {
          // User not found - show friendly message but don't log as failed scan
          scanResult = {
            qrCode,
            timestamp: currentTime,
            success: false,
            message: 'User not recognized. Please check with your administrator.'
          };
          setMessage('User not recognized. Please check with your administrator.');
          setMessageType('warning');
        } else {
          // Other errors - show error and log as failed scan
          scanResult = {
            qrCode,
            timestamp: currentTime,
            success: false,
            message: data.error || 'Failed to process attendance'
          };

          setMessage(data.error || 'Failed to process attendance');
          setMessageType('error');
          setScanHistory(prev => [scanResult!, ...prev.slice(0, 9)]); // scanResult is guaranteed to be defined here
        }

        // Notify parent component
        onScanResult?.(scanResult);
      }

      // Show result for 2 seconds, then restart scanning
      setTimeout(() => {
        setMessage('');
        setResult('');
        startScanning();
      }, 2000);
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

      // Auto-restart scanning after 3 seconds on error
      setTimeout(() => {
        startScanning();
      }, 3000);
    } finally {
      setLoading(false);
      processingRef.current = false;
      // Clear the last processed code after a short delay to allow rescanning
      setTimeout(() => {
        lastProcessedCodeRef.current = '';
      }, 1000);
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
