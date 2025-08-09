'use client'

import React, { useState, useEffect, ReactNode } from 'react'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { MagicCard } from '../magicui/magic-card'
import { useThemeMode } from '@/hooks/useThemeMode'

export function AuthPage() {
    const [currentView, setCurrentView] = useState<'login' | 'signup' | 'forgot-password'>('login')
    const { isDarkMode, getBackgroundStyle } = useThemeMode();

    return (
        <div className="min-h-screen flex items-center justify-center relative" style={getBackgroundStyle() as React.CSSProperties}>
            <div className="mx-4 relative z-[2]" style={{ width: 'min(32vw, 480px)' }}>
                <MagicCard
                    className="rounded-xl w-full dark:bg-gray-800/50 dark:border-gray-700"
                    gradientSize={240}
                    gradientColor="rgba(0, 0, 0, 0.08)"
                    gradientOpacity={0.5}
                >
                    <div className="w-full px-6 py-4 md:px-8 md:py-6 lg:px-10 lg:py-8">
                        {currentView === 'login' && (
                            <LoginForm
                                onSwitchToSignUp={() => setCurrentView('signup')}
                                onSwitchToForgotPassword={() => setCurrentView('forgot-password')}
                            />
                        )}
                        {currentView === 'signup' && (
                            <SignUpForm onSwitchToLogin={() => setCurrentView('login')} />
                        )}
                        {currentView === 'forgot-password' && (
                            <ForgotPasswordForm onSwitchToLogin={() => setCurrentView('login')} />
                        )}
                    </div>
                </MagicCard>
            </div>
        </div>
    )
} 