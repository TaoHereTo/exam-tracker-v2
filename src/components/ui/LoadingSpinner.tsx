import React from 'react';
import { ConfettiLoader } from './ConfettiLoader';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = '#3b82f6'
}) => {
  const sizeMap = {
    sm: 'small' as const,
    md: 'medium' as const,
    lg: 'large' as const
  };

  return (
    <ConfettiLoader size={sizeMap[size]} />
  );
};

// 通用的烟花加载组件，用于替换"加载中"文本
export const ConfettiLoading: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <ConfettiLoader size="medium" />
    </div>
  );
};