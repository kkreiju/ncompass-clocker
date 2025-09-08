'use client';

export function ScannerInstructions() {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <p className="font-medium">Instructions:</p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li>Position your QR code in front of the camera</li>
        <li>Ensure good lighting for best results</li>
        <li>Hold steady for quick detection</li>
        <li>The system will automatically detect clock-in/out</li>
      </ul>
    </div>
  );
}
