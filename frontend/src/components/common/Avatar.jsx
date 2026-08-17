import React, { useState } from 'react';
import { getUserInitials, getAvatarGradient } from '../../utils/helpers';

export const Avatar = ({
  name = '',
  avatar = '',
  size = 'md',
  isOnline = false,
  showStatus = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-xl font-bold',
  };

  const statusDotSizes = {
    xs: 'w-2 h-2 -bottom-0.5 -right-0.5',
    sm: 'w-2.5 h-2.5 bottom-0 right-0',
    md: 'w-3 h-3 bottom-0 right-0',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5',
    xl: 'w-4 h-4 bottom-1 right-1',
  };

  const initials = getUserInitials(name);
  const gradient = getAvatarGradient(name);

  return (
    <div className={`relative inline-block flex-shrink-0 select-none ${className}`}>
      {avatar && !imageError ? (
        <img
          src={avatar}
          alt={name}
          onError={() => setImageError(true)}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-slate-800 shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center text-white shadow-sm ring-2 ring-slate-800 tracking-wider`}
        >
          {initials}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute rounded-full border-2 border-slate-900 ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-500'
          } ${statusDotSizes[size]}`}
          title={isOnline ? 'Online' : 'Offline'}
        >
          {isOnline && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
          )}
        </span>
      )}
    </div>
  );
};
