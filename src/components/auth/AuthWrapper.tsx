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
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!user) {
        return <AuthPage />
    }

    return <>{children}</>
} 