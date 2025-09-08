'use client'

import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { OTPInput } from '../ui/OTPInput'

import { MixedText } from '../ui/MixedText'
import { UiverseSpinner } from '../ui/UiverseSpinner'

interface EmailVerificationFormProps {
    email: string
    onBack: () => void
    onSuccess: () => void
    mode: 'signup' | 'login'
}

export function EmailVerificationForm({ email, onBack, onSuccess, mode }: EmailVerificationFormProps) {
    const [verificationCode, setVerificationCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [resendCooldown, setResendCooldown] = useState(0)

    // 重新发送验证码
    const resendCode = async () => {
        if (resendCooldown > 0) return

        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: mode === 'signup',
                }
            })

            if (error) {
                setError(error.message)
            } else {
                setSuccess('验证码已重新发送，请检查邮箱')
                setResendCooldown(60) // 60秒冷却时间
            }
        } catch (err) {
            setError('发送验证码失败，请稍后重试')
        } finally {
            setIsLoading(false)
        }
    }

    // 验证验证码
    const verifyCode = async () => {
        if (!verificationCode.trim()) {
            setError('请输入验证码')
            return
        }

        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: verificationCode.trim(),
                type: 'email'
            })

            if (error) {
                setError(error.message)
            } else {
                setSuccess('验证成功！')
                // 延迟一点时间让用户看到成功消息
                setTimeout(() => {
                    onSuccess()
                }, 1000)
            }
        } catch (err) {
            setError('验证失败，请检查验证码是否正确')
        } finally {
            setIsLoading(false)
        }
    }

    // 倒计时效果
    React.useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    return (
        <div className="w-full">
            <div className="text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    <MixedText text={mode === 'signup' ? "验证邮箱" : "邮箱登录"} />
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    <MixedText text={`已向 ${email} 发送验证码，请检查邮箱`} />
                </p>
            </div>

            <div className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription className="text-xs sm:text-sm">
                            <MixedText text={error} />
                        </AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert>
                        <AlertDescription className="text-xs sm:text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <MixedText text={success} />
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    <div className="text-center">
                        <Label className="text-gray-700 dark:text-gray-300 text-sm sm:text-base block mb-4">
                            <MixedText text="请输入6位验证码" />
                        </Label>
                        <OTPInput
                            value={verificationCode}
                            onChange={setVerificationCode}
                            length={6}
                            className="mb-4"
                        />
                        <p className="text-xs text-muted-foreground">
                            <MixedText text="验证码已发送到您的邮箱，请检查收件箱或垃圾邮件文件夹" />
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <MixedText text="返回" />
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resendCode}
                            disabled={isLoading || resendCooldown > 0}
                            className="text-sm"
                        >
                            {resendCooldown > 0 ? `${resendCooldown}s` : <MixedText text="重新发送" />}
                        </Button>
                        <Button
                            type="button"
                            onClick={verifyCode}
                            disabled={isLoading}
                            variant="default"
                        >
                            {isLoading ? <><UiverseSpinner size="sm" className="mr-2 h-4 w-4" /> <MixedText text="验证中..." /></> : <MixedText text="验证" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
