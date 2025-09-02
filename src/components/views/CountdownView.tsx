import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { FormField } from "@/components/ui/FormField";
import { FormError } from "@/components/ui/form-error";
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Plus, Edit, Trash2, Clock } from "lucide-react";
import { useState } from "react";
import { MixedText } from "@/components/ui/MixedText";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateUUID } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // Use existing calendar component
import { cn } from "@/lib/utils";

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
}

export default function CountdownView({ countdowns, onCreate, onUpdate, onDelete }: CountdownViewProps) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<ExamCountdown>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [date, setDate] = useState<Date>();
    const [dateOpen, setDateOpen] = useState(false); // Add state to control popover
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date()); // Add state for month navigation

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
        }

        if (!form.examDate) {
            newErrors.examDate = '请选择考试日期';
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
                <span>
                    <span className="text-3xl font-bold">{diffDays}</span>
                    <span className="text-lg font-medium text-gray-400">天</span>
                    <span className="mx-2"></span>
                    <span className="text-3xl font-bold">{remainingHours}</span>
                    <span className="text-lg font-medium text-gray-400">小时</span>
                    <span className="mx-2"></span>
                    <span className="text-3xl font-bold">{remainingMinutes}</span>
                    <span className="text-lg font-medium text-gray-400">分钟</span>
                </span>
            );
        } else if (diffDays === 0) {
            const diffHours = differenceInHours(exam, now);
            if (diffHours > 0) {
                const remainingMinutes = differenceInMinutes(exam, now) % 60;
                return (
                    <span>
                        <span className="text-3xl font-bold">{diffHours}</span>
                        <span className="text-lg font-medium text-gray-400">小时</span>
                        <span className="mx-2"></span>
                        <span className="text-3xl font-bold">{remainingMinutes}</span>
                        <span className="text-lg font-medium text-gray-400">分钟</span>
                    </span>
                );
            } else {
                const diffMinutes = differenceInMinutes(exam, now);
                if (diffMinutes > 0) {
                    return (
                        <span>
                            <span className="text-3xl font-bold">{diffMinutes}</span>
                            <span className="text-lg font-medium text-gray-400">分钟</span>
                        </span>
                    );
                } else {
                    return <span className="text-3xl font-bold">已开始</span>;
                }
            }
        } else {
            return <span className="text-3xl font-bold">已过期</span>;
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

    return (
        <div className="space-y-6 w-full">
            <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-4">
                <ButtonGroup spacing="sm" margin="none">
                    <Button
                        onClick={() => handleOpenForm()}
                        className="h-11 px-6 bg-[#15803d] text-white rounded-xl font-medium transition-all duration-300 ease-out hover:scale-105 hover:shadow-md active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        <MixedText text="添加考试" />
                    </Button>
                </ButtonGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full items-stretch">
                {countdowns.length > 0 ? (
                    countdowns.map(countdown => (
                        <Card key={countdown.id} className="shadow-sm hover:shadow-md transition-all duration-300 w-full flex flex-col border-0 rounded-2xl overflow-hidden p-0">
                            <div className="px-8 py-6">
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="text-xl font-medium text-foreground">
                                            距离<span className="font-bold">{countdown.name}</span>开始还有
                                        </div>
                                        {/* Action buttons */}
                                        <div className="flex gap-2 flex-shrink-0">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            onClick={() => handleOpenForm(countdown)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 w-9 p-0 button-hover-info"
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
                                                                    className="h-9 w-9 button-hover-danger"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
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
                                                        此操作将永久删除考试倒计时&quot;{countdown.name}&quot;，删除后无法恢复。
                                                    </AlertDialogDescription>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel><MixedText text="取消" /></AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(countdown.id)} className="bg-red-600 transition-all duration-300 ease-out hover:scale-105 hover:shadow-md active:scale-95"><MixedText text="确认删除" /></AlertDialogAction>

                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                    <div className="text-foreground">
                                        {calculateDetailedCountdown(countdown.examDate)}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-muted/50 rounded-2xl">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                            <MixedText text="暂无考试倒计时" />
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md text-lg">
                            <MixedText text="点击右上方的按钮，添加第一个考试倒计时" />
                        </p>
                        <Button
                            onClick={() => handleOpenForm()}
                            className="bg-[#15803d] text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 ease-out hover:scale-105 hover:shadow-md active:scale-95"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            <MixedText text="立即添加" />
                        </Button>
                    </div>
                )}
            </div>
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl shadow-xl">
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
                                                required
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
                                                        className="w-full flex items-center justify-start text-left font-normal border bg-input border-[color:var(--input-border)] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-md h-11 shadow-xs transition-[color,box-shadow]"
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
                                                    className="w-auto p-0 text-black dark:text-white"
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
                                        variant="primary"
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