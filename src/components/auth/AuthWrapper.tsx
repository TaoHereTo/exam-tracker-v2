import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UiverseSpinner } from '../ui/UiverseSpinner';
import { AuthPage } from './AuthPage';
import { usePathname } from 'next/navigation';

interface AuthWrapperProps {
    children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    // 如果仍在加载认证状态，显示加载指示器
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <UiverseSpinner size="lg" />
            </div>
        );
    }

    // 如果用户未登录，渲染登录页面
    if (!user) {
        // Determine the initial view based on the current route
        let initialView: 'login' | 'signup' | 'forgot-password' = 'login';
        if (pathname?.includes('/signup')) {
            initialView = 'signup';
        } else if (pathname?.includes('/forgot-password')) {
            initialView = 'forgot-password';
        }
        
        return <AuthPage initialView={initialView} />;
    }

    // 用户已登录，渲染子组件
    return <>{children}</>;
}