import React from 'react';
import { UsageDashboard } from '../components/UsageDashboard';

const UsagePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto">
        <UsageDashboard />
      </div>
    </div>
  );
};

export default UsagePage;