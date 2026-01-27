import React from 'react';
import EnhancedBulkIssuance from '../components/EnhancedBulkIssuance';

const BulkIssuancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto p-6">
        <EnhancedBulkIssuance />
      </div>
    </div>
  );
};

export default BulkIssuancePage;