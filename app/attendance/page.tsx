'use client';

import { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';

export default function AttendancePage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

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
          maxScansPerSecond: 25, // Increase scan frequency for faster detection
          preferredCamera: 'environment', // Use back camera on mobile for better performance
        }
      );

      // Set camera preferences for better performance
      await qrScannerRef.current.start();
      
      // Optimize camera settings for speed
      if (qrScannerRef.current) {
        // Set higher resolution for better detection but balance with performance
        qrScannerRef.current.setCamera('environment').catch(() => {
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
    
    // Debounce: prevent scanning the same code within 2 seconds
    if (qrCode === lastScannedCode && currentTime - lastScanTime < 2000) {
      return;
    }
    
    // Prevent multiple simultaneous scans
    if (loading) return;
    
    setLastScannedCode(qrCode);
    setLastScanTime(currentTime);
    setResult(qrCode);
    setLoading(true);
    setMessage('Processing...');
    setMessageType('');

    // Stop scanning temporarily
    stopScanning();

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setMessageType('success');
        
        // Show success message for 2 seconds (reduced from 3), then restart scanning
        setTimeout(() => {
          setMessage('');
          setResult('');
          startScanning();
        }, 2000);
      } else {
        setMessage(data.error || 'Failed to process attendance');
        setMessageType('error');
        
        // Show error message for 2 seconds (reduced from 3), then restart scanning
        setTimeout(() => {
          setMessage('');
          setResult('');
          startScanning();
        }, 2000);
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
      
      // Show error message for 2 seconds (reduced from 3), then restart scanning
      setTimeout(() => {
        setMessage('');
        setResult('');
        startScanning();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRestart = () => {
    setMessage('');
    setResult('');
    setMessageType('');
    startScanning();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NCompass</h1>
          <p className="text-gray-600">Attendance Scanner</p>
        </div>

        {/* QR Scanner */}
        <div className="mb-6">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
              style={{
                filter: 'contrast(1.1) brightness(1.1)', // Enhance contrast for better QR detection
              }}
            />
            
            {!scanning && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-center text-white">
                  <div className="text-4xl mb-2">📷</div>
                  <p>Camera not active</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Processing...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg text-center ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : messageType === 'error'
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            {message}
          </div>
        )}

        {/* Scanned Result */}
        {result && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Scanned QR Code:</p>
            <p className="font-mono text-sm break-all">{result}</p>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3">
          {!scanning && !loading && (
            <button
              onClick={handleManualRestart}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Start Scanning
            </button>
          )}

          {scanning && (
            <button
              onClick={stopScanning}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Stop Scanning
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Position your QR code in front of the camera</li>
            <li>• Ensure good lighting for best results</li>
            <li>• Fast scanning: Hold steady for quick detection</li>
            <li>• The system will automatically detect clock-in/out</li>
            <li>• Wait for confirmation before scanning again</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <a
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
