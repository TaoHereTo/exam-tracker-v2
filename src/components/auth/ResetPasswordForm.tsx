'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react'
import { MixedText } from '../ui/MixedText'
import { UiverseSpinner } from '../ui/UiverseSpinner'
import { OTPInput } from '../ui/OTPInput'
import { Stepper, Step } from '../ui/Stepper'
import { useToast } from '../../hooks/useToast'
import { useLoading } from '../../hooks/useLoading'
import { useAuth } from '../../contexts/AuthContext'

interface ResetPasswordFormProps {
    onSwitchToLogin: () => void
}

export function ResetPasswordForm({ onSwitchToLogin }: ResetPasswordFormProps) {
    const [email, setEmail] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [resendCooldown, setResendCooldown] = useState(0)
    const [validationLoading, setValidationLoading] = useState(false)

    const { showError, showSuccess } = useToast()
    const { loading, withLoading } = useLoading()
    const { sendPasswordResetCode, verifyPasswordResetCode, updatePassword: updateUserPassword, signOut } = useAuth()

    // 倒计时效果
    useEffect(() => {
        let timer: NodeJS.Timeout
        if (resendCooldown > 0) {
            timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1)
            }, 1000)
        }
        return () => clearTimeout(timer)
    }, [resendCooldown])

    // 发送验证码
    const sendVerificationCode = async () => {
        if (!email.trim()) {
            showError('请输入邮箱地址')
            return false
        }

        setError('')

        try {
            await withLoading(async () => {
                const result = await sendPasswordResetCode(email)

                if (!result.success) {
                    if (result.error?.includes('rate limit') || result.error?.includes('too many requests')) {
                        showError('请求过于频繁，请稍后重试')
                    } else if (result.error?.includes('email') && result.error?.includes('invalid')) {
                        showError('邮箱格式不正确')
                    } else if (result.error?.includes('not found') || result.error?.includes('not exist')) {
                        // 为了安全，不显示用户不存在的错误
                        showSuccess('验证码已发送')
                        setResendCooldown(60) // 60秒倒计时
                        return
                    } else {
                        showError('发送失败，请稍后重试')
                    }
                    return
                }

                showSuccess('验证码已发送')
                setResendCooldown(60) // 60秒倒计时
            })
            return true
        } catch (error) {
            showError('发送失败，请稍后重试')
            return false
        }
    }


    // 重新发送验证码
    const resendCode = async () => {
        if (resendCooldown > 0) return
        await sendVerificationCode()
    }



    // 验证步骤1：邮箱
    const validateStep1 = async () => {
        setValidationLoading(true)
        try {
            if (!email.trim()) {
                showError('请输入邮箱地址')
                return false
            }

            // 检查邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email.trim())) {
                showError('请输入有效的邮箱地址')
                return false
            }

            // 直接发送验证码，不调用sendVerificationCode避免重复
            const result = await sendPasswordResetCode(email)
            if (!result.success) {
                if (result.error?.includes('rate limit') || result.error?.includes('too many requests')) {
                    showError('请求过于频繁，请稍后重试')
                } else if (result.error?.includes('email') && result.error?.includes('invalid')) {
                    showError('邮箱格式不正确')
                } else if (result.error?.includes('not found') || result.error?.includes('not exist')) {
                    // 为了安全，不显示用户不存在的错误
                    showSuccess('验证码已发送')
                    setResendCooldown(60) // 60秒倒计时
                    return true
                } else {
                    showError('发送失败，请稍后重试')
                }
                return false
            }

            showSuccess('验证码已发送')
            setResendCooldown(60) // 60秒倒计时
            return true
        } catch (error) {
            showError('验证失败')
            return false
        } finally {
            setValidationLoading(false)
        }
    }

    // 验证步骤2：验证码
    const validateStep2 = async () => {
        setValidationLoading(true)
        try {
            if (!verificationCode.trim()) {
                showError('请输入验证码')
                return false
            }

            const result = await verifyPasswordResetCode(email, verificationCode)
            if (result.success) {
                showSuccess('验证成功')
                return true
            } else {
                if (result.error?.includes('invalid') && result.error?.includes('code')) {
                    showError('验证码不正确')
                } else if (result.error?.includes('expired') || result.error?.includes('timeout')) {
                    showError('验证码已过期，请重新发送')
                } else {
                    showError('验证失败，请重试')
                }
                return false
            }
        } catch (error) {
            showError('验证失败')
            return false
        } finally {
            setValidationLoading(false)
        }
    }

    // 验证步骤3：密码
    const validateStep3 = async () => {
        setValidationLoading(true)
        try {
            if (!newPassword.trim()) {
                showError('请输入新密码')
                return false
            }

            if (newPassword.length < 6) {
                showError('密码长度至少6位')
                return false
            }

            if (newPassword !== confirmPassword) {
                showError('两次输入的密码不一致')
                return false
            }

            // 更新密码（Supabase会自动终止所有会话）
            const result = await updateUserPassword(newPassword)
            if (result.success) {
                showSuccess('密码重置成功，请使用新密码登录')

                // 延迟跳转到登录页面
                setTimeout(() => {
                    onSwitchToLogin()
                }, 2000)

                return true
            } else {
                showError('密码更新失败，请重试')
                return false
            }
        } catch (error) {
            showError('密码更新失败，请重试')
            return false
        } finally {
            setValidationLoading(false)
        }
    }

    return (
        <div className="w-full">
            <div className="text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    <MixedText text="重置密码" />
                </h2>
            </div>

            <Stepper
                initialStep={1}
                onFinalStepCompleted={() => { }}
                onBeforeNext={async (currentStep) => {
                    if (currentStep === 1) {
                        return await validateStep1()
                    } else if (currentStep === 2) {
                        return await validateStep2()
                    } else if (currentStep === 3) {
                        return await validateStep3()
                    }
                    return true
                }}
                backButtonText="上一步"
                nextButtonText="下一步"
                isLoading={validationLoading || loading}
            >

                {/* 第一步：邮箱输入 */}
                <Step>
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                输入邮箱地址
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                我们将向您的邮箱发送验证码
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription className="text-xs sm:text-sm">
                                    <MixedText text={error} />
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
                                />
                            </div>
                        </div>
                    </div>
                </Step>

                {/* 第二步：验证码验证 */}
                <Step>
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                验证码验证
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                请输入收到的6位验证码
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription className="text-xs sm:text-sm">
                                    <MixedText text={error} />
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="otp-input">
                                    <OTPInput
                                        value={verificationCode}
                                        onChange={setVerificationCode}
                                        length={6}
                                        className="mb-4"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    <MixedText text={`验证码已发送至 ${email}`} />
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resendCode}
                                disabled={loading || resendCooldown > 0}
                                className="text-sm"
                            >
                                {resendCooldown > 0 ? (
                                    <MixedText text={`重新发送 (${resendCooldown}s)`} />
                                ) : (
                                    <MixedText text="重新发送" />
                                )}
                            </Button>
                        </div>
                    </div>
                </Step>

                {/* 第三步：设置新密码 */}
                <Step>
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                设置新密码
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                请设置您的新密码
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription className="text-xs sm:text-sm">
                                    <MixedText text={error} />
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <MixedText text="新密码" />
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4 sm:h-5 sm:w-5 z-10" />
                                <Input
                                    id="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="请输入新密码（至少6位）"
                                    className="pl-10 pr-10 border-input-border focus:border-ring focus:ring-ring/50 text-sm sm:text-base h-9 sm:h-10"
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
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="请再次输入新密码"
                                    className="pl-10 pr-10 border-input-border focus:border-ring focus:ring-ring/50 text-sm sm:text-base h-9 sm:h-10"
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
                    </div>
                </Step>
            </Stepper>

            <div className="text-center mt-6">
                <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={onSwitchToLogin}
                >
                    <ArrowLeft className="h-4 w-4" />
                    <MixedText text="返回登录" />
                </Button>
            </div>
        </div>
    )
}
