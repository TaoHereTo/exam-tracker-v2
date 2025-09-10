'use client'

import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Mail, ArrowLeft } from 'lucide-react'

import { MixedText } from '../ui/MixedText'
import { UiverseSpinner } from '../ui/UiverseSpinner'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ForgotPasswordFormProps {
    onSwitchToLogin: () => void
}

export function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess('')

        // Validate email field
        if (!email.trim()) {
            toast.error('请输入邮箱地址')
            setIsLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            })

            if (error) {
                setError(error.message)
                // Translate common Supabase error messages to Chinese
                if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
                    toast.error('请求过于频繁，请稍后重试')
                } else if (error.message.includes('email') && error.message.includes('invalid')) {
                    toast.error('邮箱格式不正确')
                } else if (error.message.includes('not found') || error.message.includes('not exist')) {
                    // Don't show an error for non-existent emails to prevent user enumeration
                    setSuccess('重置邮件已发送')
                    toast.success('重置邮件已发送')
                    setEmail('')
                    return
                } else {
                    toast.error('发送失败，请稍后重试')
                }
            } else {
                setSuccess('重置邮件已发送')
                toast.success('重置邮件已发送')
                setEmail('')
            }
        } catch (err) {
            setError('发送失败，请稍后重试')
            toast.error('发送失败，请稍后重试')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full">
            <div className="text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    <MixedText text="找回密码" />
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    <MixedText text="输入您的邮箱地址，我们将发送重置密码的链接" />
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription className="text-xs sm:text-sm">
                            <MixedText text={error} />
                        </AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert>
                        <AlertDescription className="text-xs sm:text-sm">
                            <MixedText text={success} />
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                        <MixedText text="邮箱地址" />
                    </Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4 sm:h-5 sm:w-5 z-10" />
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="请输入注册邮箱"
                            className="pl-10 border-input-border focus:border-ring focus:ring-ring/50 text-sm sm:text-base h-9 sm:h-10"
                            // Removed required attribute to prevent browser validation
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
                    <Link href="/auth/login">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <MixedText text="返回登录" />
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        variant="default"
                    >
                        {isLoading ? <><UiverseSpinner size="sm" className="mr-2 h-4 w-4" /> <MixedText text="发送中..." /></> : <MixedText text="发送重置链接" />}
                    </Button>
                </div>
            </form>
        </div>
    )
}