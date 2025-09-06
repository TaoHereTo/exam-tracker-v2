'use client'

import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'

import { MixedText } from '../ui/MixedText'
import { UiverseSpinner } from '../ui/UiverseSpinner'
import Link from 'next/link'

interface SignUpFormProps {
    onSwitchToLogin: () => void
}

export function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const signUp = async (email: string, password: string) => {
        return await supabase.auth.signUp({
            email,
            password,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess('')

        if (password !== confirmPassword) {
            setError('两次输入的密码不一致')
            setIsLoading(false)
            return
        }

        if (password.length < 6) {
            setError('密码长度至少6位')
            setIsLoading(false)
            return
        }

        const { error } = await signUp(email, password)

        if (error) {
            setError(error.message)
        } else {
            setSuccess('注册成功！请检查您的邮箱以验证账户')
            // 注册成功后清空表单数据
            setEmail('')
            setPassword('')
            setConfirmPassword('')
        }

        setIsLoading(false)
    }

    return (
        <div className="w-full">
            <div className="text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    <MixedText text="创建账户" />
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    <MixedText text="开始行测记录之旅" />
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
                            placeholder="请输入邮箱"
                            className="pl-10 border-input-border focus:border-ring focus:ring-ring/50 text-sm sm:text-base h-9 sm:h-10"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                        <MixedText text="用户名" />
                    </Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4 sm:h-5 sm:w-5 z-10" />
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="请输入用户名"
                            className="pl-10 border-input-border focus:border-ring focus:ring-ring/50 text-sm sm:text-base h-9 sm:h-10"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                        <MixedText text="密码" />
                    </Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4 sm:h-5 sm:w-5 z-10" />
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            className="pl-10 pr-10 border-input-border focus:border-ring focus:ring-ring/50 text-sm sm:text-base h-9 sm:h-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                        <MixedText text="确认密码" />
                    </Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4 sm:h-5 sm:w-5 z-10" />
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="请确认密码"
                            className="pl-10 pr-10 border-input-border focus:border-ring focus:ring-ring/50 text-sm sm:text-base h-9 sm:h-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                        </button>
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
                        {isLoading ? <><UiverseSpinner size="sm" className="mr-2 h-4 w-4" /> <MixedText text="注册中..." /></> : <MixedText text="注册" />}
                    </Button>
                </div>
            </form>
        </div>
    )
}