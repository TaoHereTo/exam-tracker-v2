import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/ui/FormField";
import { FormError } from "@/components/ui/form-error";
import { MixedText } from "@/components/ui/MixedText";
import { Plus, Edit, Trash2, Clock, Target, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { DateRange } from "react-day-picker";
import { generateUUID } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import toast from 'react-hot-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/animate-ui/components/animate/tooltip";
import { normalizeModuleName } from "@/config/exam";
import type { ExamCountdown, StudyPlan } from "@/types/record";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Stepper, Step } from "@/components/ui/Stepper";
import CustomAgendaView from './CustomAgendaView';

// 设置 moment 中文语言
moment.locale('zh-cn');
const localizer = momentLocalizer(moment);

// 日程事件类型
export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    type: 'countdown' | 'plan';
    description?: string;
    color?: string;
    sourceId?: string; // 关联的倒计时或计划ID
    isDuration?: boolean; // 标记为持续时间事件
    isPlanStart?: boolean; // 标记为计划开始事件
    isPlanEnd?: boolean; // 标记为计划结束事件
    // 考试倒计时特定字段
    examDate?: string; // YYYY-MM-DD 格式
    // 学习计划特定字段
    module?: string;
    planType?: string;
    target?: number;
}

interface CalendarViewProps {
    countdowns: ExamCountdown[];
    plans: StudyPlan[];
    customEvents?: CalendarEvent[];
    onCreateEvent?: (event: CalendarEvent) => void;
    onUpdateEvent?: (event: CalendarEvent) => void;
    onDeleteEvent?: (id: string) => void;
}


// 自定义导航按钮组件，使用tabs样式
function CustomNavigationButton({ onClick, children, className = "" }: { onClick: () => void; children: React.ReactNode; className?: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'relative inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 leading-none unselectable',
                'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                className
            )}
        >
            {children}
        </button>
    );
}

// 完全按照simple-tabs组件实现的视图切换组件
const CalendarViewTabs = React.memo(({ currentView, onViewChange }: { currentView: string; onViewChange: (view: string) => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [highlightStyle, setHighlightStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        if (!containerRef.current) return;

        const activeTab = containerRef.current.querySelector(`[data-view="${currentView}"]`) as HTMLElement;
        if (activeTab) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const tabRect = activeTab.getBoundingClientRect();

            setHighlightStyle({
                left: tabRect.left - containerRect.left,
                width: tabRect.width
            });
        }
    }, [currentView]);

    const views = [
        { value: 'year', label: '年' },
        { value: 'month', label: '月' },
        { value: 'week', label: '周' },
        { value: 'day', label: '日' },
        { value: 'agenda', label: '议程' }
    ];

    return (
        <div
            ref={containerRef}
            className="relative inline-flex h-9 items-center justify-center rounded-full bg-white dark:bg-muted/40 backdrop-blur-md border border-white/20 dark:border-white/20 border-white p-1 text-muted-foreground shadow-lg unselectable"
            style={{ zIndex: 10 }}
        >
            {/* 高亮背景 */}
            <motion.div
                className="absolute inset-y-1 bg-black dark:bg-white backdrop-blur-sm rounded-full shadow-md border border-white/20"
                initial={false}
                animate={{
                    left: highlightStyle.left,
                    width: highlightStyle.width,
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                }}
            />
            {views.map((viewItem) => (
                <button
                    key={viewItem.value}
                    data-view={viewItem.value}
                    className={cn(
                        'relative inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 leading-none unselectable',
                        currentView === viewItem.value
                            ? 'text-white dark:text-black'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => onViewChange(viewItem.value)}
                >
                    <MixedText text={viewItem.label} />
                </button>
            ))}
        </div>
    );
});

CalendarViewTabs.displayName = 'CalendarViewTabs';

