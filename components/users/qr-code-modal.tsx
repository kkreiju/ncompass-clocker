'use client';

import { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Download } from "lucide-react";
import QRCodeLib from 'qrcode';

interface QRCodeModalProps {
  isOpen: boolean;
  userName: string | undefined;
  onClose: () => void;
}

// QR Code Component with Logo
function QRCodeWithLogo({ value, size = 256 }: { value: string | undefined; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      console.log('QR Code generation:', { value, hasCanvas: !!canvasRef.current });
      if (!canvasRef.current || !value || value.trim() === '') {
        console.log('QR Code generation skipped:', { value, hasCanvas: !!canvasRef.current });
        return;
      }

      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Generate QR code on canvas
        await QRCodeLib.toCanvas(canvas, value.trim(), {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Load and draw logo in center
        const logo = new Image();
        logo.onload = () => {
          const logoSize = size * 0.2; // Logo is 20% of QR code size
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;

          // Create a white background circle for the logo
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, logoSize / 2 + 5, 0, 2 * Math.PI);
          ctx.fill();

          // Draw the logo
          ctx.drawImage(logo, x, y, logoSize, logoSize);
        };
        logo.src = '/ncompass-logo.svg';
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />;
}

export function QRCodeModal({ isOpen, userName, onClose }: QRCodeModalProps) {
  console.log('QR Modal rendered:', { isOpen, userName });
  const handleDownload = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${userName || 'user'}-qr-code.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code for {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6">
          <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
            {userName && userName.trim() !== '' ? (
              <QRCodeWithLogo value={userName} size={256} />
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 text-sm">QR Code not available</p>
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Scan this QR code to get the user's name:
            </p>
            <p className="font-semibold text-lg">{userName}</p>
          </div>

          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
