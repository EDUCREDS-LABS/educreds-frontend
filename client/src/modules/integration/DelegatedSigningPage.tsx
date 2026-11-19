import React from 'react';

/** Delegated signing key management is not exposed through the public API. */
export const DelegatedSigningPage: React.FC = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold text-gray-900">Delegated Signing Configuration</h2>
    <p className="text-gray-700">
      Delegated signing requires administrator setup. Contact your EduCreds administrator
      to configure or rotate a signing key for your institution.
    </p>
  </div>
);

export default DelegatedSigningPage;
