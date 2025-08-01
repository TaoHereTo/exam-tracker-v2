import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = '#3b82f6'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full relative`}
      style={{
        background: `conic-gradient(from 0deg, transparent 0deg, ${color} 60deg, ${color} 120deg, transparent 180deg, transparent 360deg)`,
        mask: 'radial-gradient(circle at center, transparent 30%, black 70%)',
        WebkitMask: 'radial-gradient(circle at center, transparent 30%, black 70%)'
      }}
    />
  );
};