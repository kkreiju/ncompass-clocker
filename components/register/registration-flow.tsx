'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegistrationForm } from './registration-form';
import { FaceVerification } from './face-verification';

interface UserData {
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
}

export function RegistrationFlow() {
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [userData, setUserData] = useState<UserData | null>(null);

  const handleFormSubmit = (data: UserData) => {
    setUserData(data);
    setStep('verification');
  };

  const handleVerificationComplete = () => {
    // Registration completed successfully
    setStep('form');
    setUserData(null);
  };

  const handleBackToForm = () => {
    setStep('form');
    setUserData(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">
          {step === 'form' ? 'Create Account' : 'Face Verification'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'form' ? (
          <RegistrationForm onSubmit={handleFormSubmit} />
        ) : (
          <FaceVerification
            userData={userData!}
            onComplete={handleVerificationComplete}
            onBack={handleBackToForm}
          />
        )}
      </CardContent>
    </Card>
  );
}

