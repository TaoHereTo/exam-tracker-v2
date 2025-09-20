import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UiverseSpinner } from '../ui/UiverseSpinner';
import { useRouter } from 'next/navigation';

interface AuthWrapperProps {
    children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // 处理未登录用户的重定向
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth');
        }
    }, [loading, user, router]);

    // 如果仍在加载认证状态，显示加载指示器
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <UiverseSpinner size="lg" />
            </div>
        );
    }

    // 如果用户未登录，显示加载指示器（重定向会在useEffect中处理）
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <UiverseSpinner size="lg" />
            </div>
        );
    }

    // 用户已登录，渲染子组件
    return <>{children}</>;
}