'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Mail, Lock, Eye, EyeOff, User, CheckCircle, ArrowLeft } from 'lucide-react'
import { MixedText } from '../ui/MixedText'
import { UiverseSpinner } from '../ui/UiverseSpinner'
import { Stepper, Step } from '../ui/Stepper'
import { OTPInput } from '../ui/OTPInput'
import { useLoading } from '../../hooks/useLoading'
import { useToast } from '../../hooks/useToast'
import toast from 'react-hot-toast'

interface StepperSignUpFormProps {
    onSwitchToLogin: () => void
}

export function StepperSignUpForm({ onSwitchToLogin }: StepperSignUpFormProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [validationLoading, setValidationLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentStep, setCurrentStep] = useState(1)
    const [resendCooldown, setResendCooldown] = useState(0)

    const { loading: isLoading, withLoading } = useLoading()
    const { showError, showSuccess } = useToast()
    const [otpUIVisible, setOtpUIVisible] = useState(false)

    // Reset cooldown when component mounts
    useEffect(() => {
        setResendCooldown(0);
        setVerificationCode('');
        setOtpUIVisible(false);
    }, []); // Only run on mount

    // Reset verification code when email changes
    useEffect(() => {
        setVerificationCode('');
        // Only reset OTP UI visibility if we're not on step 3
        if (currentStep !== 3) {
            setOtpUIVisible(false);
            // Also reset cooldown when email changes and we're not on step 3
            setResendCooldown(0);
        }
    }, [email, currentStep]);

    // 发送验证码
    const sendVerificationCode = async () => {
        if (resendCooldown > 0) {
            showError(`请等待 ${resendCooldown} 秒后重试`);
            return;
        }

        await withLoading(async () => {
            setError('')

            try {
                const { error } = await supabase.auth.signInWithOtp({
                    email: email.trim(),
                    options: {
                        shouldCreateUser: true,
                    }
                })

                if (error) {
                    setError(error.message)
                    // Translate common Supabase error messages to Chinese
                    if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
                        showError('请求过于频繁，请稍后重试')
                    } else if (error.message.includes('email') && error.message.includes('invalid')) {
                        showError('邮箱格式不正确')
                    } else {
                        showError('发送失败，请稍后重试')
                    }
                } else {
                    showSuccess('验证码已发送')
                    setOtpUIVisible(true)
                    // Use a small delay to ensure the UI state is properly set before starting cooldown
                    setTimeout(() => {
                        setResendCooldown(60) // 60秒冷却时间
                    }, 50)
                }
            } catch (err) {
                setError('发送失败，请稍后重试')
                showError('发送失败，请稍后重试')
            }
        })
    }



    // 验证验证码
    const verifyCode = async () => {
        if (!verificationCode.trim()) {
            showError('请输入验证码')
            return false
        }

        setValidationLoading(true)
        setError('')

        let result = false
        try {
            await withLoading(async () => {
                const { error } = await supabase.auth.verifyOtp({
                    email: email.trim().toLowerCase(),
                    token: verificationCode.trim(),
                    type: 'email'
                })

                if (error) {
                    setError(error.message)
                    // Translate common Supabase error messages to Chinese
                    if (error.message.includes('invalid') && error.message.includes('code')) {
                        showError('验证码不正确')
                    } else if (error.message.includes('expired') || error.message.includes('timeout')) {
                        showError('验证码已过期，请重新发送')
                    } else {
                        showError('验证失败，请重试')
                    }
                    return
                }

                // 验证成功后，当前用户已通过 OTP 登录，立即为其设置密码
                const normalizedPassword = password.trim()
                if (!normalizedPassword || normalizedPassword.length < 6) {
                    showError('密码无效，请返回上一步重新设置密码')
                    return
                }

                const { error: updateError } = await supabase.auth.updateUser({ password: normalizedPassword })
                if (updateError) {
                    setError(updateError.message)
                    if (updateError.message.toLowerCase().includes('weak')) {
                        showError('密码强度不够，请返回上一步重新设置')
                    } else {
                        showError('设置密码失败，请重试')
                    }
                    return
                }

                showSuccess('验证成功，密码已设置')
                result = true
            })

            return result
        } catch (err) {
            setError('验证失败，请重试')
            showError('验证失败，请重试')
            return false
        } finally {
            setValidationLoading(false)
        }
    }

    // 检查用户是否存在 - 验证邮箱是否已被注册
    const checkUserExists = async (email: string): Promise<boolean> => {
        try {
            const emailToCheck = email.trim()

            // 检查邮箱格式是否有效
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(emailToCheck)) {
                toast.error('请输入有效的邮箱地址')
                return true // 返回true阻止继续
            }

            // 调用后端 API 使用 service role 检查
            const res = await fetch(`/api/check-email?email=${encodeURIComponent(emailToCheck)}`)
            if (!res.ok) {
                // Don't show error for backend unavailable to avoid confusion
                return false
            }
            const data = await res.json() as { exists?: boolean; error?: string }
            if (data?.error) {
                // Don't show specific error details to user
                return false
            }
            if (data?.exists) {
                toast.error('此邮箱已被使用，请返回登录')
                return true
            }
            return false
        } catch (err) {
            // Don't show network errors to user to avoid confusion
            return false
        }
    }

    // 密码注册
    const handlePasswordSignUp = async () => {
        setError('')

        if (!email.trim()) {
            setError('请输入邮箱地址')
            showError('请输入邮箱地址')
            return false
        }

        if (!password.trim()) {
            setError('请输入密码')
            showError('请输入密码')
            return false
        }

        if (password !== confirmPassword) {
            setError('两次输入的密码不一致')
            showError('两次输入的密码不一致')
            return false
        }

        if (password.length < 6) {
            setError('密码长度至少6位')
            showError('密码长度至少6位')
            return false
        }

        let result = false
        try {
            await withLoading(async () => {
                const { data, error } = await supabase.auth.signUp({
                    email: email.trim(),
                    password: password.trim(),
                })

                if (error) {
                    setError(error.message)
                    // Check if it's a duplicate user error
                    if (error.message.includes('already') || error.message.includes('exists')) {
                        showError('此邮箱已被使用，请返回登录')
                    } else if (error.message.includes('weak password')) {
                        showError('密码强度不够')
                    } else if (error.message.includes('email') && error.message.includes('invalid')) {
                        showError('邮箱格式不正确')
                    } else {
                        showError('注册失败，请稍后重试')
                    }
                    return
                } else {
                    setError('')
                    showSuccess('注册成功！请检查邮箱')
                    result = true
                }
            })

            return result
        } catch (err) {
            setError('注册失败，请稍后重试')
            showError('注册失败，请稍后重试')
            return false
        }
    }

    const handleStepChange = (step: number) => {
        setCurrentStep(step)
        setError('')
        // Reset cooldown when entering verification step if no code has been sent and OTP UI is not visible
        if (step === 3 && !verificationCode && !otpUIVisible) {
            setResendCooldown(0);
            // Don't reset otpUIVisible here as it should persist when navigating between steps
        }
        // Reset verification code and cooldown when leaving step 3
        if (currentStep === 3 && step !== 3) {
            setVerificationCode('');
            setOtpUIVisible(false);
            setResendCooldown(0);
        }
    }

    const handleFinalStepCompleted = async () => {
        const success = await handlePasswordSignUp()
        if (success) {
            // 注册成功，显示成功信息
            setError('注册成功！请检查您的邮箱以验证账户')
            // 清空表单
            setEmail('')
            setPassword('')
            setConfirmPassword('')
        }
    }

    const validateStep1 = async () => {
        setValidationLoading(true)

        try {
            if (!email.trim()) {
                toast.error('请输入邮箱地址')
                return false
            }

            // 检查邮箱格式是否有效
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            const isValidEmail = emailRegex.test(email.trim())

            if (!isValidEmail) {
                toast.error('请输入有效的邮箱地址')
                return false
            }

            // 检查用户是否已经存在
            const userExists = await checkUserExists(email)
            if (userExists) {
                return false
            }

            // 邮箱格式有效且未被注册，可以继续
            return true
        } catch (error) {
            console.error('验证第1步失败:', error)
            toast.error('验证失败')
            return false
        } finally {
            setValidationLoading(false)
        }
    }

    const validateStep2 = async () => {
        setValidationLoading(true)

        try {
            if (!password.trim()) {
                toast.error('请输入密码')
                return false
            }
            if (password !== confirmPassword) {
                toast.error('两次输入的密码不一致')
                return false
            }
            if (password.length < 6) {
                toast.error('密码长度至少6位')
                return false
            }

            // 密码验证通过，直接进入下一步
            toast.success('密码设置完成！')
            return true
        } catch (error) {
            console.error('验证第2步失败:', error)
            toast.error('验证失败')
            return false
        } finally {
            setValidationLoading(false)
        }
    }

    // 倒计时效果
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendCooldown > 0) {
            timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1)
            }, 1000)
        }
        return () => {
            if (timer) clearTimeout(timer)
        }
    }, [resendCooldown])

    const handleNextStep = async () => {
        if (currentStep === 1) {
            const isValid = await validateStep1();
            if (!isValid) {
                return;
            }
        }
        if (currentStep === 2) {
            const isValid = await validateStep2();
            if (!isValid) {
                return;
            }
        }
        // 如果验证通过，stepper会自动处理下一步
    }

    return (
        <div className="w-full">
            <div className="text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    创建账户
                </h2>
            </div>

            <Stepper
                initialStep={1}
                onStepChange={handleStepChange}
                onFinalStepCompleted={handleFinalStepCompleted}
                onBeforeNext={async (currentStep) => {
                    if (currentStep === 1) {
                        return validateStep1()
                    } else if (currentStep === 2) {
                        return validateStep2()
                    } else if (currentStep === 3) {
                        return await verifyCode()
                    }
                    return true
                }}
                backButtonText="上一步"
                nextButtonText="下一步"
                isLoading={validationLoading || isLoading}
            >
                {/* 第一步：邮箱和用户名 */}
                <Step>
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                基本信息
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                请填写您的邮箱地址
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
                                    placeholder="请输入邮箱"
                                    className="pl-10 border-input-border focus:border-ring focus:ring-ring/50 text-sm sm:text-base h-9 sm:h-10"
                                />
                            </div>
                        </div>
                    </div>
                </Step>

                {/* 第二步：密码设置 */}
                <Step>
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                设置密码
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                请设置您的登录密码
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
                            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <MixedText text="密码" />
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4 sm:h-5 sm:w-5 z-10" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="请输入密码"
                                    className="pl-10 pr-10 border-input-border focus:border-ring focus:ring-ring/50 text-sm sm:text-base h-9 sm:h-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 z-10"
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
                                    placeholder="请确认密码"
                                    className="pl-10 pr-10 border-input-border focus:border-ring focus:ring-ring/50 text-sm sm:text-base h-9 sm:h-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 z-10"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </Step>

                {/* 第三步：邮箱验证 */}
                <Step>
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                邮箱验证
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                向 {email} 发送验证码
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
                                <div className="mb-6">
                                    {!otpUIVisible ? (
                                        <Button
                                            type="button"
                                            onClick={sendVerificationCode}
                                            disabled={isLoading}
                                            className="mb-4"
                                        >
                                            {isLoading ? <><UiverseSpinner size="sm" className="mr-2 h-4 w-4" /> 发送中...</> : '发送验证码'}
                                        </Button>
                                    ) : (
                                        <>
                                            <Label className="text-gray-700 dark:text-gray-300 text-sm sm:text-base block mb-4">
                                                <MixedText text="请输入6位验证码" />
                                            </Label>
                                            <div className="otp-input">
                                                <OTPInput
                                                    value={verificationCode}
                                                    onChange={setVerificationCode}
                                                    length={6}
                                                    className="mb-4"
                                                />
                                            </div>
                                        </>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {otpUIVisible
                                            ? (resendCooldown > 0
                                                ? `${resendCooldown}秒后可重新发送`
                                                : '验证码已发送，请检查邮箱')
                                            : '点击发送验证码'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {otpUIVisible && (
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={sendVerificationCode}
                                    disabled={isLoading || resendCooldown > 0 || !otpUIVisible}
                                    className="text-sm"
                                >
                                    {resendCooldown > 0 ? `${resendCooldown}s` : '重新发送'}
                                </Button>
                            </div>
                        )}
                    </div>
                </Step>

                {/* 第四步：完成注册 */}
                <Step>
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                完成注册
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                确认信息并完成账户创建
                            </p>
                        </div>

                        {error && (
                            <Alert variant={error === '注册成功！请检查您的邮箱以验证账户' ? 'default' : 'destructive'}>
                                <AlertDescription className="text-xs sm:text-sm">
                                    <MixedText text={error} />
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">邮箱地址:</span>
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{email}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">密码:</span>
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">已设置</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">邮箱验证:</span>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">已验证</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                点击"完成"按钮创建您的账户
                            </p>
                        </div>
                    </div>
                </Step>
            </Stepper>

            <div className="text-center mt-6">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <MixedText text="已有账号？" />
                </span>
                <button
                    onClick={onSwitchToLogin}
                    className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 underline ml-1 hover:text-blue-800 dark:hover:text-blue-300"
                >
                    <MixedText text="返回登录" />
                </button>
            </div>
        </div>
    )
}