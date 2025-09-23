'use client';

import { useState, useEffect, useRef } from 'react';
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
  imageData?: string;
  timestamp: number;
  success: boolean;
  message: string;
  userName?: string;
  action?: 'clock-in' | 'clock-out';
  type?: 'qr' | 'face';
  qrCode?: string;
}

interface FaceScannerProps {
  className?: string;
  onScanResult?: (result: ScanResult) => void;
}

export function FaceScanner({ className, onScanResult }: FaceScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | ''>('');
  const [loading, setLoading] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingRef = useRef(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) return;

    // Clear any existing interval to prevent multiple scans
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    try {
      setScanning(true);
      setMessage('');

      // Get camera access with high quality settings matching QR scanner
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      }).catch(async () => {
        // Fallback to default camera with same quality settings
        console.log('Environment camera not available, using default');
        return navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 }
          }
        });
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      // Wait for video to load
      await new Promise((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = resolve;
        }
      });

      scanIntervalRef.current = setInterval(() => {
        captureAndProcessFrame();
      }, 10000);

    } catch (error) {
      setMessage('Failed to start camera. Please check permissions.');
      setMessageType('error');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };

  const captureAndProcessFrame = async () => {
    if (!videoRef.current || !canvasRef.current || processingRef.current || loading) {
      return;
    }

    const currentTime = Date.now();

    // Debounce: prevent scanning within 8 seconds
    if (currentTime - lastScanTime < 8000) {
      return;
    }

    processingRef.current = true;

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 with high quality for better face recognition
      const imageData = canvas.toDataURL('image/jpeg', 0.9);

      setLastScanTime(currentTime);
      setLoading(true);
      // Don't show processing message for silent operation

      // Send to face recognition API
      const response = await fetch('/api/face-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData }),
      });

      const data = await response.json();

      if (response.ok) {
        // Handle response in same format as QR scanner
        const attendanceAction = data.attendance?.action;
        const message = data.message || `Successfully ${attendanceAction === 'clock-in' ? 'clocked in' : 'clocked out'}`;

        const scanResult: ScanResult = {
          imageData,
          timestamp: currentTime,
          success: true,
          message: message,
          userName: data.attendance?.userName,
          action: attendanceAction,
          type: 'face'
        };

        setMessage(message);
        setMessageType('success');
        setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]); // Keep last 10 scans
      } else {
        // Failed scans - don't show any messages or log to history
        // Just silently continue
      }

      // Clear message after 3 seconds (only if there was a success message)
      if (response.ok) {
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 3000);
      }

    } catch (error) {
      // Network errors - don't show messages or log to history
      // Just silently continue
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
              <span className="text-lg">👤</span>
              Face Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScannerVideo
              ref={videoRef}
              scanning={scanning}
              loading={loading}
              type="face"
            />

            {/* Hidden canvas for image capture */}
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
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

            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Position your face clearly in the camera</p>
              <p>• Ensure good lighting for better recognition</p>
              <p>• The system will automatically scan every 10 seconds</p>
            </div>
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
