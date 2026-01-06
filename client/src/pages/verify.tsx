import React from 'react';
import { CertificateVerification } from '@/components/CertificateVerification';

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <CertificateVerification />
      </div>
    </div>
  );
}