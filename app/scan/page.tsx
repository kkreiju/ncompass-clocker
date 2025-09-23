'use client';

import { FaceScanner } from '@/components/scanner';

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <FaceScanner />
      </div>
    </div>
  );
}
