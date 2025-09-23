import React, { useMemo } from 'react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarEvent } from './ScheduleManagementView';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';

interface CustomAgendaViewProps {
    events: CalendarEvent[];
    currentDate: Date;
    onEventClick: (event: CalendarEvent) => void;
}

interface GroupedEvents {
    [key: string]: CalendarEvent[];
}

export default function CustomAgendaView({ events, currentDate, onEventClick }: CustomAgendaViewProps) {
    // 按日期分组事件
    const groupedEvents = useMemo(() => {
        const groups: GroupedEvents = {};

        events.forEach(event => {
            const eventDate = format(event.start, 'yyyy-MM-dd');
            if (!groups[eventDate]) {
                groups[eventDate] = [];
            }

            // 为学习计划添加标识
            if (event.type === 'plan') {
                const isStartEvent = event.title.includes('(开始)') || event.title.includes('开始');
                const isEndEvent = event.title.includes('(结束)') || event.title.includes('结束');

                groups[eventDate].push({
                    ...event,
                    isPlanStart: isStartEvent,
                    isPlanEnd: isEndEvent
                });
            } else {
                groups[eventDate].push(event);
            }
        });

        // 按日期排序
        return Object.keys(groups)
            .sort()
            .reduce((sorted, date) => {
                sorted[date] = groups[date].sort((a, b) => a.start.getTime() - b.start.getTime());
                return sorted;
            }, {} as GroupedEvents);
    }, [events]);

    // 获取日期显示文本
    const getDateDisplayText = (date: Date) => {
        const today = new Date();
        const dateStr = format(date, 'yyyy-MM-dd');
        const todayStr = format(today, 'yyyy-MM-dd');

        if (dateStr === todayStr) {
            return '今天';
        } else if (isTomorrow(date)) {
            return '明天';
        } else if (isYesterday(date)) {
            return '昨天';
        } else {
            return format(date, 'M月d日 EEEE', { locale: zhCN });
        }
    };

    // 获取事件类型颜色
    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'countdown':
                return 'bg-red-500';
            case 'plan':
                return 'bg-blue-500';
            case 'custom':
                return 'bg-green-500';
            default:
                return 'bg-gray-500';
        }
    };

    // 格式化时间显示
    const formatTime = (date: Date) => {
        return format(date, 'HH:mm');
    };

    if (Object.keys(groupedEvents).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    暂无日程安排
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                    当前时间段内没有找到任何事件
                </p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-4">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">日期</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">时间</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">事件</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groupedEvents).map(([dateStr, dayEvents]) => {
                            const date = new Date(dateStr);
                            const isCurrentDay = isToday(date);

                            return dayEvents.map((event, index) => (
                                <Tooltip key={`${event.id}-${index}`}>
                                    <TooltipTrigger asChild>
                                        <tr
                                            className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${isCurrentDay ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                                                }`}
                                            onClick={() => onEventClick(event)}
                                        >
                                            {/* 日期列 */}
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-medium ${isCurrentDay
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : 'text-gray-900 dark:text-gray-100'
                                                        }`}>
                                                        {getDateDisplayText(date)}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {format(date, 'yyyy-MM-dd')}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 时间列 */}
                                            <td className="py-3 px-4">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {event.type === 'plan' ?
                                                        (event.isPlanStart ? '开始' : '结束') :
                                                        event.allDay ? '全天' : formatTime(event.start)
                                                    }
                                                </span>
                                            </td>

                                            {/* 事件列 */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    {/* 事件类型指示器 */}
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getEventTypeColor(event.type)}`} />

                                                    {/* 事件标题 */}
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {event.title}
                                                    </span>

                                                    {/* 事件类型标签 */}
                                                    <span className={`text-xs px-2 py-1 rounded-full ${event.type === 'countdown'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                        : event.type === 'plan'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : event.type === 'custom'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                                                        }`}>
                                                        {event.type === 'countdown' ? '倒计时' :
                                                            event.type === 'plan' ?
                                                                (event.isPlanStart && event.isPlanEnd ? '计划' :
                                                                    event.isPlanStart ? '计划开始' : '计划结束') :
                                                                event.type === 'custom' ? '自定义' : '事件'}
                                                    </span>
                                                </div>

                                                {/* 事件描述 */}
                                                {event.description && (
                                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                                                        {event.description}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="space-y-1">
                                            <p className="font-medium">{event.title}</p>
                                            {event.description && (
                                                <p className="text-sm">{event.description}</p>
                                            )}
                                            <p className="text-xs text-gray-400">
                                                {event.allDay
                                                    ? format(event.start, 'yyyy-MM-dd', { locale: zhCN })
                                                    : event.type === 'countdown'
                                                        ? format(event.start, 'yyyy-MM-dd HH:mm', { locale: zhCN })
                                                        : `${format(event.start, 'yyyy-MM-dd HH:mm', { locale: zhCN })} - ${format(event.end, 'yyyy-MM-dd HH:mm', { locale: zhCN })}`
                                                }
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            ));
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}