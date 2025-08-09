import React from 'react';
import { MixedText } from './MixedText';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <div className={`${sizeMap[size]} animate-spin rounded-full border-b-2 border-blue-600`}></div>
      {text && (
        <p className="text-sm text-gray-600">
          <MixedText text={text} />
        </p>
      )}
    </div>
  );
}

// 简化的loading组件，只显示旋转动画
export function SimpleLoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <div className={`${sizeMap[size]} animate-spin rounded-full border-b-2 border-blue-600 ${className}`}></div>
  );
}

// 内联loading组件，用于按钮等小空间
export function InlineLoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600 ${className}`}></div>
  );
}

// Loading包装器组件，用于包装整个页面内容
interface LoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function LoadingWrapper({ loading, children, className = '' }: LoadingWrapperProps) {
  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[80vh] ${className}`}>
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    );
  }

  return <>{children}</>;
}