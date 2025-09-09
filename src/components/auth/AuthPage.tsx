'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LoginForm } from './LoginForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { StepperSignUpForm } from './StepperSignUpForm'
import { FormTransitionWrapper } from './FormTransitionWrapper'
import { MagicCard } from '../magicui/magic-card'
import { BentoGrid, BentoCard } from '../magicui/bento-grid'
import { useThemeMode } from '@/hooks/useThemeMode'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/magicui/NotificationProvider' // Added notification import
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
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler' // Added import for theme toggler
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
    const router = useRouter()
    const pathname = usePathname()
    const { user, loading } = useAuth()
    const { notify } = useNotification() // Added notification hook
    const { isDarkMode, getBackgroundStyle } = useThemeMode();

    // Determine if we need to show BentoGrid based on pathname - All auth pages show BentoGrid
    const shouldShowBentoGrid = pathname === '/' || pathname.startsWith('/auth/')

    // 登录成功后跳转到主页面
    useEffect(() => {
        if (!loading && user) {
            router.replace('/')
        }
    }, [loading, user, router])

    // Function to show login notification
    const showLoginNotification = () => {
        notify({
            type: "info",
            message: "登录账号后开始记录",
            icon: "flower" // Custom property to indicate we want a flower icon
        });
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row relative" style={getBackgroundStyle() as React.CSSProperties}>
            {/* 顶部右侧应用图标和主题切换器 */}
            <div className="absolute right-4 top-4 z-[50] inline-flex items-center gap-3">
                <Link href="/" className="inline-flex items-center gap-3">
                    <Image src="/trace.svg" alt="App Icon" className="h-10 w-10 sm:h-12 sm:w-12" width={48} height={48} />
                    <span className="hidden sm:inline text-lg sm:text-xl font-semibold text-foreground/90">行测每日记录</span>
                </Link>
                <AnimatedThemeToggler className="w-10 h-10" />
            </div>

            {/* 左侧功能展示 - 交换位置 */}
            {shouldShowBentoGrid && (
                <div className="flex-1 flex items-center justify-center p-4 lg:p-8 order-2 lg:order-1">
                    <div className="w-full max-w-4xl">
                        <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-4">
                            <BentoCard
                            name="刷题记录"
                            className="col-span-1 md:col-span-2"
                            background={
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-md bg-background/60">
                                    <div className="absolute left-10 top-7 w-full origin-top-left scale-100 rounded-md transition-all duration-300 ease-out group-hover:blur-none">
                                        <Card className="blur-sm group-hover:blur-none p-4 w-full max-w-[70%] transition-all duration-300 ease-out ml-8">
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
                                                                onSelect={() => { }}
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
                            cta="开始记录"
                            titleClassName="text-[#404040] dark:text-white"
                            descriptionClassName="text-[#404040]/80 dark:text-white/60"
                            iconClassName="text-[#404040] dark:text-white"
                            onCtaClick={showLoginNotification}
                        />
                        <BentoCard
                            name="学习计划"
                            className="col-span-1"
                            background={
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-md bg-background/60">
                                    <div className="absolute left-10 top-10 w-full h-full origin-top-left scale-110 rounded-md transition-all duration-300 ease-out group-hover:blur-none">
                                        <div className="flex-1 space-y-3 w-full max-w-[100%]">
                                            {mockPlans.map(plan => (
                                            <Card key={plan.id} className="p-3 blur-sm group-hover:blur-none transition-all duration-300 ease-out">
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
                            cta="制定计划"
                            titleClassName="text-[#404040] dark:text-white"
                            descriptionClassName="text-[#404040]/80 dark:text-white/60"
                            iconClassName="text-[#404040] dark:text-white"
                            onCtaClick={showLoginNotification} // Changed from href to onClick
                        />
                        <BentoCard
                            name="数据可视化"
                            className="col-span-1"
                            background={
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-md bg-background/40 dark:bg-background/30">
                                    {/* Pie chart visualization */}
                                    <div className="absolute left-4 top-0 w-full h-full origin-top-left scale-110 rounded-md transition-all duration-300 ease-out group-hover:blur-none">
                                        <div className="w-full h-64 relative bg-white/50 dark:bg-[#1E1E1F] backdrop-blur-md rounded-lg p-4 ml-4 blur-sm group-hover:blur-none transition-all duration-300 ease-out">
                                            <ModulePieChart
                                                data={[
                                                    { date: '2023-01-01', module: '资料分析', score: 1.5, duration: 25 },
                                                    { date: '2023-01-02', module: '政治理论', score: 1.2, duration: 30 },
                                                    { date: '2023-01-03', module: '数量关系', score: 1.8, duration: 20 },
                                                    { date: '2023-01-04', module: '常识判断', score: 1.6, duration: 28 },
                                                    { date: '2023-01-05', module: '言语理解', score: 1.3, duration: 32 },
                                                    { date: '2023-01-06', module: '判断推理', score: 1.7, duration: 22 },
                                                    { date: '2023-01-07', module: '资料分析', score: 1.4, duration: 26 },
                                                    { date: '2023-01-08', module: '政治理论', score: 1.1, duration: 31 },
                                                    { date: '2023-01-09', module: '数量关系', score: 1.9, duration: 19 },
                                                    { date: '2023-01-10', module: '常识判断', score: 1.5, duration: 29 },
                                                    { date: '2023-01-11', module: '言语理解', score: 1.4, duration: 33 },
                                                    { date: '2023-01-12', module: '判断推理', score: 1.6, duration: 23 }
                                                ]}
                                                showLegend={false}
                                            />
                                        </div>
                                    </div>
                                </div>
                            }
                            Icon={BarChart3}
                            description="图表展示学习趋势"
                            cta="了解更多"
                            titleClassName="text-[#404040] dark:text-white"
                            descriptionClassName="text-[#404040]/80 dark:text-white/60"
                            iconClassName="text-[#404040] dark:text-white"
                            onCtaClick={showLoginNotification} // Changed from href to onClick
                        />
                        <BentoCard
                            name="知识点录入"
                            className="col-span-1 md:col-span-2"
                            background={
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-md bg-background/40 dark:bg-background/30">
                                    <div className="absolute left-10 top-10 w-full h-full origin-top-left scale-110 rounded-md transition-all duration-300 ease-out group-hover:blur-none">
                                        <div className="flex-1 overflow-hidden w-full max-w-[90%] bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-md border border-white/40 dark:border-white/30 rounded-lg p-2 blur-sm group-hover:blur-none transition-all duration-300 ease-out">
                                            <UnifiedTable
                                                columns={[
                                                    { key: 'module', label: '模块', className: 'w-24 text-xs' },
                                                    { key: 'type', label: '类型', className: 'w-28 text-xs' },
                                                    { key: 'note', label: '笔记', className: 'w-48 text-xs' },
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
                            }
                            Icon={BookOpen}
                            description="便捷录入和整理知识点"
                            cta="开始使用"
                            titleClassName="text-[#404040] dark:text-white"
                            descriptionClassName="text-[#404040]/80 dark:text-white/60"
                            iconClassName="text-[#404040] dark:text-white"
                            onCtaClick={showLoginNotification} // Changed from href to onClick
                        />
                    </BentoGrid>
                </div>
            </div>
            )}

            {/* 右侧登录表单 - 交换位置 */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 order-1 lg:order-2">
                {/* 卡片 - 独立元素 */}
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
                    <div className="space-y-4">
                        {/* 根据页面URL动态显示相应表单 */}
                        {/* 根据页面路径选择显示对应的表单 */}
                        {pathname === '/auth/signup' ? (
                            // 注册页面不使用FormTransitionWrapper，避免冲突
                            <MagicCard
                                className="rounded-xl w-full overflow-hidden"
                                gradientSize={240}
                                gradientColor="rgba(0, 0, 0, 0.08)"
                                gradientOpacity={0.5}
                            >
                                <div className="w-full p-6 sm:p-8">
                                    <StepperSignUpForm onSwitchToLogin={() => router.push('/auth/login')} />
                                </div>
                            </MagicCard>
                        ) : (
                            // 登录和忘记密码页面使用动画包装器
                            <FormTransitionWrapper currentPath={pathname} className="w-full">
                                <MagicCard
                                    className="rounded-xl w-full overflow-visible"
                                    gradientSize={240}
                                    gradientColor="rgba(0, 0, 0, 0.08)"
                                    gradientOpacity={0.5}
                                >
                                    <div className="w-full p-6 sm:p-8">
                                        {pathname === '/auth/forgot-password' ? (
                                            <ForgotPasswordForm onSwitchToLogin={() => router.push('/auth/login')} />
                                        ) : (
                                            // 默认显示登录表单 (包括首页 '/')
                                            <LoginForm />
                                        )}
                                    </div>
                                </MagicCard>
                            </FormTransitionWrapper>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
