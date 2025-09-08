'use client';

import { AttendanceScanner } from '@/components/scanner';

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <AttendanceScanner />
      </div>
    </div>
  );
}
