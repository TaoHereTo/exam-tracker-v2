"use client";

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LoginForm } from '@/components/auth/LoginForm'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { StepperSignUpForm } from '@/components/auth/StepperSignUpForm'
import { MagicCard } from '@/components/magicui/magic-card'
import { motion, AnimatePresence } from 'motion/react'
import { BentoGrid, BentoCard } from '@/components/magicui/bento-grid'
import { useThemeMode } from '@/hooks/useThemeMode'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/magicui/NotificationProvider'
import { BarChart3, BookOpen, Calendar as CalendarIcon, BookCopy } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TimePicker } from '@/components/ui/TimePicker'
import { MODULES } from '@/config/exam'
import { UnifiedTable } from '@/components/ui/UnifiedTable'
import { ModulePieChart } from '@/components/ui/ModulePieChart'
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler'
import { zhCN } from 'date-fns/locale'

type AuthView = 'login' | 'signup' | 'forgot-password'

// Mock data for knowledge entries
const mockKnowledgeData = [
    { id: '1', module: '资料分析', type: '计算技巧', note: '快速计算百分比变化的方法' },
    { id: '2', module: '言语理解', type: '成语积累', note: '望洋兴叹：比喻做事时因力不胜任或没有条件而感到无可奈何' },
    { id: '3', module: '判断推理', type: '图形推理', note: '对称轴旋转规律' },
    { id: '4', module: '数量关系', type: '数学公式', note: '等差数列求和公式：Sn=n(a1+an)/2' },
    { id: '5', module: '政治理论', type: '重要会议', note: '十九大报告提出的新时代中国特色社会主义思想' },
    { id: '6', module: '常识判断', type: '历史知识', note: '中国四大发明：造纸术、指南针、火药、印刷术' },
]

// Mock data for study plans
const mockPlans = [
    { id: '1', name: '资料分析专项训练', module: 'data-analysis', progress: 65, target: 100, status: '进行中' },
    { id: '2', name: '言语理解提升计划', module: 'verbal', progress: 15, target: 50, status: '进行中' }
]

function AuthPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, loading } = useAuth()
    const { notify } = useNotification()
    const { isDarkMode, getBackgroundStyle } = useThemeMode()

    // 从 URL 参数获取初始视图，默认为登录
    const [currentView, setCurrentView] = useState<AuthView>(() => {
        const viewParam = searchParams.get('view') as AuthView
        return viewParam || 'login'
    })


    // 登录成功后跳转到主页面（但不在密码重置流程中跳转）
    useEffect(() => {
        if (!loading && user && currentView !== 'forgot-password') {
            router.replace('/')
        }
    }, [loading, user, router, currentView])

    // Function to show login notification
    const showLoginNotification = () => {
        notify({
            type: "info",
            message: "登录账号后开始记录",
            icon: "flower"
        })
    }

    // 视图切换函数
    const switchToLogin = () => setCurrentView('login')
    const switchToSignup = () => setCurrentView('signup')
    const switchToForgotPassword = () => setCurrentView('forgot-password')

    return (
        <div className="min-h-screen flex flex-col lg:flex-row relative" style={getBackgroundStyle()}>
            {/* 顶部右侧应用图标和主题切换器 */}
            <div className="absolute right-4 top-4 z-[50] inline-flex items-center gap-3">
                <Link href="/" className="inline-flex items-center gap-3">
                    <Image src="/trace.svg" alt="App Icon" className="h-10 w-10 sm:h-12 sm:w-12" width={48} height={48} />
                    <span className="hidden sm:inline text-lg sm:text-xl font-semibold text-foreground/90">行测每日记录</span>
                </Link>
                <AnimatedThemeToggler className="w-8 h-8" />
            </div>

            {/* 左侧功能展示 */}
            <div className="flex-1 flex items-center justify-center p-4 lg:p-8 order-2 lg:order-1">
                <div className="w-full max-w-4xl">
                    <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-4">
                        <BentoCard
                            name="刷题记录"
                            className="col-span-1 md:col-span-2"
                            background={(
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-md bg-background/60">
                                    <div className="absolute left-10 top-7 w-full origin-top-left scale-100 rounded-md blur-sm transition-all duration-300 ease-out group-hover:blur-none">
                                        <Card className="p-4 w-full max-w-[70%] transition-all duration-300 ease-out ml-8">
                                            <div className="space-y-3">
                                                <div>
                                                    <Label className="text-sm">模块</Label>
                                                    <Select defaultValue="data-analysis">
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder="选择模块" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {MODULES.map(module => (
                                                                <SelectItem key={module.value} value={module.value} className="text-sm">
                                                                    {module.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label className="text-sm">日期</Label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button className="w-full flex items-center justify-start text-left font-normal border px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-md h-9 bg-white dark:bg-[#303030] mt-1">
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                <span className="text-muted-foreground text-sm">选择日期</span>
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar mode="single" captionLayout="dropdown" selected={new Date()} onSelect={() => { }} initialFocus={false} locale={zhCN} />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-sm">总题数</Label>
                                                        <Input type="number" className="h-9 text-sm" defaultValue="20" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm">正确数</Label>
                                                        <Input type="number" className="h-9 text-sm" defaultValue="18" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-sm">做题时长</Label>
                                                    <TimePicker value="" placeholder="选择时长" className="h-9 text-sm" />
                                                </div>
                                                <div className="pt-2">
                                                    <Button className="w-full h-9 text-sm rounded-full">添加记录</Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            )}
                            Icon={BarChart3}
                            description="记录每日刷题数据"
                            cta="开始使用"
                            titleClassName="text-[#404040] dark:text-white"
                            descriptionClassName="text-[#404040]/80 dark:text-white/60"
                            iconClassName="text-[#404040] dark:text-white"
                            onCtaClick={showLoginNotification}
                        />
                        <BentoCard
                            name="学习计划"
                            className="col-span-1"
                            background={(
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-md bg-background/40 dark:bg-background/30">
                                    <div className="absolute left-6 top-6 w-full h-full origin-top-left scale-110 rounded-md blur-sm transition-all duration-300 ease-out group-hover:blur-none">
                                        <div className="flex-1 overflow-hidden w-full max-w-[90%] bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-md border border-white/40 dark:border-white/30 rounded-lg p-3 transition-all duration-300 ease-out">
                                            <div className="space-y-3">
                                                {mockPlans.map((plan) => (
                                                    <div key={plan.id} className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-medium text-[#404040] dark:text-white">{plan.name}</span>
                                                            <span className="text-xs text-[#404040]/60 dark:text-white/60">{plan.progress}/{plan.target}</span>
                                                        </div>
                                                        <Progress value={(plan.progress / plan.target) * 100} className="h-1.5" />
                                                        <span className="text-xs text-[#404040]/60 dark:text-white/60">{plan.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            Icon={CalendarIcon}
                            description="制定学习计划"
                            cta="创建计划"
                            titleClassName="text-[#404040] dark:text-white"
                            descriptionClassName="text-[#404040]/80 dark:text-white/60"
                            iconClassName="text-[#404040] dark:text-white"
                            onCtaClick={showLoginNotification}
                        />
                        <BentoCard
                            name="数据图表"
                            className="col-span-1"
                            background={(
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-md bg-background/40 dark:bg-background/30">
                                    <div className="w-full h-full flex items-center justify-center p-0">
                                        <div className="w-full h-full bg-white/50 dark:bg-[#101010] backdrop-blur-md rounded-lg p-0 blur-sm transition-all duration-300 ease-out group-hover:blur-none flex items-center justify-center">
                                            <ModulePieChart
                                                data={[
                                                    { date: '2023-01-01', module: '资料分析', score: 1.5, duration: 25 },
                                                    { date: '2023-01-02', module: '政治理论', score: 1.2, duration: 30 },
                                                    { date: '2023-01-03', module: '数量关系', score: 1.8, duration: 20 },
                                                    { date: '2023-01-04', module: '常识判断', score: 1.6, duration: 28 },
                                                    { date: '2023-01-05', module: '言语理解', score: 1.3, duration: 32 },
                                                    { date: '2023-01-06', module: '判断推理', score: 1.7, duration: 22 }
                                                ]}
                                                showLegend={false}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            Icon={BarChart3}
                            description="图表展示学习趋势"
                            cta="了解更多"
                            titleClassName="text-[#404040] dark:text-white"
                            descriptionClassName="text-[#404040]/80 dark:text-white/60"
                            iconClassName="text-[#404040] dark:text-white"
                            onCtaClick={showLoginNotification}
                        />
                        <BentoCard
                            name="知识点录入"
                            className="col-span-1 md:col-span-2"
                            background={(
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-md bg-background/40 dark:bg-background/30">
                                    <div className="absolute left-10 top-10 w-full h-full origin-top-left scale-110 rounded-md blur-sm transition-all duration-300 ease-out group-hover:blur-none">
                                        <div className="flex-1 overflow-hidden w-full max-w-[90%] bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-md border border-white/40 dark:border-white/30 rounded-lg p-2 transition-all duration-300 ease-out">
                                            <UnifiedTable
                                                columns={[
                                                    { key: 'module', label: '模块', className: 'w-24 text-xs' },
                                                    { key: 'type', label: '类型', className: 'w-28 text-xs' },
                                                    { key: 'note', label: '笔记', className: 'w-48 text-xs' }
                                                ]}
                                                data={mockKnowledgeData}
                                                selected={[]}
                                                onSelect={() => { }}
                                                rowKey={(row) => row.id}
                                                selectable={false}
                                                className="text-xs bg-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            Icon={BookOpen}
                            description="便捷录入和整理知识点"
                            cta="开始使用"
                            titleClassName="text-[#404040] dark:text-white"
                            descriptionClassName="text-[#404040]/80 dark:text-white/60"
                            iconClassName="text-[#404040] dark:text-white"
                            onCtaClick={showLoginNotification}
                        />
                    </BentoGrid>
                </div>
            </div>

            {/* 右侧认证表单 */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 order-1 lg:order-2">
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
                    <motion.div
                        animate={{ height: 'auto' }}
                        transition={{ type: 'spring', duration: 0.4 }}
                        style={{ position: 'relative', overflow: 'hidden' }}
                    >
                        <MagicCard className="rounded-xl w-full overflow-hidden" gradientSize={240} gradientColor="rgba(0, 0, 0, 0.08)" gradientOpacity={0.5}>
                            <div className="w-full p-6 sm:p-8">
                                {currentView === 'signup' ? (
                                    <StepperSignUpForm onSwitchToLogin={switchToLogin} />
                                ) : currentView === 'forgot-password' ? (
                                    <ResetPasswordForm onSwitchToLogin={switchToLogin} />
                                ) : (
                                    <LoginForm onSwitchToSignUp={switchToSignup} onSwitchToForgotPassword={switchToForgotPassword} />
                                )}
                            </div>
                        </MagicCard>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
            <AuthPageContent />
        </Suspense>
    )
}
