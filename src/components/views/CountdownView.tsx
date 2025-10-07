import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/FormField";
import { FormError } from "@/components/ui/form-error";
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Plus, Edit, Trash2, Clock, CheckCircle, Trash, Pin, PinOff } from "lucide-react";
import { CircularButton } from "@/components/ui/circular-button";
import { useState, useEffect, useMemo } from "react";
import { MixedText } from "@/components/ui/MixedText";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/animate-ui/components/animate/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/animate-ui/components/radix/hover-card";
import { AnimatePresence, motion } from "motion/react";
import { generateUUID } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // Use new grid calendar component
import { cn } from "@/lib/utils";
import { BorderBeamCard } from "@/components/magicui/border-beam-card";
import toast from 'react-hot-toast';
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/simple-tabs";
import CountdownExpandableCard from "@/components/ui/CountdownExpandableCard";
import { BeautifulPagination } from "@/components/ui/BeautifulPagination";
import { ThemeColorProvider, PAGE_THEME_COLORS } from "@/contexts/ThemeColorContext";

interface ExamCountdown {
    id: string;
    name: string;
    examDate: string;
    description?: string;
    isPinned?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface CountdownViewProps {
    countdowns: ExamCountdown[];
    onCreate: (countdown: ExamCountdown) => void;
    onUpdate: (countdown: ExamCountdown) => void;
    onDelete: (id: string) => void;
    onBatchDelete?: (ids: string[]) => void;
    onCountdownComplete?: (countdown: ExamCountdown) => void; // Add this prop
}

export default function CountdownView({ countdowns, onCreate, onUpdate, onDelete, onBatchDelete, onCountdownComplete }: CountdownViewProps) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<ExamCountdown>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [date, setDate] = useState<Date>();
    const [dateOpen, setDateOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [time, setTime] = useState({ hours: '09', minutes: '00' }); // 默认时间 09:00
    const [recentlyCompletedCountdowns, setRecentlyCompletedCountdowns] = useState<ExamCountdown[]>([]); // Track recently completed countdowns
    const [selectedCountdowns, setSelectedCountdowns] = useState<Set<string>>(new Set()); // Track selected countdowns for bulk operations
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // Control delete confirmation dialog

    // 分页相关状态
    const [completedPage, setCompletedPage] = useState(1);
    const [completedPageSize, setCompletedPageSize] = useState(7);

    // Check for completed countdowns - 使用useMemo优化，避免频繁重新渲染
    const newlyCompletedCountdowns = useMemo(() => {
        if (countdowns.length === 0) return []; // 空数组时直接返回，避免创建Date对象
        const now = new Date();
        return countdowns.filter(countdown => {
            const examDate = new Date(countdown.examDate);
            // Check if the exam date has passed within the last minute and we haven't already notified
            const isCompleted = examDate <= now && examDate > new Date(now.getTime() - 60000);
            const alreadyNotified = recentlyCompletedCountdowns.some(c => c.id === countdown.id);
            return isCompleted && !alreadyNotified;
        });
    }, [countdowns, recentlyCompletedCountdowns]); // 依赖完整的数组

    useEffect(() => {
        if (newlyCompletedCountdowns.length > 0 && onCountdownComplete) {
            // Call the completion callback for the first completed countdown
            onCountdownComplete(newlyCompletedCountdowns[0]);
            // Add to completed countdowns to prevent duplicate notifications
            setRecentlyCompletedCountdowns(prev => [...prev, ...newlyCompletedCountdowns]);
        }
    }, [newlyCompletedCountdowns, onCountdownComplete]);

    const handleOpenForm = (countdown?: ExamCountdown) => {
        if (countdown) {
            setEditId(countdown.id);
            setForm(countdown);
            if (countdown.examDate) {
                const examDateTime = new Date(countdown.examDate);
                setDate(examDateTime);
                // 解析时间
                const hours = examDateTime.getHours().toString().padStart(2, '0');
                const minutes = examDateTime.getMinutes().toString().padStart(2, '0');
                setTime({ hours, minutes });
            } else {
                setDate(undefined);
                setTime({ hours: '09', minutes: '00' });
            }
        } else {
            setEditId(null);
            setForm({});
            setDate(undefined);
            setTime({ hours: '09', minutes: '00' });
        }
        setErrors({});
        setShowForm(true);
        setDateOpen(false); // Close popover when opening form
        setCurrentMonth(new Date()); // Reset to current month
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditId(null);
        setForm({});
        setErrors({});
        setDate(undefined);
        setTime({ hours: '09', minutes: '00' });
        setDateOpen(false); // Close popover when closing form
    };

    const handleDialogClose = () => {
        // 只重置表单状态，不直接设置showForm，让Dialog自己处理关闭
        setEditId(null);
        setForm({});
        setErrors({});
        setDate(undefined);
        setTime({ hours: '09', minutes: '00' });
        setDateOpen(false);
    };

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

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        if (selectedDate) {
            // 结合日期和时间创建完整的日期时间
            const combinedDateTime = new Date(selectedDate);
            combinedDateTime.setHours(parseInt(time.hours), parseInt(time.minutes), 0, 0);
            setForm(prev => ({ ...prev, examDate: combinedDateTime.toISOString() }));
        }
        if (errors.examDate) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.examDate;
                return newErrors;
            });
        }
    };

    const handleTimeChange = (field: 'hours' | 'minutes', value: string) => {
        setTime(prev => ({ ...prev, [field]: value }));
        if (date) {
            // 更新表单中的日期时间
            const combinedDateTime = new Date(date);
            const newTime = { ...time, [field]: value };
            combinedDateTime.setHours(parseInt(newTime.hours), parseInt(newTime.minutes), 0, 0);
            setForm(prev => ({ ...prev, examDate: combinedDateTime.toISOString() }));
        }
        if (errors.examDate) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.examDate;
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.name?.trim()) {
            newErrors.name = '倒计时名称不能为空';
            toast.error('倒计时名称不能为空');
            setErrors(newErrors);
            return false;
        }

        if (!form.examDate) {
            newErrors.examDate = '请选择目标日期';
            toast.error('请选择目标日期');
            setErrors(newErrors);
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const now = new Date().toISOString();

        // 确保日期时间格式正确
        let examDateTime = form.examDate!;
        if (date && !examDateTime.includes('T')) {
            // 如果没有时间部分，使用选择的时间
            const combinedDateTime = new Date(date);
            combinedDateTime.setHours(parseInt(time.hours), parseInt(time.minutes), 0, 0);
            examDateTime = combinedDateTime.toISOString();
        }

        const countdownData: ExamCountdown = {
            id: editId || generateUUID(),
            name: form.name!,
            examDate: examDateTime,
            description: form.description,
            createdAt: editId ? form.createdAt : now,
            updatedAt: now
        };

        if (editId) {
            onUpdate(countdownData);
        } else {
            onCreate(countdownData);
        }

        handleCloseForm();
    };

    const handleDelete = (id: string) => {
        const countdown = countdowns.find(c => c.id === id);
        if (countdown) {
            setSelectedCountdowns(new Set([id]));
            setDeleteDialogOpen(true);
        }
    };

    // 处理单个复选框选择
    const handleCountdownSelect = (id: string, checked: boolean) => {
        setSelectedCountdowns(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };

    // 处理全选/取消全选
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedCountdowns(new Set(paginatedCompletedCountdowns.map(c => c.id)));
        } else {
            setSelectedCountdowns(new Set());
        }
    };

    // 批量编辑
    const handleBulkEdit = () => {
        if (selectedCountdowns.size === 0) return;

        // 如果只选中一个，直接编辑
        if (selectedCountdowns.size === 1) {
            const countdownId = Array.from(selectedCountdowns)[0];
            const countdown = paginatedCompletedCountdowns.find(c => c.id === countdownId);
            if (countdown) {
                handleOpenForm(countdown);
            }
        } else {
            // 多个选中时，提示用户
            toast.error('请选择一个倒计时进行编辑');
        }
    };

    // 批量删除 - 显示确认对话框
    const handleBulkDelete = () => {
        if (selectedCountdowns.size === 0) return;
        setDeleteDialogOpen(true);
    };

    // 确认删除
    const confirmDelete = async () => {
        const countdownIds = Array.from(selectedCountdowns);

        // 先关闭对话框
        setDeleteDialogOpen(false);

        // 清空选中状态
        setSelectedCountdowns(new Set());

        // 如果有批量删除函数，使用它；否则使用单个删除
        if (onBatchDelete) {
            await onBatchDelete(countdownIds);
        } else {
            // 执行删除操作
            countdownIds.forEach(id => {
                onDelete(id);
            });
            // 显示统一的成功toast
            toast.success(`已删除 ${countdownIds.length} 个倒计时`);
        }
    };

    // 处理置顶功能
    const handleTogglePin = (countdown: ExamCountdown) => {
        const updatedCountdown = {
            ...countdown,
            isPinned: !countdown.isPinned
        };
        onUpdate(updatedCountdown);
        toast.success(updatedCountdown.isPinned ? '已置顶' : '已取消置顶');
    };


    // 计算倒计时
    const calculateCountdown = (examDate: string) => {
        const now = new Date();
        const exam = new Date(examDate);
        const diffDays = differenceInDays(exam, now);

        if (diffDays > 0) {
            return `${diffDays}天`;
        } else if (diffDays === 0) {
            const diffHours = differenceInHours(exam, now);
            if (diffHours > 0) {
                return `${diffHours}小时`;
            } else {
                const diffMinutes = differenceInMinutes(exam, now);
                if (diffMinutes > 0) {
                    return `${diffMinutes}分钟`;
                } else {
                    return "已开始";
                }
            }
        } else {
            return "已过期";
        }
    };

    // 改进的倒计时计算，显示完整的时间 - 使用useMemo缓存结果避免频繁重新计算
    const calculateDetailedCountdown = useMemo(() => {
        const calculateCountdown = (examDate: string) => {
            const now = new Date();
            const exam = new Date(examDate);
            const diffDays = differenceInDays(exam, now);

            if (diffDays > 0) {
                const remainingHours = differenceInHours(exam, now) % 24;
                const remainingMinutes = differenceInMinutes(exam, now) % 60;
                return (
                    <div className="flex items-center justify-center gap-6 sm:gap-8">
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl font-bold text-foreground leading-none">{diffDays}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">天</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl font-bold text-foreground leading-none">{remainingHours}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">小时</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl font-bold text-foreground leading-none">{remainingMinutes}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">分钟</div>
                        </div>
                    </div>
                );
            } else if (diffDays === 0) {
                const diffHours = differenceInHours(exam, now);
                if (diffHours > 0) {
                    const remainingMinutes = differenceInMinutes(exam, now) % 60;
                    return (
                        <div className="flex items-center justify-center gap-6 sm:gap-8">
                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold text-foreground leading-none">{diffHours}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground mt-1">小时</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold text-foreground leading-none">{remainingMinutes}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground mt-1">分钟</div>
                            </div>
                        </div>
                    );
                } else {
                    const diffMinutes = differenceInMinutes(exam, now);
                    if (diffMinutes > 0) {
                        return (
                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold text-foreground leading-none">{diffMinutes}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground mt-1">分钟</div>
                            </div>
                        );
                    } else {
                        return (
                            <div className="flex items-center justify-center gap-6 sm:gap-8">
                                <div className="text-center">
                                    <div className="text-3xl sm:text-4xl font-bold text-green-500 leading-none">已开始</div>
                                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">倒计时进行中</div>
                                </div>
                            </div>
                        );
                    }
                }
            } else {
                // 计算已过天数
                const daysPassed = Math.max(0, differenceInDays(now, exam));
                return (
                    <div className="flex items-center justify-center gap-6 sm:gap-8">
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl font-bold text-blue-500 leading-none">{daysPassed}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">天前</div>
                        </div>
                    </div>
                );
            }
        };
        return calculateCountdown;
    }, []); // 空依赖数组，函数本身不需要重新创建

    // 获取倒计时颜色 - 使用useMemo缓存
    const getCountdownColor = useMemo(() => {
        return (examDate: string) => {
            const now = new Date();
            const exam = new Date(examDate);
            const diffDays = differenceInDays(exam, now);

            if (diffDays > 30) {
                return "text-green-500";
            } else if (diffDays > 7) {
                return "text-yellow-500";
            } else if (diffDays > 0) {
                return "text-red-500";
            } else {
                return "text-gray-500";
            }
        };
    }, []);

    // 根据剩余时间显示不同的阶段 - 使用useMemo缓存
    const getExamPhase = useMemo(() => {
        return (examDate: string) => {
            const now = new Date();
            const exam = new Date(examDate);
            const diffDays = differenceInDays(exam, now);

            if (diffDays > 150) { // 5个月以上
                return "准备阶段";
            } else if (diffDays > 90) { // 3-5个月
                return "强化阶段";
            } else if (diffDays > 30) { // 1-3个月
                return "冲刺阶段";
            } else if (diffDays >= 0) { // 1个月内
                return "即将开始";
            } else { // 已开始
                return "已开始";
            }
        };
    }, []);

    // 获取倒计时状态 - 使用useMemo缓存
    const getExamStatus = useMemo(() => {
        return (examDate: string) => {
            const now = new Date();
            const exam = new Date(examDate);
            const diffDays = differenceInDays(exam, now);

            // 如果目标日期已过，显示"已完成"，否则显示"进行中"
            return diffDays < 0 ? "已完成" : "进行中";
        };
    }, []);

    // 计算已过天数 - 使用useMemo缓存
    const getDaysPassed = useMemo(() => {
        return (examDate: string) => {
            const now = new Date();
            const exam = new Date(examDate);
            const diffDays = differenceInDays(now, exam); // 注意：这里用now - exam来计算已过的天数
            return Math.max(0, diffDays); // 确保返回非负数
        };
    }, []);

    // 获取状态显示文本和颜色 - 使用useMemo缓存
    const getStatusDisplay = useMemo(() => {
        return (examDate: string) => {
            const status = getExamStatus(examDate);
            if (status === "已完成") {
                const daysPassed = getDaysPassed(examDate);
                return { text: `已过${daysPassed}天`, color: "#0284c7" }; // 蓝色表示已完成
            } else {
                return { text: status, color: "#10b981" }; // 绿色表示进行中
            }
        };
    }, [getExamStatus, getDaysPassed]);

    // 分离进行中和已完成的倒计时 - 使用useMemo缓存避免每次渲染都重新计算
    const activeCountdowns = useMemo(() => {
        if (countdowns.length === 0) return []; // 空数组时直接返回，避免调用getExamStatus
        return countdowns
            .filter(countdown => getExamStatus(countdown.examDate) !== "已完成")
            .sort((a, b) => {
                // 置顶的排在前面
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                // 如果置顶状态相同，按目标日期排序
                return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
            });
    }, [countdowns, getExamStatus]);

    const completedCountdowns = useMemo(() => {
        if (countdowns.length === 0) return []; // 空数组时直接返回，避免调用getExamStatus
        return countdowns
            .filter(countdown => getExamStatus(countdown.examDate) === "已完成")
            .sort((a, b) => {
                // 置顶的排在前面
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                // 如果置顶状态相同，按目标日期排序（最近的在前）
                return new Date(b.examDate).getTime() - new Date(a.examDate).getTime();
            });
    }, [countdowns, getExamStatus]);

    // 分页处理
    const totalCompletedPages = Math.ceil(completedCountdowns.length / completedPageSize);
    const paginatedCompletedCountdowns = completedCountdowns.slice(
        (completedPage - 1) * completedPageSize,
        completedPage * completedPageSize
    );

    // 处理分页变化
    const handleCompletedPageChange = (page: number) => {
        setCompletedPage(page);
        // 清空选中状态
        setSelectedCountdowns(new Set());
    };

    const handleCompletedPageSizeChange = (size: number) => {
        setCompletedPageSize(size);
        setCompletedPage(1); // 重置到第一页
        // 清空选中状态
        setSelectedCountdowns(new Set());
    };

    return (
        <div className="form-stack">
            <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center button-group-lg">
                <ButtonGroup spacing="sm">
                    <Button
                        onClick={() => handleOpenForm()}
                        className="h-9 px-6 rounded-full font-medium bg-[#db2777] text-white hover:bg-[#db2777]/90"
                        variant="default"
                    >
                        <div className="button-group">
                            <Plus className="w-5 h-5" />
                            <MixedText text="添加倒计时" />
                        </div>
                    </Button>
                </ButtonGroup>
            </div>

            {/* 使用自定义 tabs 组件 */}
            <ThemeColorProvider defaultColor={PAGE_THEME_COLORS.countdown}>
                <Tabs defaultValue="active" className="w-full" themeColor={PAGE_THEME_COLORS.countdown}>
                    <div className="flex justify-center mb-6">
                        <TabsList className="grid w-fit min-w-[200px] grid-cols-2">
                            <TabsTrigger value="active">
                                <MixedText text="未开始" />
                            </TabsTrigger>
                            <TabsTrigger value="completed">
                                <MixedText text="已完成" />
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContents className="py-6 px-2">
                        <TabsContent value="active" className="outline-none">
                            <div className="w-full max-w-6xl mx-auto pb-4 px-4 sm:px-6 lg:px-8">
                                <div className="min-h-[500px]">
                                    {activeCountdowns.length > 0 ? (
                                        /* 使用 CountdownExpandableCard 组件 */
                                        <CountdownExpandableCard
                                            countdowns={activeCountdowns}
                                            calculateDetailedCountdown={calculateDetailedCountdown}
                                            getExamPhase={getExamPhase}
                                            getStatusDisplay={getStatusDisplay}
                                            prefix="active"
                                            onEdit={handleOpenForm}
                                            onDelete={handleDelete}
                                            onTogglePin={handleTogglePin}
                                        />
                                    ) : (
                                        /* 空状态 */
                                        <div className="p-12 text-center">
                                            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                                                <Clock className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                                <MixedText text="暂无倒计时" />
                                            </h3>
                                            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-lg">
                                                <MixedText text="点击上方的按钮，添加第一个倒计时" />
                                            </p>
                                            <Button
                                                onClick={() => handleOpenForm()}
                                                className="h-10 px-6 rounded-md font-medium bg-[#db2777] text-white hover:bg-[#db2777]/90"
                                                variant="default"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Plus className="w-5 h-5" />
                                                    <MixedText text="添加倒计时" />
                                                </div>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="completed" className="outline-none">
                            <div className="w-full max-w-6xl mx-auto pb-4 px-4 sm:px-6 lg:px-8">
                                <div className="min-h-[500px]">
                                    {completedCountdowns.length > 0 ? (
                                        <div className="space-y-4">
                                            {/* 批量操作栏 */}
                                            <div className="flex items-center justify-between px-6 py-3 rounded-lg bg-[#EEEDED] dark:bg-[#262626]">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={selectedCountdowns.size === paginatedCompletedCountdowns.length && paginatedCompletedCountdowns.length > 0}
                                                        onCheckedChange={handleSelectAll}
                                                        size="sm"
                                                    />
                                                    <span className="text-sm text-muted-foreground">
                                                        已选择 {selectedCountdowns.size} / {paginatedCompletedCountdowns.length} 项
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <CircularButton
                                                                onClick={handleBulkEdit}
                                                                variant="success"
                                                                size="default"
                                                                disabled={selectedCountdowns.size === 0}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </CircularButton>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p><MixedText text="编辑选中项" /></p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                onClick={handleBulkDelete}
                                                                variant="destructive"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full"
                                                                disabled={selectedCountdowns.size === 0}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p><MixedText text="删除选中项" /></p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>

                                            {/* 横向长条卡片列表 */}
                                            <AnimatePresence mode="popLayout">
                                                <div className="space-y-2">
                                                    {paginatedCompletedCountdowns.map(countdown => {
                                                        const isSelected = selectedCountdowns.has(countdown.id);
                                                        return (
                                                            <HoverCard key={countdown.id}>
                                                                <HoverCardTrigger asChild>
                                                                    <motion.div
                                                                        layoutId={`completed-countdown-${countdown.id}`}
                                                                        layout
                                                                        className="w-full rounded-xl overflow-hidden cursor-pointer bg-white dark:bg-black dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#303030] transition-colors shadow-none"
                                                                        onClick={() => handleCountdownSelect(countdown.id, !isSelected)}
                                                                    >
                                                                        <div className="px-6 py-3 flex items-center gap-3">
                                                                            {/* 复选框 */}
                                                                            <Checkbox
                                                                                checked={isSelected}
                                                                                onCheckedChange={(checked) => handleCountdownSelect(countdown.id, checked as boolean)}
                                                                                size="sm"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            />

                                                                            {/* 倒计时信息 */}
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <h3 className="text-base font-bold text-black dark:text-white truncate">{countdown.name}</h3>
                                                                                        <div className="flex items-center gap-4 mt-0.5 text-xs text-muted-foreground">
                                                                                            <span>{countdown.examDate.split('T')[0]}</span>
                                                                                            {countdown.description && (
                                                                                                <>
                                                                                                    <span>•</span>
                                                                                                    <span className="truncate text-black dark:text-white">{countdown.description}</span>
                                                                                                </>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* 状态显示 */}
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <CheckCircle className="w-4 h-4" style={{ color: '#0284c7' }} />
                                                                                            <span className="text-xs font-medium" style={{ color: '#0284c7' }}>已完成</span>
                                                                                        </div>

                                                                                        {/* 操作按钮 */}
                                                                                        <div className="flex gap-1 ml-2 flex-shrink-0">
                                                                                            <Tooltip>
                                                                                                <TooltipTrigger asChild>
                                                                                                    <CircularButton
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            handleTogglePin(countdown);
                                                                                                        }}
                                                                                                        variant={countdown.isPinned ? "warning" : "gray"}
                                                                                                        size="sm"
                                                                                                    >
                                                                                                        {countdown.isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                                                                                                    </CircularButton>
                                                                                                </TooltipTrigger>
                                                                                                <TooltipContent>
                                                                                                    <p><MixedText text={countdown.isPinned ? "取消置顶" : "置顶"} /></p>
                                                                                                </TooltipContent>
                                                                                            </Tooltip>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                </HoverCardTrigger>
                                                                <HoverCardContent className="w-80">
                                                                    <div className="space-y-2">
                                                                        <h4 className="text-sm font-semibold">
                                                                            <MixedText text="倒计时详情" />
                                                                        </h4>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            <MixedText text={countdown.description || '暂无描述'} />
                                                                        </p>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            <MixedText text={`目标日期: ${countdown.examDate.split('T')[0]}`} />
                                                                        </div>
                                                                    </div>
                                                                </HoverCardContent>
                                                            </HoverCard>
                                                        );
                                                    })}
                                                </div>
                                            </AnimatePresence>

                                            {/* 分页组件 */}
                                            {totalCompletedPages > 1 && (
                                                <div className="mt-6">
                                                    <BeautifulPagination
                                                        currentPage={completedPage}
                                                        totalPages={totalCompletedPages}
                                                        onPageChange={handleCompletedPageChange}
                                                        totalItems={completedCountdowns.length}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* 空状态 */
                                        <div className="p-12 text-center">
                                            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                                                <CheckCircle className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                                <MixedText text="暂无已完成的倒计时" />
                                            </h3>
                                            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-lg">
                                                <MixedText text="已完成的倒计时将显示在这里，帮助您回顾重要时刻" />
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </TabsContents>
                </Tabs>
            </ThemeColorProvider>

            <Dialog open={showForm} onOpenChange={(open) => {
                if (!open) {
                    handleDialogClose();
                }
                setShowForm(open);
            }}>
                <DialogContent className="w-11/12 max-w-md sm:max-w-lg h-[73vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {editId ? <MixedText text="编辑倒计时" /> : <MixedText text="添加倒计时" />}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-8">
                        <div className="space-y-2">
                            <FormField label={<MixedText text="倒计时名称" />} htmlFor="name" required>
                                <Input
                                    id="name"
                                    name="name"
                                    value={form.name || ''}
                                    onChange={handleFormChange}
                                    className="h-11"
                                    placeholder="请输入倒计时名称"
                                />
                            </FormField>
                            <FormError error={errors.name} />
                        </div>

                        <div className="space-y-2">
                            <FormField label={<MixedText text="目标日期" />} htmlFor="examDate" required>
                                <Popover open={dateOpen} onOpenChange={(open) => {
                                    console.log('Popover onOpenChange:', open);
                                    setDateOpen(open);
                                }}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className="w-full flex items-center justify-start text-left font-normal border bg-white dark:bg-[#303030] px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-md h-11 shadow-xs transition-[color,box-shadow]"
                                            onClick={() => {
                                                console.log('Button clicked, current dateOpen:', dateOpen);
                                                setDateOpen(true);
                                            }}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                            {date ? (
                                                <span>{format(date, 'PPP', { locale: zhCN })}</span>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">请选择目标日期</span>
                                            )}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0 bg-white dark:bg-black text-black dark:text-white z-[100010]"
                                        align="start"
                                        onInteractOutside={() => setDateOpen(false)}
                                        side="bottom"
                                        sideOffset={4}
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(d) => {
                                                setDate(d);
                                                if (d) {
                                                    // 结合日期和时间创建完整的日期时间
                                                    const combinedDateTime = new Date(d);
                                                    combinedDateTime.setHours(parseInt(time.hours), parseInt(time.minutes), 0, 0);
                                                    setForm(prev => ({ ...prev, examDate: combinedDateTime.toISOString() }));
                                                }
                                                if (errors.examDate) {
                                                    setErrors(prev => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors.examDate;
                                                        return newErrors;
                                                    });
                                                }
                                                // 延迟关闭popover，确保点击事件完成
                                                setTimeout(() => {
                                                    setDateOpen(false);
                                                }, 100);
                                            }}
                                            page="countdown"
                                            captionLayout="label"
                                            showCustomHeader={true}
                                            locale={zhCN}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FormField>
                            <FormError error={errors.examDate} />
                        </div>

                        <div className="space-y-2">
                            <FormField label={<MixedText text="目标时间" />} htmlFor="examTime">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="hours"
                                            type="number"
                                            min="0"
                                            max="23"
                                            value={time.hours}
                                            onChange={(e) => {
                                                let value = e.target.value;
                                                if (value === '') {
                                                    value = '00';
                                                } else {
                                                    const num = parseInt(value);
                                                    if (num >= 0 && num <= 23) {
                                                        value = num.toString().padStart(2, '0');
                                                    } else {
                                                        return; // 不更新无效值
                                                    }
                                                }
                                                handleTimeChange('hours', value);
                                            }}
                                            className="h-11 w-16 text-center"
                                            placeholder="09"
                                        />
                                        <label htmlFor="hours" className="text-sm text-muted-foreground whitespace-nowrap">时</label>
                                    </div>
                                    <span className="text-muted-foreground text-lg font-medium">:</span>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="minutes"
                                            type="number"
                                            min="0"
                                            max="59"
                                            value={time.minutes}
                                            onChange={(e) => {
                                                let value = e.target.value;
                                                if (value === '') {
                                                    value = '00';
                                                } else {
                                                    const num = parseInt(value);
                                                    if (num >= 0 && num <= 59) {
                                                        value = num.toString().padStart(2, '0');
                                                    } else {
                                                        return; // 不更新无效值
                                                    }
                                                }
                                                handleTimeChange('minutes', value);
                                            }}
                                            className="h-11 w-16 text-center"
                                            placeholder="00"
                                        />
                                        <label htmlFor="minutes" className="text-sm text-muted-foreground whitespace-nowrap">分</label>
                                    </div>
                                </div>
                            </FormField>
                        </div>

                        <div className="space-y-2">
                            <FormField label={<MixedText text="倒计时描述" />} htmlFor="description">
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={form.description || ''}
                                    onChange={handleFormChange}
                                    rows={3}
                                    placeholder="可选：添加倒计时描述"
                                    className="resize-none"
                                />
                            </FormField>
                        </div>

                        <DialogFooter className="flex-col sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseForm}
                                className="w-full sm:w-auto rounded-full"
                            >
                                <MixedText text="取消" />
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                className="w-full sm:w-auto rounded-full bg-[#db2777] hover:bg-[#db2777]/90 text-white dark:text-white"
                            >
                                {editId ? <MixedText text="更新" /> : <MixedText text="添加倒计时" />}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle><MixedText text="确认删除" /></DialogTitle>
                        <DialogDescription>
                            <MixedText text={`确定要删除选中的 ${selectedCountdowns.size} 个倒计时吗？`} />
                            <br />
                            <br />
                            <MixedText text="此操作不可撤销，删除后无法恢复。" />
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" className="flex items-center justify-center rounded-full">
                                <MixedText text="取消" />
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={confirmDelete}
                            variant="destructive"
                            className="flex items-center justify-center rounded-full"
                        >
                            <MixedText text="确认删除" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}