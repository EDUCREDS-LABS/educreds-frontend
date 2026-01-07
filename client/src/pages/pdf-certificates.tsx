import React from 'react';
import { PdfCertificateUpload } from '../components/PdfCertificateUpload';

const PdfCertificatesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">PDF Certificate Issuance</h1>
          <p className="text-gray-600 mt-2">
            Upload your own certificate PDFs and issue them to students. Perfect for custom-designed certificates.
          </p>
        </div>
        
        <PdfCertificateUpload />
      </div>
    </div>
  );
};

export default PdfCertificatesPage;