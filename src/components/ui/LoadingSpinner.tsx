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
    <div className="relative">
      {/* 外圈旋转动画 */}
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700`}
        style={{
          borderTopColor: color,
          borderRightColor: color,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent'
        }}
      />

      {/* 内圈脉冲效果 */}
      <div
        className={`${sizeClasses[size]} absolute inset-0 rounded-full animate-pulse`}
        style={{
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`
        }}
      />
    </div>
  );
};