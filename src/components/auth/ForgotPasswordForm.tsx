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

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth?reset=true`,
        })

        if (error) {
            setError(error.message)
        } else {
            setSuccess('重置密码邮件已发送，请检查您的邮箱')
            setEmail('')
        }

        setIsLoading(false)
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
                            className="pl-10 border-input-border focus:border-ring focus:ring-ring/50 text-sm sm:text-base h-10 sm:h-12"
                            required
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