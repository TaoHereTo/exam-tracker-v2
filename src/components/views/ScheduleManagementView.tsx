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
import { generateUUID } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import toast from 'react-hot-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/animate-ui/components/animate/tooltip";
import { normalizeModuleName } from "@/config/exam";
import type { ExamCountdown, StudyPlan } from "@/types/record";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

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
    type: 'countdown' | 'plan' | 'custom';
    description?: string;
    color?: string;
    sourceId?: string; // 关联的倒计时或计划ID
    isDuration?: boolean; // 标记为持续时间事件
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

    // 将倒计时、计划和自定义事件转换为日历事件
    const events = useMemo(() => {
        const calendarEvents: CalendarEvent[] = [];

        // 添加倒计时事件
        countdowns.forEach(countdown => {
            const examDate = new Date(countdown.examDate);
            calendarEvents.push({
                id: `countdown-${countdown.id}`,
                title: countdown.name,
                start: examDate,
                end: examDate,
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
                type: event.type || 'custom',
                description: event.description,
                color: event.color || '#8b5cf6', // 紫色
                sourceId: event.sourceId
            });
        });

        return calendarEvents;
    }, [countdowns, plans, customEvents]);

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
            type: 'custom',
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

    // 表单验证
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 处理表单提交
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const eventData: CalendarEvent = {
            id: editEvent?.id || generateUUID(),
            title: form.title!,
            start: form.start!,
            end: form.end!,
            type: form.type || 'custom',
            description: form.description,
            color: form.color || '#3174ad'
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
            case 'custom':
                return '#8b5cf6';
            default:
                return '#3174ad';
        }
    };

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* 工具栏 */}
                <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-4">
                    <Button
                        onClick={() => {
                            setForm({
                                title: '',
                                start: new Date(),
                                end: new Date(),
                                type: 'custom',
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
                            <CalendarViewTabs currentView={view} onViewChange={(viewStr) => setView(viewStr as View)} />
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
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
                                    <span className="text-xs">
                                        <MixedText text="自定义日程" />
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
                                                    className="cursor-pointer w-full h-full"
                                                    title="" // 清空默认的 title 属性
                                                    style={{ pointerEvents: 'auto' }}
                                                >
                                                    {event.title}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-lg z-50">
                                                <div className="space-y-1">
                                                    <p className="font-medium text-black dark:text-white">{event.title}</p>
                                                    {event.description && (
                                                        <p className="text-sm text-black dark:text-white">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                                        {event.allDay
                                                            ? format(event.start, 'yyyy-MM-dd', { locale: zhCN })
                                                            : `${format(event.start, 'yyyy-MM-dd HH:mm', { locale: zhCN })} - ${format(event.end, 'yyyy-MM-dd HH:mm', { locale: zhCN })}`
                                                        }
                                                    </p>
                                                </div>
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
                        </div>
                    </div>
                </div>

                {/* 添加/编辑日程对话框 */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent className="w-11/12 max-w-md sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl">
                                {editEvent ? <MixedText text="编辑日程" /> : <MixedText text="添加日程" />}
                            </DialogTitle>
                        </DialogHeader>
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
                                <FormField label={<MixedText text="日程类型" />} htmlFor="type">
                                    <Select
                                        value={form.type || 'custom'}
                                        onValueChange={handleTypeChange}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="选择日程类型" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="custom">
                                                <MixedText text="自定义日程" />
                                            </SelectItem>
                                            <SelectItem value="countdown">
                                                <MixedText text="考试倒计时" />
                                            </SelectItem>
                                            <SelectItem value="plan">
                                                <MixedText text="学习计划" />
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormField>
                                <FormError error={errors.type} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <FormField label={<MixedText text="开始时间" />} htmlFor="start" required>
                                        <Input
                                            id="start"
                                            name="start"
                                            type="datetime-local"
                                            value={form.start ? format(form.start, "yyyy-MM-dd'T'HH:mm") : ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value) {
                                                    setForm(prev => ({ ...prev, start: new Date(value) }));
                                                }
                                            }}
                                            className="h-11"
                                        />
                                    </FormField>
                                    <FormError error={errors.start} />
                                </div>

                                <div className="space-y-2">
                                    <FormField label={<MixedText text="结束时间" />} htmlFor="end" required>
                                        <Input
                                            id="end"
                                            name="end"
                                            type="datetime-local"
                                            value={form.end ? format(form.end, "yyyy-MM-dd'T'HH:mm") : ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value) {
                                                    setForm(prev => ({ ...prev, end: new Date(value) }));
                                                }
                                            }}
                                            className="h-11"
                                        />
                                    </FormField>
                                    <FormError error={errors.end} />
                                </div>
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
                                {editEvent && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleDelete}
                                        className="w-full sm:w-auto"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        <MixedText text="删除" />
                                    </Button>
                                )}
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
                                    {editEvent ? <MixedText text="更新" /> : <MixedText text="添加" />}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
