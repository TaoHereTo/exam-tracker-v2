import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UiverseSpinner } from '../ui/UiverseSpinner';

interface AuthWrapperProps {
    children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
    const { user, loading } = useAuth();

    // 如果仍在加载认证状态，显示加载指示器
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <UiverseSpinner size="lg" />
            </div>
        );
    }

    // 如果用户未登录，不渲染子组件
    if (!user) {
        return null;
    }

    // 用户已登录，渲染子组件
    return <>{children}</>;
}