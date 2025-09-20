import React from 'react';
import { MixedText } from './MixedText';
import { UiverseSpinner } from './UiverseSpinner';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <UiverseSpinner size={size} />
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
    <UiverseSpinner size={size} />
  );
}

// 内联loading组件，用于按钮等小空间
export function InlineLoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <UiverseSpinner size="sm" />
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
        <UiverseSpinner size="lg" centered />
        <span className="ml-3 text-gray-600 dark:text-gray-300">加载中...</span>
      </div>
    );
  }

  return <>{children}</>;
}