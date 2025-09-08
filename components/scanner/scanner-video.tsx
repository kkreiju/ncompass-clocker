'use client';

import { forwardRef } from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface ScannerVideoProps {
  scanning: boolean;
  loading: boolean;
  className?: string;
}

export const ScannerVideo = forwardRef<HTMLVideoElement, ScannerVideoProps>(
  ({ scanning, loading, className }, ref) => {
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ aspectRatio: '1' }}>
        <video
          ref={ref}
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
              <CameraOff className="h-12 w-12 mx-auto mb-4 opacity-60" />
              <p className="text-lg">Camera not active</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Processing...</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ScannerVideo.displayName = 'ScannerVideo';
