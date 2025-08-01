'use client';

import React from 'react';
import { ConfettiLoader } from './ConfettiLoader';

interface LoadingWrapperProps {
    loading: boolean;
    children: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
    className?: string;
    fallback?: React.ReactNode;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
    loading,
    children,
    size = 'large',
    className = '',
    fallback
}) => {
    if (loading) {
        return (
            <div className={`flex items-center justify-center min-h-[80vh] ${className}`}>
                {fallback || <ConfettiLoader size={size} />}
            </div>
        );
    }

    return <>{children}</>;
}; 