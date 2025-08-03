'use client'

import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { AuthPage } from './AuthPage'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface AuthWrapperProps {
    children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600" style={{ fontFamily: '思源宋体, serif' }}>
                        正在加载...
                    </p>
                </div>
            </div>
        )
    }

    if (!user) {
        return <AuthPage />
    }

    return <>{children}</>
} 