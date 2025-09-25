'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { UserProfileService } from '../lib/userProfileService'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
    signInWithOtp: (email: string) => Promise<{ success: boolean; error?: string }>
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signOut: () => Promise<void>
    sendPasswordResetCode: (email: string) => Promise<{ success: boolean; error?: string }>
    verifyPasswordResetCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>
    updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
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
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            updateAuthState(session);
        });

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            updateAuthState(session);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [updateAuthState]);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            setUser(data.user);
            return { success: true };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }, []);

    const signInWithOtp = useCallback(async (email: string) => {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
            });

            if (error) throw error;

            return { success: true };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }, []);

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

    const sendPasswordResetCode = useCallback(async (email: string) => {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim().toLowerCase(),
                options: {
                    shouldCreateUser: false, // 不创建新用户，只发送验证码
                }
            })

            if (error) throw error
            return { success: true }
        } catch (error) {
            return { success: false, error: (error as Error).message }
        }
    }, [])

    const verifyPasswordResetCode = useCallback(async (email: string, code: string) => {
        try {
            // 验证验证码，这会临时登录用户
            const { data, error } = await supabase.auth.verifyOtp({
                email: email.trim().toLowerCase(),
                token: code.trim(),
                type: 'email'
            })

            if (error) {
                throw error
            }

            // 验证成功，用户现在已登录，可以更新密码
            return { success: true, user: data.user }
        } catch (error) {
            return { success: false, error: (error as Error).message }
        }
    }, [])

    const updatePassword = useCallback(async (password: string) => {
        try {
            // 更新用户密码
            const { data, error } = await supabase.auth.updateUser({
                password: password.trim()
            })

            if (error) {
                throw error
            }

            // 注意：Supabase会自动终止所有活跃会话，不需要手动登出
            // 用户需要重新登录以建立新的会话

            return { success: true }
        } catch (error) {
            return { success: false, error: (error as Error).message }
        }
    }, [])

    const value = React.useMemo(() => ({
        user,
        session,
        loading,
        signIn,
        signInWithOtp,
        signUp,
        signOut,
        sendPasswordResetCode,
        verifyPasswordResetCode,
        updatePassword,
    }), [user, session, loading, signIn, signInWithOtp, signUp, signOut, sendPasswordResetCode, verifyPasswordResetCode, updatePassword])

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