export default function ScheduleManagementView({
    countdowns,
    plans,
    customEvents = [],
    onCreateEvent,
    onUpdateEvent,
    onDeleteEvent
}: CalendarViewProps) {
    const [showForm, setShowForm] = useState(false);
    const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
    const [form, setForm] = useState<Partial<CalendarEvent>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [showYearView, setShowYearView] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // 日期选择相关状态
    const [dateRange, setDateRange] = useState<DateRange>();
    const [examDate, setExamDate] = useState<Date>();
    const [examDateOpen, setExamDateOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    // 将倒计时、计划和自定义事件转换为日历事件
    const events = useMemo(() => {
        const calendarEvents: CalendarEvent[] = [];

        // 添加倒计时事件
        countdowns.forEach(countdown => {
            const examDate = new Date(countdown.examDate);
            // 设置具体时间，比如上午9点
            examDate.setHours(9, 0, 0, 0);
            calendarEvents.push({
                id: `countdown-${countdown.id}`,
                title: countdown.name,
                start: examDate,
                end: examDate,
                allDay: false, // 不是全天事件，显示具体时间
                type: 'countdown',
                description: countdown.description || '考试倒计时',
                color: '#ef4444', // 红色
                sourceId: countdown.id
            });
        });

        // 添加学习计划事件
        plans.forEach(plan => {
            const startDate = new Date(plan.startDate);
            const endDate = new Date(plan.endDate);

            // 为计划的开始和结束日期创建全天事件
            calendarEvents.push({
                id: `plan-start-${plan.id}`,
                title: `${plan.name} (开始)`,
                start: startDate,
                end: startDate,
                allDay: true, // 设置为全天事件
                type: 'plan',
                description: `学习计划开始 - ${normalizeModuleName(plan.module)}`,
                color: '#3b82f6', // 蓝色
                sourceId: plan.id
            });

            calendarEvents.push({
                id: `plan-end-${plan.id}`,
                title: `${plan.name} (结束)`,
                start: endDate,
                end: endDate,
                allDay: true, // 设置为全天事件
                type: 'plan',
                description: `学习计划结束 - ${normalizeModuleName(plan.module)}`,
                color: '#10b981', // 绿色
                sourceId: plan.id
            });

            // 为计划期间的每一天创建全天事件（颜色更浅）
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + 1); // 从第二天开始

            while (currentDate < endDate) {
                calendarEvents.push({
                    id: `plan-duration-${plan.id}-${currentDate.toISOString().split('T')[0]}`,
                    title: plan.name,
                    start: new Date(currentDate),
                    end: new Date(currentDate),
                    allDay: true, // 设置为全天事件
                    type: 'plan',
                    description: `学习计划进行中 - ${normalizeModuleName(plan.module)}`,
                    color: '#10b981', // 绿色，但会在样式中降低透明度
                    sourceId: plan.id,
                    isDuration: true // 标记为持续时间事件
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        // 添加自定义事件
        customEvents.forEach(event => {
            calendarEvents.push({
                id: event.id,
                title: event.title,
                start: new Date(event.start),
                end: new Date(event.end),
                type: event.type || 'countdown',
                description: event.description,
                color: event.color || '#8b5cf6', // 紫色
                sourceId: event.sourceId
            });
        });

        return calendarEvents;
    }, [countdowns, plans, customEvents]);

    // 强制禁用默认 tooltip 的 useEffect
    useEffect(() => {
        const removeDefaultTooltips = () => {
            // 移除所有日历事件的 title 属性
            const eventElements = document.querySelectorAll('.rbc-event, .rbc-event *');
            eventElements.forEach(event => {
                event.removeAttribute('title');
            });
        };

        // 初始移除
        removeDefaultTooltips();

        // 监听 DOM 变化，当新的事件被添加时也移除 title
        const observer = new MutationObserver(() => {
            removeDefaultTooltips();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['title']
        });

        return () => {
            observer.disconnect();
        };
    }, [events]); // 当事件变化时重新执行

    // 事件样式
    const eventStyleGetter = (event: CalendarEvent) => {
        const isDuration = event.isDuration;
        return {
            style: {
                backgroundColor: event.color || '#3174ad',
                borderRadius: '5px',
                opacity: isDuration ? 0.4 : 0.8, // 持续时间事件透明度更低
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    // 处理日期选择
    const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
        setSelectedDate(start);
        setForm({
            title: '',
            start: start,
            end: end,
            type: undefined, // 不预设类型，让用户选择
            description: ''
        });
        setErrors({});
        setShowForm(true);
    }, []);

    // 处理事件选择
    const handleSelectEvent = useCallback((event: CalendarEvent) => {
        setEditEvent(event);
        setForm(event);
        setErrors({});

        // 设置日期状态
        if (event.type === 'plan') {
            // 学习计划使用日期范围
            setDateRange({
                from: event.start,
                to: event.end
            });
        } else if (event.type === 'countdown') {
            // 考试倒计时使用单个日期
            setExamDate(event.start);
        }

        setShowForm(true);
    }, []);

    // 处理表单变化
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // 处理类型变化
    const handleTypeChange = (type: string) => {
        setForm(prev => ({ ...prev, type: type as CalendarEvent['type'] }));
        if (errors.type) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.type;
                return newErrors;
            });
        }
    };

    // 处理日期范围变化
    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        if (range?.from || range?.to) {
            setForm(prev => ({
                ...prev,
                start: range?.from || prev.start,
                end: range?.to || prev.end
            }));
        }
        // 清除日期相关的错误
        if (errors.start || errors.end) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.start;
                delete newErrors.end;
                return newErrors;
            });
        }
    };

    // 表单验证
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // 详情步骤的验证
        if (!form.title?.trim()) {
            newErrors.title = '事件标题不能为空';
            toast.error('事件标题不能为空');
            setErrors(newErrors);
            return false;
        }

        if (!form.start) {
            newErrors.start = '请选择开始时间';
            toast.error('请选择开始时间');
            setErrors(newErrors);
            return false;
        }

        if (!form.end) {
            newErrors.end = '请选择结束时间';
            toast.error('请选择结束时间');
            setErrors(newErrors);
            return false;
        }

        if (form.start && form.end && form.start > form.end) {
            newErrors.end = '结束时间不能早于开始时间';
            toast.error('结束时间不能早于开始时间');
            setErrors(newErrors);
            return false;
        }

        // 考试倒计时特定验证
        if (form.type === 'countdown') {
            if (!form.start) {
                newErrors.examDate = '请选择考试日期';
                toast.error('请选择考试日期');
                setErrors(newErrors);
                return false;
            }
        }

        // 学习计划特定验证
        if (form.type === 'plan') {
            if (!form.module) {
                newErrors.module = '请选择学习模块';
                toast.error('请选择学习模块');
                setErrors(newErrors);
                return false;
            }
            if (!form.planType) {
                newErrors.planType = '请选择计划类型';
                toast.error('请选择计划类型');
                setErrors(newErrors);
                return false;
            }
            if (!form.target || form.target <= 0) {
                newErrors.target = '请输入有效的目标值';
                toast.error('请输入有效的目标值');
                setErrors(newErrors);
                return false;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Stepper 验证函数
    const validateStep = async (step: number): Promise<boolean> => {
        if (step === 1) {
            // 第一步：验证类型选择
            if (!form.type) {
                toast.error('请选择日程类型');
                return false;
            }
            return true;
        } else if (step === 2) {
            // 第二步：验证详情
            return validateForm();
        }
        return true;
    };

    // 处理表单提交
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        // 详情步骤的提交逻辑
        const eventData: CalendarEvent = {
            id: editEvent?.id || generateUUID(),
            title: form.title!,
            start: form.start!,
            end: form.end!,
            type: form.type || 'countdown',
            description: form.description,
            color: form.color || getTypeColor(form.type || 'countdown'),
            // 考试倒计时特定字段
            examDate: form.type === 'countdown' ? format(form.start!, "yyyy-MM-dd") : undefined,
            // 学习计划特定字段
            module: form.type === 'plan' ? form.module : undefined,
            planType: form.type === 'plan' ? form.planType : undefined,
            target: form.type === 'plan' ? form.target : undefined
        };

        if (editEvent) {
            onUpdateEvent?.(eventData);
            toast.success('日程更新成功');
        } else {
            onCreateEvent?.(eventData);
            toast.success('日程创建成功');
        }

        handleCloseForm();
    };

    // 处理 Stepper 最终步骤完成
    const handleFinalStepCompleted = () => {
        if (!validateForm()) return;

        const eventData: CalendarEvent = {
            id: editEvent?.id || generateUUID(),
            title: form.title!,
            start: form.start!,
            end: form.end!,
            type: form.type || 'countdown',
            description: form.description,
            color: form.color || getTypeColor(form.type || 'countdown'),
            // 考试倒计时特定字段
            examDate: form.type === 'countdown' ? format(form.start!, "yyyy-MM-dd") : undefined,
            // 学习计划特定字段
            module: form.type === 'plan' ? form.module : undefined,
            planType: form.type === 'plan' ? form.planType : undefined,
            target: form.type === 'plan' ? form.target : undefined
        };

        if (editEvent) {
            onUpdateEvent?.(eventData);
            toast.success('日程更新成功');
        } else {
            onCreateEvent?.(eventData);
            toast.success('日程创建成功');
        }

        handleCloseForm();
    };

    // 关闭表单
    const handleCloseForm = () => {
        setShowForm(false);
        setEditEvent(null);
        setForm({});
        setErrors({});
        setSelectedDate(null);
        setDateRange(undefined); // 重置日期范围
        setExamDate(undefined); // 重置考试日期
        setExamDateOpen(false); // 重置考试日期弹窗状态
    };

    // 删除事件
    const handleDelete = () => {
        if (editEvent) {
            onDeleteEvent?.(editEvent.id);
            toast.success('日程删除成功');
            handleCloseForm();
        }
    };

    // 获取事件类型颜色
    const getTypeColor = (type: CalendarEvent['type']) => {
        switch (type) {
            case 'countdown':
                return '#ef4444';
            case 'plan':
                return '#3b82f6';
            default:
                return '#3174ad';
        }
    };

    // 年视图组件 - 集成到大日历样式中
    const YearView = () => {
        const months = [
            '一月', '二月', '三月', '四月', '五月', '六月',
            '七月', '八月', '九月', '十月', '十一月', '十二月'
        ];

        const handleMonthSelect = (month: number) => {
            const newDate = new Date(selectedYear, month, 1);
            setDate(newDate);
            setView(Views.MONTH);
            setShowYearView(false);
        };

        const handleYearChange = (direction: 'prev' | 'next') => {
            setSelectedYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
        };

        // 计算每个月份的事件数量
        const getMonthEvents = (month: number) => {
            const monthStart = new Date(selectedYear, month, 1);
            const monthEnd = new Date(selectedYear, month + 1, 0);

            let countdownCount = 0;
            let planCount = 0;

            // 统计倒计时事件
            countdowns.forEach(countdown => {
                const examDate = new Date(countdown.examDate);
                if (examDate >= monthStart && examDate <= monthEnd) {
                    countdownCount++;
                }
            });

            // 统计学习计划事件
            plans.forEach(plan => {
                const startDate = new Date(plan.startDate);
                const endDate = new Date(plan.endDate);

                // 检查计划是否与当前月份有重叠
                if ((startDate <= monthEnd && endDate >= monthStart)) {
                    planCount++;
                }
            });

            return { countdownCount, planCount };
        };

        return (
            <div className="h-[600px] flex flex-col">
                {/* 年视图头部 - 模仿大日历的头部样式 */}
                <div className="flex items-center justify-between p-4 border-b-2 border-gray-300 dark:border-gray-600">
                    <button
                        onClick={() => handleYearChange('prev')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        {selectedYear}年
                    </h2>

                    <button
                        onClick={() => handleYearChange('next')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* 月份网格 - 使用表格样式，显示事件数量 */}
                <div className="flex-1 p-4">
                    <div className="grid grid-cols-3 gap-4 h-full">
                        {months.map((month, index) => {
                            const { countdownCount, planCount } = getMonthEvents(index);
                            const totalEvents = countdownCount + planCount;

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleMonthSelect(index)}
                                    className="flex flex-col items-center justify-center border-2 border-gray-400 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md p-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-600 dark:hover:border-gray-400"
                                >
                                    <div className="font-semibold mb-1">
                                        <MixedText text={month} />
                                    </div>
                                    {totalEvents > 0 && (
                                        <div className="text-xs space-y-1">
                                            {countdownCount > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    <span>{countdownCount}个倒计时</span>
                                                </div>
                                            )}
                                            {planCount > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    <span>{planCount}个计划</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {totalEvents === 0 && (
                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                            无事件
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <TooltipProvider openDelay={100} closeDelay={50}>
            <div className="space-y-6">
                {/* 工具栏 */}
                <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-4">
                    <Button
                        onClick={() => {
                            setForm({
                                title: '',
                                start: new Date(),
                                end: new Date(),
                                type: undefined, // 不预设类型，让用户选择
                                description: ''
                            });
                            setErrors({});
                            setShowForm(true);
                        }}
                        className="h-9 px-6 rounded-full font-medium bg-[#8b5cf6] text-white hover:bg-[#8b5cf6]/90"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        <MixedText text="添加日程" />
                    </Button>
                </div>

                {/* 左右布局 */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* 左侧：日程说明和日历 */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* 视图切换tabs，位于左侧卡片上方 */}
                        <div className="flex justify-center">
                            <CalendarViewTabs
                                currentView={showYearView ? 'year' : view}
                                onViewChange={(viewStr) => {
                                    if (viewStr === 'year') {
                                        setShowYearView(true);
                                    } else {
                                        setShowYearView(false);
                                        setView(viewStr as View);
                                    }
                                }}
                            />
                        </div>

                        {/* 日程类型说明 */}
                        <div className="text-center">
                            <h4 className="text-sm font-medium mb-3">
                                <MixedText text="日程类型说明" />
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                                    <span className="text-xs">
                                        <MixedText text="考试倒计时" />
                                    </span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                                    <span className="text-xs">
                                        <MixedText text="学习计划开始" />
                                    </span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
                                    <span className="text-xs">
                                        <MixedText text="学习计划结束" />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 快速日期选择日历 */}
                        <div className="text-center">
                            <div className="flex justify-center">
                                <DatePicker
                                    mode="single"
                                    selected={date}
                                    onSelect={(selectedDate) => {
                                        if (selectedDate) {
                                            setDate(selectedDate);
                                        }
                                    }}
                                    className="rounded-md border scale-100"
                                    locale={zhCN}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 右侧：大日历视图 */}
                    <div className="lg:col-span-3">
                        <div className="h-[600px] relative">
                            {showYearView ? (
                                <YearView />
                            ) : view === 'agenda' ? (
                                <CustomAgendaView
                                    events={events.filter(event => {
                                        // 过滤掉学习计划的持续时间事件（中间日期）
                                        if (event.type === 'plan' && event.isDuration) {
                                            return false;
                                        }
                                        // 其他事件正常显示
                                        return true;
                                    })}
                                    currentDate={date}
                                    onEventClick={handleSelectEvent}
                                />
                            ) : (
                                <BigCalendar
                                    localizer={localizer}
                                    events={events}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: '100%' }}
                                    view={view}
                                    onView={setView}
                                    date={date}
                                    onNavigate={setDate}
                                    onSelectSlot={handleSelectSlot}
                                    onSelectEvent={handleSelectEvent}
                                    selectable
                                    eventPropGetter={eventStyleGetter}
                                    showMultiDayTimes
                                    step={15}
                                    timeslots={4}
                                    popup={false} // 禁用默认的弹出窗口
                                    popupOffset={{ x: 0, y: 0 }} // 设置弹出窗口偏移为0
                                    doShowMoreDrillDown={false} // 禁用更多事件的下钻
                                    className="" // 移除阻止tooltip的类名
                                    messages={{
                                        next: '下月',
                                        previous: '上月',
                                        today: '今天',
                                        month: '月',
                                        week: '周',
                                        day: '日',
                                        agenda: '议程',
                                        date: '日期',
                                        time: '时间',
                                        event: '事件',
                                        noEventsInRange: '此范围内没有事件',
                                        showMore: (total: number) => `+${total} 更多`,
                                        allDay: '全天',
                                        work_week: '工作周'
                                    }}
                                    components={{
                                        event: ({ event }) => (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className="w-full h-full cursor-pointer"
                                                        style={{
                                                            minHeight: '20px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        {/* 完全透明的触发器，但保持完整的点击区域 */}
                                                        <div
                                                            className="absolute inset-0 w-full h-full"
                                                            style={{
                                                                backgroundColor: 'transparent',
                                                                zIndex: 2
                                                            }}
                                                        />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{event.title}</p>
                                                    {event.description && (
                                                        <p className="text-sm">{event.description}</p>
                                                    )}
                                                    <p className="text-xs">
                                                        {event.allDay
                                                            ? format(event.start, 'yyyy-MM-dd', { locale: zhCN })
                                                            : event.type === 'countdown'
                                                                ? format(event.start, 'yyyy-MM-dd', { locale: zhCN })
                                                                : `${format(event.start, 'yyyy-MM-dd HH:mm', { locale: zhCN })} - ${format(event.end, 'yyyy-MM-dd HH:mm', { locale: zhCN })}`
                                                        }
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ),
                                        // 自定义导航按钮
                                        toolbar: ({ label, onNavigate }) => {
                                            const navigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
                                                onNavigate(action);
                                            };

                                            return (
                                                <div className="flex items-center justify-between mb-4">
                                                    {/* 左侧：导航按钮 */}
                                                    <div className="flex items-center gap-2">
                                                        <CustomNavigationButton onClick={() => navigate('PREV')}>
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </CustomNavigationButton>
                                                        <CustomNavigationButton onClick={() => navigate('TODAY')}>
                                                            <MixedText text="今天" />
                                                        </CustomNavigationButton>
                                                        <CustomNavigationButton onClick={() => navigate('NEXT')}>
                                                            <ChevronRight className="w-4 h-4" />
                                                        </CustomNavigationButton>
                                                    </div>

                                                    {/* 中间：当前日期标签 */}
                                                    <div className="text-lg font-semibold text-foreground">
                                                        <MixedText text={label} />
                                                    </div>

                                                    {/* 右侧：空白区域，保持布局平衡 */}
                                                    <div className="w-32"></div>
                                                </div>
                                            );
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* 添加/编辑日程对话框 */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent className="w-11/12 max-w-md sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl">
                                {editEvent ? (
                                    <MixedText text="编辑日程" />
                                ) : (
                                    <MixedText text="添加日程" />
                                )}
                            </DialogTitle>
                        </DialogHeader>
                        {editEvent ? (
                            // 编辑模式：直接显示表单
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <FormField label={<MixedText text="日程标题" />} htmlFor="title" required>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={form.title || ''}
                                            onChange={handleFormChange}
                                            className="h-11"
                                            placeholder="请输入日程标题"
                                        />
                                    </FormField>
                                    <FormError error={errors.title} />
                                </div>

                                <div className="space-y-2">
                                    <FormField label={<MixedText text="日程描述" />} htmlFor="description">
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={form.description || ''}
                                            onChange={handleFormChange}
                                            rows={3}
                                            placeholder="可选：添加日程描述"
                                            className="resize-none"
                                        />
                                    </FormField>
                                </div>

                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleDelete}
                                        className="w-full sm:w-auto"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        <MixedText text="删除" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseForm}
                                        className="w-full sm:w-auto"
                                    >
                                        <MixedText text="取消" />
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="w-full sm:w-auto"
                                    >
                                        <MixedText text="更新" />
                                    </Button>
                                </DialogFooter>
                            </form>
                        ) : (
                            // 新建模式：使用正确的 Stepper 组件
                            <Stepper
                                initialStep={1}
                                onBeforeNext={validateStep}
                                onFinalStepCompleted={handleFinalStepCompleted}
                                backButtonText="上一步"
                                nextButtonText="下一步"
                            >
                                {/* 第一步：选择日程类型 */}
                                <Step>
                                    <div className="space-y-4">
                                        <div className="text-center mb-6">
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                                <MixedText text="选择日程类型" />
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                <MixedText text="请选择您要添加的日程类型" />
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <div
                                                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${form.type === 'countdown'
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-950 shadow-md'
                                                    : 'hover:bg-accent hover:shadow-sm'
                                                    }`}
                                                onClick={() => handleTypeChange('countdown')}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-4 h-4 rounded transition-all ${form.type === 'countdown' ? 'ring-2 ring-red-500 scale-110' : ''
                                                        }`} style={{ backgroundColor: '#ef4444' }}></div>
                                                    <div>
                                                        <h3 className="font-medium">
                                                            <MixedText text="考试倒计时" />
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            <MixedText text="设置考试日期和倒计时" />
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${form.type === 'plan'
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md'
                                                    : 'hover:bg-accent hover:shadow-sm'
                                                    }`}
                                                onClick={() => handleTypeChange('plan')}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-4 h-4 rounded transition-all ${form.type === 'plan' ? 'ring-2 ring-blue-500 scale-110' : ''
                                                        }`} style={{ backgroundColor: '#3b82f6' }}></div>
                                                    <div>
                                                        <h3 className="font-medium">
                                                            <MixedText text="学习计划" />
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            <MixedText text="创建学习计划和目标" />
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Step>

                                {/* 第二步：填写日程详情 */}
                                <Step>
                                    <div className="space-y-4">
                                        <div className="text-center mb-6">
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                                <MixedText text="填写日程详情" />
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                <MixedText text="请填写日程的详细信息" />
                                            </p>
                                        </div>

                                        {/* 显示已选择的类型 */}
                                        <div className="flex items-center p-3 bg-accent rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className="w-3 h-3 rounded"
                                                    style={{ backgroundColor: getTypeColor(form.type || 'countdown') }}
                                                ></div>
                                                <span className="text-sm font-medium">
                                                    {form.type === 'countdown' && <MixedText text="考试倒计时" />}
                                                    {form.type === 'plan' && <MixedText text="学习计划" />}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <FormField label={<MixedText text="日程标题" />} htmlFor="title" required>
                                                <Input
                                                    id="title"
                                                    name="title"
                                                    value={form.title || ''}
                                                    onChange={handleFormChange}
                                                    className="h-11"
                                                    placeholder="请输入日程标题"
                                                />
                                            </FormField>
                                            <FormError error={errors.title} />
                                        </div>

                                        {/* 根据日程类型显示不同的日期选择器 */}
                                        {form.type === 'plan' ? (
                                            <div className="space-y-2">
                                                <FormField label={<MixedText text="计划时间范围" />}>
                                                    <DateRangePicker
                                                        dateRange={dateRange}
                                                        onDateRangeChange={handleDateRangeChange}
                                                        placeholder="选择开始和结束日期"
                                                        error={!!errors.start || !!errors.end}
                                                    />
                                                </FormField>
                                                <FormError error={errors.start || errors.end} />
                                            </div>
                                        ) : null}

                                        {/* 考试倒计时特定字段 */}
                                        {form.type === 'countdown' && (
                                            <div className="space-y-2">
                                                <FormField label={<MixedText text="考试日期" />} htmlFor="examDate" required>
                                                    <Popover open={examDateOpen} onOpenChange={setExamDateOpen}>
                                                        <PopoverTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="w-full flex items-center justify-start text-left font-normal border bg-white dark:bg-[#303030] px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-md h-11 shadow-xs transition-[color,box-shadow]"
                                                                onClick={() => setExamDateOpen(true)}
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                {examDate ? (
                                                                    <span>{format(examDate, 'PPP', { locale: zhCN })}</span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">请选择考试日期</span>
                                                                )}
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-auto p-0 bg-white dark:bg-black text-black dark:text-white"
                                                            align="start"
                                                            onInteractOutside={() => setExamDateOpen(false)}
                                                        >
                                                            <DatePicker
                                                                mode="single"
                                                                captionLayout="dropdown"
                                                                month={currentMonth}
                                                                onMonthChange={setCurrentMonth}
                                                                selected={examDate}
                                                                onSelect={(d) => {
                                                                    setExamDate(d);
                                                                    if (d) {
                                                                        setForm(prev => ({
                                                                            ...prev,
                                                                            start: d,
                                                                            end: d // 考试倒计时通常是一天
                                                                        }));
                                                                    }
                                                                    if (errors.examDate) {
                                                                        setErrors(prev => {
                                                                            const newErrors = { ...prev };
                                                                            delete newErrors.examDate;
                                                                            return newErrors;
                                                                        });
                                                                    }
                                                                    setExamDateOpen(false);
                                                                }}
                                                                initialFocus={false}
                                                                locale={zhCN}
                                                                className="p-3"
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </FormField>
                                                <FormError error={errors.examDate} />
                                            </div>
                                        )}

                                        {/* 学习计划特定字段 */}
                                        {form.type === 'plan' && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <FormField label={<MixedText text="学习模块" />} htmlFor="module" required>
                                                            <Select
                                                                value={form.module || ''}
                                                                onValueChange={(value) => setForm(prev => ({ ...prev, module: value }))}
                                                            >
                                                                <SelectTrigger className="h-11">
                                                                    <SelectValue placeholder="选择学习模块" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="data-analysis">资料分析</SelectItem>
                                                                    <SelectItem value="politics">政治理论</SelectItem>
                                                                    <SelectItem value="math">数量关系</SelectItem>
                                                                    <SelectItem value="verbal">言语理解</SelectItem>
                                                                    <SelectItem value="common">常识判断</SelectItem>
                                                                    <SelectItem value="logic">判断推理</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormField>
                                                        <FormError error={errors.module} />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <FormField label={<MixedText text="计划类型" />} htmlFor="planType" required>
                                                            <Select
                                                                value={form.planType || ''}
                                                                onValueChange={(value) => setForm(prev => ({ ...prev, planType: value }))}
                                                            >
                                                                <SelectTrigger className="h-11">
                                                                    <SelectValue placeholder="选择计划类型" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="题量">题量</SelectItem>
                                                                    <SelectItem value="正确率">正确率</SelectItem>
                                                                    <SelectItem value="错题数">错题数</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormField>
                                                        <FormError error={errors.planType} />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <FormField label={<MixedText text="目标值" />} htmlFor="target" required>
                                                        <Input
                                                            id="target"
                                                            name="target"
                                                            type="number"
                                                            value={form.target || ''}
                                                            onChange={handleFormChange}
                                                            className="h-11"
                                                            placeholder="请输入目标值"
                                                        />
                                                    </FormField>
                                                    <FormError error={errors.target} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <FormField label={<MixedText text="日程描述" />} htmlFor="description">
                                                <Textarea
                                                    id="description"
                                                    name="description"
                                                    value={form.description || ''}
                                                    onChange={handleFormChange}
                                                    rows={3}
                                                    placeholder="可选：添加日程描述"
                                                    className="resize-none"
                                                />
                                            </FormField>
                                        </div>
                                    </div>
                                </Step>
                            </Stepper>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider >
    );
}
