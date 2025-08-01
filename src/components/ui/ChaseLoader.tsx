'use client';

import React from 'react';
import './chase-loader.css';

interface ChaseLoaderProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
    color?: string;
}

export const ChaseLoader: React.FC<ChaseLoaderProps> = ({
    size = 'medium',
    className = '',
    color = '#3b82f6'
}) => {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={`sk-chase ${size !== 'medium' ? size : ''}`}>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
            </div>
        </div>
    );
}; 