import React from 'react';
import { BulkCertificateIssuance } from '../components/BulkCertificateIssuance';

const BulkIssuancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Certificate Issuance</h1>
          <p className="text-gray-600 mt-2">
            Issue multiple certificates at once using CSV upload. Perfect for graduation ceremonies and course completions.
          </p>
        </div>
        
        <BulkCertificateIssuance />
      </div>
    </div>
  );
};

export default BulkIssuancePage;