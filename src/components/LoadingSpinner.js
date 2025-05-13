import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      <p className="ml-4 text-lg font-semibold text-blue-600">Loading your fitness schedule...</p>
    </div>
  );
};

export default LoadingSpinner;
