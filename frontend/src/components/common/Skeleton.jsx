import React from 'react';

export const Skeleton = ({ className = '', variant = 'rectangular' }) => {
  const variantClasses = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4 w-full',
  };

  return (
    <div
      className={`animate-pulse bg-slate-800/60 ${variantClasses[variant]} ${className}`}
    />
  );
};
