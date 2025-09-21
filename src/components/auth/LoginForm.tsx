'use client'

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import { RainbowButton } from '../ui/rainbow-button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { MixedText } from '../ui/MixedText'
import { Checkbox } from '@/components/animate-ui/components/radix/checkbox'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotification } from '../magicui/NotificationProvider'
import { useLoading } from '../../hooks/useLoading'
import { useToast } from '../../hooks/useToast'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface LoginFormProps {
    onSwitchToSignUp?: () => void
    onSwitchToForgotPassword?: () => void
}

export function LoginForm({ onSwitchToSignUp, onSwitchToForgotPassword }: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const { signIn } = useAuth()
    const router = useRouter()
    const { notify, notifyLoading, updateToSuccess, updateToError } = useNotification()
    const { loading, withLoading } = useLoading()
    const { showError } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate fields before submitting
        if (!email.trim()) {
            showError('请输入邮箱地址')
            return
        }

        if (!password.trim()) {
            showError('请输入密码')
            return
        }

        await withLoading(async () => {
            // Show loading toast
            const loadingToastId = notifyLoading?.('正在登录中，请稍候...')

            try {
                const result = await signIn(email, password)
                if (!result.success) {
                    // Update to error toast or show error notification
                    if (loadingToastId && updateToError) {
                        updateToError(loadingToastId, '登录失败', result.error || '请检查邮箱和密码后重试')
                    } else {
                        notify({
                            type: 'error',
                            message: '登录失败',
                            description: result.error || '请检查邮箱和密码后重试'
                        })
                    }
                } else {
                    // Update to success toast or show success notification
                    if (loadingToastId && updateToSuccess) {
                        updateToSuccess(loadingToastId, '登录成功')
                    } else {
                        notify({
                            type: 'success',
                            message: '登录成功'
                        })
                    }
                    router.push('/')
                }
            } catch (err) {
                console.error('Unexpected error during login:', err)
                // Update to error toast or show error notification
                if (loadingToastId && updateToError) {
                    updateToError(loadingToastId, '登录失败', '网络错误，请稍后重试')
                } else {
                    notify({
                        type: 'error',
                        message: '登录失败',
                        description: '网络错误，请稍后重试'
                    })
                }
            }
        })
    }

    return (
        <div className="w-full">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-neutral-200 unselectable">
                <MixedText text="欢迎回来" />
            </h2>
            <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300 unselectable">
                <MixedText text="请登录您的账号开始记录" />
            </p>

            <form className="my-6" onSubmit={handleSubmit}>
                <LabelInputContainer className="mb-4">
                    <Label htmlFor="email" className="unselectable">
                        <MixedText text="邮箱地址" />
                    </Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4 z-10" />
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="请输入邮箱"
                            className="pl-10"
                        />
                    </div>
                </LabelInputContainer>

                <LabelInputContainer className="mb-4">
                    <Label htmlFor="password" className="unselectable">
                        <MixedText text="密码" />
                    </Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4 z-10" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            className="pl-10 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </LabelInputContainer>

                {/* 记住我和忘记密码行 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="rememberMe"
                            size="sm"
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        />
                        <Label htmlFor="rememberMe" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 unselectable">
                            <MixedText text="记住我" />
                        </Label>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onSwitchToForgotPassword}
                        className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto rounded-full unselectable"
                    >
                        <MixedText text="忘记密码？" />
                    </Button>
                </div>

                {/* 登录按钮 */}
                <RainbowButton
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full rounded-full unselectable text-base font-semibold"
                >
                    <MixedText text={loading ? '登录中...' : '登录'} />
                </RainbowButton>

                <div className="my-4 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

                {/* 注册按钮 */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={onSwitchToSignUp}
                    className="group/btn shadow-input relative flex h-10 w-full items-center justify-center space-x-2 rounded-full bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626] unselectable"
                >
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        <MixedText text="注册账号" />
                    </span>
                </Button>
            </form>
        </div>
    )
}


const LabelInputContainer = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn("flex w-full flex-col space-y-2", className)}>
            {children}
        </div>
    );
};
