'use client'

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Mail, Lock, Eye, EyeOff, Plus, Key } from 'lucide-react'
import { RainbowButton } from '../magicui/rainbow-button'
import { InteractiveHoverButton } from '../magicui/interactive-hover-button'
import { MixedText } from '../ui/MixedText'

interface LoginFormProps {
    onSwitchToSignUp: () => void
    onSwitchToForgotPassword: () => void
}

export function LoginForm({ onSwitchToSignUp, onSwitchToForgotPassword }: LoginFormProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { signIn } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await signIn(email, password)

        if (error) {
            setError(error.message)
        }

        setLoading(false)
    }

    return (
        <div className="w-full">
            <div className="text-left mb-6 mt-0">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                    <MixedText text="欢迎回来" />
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    <MixedText text="请登录或注册" />
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            <MixedText text={error} />
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2 mb-4">
                    <Label htmlFor="email" className="text-left text-gray-700 dark:text-gray-300 block">
                        <MixedText text="邮箱地址" />
                    </Label>
                    <div className="relative w-full">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="请输入邮箱地址"
                            className="w-full pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 focus:ring-transparent text-gray-900 dark:text-gray-100"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    <Label htmlFor="password" className="text-left text-gray-700 dark:text-gray-300 block">
                        <MixedText text="密码" />
                    </Label>
                    <div className="relative w-full">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            className="w-full pl-10 pr-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 focus:ring-transparent text-gray-900 dark:text-gray-100"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center gap-2 pt-2 pb-0">
                    <InteractiveHoverButton
                        type="button"
                        onClick={onSwitchToSignUp}
                        className="flex-1 signup-btn"
                        hoverColor="#3B82F6"
                        compact={true}
                        icon={<Plus className="w-4 h-4" />}
                    >
                        <MixedText text="注册" />
                    </InteractiveHoverButton>
                    <InteractiveHoverButton
                        type="button"
                        onClick={onSwitchToForgotPassword}
                        className="flex-1 forgot-btn"
                        hoverColor="#059669"
                        compact={true}
                        icon={<Key className="w-4 h-4" />}
                    >
                        <MixedText text="找回密码" />
                    </InteractiveHoverButton>
                    <RainbowButton
                        type="submit"
                        disabled={loading}
                        className="flex-1"
                    >
                        <MixedText text={loading ? '登录中...' : '登录'} />
                    </RainbowButton>
                </div>
            </form>
        </div>
    )
} 