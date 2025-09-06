'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { MagicCard } from '../magicui/magic-card'
import { BentoGrid, BentoCard } from '../magicui/bento-grid'
import { useThemeMode } from '@/hooks/useThemeMode'
import { useAuth } from '@/contexts/AuthContext'
import { BarChart3, BookOpen, Calendar as CalendarIcon, TrendingUp, FileText, Target, BookCopy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TimePicker } from '@/components/ui/TimePicker'
import { MODULES } from '@/config/exam'
import { MixedText } from '@/components/ui/MixedText'
import { UnifiedTable } from '@/components/ui/UnifiedTable'
import type { RecordItem } from '@/types/record'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface AuthPageProps {
    initialView?: 'login' | 'signup' | 'forgot-password'
}

// Mock data for charts with more dates
const mockChartData = [
    { date: '01/01', module: '资料分析', score: 1.2 },
    { date: '01/02', module: '资料分析', score: 1.5 },
    { date: '01/03', module: '资料分析', score: 1.8 },
    { date: '01/04', module: '资料分析', score: 1.6 },
    { date: '01/05', module: '资料分析', score: 1.7 },
    { date: '01/06', module: '资料分析', score: 1.9 },
    { date: '01/07', module: '资料分析', score: 1.4 },
    { date: '01/08', module: '资料分析', score: 1.6 },
    { date: '01/09', module: '资料分析', score: 1.8 },
    { date: '01/10', module: '资料分析', score: 1.5 },
    { date: '01/11', module: '资料分析', score: 1.7 },
    { date: '01/12', module: '资料分析', score: 1.9 },
    { date: '01/13', module: '资料分析', score: 1.6 },
    { date: '01/14', module: '资料分析', score: 1.8 },
    { date: '01/15', module: '资料分析', score: 1.7 },
    { date: '01/16', module: '资料分析', score: 1.9 },
    { date: '01/17', module: '资料分析', score: 1.6 },
    { date: '01/18', module: '资料分析', score: 1.8 },
    { date: '01/19', module: '资料分析', score: 1.7 },
    { date: '01/20', module: '资料分析', score: 2.0 },
    { date: '01/01', module: '言语理解', score: 0.8 },
    { date: '01/02', module: '言语理解', score: 0.9 },
    { date: '01/03', module: '言语理解', score: 1.1 },
    { date: '01/04', module: '言语理解', score: 1.0 },
    { date: '01/05', module: '言语理解', score: 1.2 },
    { date: '01/06', module: '言语理解', score: 1.3 },
    { date: '01/07', module: '言语理解', score: 1.1 },
    { date: '01/08', module: '言语理解', score: 1.0 },
    { date: '01/09', module: '言语理解', score: 1.2 },
    { date: '01/10', module: '言语理解', score: 1.1 },
    { date: '01/11', module: '言语理解', score: 1.3 },
    { date: '01/12', module: '言语理解', score: 1.2 },
    { date: '01/13', module: '言语理解', score: 1.1 },
    { date: '01/14', module: '言语理解', score: 1.3 },
    { date: '01/15', module: '言语理解', score: 1.2 },
    { date: '01/16', module: '言语理解', score: 1.4 },
    { date: '01/17', module: '言语理解', score: 1.3 },
    { date: '01/18', module: '言语理解', score: 1.2 },
    { date: '01/19', module: '言语理解', score: 1.4 },
    { date: '01/20', module: '言语理解', score: 1.3 },
    { date: '01/01', module: '判断推理', score: 1.0 },
    { date: '01/02', module: '判断推理', score: 1.2 },
    { date: '01/03', module: '判断推理', score: 1.4 },
    { date: '01/04', module: '判断推理', score: 1.3 },
    { date: '01/05', module: '判断推理', score: 1.5 },
    { date: '01/06', module: '判断推理', score: 1.6 },
    { date: '01/07', module: '判断推理', score: 1.4 },
    { date: '01/08', module: '判断推理', score: 1.3 },
    { date: '01/09', module: '判断推理', score: 1.5 },
    { date: '01/10', module: '判断推理', score: 1.4 },
    { date: '01/11', module: '判断推理', score: 1.6 },
    { date: '01/12', module: '判断推理', score: 1.5 },
    { date: '01/13', module: '判断推理', score: 1.4 },
    { date: '01/14', module: '判断推理', score: 1.6 },
    { date: '01/15', module: '判断推理', score: 1.5 },
    { date: '01/16', module: '判断推理', score: 1.7 },
    { date: '01/17', module: '判断推理', score: 1.6 },
    { date: '01/18', module: '判断推理', score: 1.5 },
    { date: '01/19', module: '判断推理', score: 1.7 },
    { date: '01/20', module: '判断推理', score: 1.6 },
];

