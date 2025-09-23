'use client';

import { RegistrationFlow } from '@/components/register';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <RegistrationFlow />
      </div>
    </div>
  );
}

