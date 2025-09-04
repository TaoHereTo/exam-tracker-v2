'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { MagicCard } from '../magicui/magic-card'
import { useThemeMode } from '@/hooks/useThemeMode'
import { useAuth } from '@/contexts/AuthContext'

interface AuthPageProps {
    initialView?: 'login' | 'signup' | 'forgot-password'
}

export function AuthPage({ initialView }: AuthPageProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, loading } = useAuth()
    const { isDarkMode, getBackgroundStyle } = useThemeMode();

    // Determine the current view based on the pathname
    const getDefaultView = useCallback(() => {
        if (initialView) return initialView
        if (pathname?.includes('/signup')) return 'signup'
        if (pathname?.includes('/forgot-password')) return 'forgot-password'
        return 'login'
    }, [initialView, pathname])

    const [currentView, setCurrentView] = useState<'login' | 'signup' | 'forgot-password'>(getDefaultView())

    // Update the view when the pathname changes
    useEffect(() => {
        setCurrentView(getDefaultView())
    }, [getDefaultView])

    // 登录成功后跳转到主页面
    useEffect(() => {
        if (!loading && user) {
            router.replace('/')
        }
    }, [loading, user, router])

    return (
        <div className="min-h-screen flex items-center justify-center relative px-4" style={getBackgroundStyle() as React.CSSProperties}>
            {/* 顶部左侧应用图标 */}
            <Link href="/" className="absolute left-4 top-4 z-[3] inline-flex items-center gap-3">
                <Image src="/trace.svg" alt="App Icon" className="h-10 w-10 sm:h-12 sm:w-12" width={48} height={48} />
                <span className="hidden sm:inline text-lg sm:text-xl font-semibold text-foreground/90">行测每日记录</span>
            </Link>
            <div className="mx-auto relative z-[2] w-full max-w-[18rem] sm:max-w-sm md:max-w-sm">
                <MagicCard
                    className="rounded-xl w-full p-6 sm:p-8"
                    gradientSize={240}
                    gradientColor="rgba(0, 0, 0, 0.08)"
                    gradientOpacity={0.5}
                >
                    <div className="w-full">
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