// Mock data for knowledge entries
const mockKnowledgeData = [
    { id: '1', module: '资料分析', type: '计算技巧', note: '快速计算百分比变化的方法' },
    { id: '2', module: '言语理解', type: '成语积累', note: '望洋兴叹：比喻做事时因力不胜任或没有条件而感到无可奈何' },
    { id: '3', module: '判断推理', type: '图形推理', note: '对称轴旋转规律' },
    { id: '4', module: '数量关系', type: '数学公式', note: '等差数列求和公式：Sn=n(a1+an)/2' },
    { id: '5', module: '政治理论', type: '重要会议', note: '十九大报告提出的新时代中国特色社会主义思想' },
    { id: '6', module: '常识判断', type: '历史知识', note: '中国四大发明：造纸术、指南针、火药、印刷术' },
]

// Mock data for study plans with more different progress values
const mockPlans = [
    { id: '1', name: '资料分析专项训练', module: 'data-analysis', progress: 65, target: 100, status: '进行中' },
    { id: '2', name: '言语理解提升计划', module: 'verbal', progress: 15, target: 50, status: '进行中' }, // Reduced progress from 30 to 15
]

export function AuthPage({ initialView }: AuthPageProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, loading } = useAuth()
    const { isDarkMode, getBackgroundStyle } = useThemeMode();

    // Determine the current view based on the pathname
    const getDefaultView = useCallback(() => {
        if (initialView) return initialView
        if (pathname?.includes('/signup')) return 'signup'
        if (pathname?.includes('/forgot-password')) return 'forgot-password'
        return 'login'
    }, [initialView, pathname])

    const [currentView, setCurrentView] = useState<'login' | 'signup' | 'forgot-password'>(getDefaultView())

    // Update the view when the pathname changes
    useEffect(() => {
        setCurrentView(getDefaultView())
    }, [getDefaultView])

    // 登录成功后跳转到主页面
    useEffect(() => {
        if (!loading && user) {
            router.replace('/')
        }
    }, [loading, user, router])

    return (
        <div className="min-h-screen flex flex-col lg:flex-row relative" style={getBackgroundStyle() as React.CSSProperties}>
            {/* 顶部左侧应用图标 */}
            <Link href="/" className="absolute left-4 top-4 z-[3] inline-flex items-center gap-3">
                <Image src="/trace.svg" alt="App Icon" className="h-10 w-10 sm:h-12 sm:w-12" width={48} height={48} />
                <span className="hidden sm:inline text-lg sm:text-xl font-semibold text-foreground/90">行测每日记录</span>
            </Link>

            {/* 左侧登录表单 */}
            <div className="flex-1 flex items-center justify-center p-4 lg:p-8 order-2 lg:order-1">
                <div className="w-full max-w-md">
                    <MagicCard
                        className="rounded-xl w-full p-6 sm:p-8"
                        gradientSize={240}
                        gradientColor="rgba(0, 0, 0, 0.08)"
                        gradientOpacity={0.5}
                    >
                        <div className="w-full">
                            {currentView === 'login' && (
                                <LoginForm
                                    onSwitchToSignUp={() => setCurrentView('signup')}
                                    onSwitchToForgotPassword={() => setCurrentView('forgot-password')}
                                />
                            )}
                            {currentView === 'signup' && (
                                <SignUpForm onSwitchToLogin={() => setCurrentView('login')} />
                            )}
                            {currentView === 'forgot-password' && (
                                <ForgotPasswordForm onSwitchToLogin={() => setCurrentView('login')} />
                            )}
                        </div>
                    </MagicCard>
                </div>
            </div>

            {/* 右侧功能展示 */}
            <div className="flex-1 flex items-center justify-center p-4 lg:p-8 order-1 lg:order-2">
                <div className="w-full max-w-4xl">
                    <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-4">
                        <BentoCard
                            name="刷题记录"
                            className="col-span-1 md:col-span-2"
                            background={
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-sm bg-background/30">
                                    <div className="absolute left-10 top-10 w-full origin-top-left scale-110 rounded-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                                        <Card className="p-4 w-full max-w-[80%]">
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
                                                            <button 
                                                                type="button" 
                                                                className="w-full flex items-center justify-start text-left font-normal border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-md h-9 bg-white dark:bg-[#303030] mt-1"
                                                                style={{
                                                                    transition: 'none',
                                                                    transform: 'none',
                                                                    boxShadow: 'none'
                                                                }}
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                <span className="text-muted-foreground text-sm">选择日期</span>
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-auto p-0"
                                                            align="start"
                                                        >
                                                            <Calendar
                                                                mode="single"
                                                                captionLayout="dropdown"
                                                                selected={new Date()}
                                                                onSelect={() => {}}
                                                                initialFocus={false}
                                                                locale={zhCN}
                                                            />
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
                                                    <TimePicker
                                                        value=""
                                                        placeholder="选择时长"
                                                        className="h-9 text-sm"
                                                    />
                                                </div>
                                                <div className="pt-2">
                                                    <Button className="w-full h-9 text-sm">添加记录</Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            }
                            Icon={BookCopy}
                            description="快速录入和管理刷题记录"
                            href="#"
                            cta="开始记录"
                            titleClassName="text-yellow-600 dark:text-yellow-400"
                            descriptionClassName="text-yellow-500/80 dark:text-yellow-300/80"
                        />
                        <BentoCard
                            name="学习计划"
                            className="col-span-1"
                            background={
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-sm bg-background/30">
                                    <div className="absolute left-10 top-10 w-full h-full origin-top-left scale-110 rounded-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                                        <div className="flex-1 space-y-3 w-full max-w-[100%]">
                                            {mockPlans.map(plan => (
                                                <Card key={plan.id} className="p-3">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium truncate">{plan.name}</span>
                                                        <span className="text-xs text-muted-foreground">{plan.progress}/{plan.target}</span>
                                                    </div>
                                                    <Progress value={(plan.progress / plan.target) * 100} className="h-2.5" />
                                                    <div className="flex justify-between mt-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {MODULES.find(m => m.value === plan.module)?.label}
                                                        </span>
                                                        <span className="text-xs text-green-500">进行中</span>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            }
                            Icon={CalendarIcon}
                            description="制定个性化学习计划"
                            href="#"
                            cta="制定计划"
                            titleClassName="text-orange-600 dark:text-orange-400"
                            descriptionClassName="text-orange-500/80 dark:text-orange-300/80"
                        />
                        <BentoCard
                            name="数据可视化"
                            className="col-span-1"
                            background={
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-sm bg-background/30">
                                    {/* Line chart visualization */}
                                    <div className="absolute left-10 top-10 w-full h-full origin-top-left scale-110 rounded-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                                        <div className="w-full h-64 relative">
                                            {/* Y-axis labels */}
                                            <div className="absolute left-10 top-10 bottom-0 flex flex-col justify-between text-xs text-muted-foreground py-4">
                                                <span>2.0</span>
                                                <span>1.5</span>
                                                <span>1.0</span>
                                                <span>0.5</span>
                                                <span>0.0</span>
                                            </div>
                                            
                                            {/* Chart area */}
                                            <div className="absolute left-8 right-0 top-0 bottom-6">
                                                {/* Grid lines */}
                                                <div className="absolute inset-0 flex flex-col justify-between">
                                                    {[0, 1, 2, 3, 4].map(i => (
                                                        <div key={i} className="border-t border-muted-foreground/20"></div>
                                                    ))}
                                                </div>
                                                
                                                {/* Data lines */}
                                                {/* 资料分析 line */}
                                                <svg className="absolute inset-0 w-full h-full">
                                                    <polyline 
                                                        points="0,40 5,25 10,10 15,20 20,15 25,5 30,30 35,20 40,10 45,25 50,15 55,5 60,20 65,10 70,30 75,20 80,15 85,25 90,15 95,10 100,30" 
                                                        fill="none" 
                                                        stroke="#3b82f6" 
                                                        strokeWidth="2"
                                                        className="drop-shadow-sm"
                                                    />
                                                    <circle cx="0" cy="40" r="1.5" fill="#3b82f6" />
                                                    <circle cx="5" cy="25" r="1.5" fill="#3b82f6" />
                                                    <circle cx="10" cy="10" r="1.5" fill="#3b82f6" />
                                                    <circle cx="15" cy="20" r="1.5" fill="#3b82f6" />
                                                    <circle cx="20" cy="15" r="1.5" fill="#3b82f6" />
                                                    <circle cx="25" cy="5" r="1.5" fill="#3b82f6" />
                                                    <circle cx="30" cy="30" r="1.5" fill="#3b82f6" />
                                                    <circle cx="35" cy="20" r="1.5" fill="#3b82f6" />
                                                    <circle cx="40" cy="10" r="1.5" fill="#3b82f6" />
                                                    <circle cx="45" cy="25" r="1.5" fill="#3b82f6" />
                                                    <circle cx="50" cy="15" r="1.5" fill="#3b82f6" />
                                                    <circle cx="55" cy="5" r="1.5" fill="#3b82f6" />
                                                    <circle cx="60" cy="20" r="1.5" fill="#3b82f6" />
                                                    <circle cx="65" cy="10" r="1.5" fill="#3b82f6" />
                                                    <circle cx="70" cy="30" r="1.5" fill="#3b82f6" />
                                                    <circle cx="75" cy="20" r="1.5" fill="#3b82f6" />
                                                    <circle cx="80" cy="15" r="1.5" fill="#3b82f6" />
                                                    <circle cx="85" cy="25" r="1.5" fill="#3b82f6" />
                                                    <circle cx="90" cy="15" r="1.5" fill="#3b82f6" />
                                                    <circle cx="95" cy="10" r="1.5" fill="#3b82f6" />
                                                    <circle cx="100" cy="30" r="1.5" fill="#3b82f6" />
                                                </svg>
                                                
                                                {/* 言语理解 line */}
                                                <svg className="absolute inset-0 w-full h-full">
                                                    <polyline 
                                                        points="0,60 5,55 10,45 15,50 20,40 25,35 30,45 35,50 40,40 45,35 50,45 55,50 60,40 65,35 70,45 75,50 80,40 85,35 90,45 95,50 100,45" 
                                                        fill="none" 
                                                        stroke="#10b981" 
                                                        strokeWidth="2"
                                                        className="drop-shadow-sm"
                                                    />
                                                    <circle cx="0" cy="60" r="1.5" fill="#10b981" />
                                                    <circle cx="5" cy="55" r="1.5" fill="#10b981" />
                                                    <circle cx="10" cy="45" r="1.5" fill="#10b981" />
                                                    <circle cx="15" cy="50" r="1.5" fill="#10b981" />
                                                    <circle cx="20" cy="40" r="1.5" fill="#10b981" />
                                                    <circle cx="25" cy="35" r="1.5" fill="#10b981" />
                                                    <circle cx="30" cy="45" r="1.5" fill="#10b981" />
                                                    <circle cx="35" cy="50" r="1.5" fill="#10b981" />
                                                    <circle cx="40" cy="40" r="1.5" fill="#10b981" />
                                                    <circle cx="45" cy="35" r="1.5" fill="#10b981" />
                                                    <circle cx="50" cy="45" r="1.5" fill="#10b981" />
                                                    <circle cx="55" cy="50" r="1.5" fill="#10b981" />
                                                    <circle cx="60" cy="40" r="1.5" fill="#10b981" />
                                                    <circle cx="65" cy="35" r="1.5" fill="#10b981" />
                                                    <circle cx="70" cy="45" r="1.5" fill="#10b981" />
                                                    <circle cx="75" cy="50" r="1.5" fill="#10b981" />
                                                    <circle cx="80" cy="40" r="1.5" fill="#10b981" />
                                                    <circle cx="85" cy="35" r="1.5" fill="#10b981" />
                                                    <circle cx="90" cy="45" r="1.5" fill="#10b981" />
                                                    <circle cx="95" cy="50" r="1.5" fill="#10b981" />
                                                    <circle cx="100" cy="45" r="1.5" fill="#10b981" />
                                                </svg>
                                                
                                                {/* 判断推理 line */}
                                                <svg className="absolute inset-0 w-full h-full">
                                                    <polyline 
                                                        points="0,50 5,40 10,30 15,35 20,25 25,20 30,30 35,35 40,25 45,20 50,30 55,35 60,25 65,20 70,30 75,35 80,25 85,20 90,30 95,35 100,30" 
                                                        fill="none" 
                                                        stroke="#f59e0b" 
                                                        strokeWidth="2"
                                                        className="drop-shadow-sm"
                                                    />
                                                    <circle cx="0" cy="50" r="1.5" fill="#f59e0b" />
                                                    <circle cx="5" cy="40" r="1.5" fill="#f59e0b" />
                                                    <circle cx="10" cy="30" r="1.5" fill="#f59e0b" />
                                                    <circle cx="15" cy="35" r="1.5" fill="#f59e0b" />
                                                    <circle cx="20" cy="25" r="1.5" fill="#f59e0b" />
                                                    <circle cx="25" cy="20" r="1.5" fill="#f59e0b" />
                                                    <circle cx="30" cy="30" r="1.5" fill="#f59e0b" />
                                                    <circle cx="35" cy="35" r="1.5" fill="#f59e0b" />
                                                    <circle cx="40" cy="25" r="1.5" fill="#f59e0b" />
                                                    <circle cx="45" cy="20" r="1.5" fill="#f59e0b" />
                                                    <circle cx="50" cy="30" r="1.5" fill="#f59e0b" />
                                                    <circle cx="55" cy="35" r="1.5" fill="#f59e0b" />
                                                    <circle cx="60" cy="25" r="1.5" fill="#f59e0b" />
                                                    <circle cx="65" cy="20" r="1.5" fill="#f59e0b" />
                                                    <circle cx="70" cy="30" r="1.5" fill="#f59e0b" />
                                                    <circle cx="75" cy="35" r="1.5" fill="#f59e0b" />
                                                    <circle cx="80" cy="25" r="1.5" fill="#f59e0b" />
                                                    <circle cx="85" cy="20" r="1.5" fill="#f59e0b" />
                                                    <circle cx="90" cy="30" r="1.5" fill="#f59e0b" />
                                                    <circle cx="95" cy="35" r="1.5" fill="#f59e0b" />
                                                    <circle cx="100" cy="30" r="1.5" fill="#f59e0b" />
                                                </svg>
                                            </div>
                                            
                                            {/* X-axis labels */}
                                            <div className="absolute left-8 right-0 bottom-0 flex justify-between text-xs text-muted-foreground pb-1">
                                                <span>01/01</span>
                                                <span>01/05</span>
                                                <span>01/10</span>
                                                <span>01/15</span>
                                                <span>01/20</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }
                            Icon={BarChart3}
                            description="直观的图表展示学习进度和成绩趋势"
                            href="#"
                            cta="了解更多"
                            titleClassName="text-blue-600 dark:text-blue-400"
                            descriptionClassName="text-blue-500/80 dark:text-blue-300/80"
                        />
                        <BentoCard
                            name="知识点录入"
                            className="col-span-1 md:col-span-2"
                            background={
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-sm bg-background/30">
                                    <div className="absolute left-10 top-10 w-full h-full origin-top-left scale-110 rounded-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                                        <div className="flex-1 overflow-hidden w-full max-w-[90%]">
                                            <UnifiedTable
                                                columns={[
                                                    { key: 'module', label: '模块', className: 'w-24' },
                                                    { key: 'type', label: '类型', className: 'w-28' },
                                                    { key: 'note', label: '笔记', className: 'w-48' },
                                                ]}
                                                data={mockKnowledgeData}
                                                selected={[]}
                                                onSelect={() => {}}
                                                rowKey={(row) => row.id}
                                                selectable={false}
                                                className="text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            }
                            Icon={BookOpen}
                            description="便捷录入和整理知识点"
                            href="#"
                            cta="开始使用"
                            titleClassName="text-green-600 dark:text-green-400"
                            descriptionClassName="text-green-500/80 dark:text-green-300/80"
                        />
                    </BentoGrid>
                </div>
            </div>
        </div>
    )
}