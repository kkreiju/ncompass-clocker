'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { ScannerVideo } from '@/components/scanner/scanner-video';
import { ScannerStatus } from '@/components/scanner/scanner-status';

interface UserData {
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
}

interface FaceVerificationProps {
  userData: UserData;
  onComplete: () => void;
  onBack: () => void;
}

export function FaceVerification({ userData, onComplete, onBack }: FaceVerificationProps) {
  const [scanning, setScanning] = useState(true);
  const [message, setMessage] = useState('Position your face in the camera for verification');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | ''>('warning');
  const [loading, setLoading] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingRef = useRef(false);

  const startVerification = async () => {
    if (!videoRef.current) return;

    try {
      setScanning(true);
      setMessage('Starting camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      }).catch(async () => {
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

      await new Promise((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = resolve;
        }
      });

      setMessage('Position your face clearly in the camera and click "Capture Face"');
      setMessageType('warning');

    } catch (error) {
      setMessage('Failed to start camera. Please check permissions.');
      setMessageType('error');
      setScanning(false);
    }
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current || processingRef.current) {
      return;
    }

    processingRef.current = true;
    setLoading(true);
    setMessage('Capturing and verifying face...');
    setMessageType('warning');

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg', 0.9);

      // Send registration data with face image to backend
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          faceImage: imageData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message || 'Registration successful! Welcome aboard.');
        setMessageType('success');
        setVerificationComplete(true);
        setScanning(false);

        // Auto-redirect after success
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Face verification failed. Please try again.');
        setMessageType('error');
      }

    } catch (error) {
      setMessage('Registration failed. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  // Start camera when component mounts
  useState(() => {
    startVerification();
    return () => {
      stopCamera();
    };
  });

  return (
    <div className="space-y-6">
      {/* User Info Summary */}
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-medium mb-2">Registration Details:</h3>
        <p><strong>Name:</strong> {userData.name}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        {userData.profilePicture && (
          <div className="mt-2">
            <strong>Profile Picture:</strong>
            <img
              src={userData.profilePicture}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover mt-1 border-2 border-primary"
            />
          </div>
        )}
      </div>

      {/* Face Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">📸</span>
            Face Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScannerVideo
            ref={videoRef}
            scanning={scanning}
            loading={loading}
            type="face"
          />

          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />

          <ScannerStatus
            message={message}
            messageType={messageType}
          />

          {!verificationComplete && (
            <div className="flex gap-3">
              <Button
                onClick={captureAndVerify}
                disabled={loading || !scanning}
                className="flex-1"
                size="lg"
              >
                {loading ? 'Verifying...' : 'Capture Face'}
              </Button>
              <Button
                variant="outline"
                onClick={startVerification}
                disabled={loading}
              >
                Restart Camera
              </Button>
            </div>
          )}

          {verificationComplete && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Registration Complete!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to login page...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Form
        </Button>

        {verificationComplete && (
          <Button onClick={onComplete}>
            Continue to Login
          </Button>
        )}
      </div>
    </div>
  );
}

