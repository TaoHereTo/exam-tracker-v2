'use client'

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { CapsuleButton } from '../ui/CapsuleButton'
import { RainbowButton } from '../magicui/rainbow-button'
import { MixedText } from '../ui/MixedText'
import { Checkbox } from '../ui/checkbox'

interface LoginFormProps {
    onSwitchToSignUp: () => void
    onSwitchToForgotPassword: () => void
}

export function LoginForm({ onSwitchToSignUp, onSwitchToForgotPassword }: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const { signIn } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await signIn(email, password)

        if (error) {
            setError(error.message)
        } else {
            // 登录成功后清除表单数据
            setEmail('')
            setPassword('')
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
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-5 w-5 z-10" />
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
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-5 w-5 z-10" />
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

                {/* 记住我和忘记密码行 */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="rememberMe"
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        />
                        <Label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-400">
                            <MixedText text="记住我" />
                        </Label>
                    </div>
                    <button
                        type="button"
                        onClick={onSwitchToForgotPassword}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                    >
                        <MixedText text="忘记密码？" />
                    </button>
                </div>

                {/* 登录按钮 */}
                <div className="w-full mb-4">
                    <RainbowButton
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        <MixedText text={loading ? '登录中...' : '登录'} />
                    </RainbowButton>
                </div>

                {/* 注册链接 */}
                <div className="text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        <MixedText text="还没有账号？" />
                    </span>
                    <button
                        type="button"
                        onClick={onSwitchToSignUp}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline ml-1"
                    >
                        <MixedText text="现在注册" />
                    </button>
                </div>
            </form>
        </div>
    )
} 