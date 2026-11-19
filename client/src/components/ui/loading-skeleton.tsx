import React from 'react';

/**
 * Skeleton loader component for asynchronous data fetching states.
 * Designed to provide immediate visual feedback and reduce perceived latency
 * in enterprise-grade interfaces.
 */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};
