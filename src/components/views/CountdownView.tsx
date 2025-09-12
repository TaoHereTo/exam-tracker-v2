import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { FormField } from "@/components/ui/FormField";
import { FormError } from "@/components/ui/form-error";
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Plus, Edit, Trash2, Clock, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { MixedText } from "@/components/ui/MixedText";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateUUID } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // Use existing calendar component
import { cn } from "@/lib/utils";
import { BorderBeamCard } from "@/components/magicui/border-beam-card";
import toast from 'react-hot-toast';

interface ExamCountdown {
    id: string;
    name: string;
    examDate: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface CountdownViewProps {
    countdowns: ExamCountdown[];
    onCreate: (countdown: ExamCountdown) => void;
    onUpdate: (countdown: ExamCountdown) => void;
    onDelete: (id: string) => void;
    onCountdownComplete?: (countdown: ExamCountdown) => void; // Add this prop
}

export default function CountdownView({ countdowns, onCreate, onUpdate, onDelete, onCountdownComplete }: CountdownViewProps) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<ExamCountdown>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [date, setDate] = useState<Date>();
    const [dateOpen, setDateOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [showCompleted, setShowCompleted] = useState(false); // Add state for toggle
    const [recentlyCompletedCountdowns, setRecentlyCompletedCountdowns] = useState<ExamCountdown[]>([]); // Track recently completed countdowns

    // Check for completed countdowns
    useEffect(() => {
        const now = new Date();
        const newlyCompleted = countdowns.filter(countdown => {
            const examDate = new Date(countdown.examDate);
            // Check if the exam date has passed within the last minute and we haven't already notified
            const isCompleted = examDate <= now && examDate > new Date(now.getTime() - 60000);
            const alreadyNotified = recentlyCompletedCountdowns.some(c => c.id === countdown.id);
            return isCompleted && !alreadyNotified;
        });

        if (newlyCompleted.length > 0 && onCountdownComplete) {
            // Call the completion callback for the first completed countdown
            onCountdownComplete(newlyCompleted[0]);
            // Add to completed countdowns to prevent duplicate notifications
            setRecentlyCompletedCountdowns(prev => [...prev, ...newlyCompleted]);
        }
    }, [countdowns, onCountdownComplete, recentlyCompletedCountdowns]);

    const handleOpenForm = (countdown?: ExamCountdown) => {
        if (countdown) {
            setEditId(countdown.id);
            setForm(countdown);
            setDate(countdown.examDate ? new Date(countdown.examDate) : undefined);
        } else {
            setEditId(null);
            setForm({});
            setDate(undefined);
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
        setDateOpen(false); // Close popover when closing form
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
            setForm(prev => ({ ...prev, examDate: format(selectedDate, 'yyyy-MM-dd') }));
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
            newErrors.name = '考试名称不能为空';
            toast.error('考试名称不能为空');
            setErrors(newErrors);
            return false;
        }

        if (!form.examDate) {
            newErrors.examDate = '请选择考试日期';
            toast.error('请选择考试日期');
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
        const countdownData: ExamCountdown = {
            id: editId || generateUUID(),
            name: form.name!,
            examDate: form.examDate!,
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
        onDelete(id);
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

    // 改进的倒计时计算，显示完整的时间
    const calculateDetailedCountdown = (examDate: string) => {
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
                    return <div className="text-center">
                        <div className="text-3xl sm:text-4xl font-bold text-green-500 leading-none">已开始</div>
                    </div>;
                }
            }
        } else {
            return <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-red-500 leading-none">已过期</div>
            </div>;
        }
    };

    // 获取倒计时颜色
    const getCountdownColor = (examDate: string) => {
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

    // 根据剩余时间显示不同的阶段
    const getExamPhase = (examDate: string) => {
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
        } else { // 已过期
            return "已过期";
        }
    };

    // 获取考试状态
    const getExamStatus = (examDate: string) => {
        const now = new Date();
        const exam = new Date(examDate);
        const diffDays = differenceInDays(exam, now);

        // 如果考试日期已过，显示"已考完"，否则显示"准备中"
        return diffDays < 0 ? "已考完" : "准备中";
    };

    // 获取状态显示文本和颜色
    const getStatusDisplay = (examDate: string) => {
        const status = getExamStatus(examDate);
        const color = status === "已考完" ? "#0284c7" : "#10b981"; // 蓝色表示已考完，绿色表示准备中
        return { text: status, color };
    };

    // 分离准备中和已考完的考试
    const activeCountdowns = countdowns.filter(countdown => getExamStatus(countdown.examDate) !== "已考完");
    const completedCountdowns = countdowns.filter(countdown => getExamStatus(countdown.examDate) === "已考完");

    return (
        <div className="space-y-6 w-full">
            <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-4">
                <ButtonGroup spacing="sm" margin="none">
                    <Button
                        onClick={() => handleOpenForm()}
                        className="h-9 px-6 rounded-md font-medium bg-[#15803d] text-white hover:bg-[#15803d]/90 dark:bg-[#15803d] dark:hover:bg-[#15803d]/90 dark:text-white"
                        variant="default"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        <MixedText text="添加考试" />
                    </Button>
                </ButtonGroup>
            </div>

            {/* 切换按钮 */}
            <div className="flex gap-2">
                <Button
                    variant={!showCompleted ? "default" : "outline"}
                    onClick={() => setShowCompleted(false)}
                    className="flex items-center gap-2 shadow-sm"
                    style={{
                        ...((!showCompleted ? { backgroundColor: '#10b981', color: 'white' } : {})),
                        transition: 'none',
                        transform: 'none'
                    }}
                >
                    <Clock className="w-5 h-5" />
                    <MixedText text="准备中" />
                </Button>
                <Button
                    variant={showCompleted ? "default" : "outline"}
                    onClick={() => setShowCompleted(true)}
                    className="flex items-center gap-2 shadow-sm"
                    style={{
                        ...(showCompleted ? { backgroundColor: '#0284c7', color: 'white' } : {}),
                        transition: 'none',
                        transform: 'none'
                    }}
                >
                    <CheckCircle className="w-5 h-5" />
                    <MixedText text="已考完" />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full items-stretch">
                {(showCompleted ? completedCountdowns : activeCountdowns).length > 0 ? (
                    (showCompleted ? completedCountdowns : activeCountdowns).map(countdown => {
                        const statusDisplay = getStatusDisplay(countdown.examDate);
                        return (
                        <BorderBeamCard key={countdown.id} className="w-full rounded-2xl overflow-hidden">
                            <div className="p-6 flex flex-col h-full">
                                {/* Header with title and actions */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-foreground truncate">
                                            {countdown.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {getExamPhase(countdown.examDate)}
                                        </p>
                                    </div>
                                    {/* Action buttons */}
                                    <div className="flex gap-1 ml-2 flex-shrink-0">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        onClick={() => handleOpenForm(countdown)}
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p><MixedText text="编辑" /></p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <AlertDialog>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p><MixedText text="删除" /></p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle><MixedText text="确认删除考试？" /></AlertDialogTitle>
                                                </AlertDialogHeader>
                                                <AlertDialogDescription>
                                                    此操作将永久删除考试倒计时"{countdown.name}"，删除后无法恢复。
                                                </AlertDialogDescription>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel><MixedText text="取消" /></AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(countdown.id)} variant="destructive">
                                                        <MixedText text="确认删除" />
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>

                                {/* Countdown display - main focus */}
                                <div className="flex-1 flex flex-col items-center justify-center my-4">
                                    <div className="text-center">
                                        {calculateDetailedCountdown(countdown.examDate)}
                                    </div>
                                </div>

                                {/* Footer with exam date */}
                                <div className="mt-4 pt-4 border-t border-border">
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">考试日期：</span>
                                        <span className="font-medium">{format(new Date(countdown.examDate), 'yyyy年MM月dd日')}</span>
                                    </div>
                                </div>
                            </div>
                        </BorderBeamCard>
                        )
                    })
                ) : (
                    <div className="col-span-full">
                        <BorderBeamCard className="rounded-2xl overflow-hidden">
                            <div className="p-12 text-center">
                                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                                    {showCompleted ? (
                                        <CheckCircle className="w-8 h-8 text-muted-foreground" />
                                    ) : (
                                        <Clock className="w-8 h-8 text-muted-foreground" />
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-3">
                                    {showCompleted ? (
                                        <MixedText text="暂无已完成的考试" />
                                    ) : (
                                        <MixedText text="暂无考试倒计时" />
                                    )}
                                </h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-lg">
                                    {showCompleted ? (
                                        <MixedText text="已完成的考试将显示在这里，帮助您回顾考试历程" />
                                    ) : (
                                        <MixedText text="点击上方的按钮，添加第一个考试倒计时" />
                                    )}
                                </p>
                                {!showCompleted && (
                                    <Button
                                        onClick={() => handleOpenForm()}
                                        className="h-10 px-6 rounded-md font-medium bg-[#15803d] text-white hover:bg-[#15803d]/90 dark:bg-[#15803d] dark:hover:bg-[#15803d]/90 dark:text-white"
                                        variant="default"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        <MixedText text="添加考试" />
                                    </Button>
                                )}
                            </div>
                        </BorderBeamCard>
                    </div>
                )}
            </div>
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
                        <CardHeader className="border-b border-border">
                            <CardTitle className="text-xl">{editId ? <MixedText text="编辑考试" /> : <MixedText text="添加考试" />}</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="pt-6">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <FormField label={<MixedText text="考试名称" />} htmlFor="name" required>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={form.name || ''}
                                                onChange={handleFormChange}
                                                className="h-11"
                                                placeholder="请输入考试名称"
                                            />
                                        </FormField>
                                        <FormError error={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <FormField label={<MixedText text="考试日期" />} htmlFor="examDate" required>
                                            <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center justify-start text-left font-normal border bg-white dark:bg-[#303030] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-md h-11 shadow-xs transition-[color,box-shadow]"
                                                        onClick={() => setDateOpen(true)}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {date ? (
                                                            <span>{format(date, 'PPP', { locale: zhCN })}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">请选择考试日期</span>
                                                        )}
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0 bg-white dark:bg-black text-black dark:text-white"
                                                    align="start"
                                                    onInteractOutside={() => setDateOpen(false)}
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        captionLayout="dropdown"
                                                        month={currentMonth}
                                                        onMonthChange={setCurrentMonth}
                                                        selected={date}
                                                        onSelect={(d) => {
                                                            setDate(d);
                                                            if (d) {
                                                                setForm(prev => ({ ...prev, examDate: format(d, 'yyyy-MM-dd') }));
                                                            }
                                                            if (errors.examDate) {
                                                                setErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors.examDate;
                                                                    return newErrors;
                                                                });
                                                            }
                                                            // Close popover after selection
                                                            setDateOpen(false);
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

                                    <div className="space-y-2">
                                        <FormField label={<MixedText text="考试描述" />} htmlFor="description">
                                            <Textarea
                                                id="description"
                                                name="description"
                                                value={form.description || ''}
                                                onChange={handleFormChange}
                                                rows={3}
                                                placeholder="可选：添加考试描述"
                                                className="resize-none"
                                            />
                                        </FormField>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="px-6 pb-6">
                                <ButtonGroup spacing="sm" margin="none" className="justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseForm}
                                        className="h-10 px-4"
                                    >
                                        <MixedText text="取消" />
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="default"
                                        className="h-10 px-4"
                                    >
                                        {editId ? <MixedText text="更新" /> : <MixedText text="添加考试" />}
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}