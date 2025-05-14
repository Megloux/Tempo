import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-4 border-accent-turquoise animate-spin"></div>
        <div className="h-16 w-16 rounded-full border-r-4 border-accent-blue animate-pulse-slow absolute top-0 opacity-70"></div>
      </div>
      <span className="text-xl font-light tracking-wider text-white/80">LOADING</span>
    </div>
  );
};

export default LoadingSpinner;
