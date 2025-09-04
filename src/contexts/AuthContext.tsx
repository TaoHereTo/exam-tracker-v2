'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { UserProfileService } from '../lib/userProfileService'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    // 使用 useCallback 优化函数性能
    const updateAuthState = useCallback(async (newSession: Session | null) => {
        const newUser = newSession?.user ?? null;

        // 只有当用户状态真正改变时才更新
        setSession(prevSession => {
            if (prevSession?.access_token === newSession?.access_token) {
                return prevSession;
            }
            return newSession;
        });

        setUser(prevUser => {
            if (prevUser?.id === newUser?.id) {
                return prevUser;
            }
            return newUser;
        });

        setLoading(false);

        // 延迟创建用户资料，确保用户状态已完全更新
        if (newUser) {
            // 使用setTimeout确保状态更新完成后再创建用户资料
            setTimeout(async () => {
                try {
                    await UserProfileService.ensureUserProfile();
                } catch (error) {
                    console.error('创建用户资料失败:', error);
                }
            }, 100);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        // 获取当前会话
        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (mounted) {
                    await updateAuthState(session);
                }
            } catch (error) {
                console.error('Failed to get session:', error);
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        getSession()

        // 监听认证状态变化
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.id);
                if (mounted) {
                    await updateAuthState(session);
                }
            }
        )

        return () => {
            mounted = false;
            subscription.unsubscribe()
        }
    }, [updateAuthState])

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            
            if (error) {
                console.error('Sign in error:', error);
                return { error };
            }
            
            console.log('Sign in successful:', data.user?.id);
            // Manually update the auth state after successful sign in
            await updateAuthState(data.session);
            return { error: null };
        } catch (err) {
            console.error('Unexpected sign in error:', err);
            return { error: err as AuthError };
        }
    }, [updateAuthState])

    const signUp = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        })
        return { error }
    }, [])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
    }, [])

    const value = React.useMemo(() => ({
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
    }), [user, session, loading, signIn, signUp, signOut])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}