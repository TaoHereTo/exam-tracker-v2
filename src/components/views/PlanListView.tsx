import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { FormField } from "@/components/ui/FormField";
import { FormError } from "@/components/ui/form-error";
import { normalizeModuleName } from "@/config/exam";
import { format } from "date-fns";
import { Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { MixedText } from "@/components/ui/MixedText";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { DateRange } from "react-day-picker";
import { generateUUID } from "@/lib/utils";
import toast from 'react-hot-toast';

interface StudyPlan {
    id: string;
    name: string;
    module: string;
    type: "题量" | "正确率" | "错题数";
    startDate: string;
    endDate: string;
    target: number;
    progress: number;
    status: "未开始" | "进行中" | "已完成" | "未达成";
    description?: string;
}

interface PlanListViewProps {
    plans: StudyPlan[];
    onCreate: (plan: StudyPlan) => void;
    onUpdate: (plan: StudyPlan) => void;
    onDelete: (id: string) => void;
}

export default function PlanListView({ plans, onCreate, onUpdate, onDelete }: PlanListViewProps) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<StudyPlan>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dateRange, setDateRange] = useState<DateRange>();
    const [showCompleted, setShowCompleted] = useState(false);

    const handleOpenForm = (plan?: StudyPlan) => {
        if (plan) {
            setEditId(plan.id);
            setForm(plan);
            setDateRange({
                from: new Date(plan.startDate),
                to: new Date(plan.endDate)
            });
        } else {
            setEditId(null);
            setForm({});
            setDateRange(undefined);
        }
        setErrors({});
        // 使用setTimeout确保状态更新完成后再显示表单
        setTimeout(() => {
            setShowForm(true);
        }, 0);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditId(null);
        setForm({});
        setErrors({});
        setDateRange(undefined);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        // 只在有日期变化时才更新form状态
        if (range?.from || range?.to) {
            setForm(prev => ({
                ...prev,
                startDate: range?.from ? format(range.from, 'yyyy-MM-dd') : prev.startDate,
                endDate: range?.to ? format(range.to, 'yyyy-MM-dd') : prev.endDate
            }));
        }
        // 清除日期相关的错误
        if (errors.startDate || errors.endDate) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.startDate;
                delete newErrors.endDate;
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.name?.trim()) {
            newErrors.name = '计划名称不能为空';
            return false;
        }

        if (!form.module) {
            newErrors.module = '请选择模块';
            return false;
        }

        if (!form.type) {
            newErrors.type = '请选择计划类型';
            return false;
        }

        if (!form.startDate) {
            newErrors.startDate = '请选择开始日期';
            return false;
        }

        if (!form.endDate) {
            newErrors.endDate = '请选择结束日期';
            return false;
        }

        if (form.startDate && form.endDate) {
            const startDate = new Date(form.startDate);
            const endDate = new Date(form.endDate);
            if (startDate > endDate) {
                newErrors.endDate = '结束日期不能早于开始日期';
                return false;
            }
        }

        if (!form.target) {
            newErrors.target = '请输入目标值';
            return false;
        }

        const target = parseInt(form.target.toString());
        if (isNaN(target) || target <= 0) {
            newErrors.target = '目标值必须是大于0的数字';
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const planData: StudyPlan = {
            id: editId || generateUUID(),
            name: form.name!,
            module: form.module!,
            type: form.type!,
            startDate: form.startDate!,
            endDate: form.endDate!,
            target: form.target!,
            progress: form.progress || 0,
            status: form.status || '未开始',
            description: form.description
        };

        if (editId) {
            onUpdate(planData);

        } else {
            onCreate(planData);

        }

        handleCloseForm();
    };

    const handleDelete = (id: string) => {
        onDelete(id);

    };

    const getProgressPercentage = (plan: StudyPlan) => {
        if (plan.target === 0) return 0;
        return Math.min((plan.progress / plan.target) * 100, 100);
    };

    // 分离进行中和已完成的计划
    const activePlans = plans.filter(plan => plan.status !== "已完成");
    const completedPlans = plans.filter(plan => plan.status === "已完成");

    // 获取状态图标和颜色
    const getStatusIcon = (status: StudyPlan["status"]) => {
        switch (status) {
            case "已完成":
                return <CheckCircle className="w-5 h-5" style={{ color: '#0284c7' }} />;
            case "进行中":
                return <Clock className="w-5 h-5" style={{ color: '#10b981' }} />;
            case "未开始":
                return <Clock className="w-5 h-5 text-gray-500" />;
            case "未达成":
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    // 获取状态显示文本
    const getStatusText = (status: StudyPlan["status"]) => {
        switch (status) {
            case "已完成":
                return "已完成";
            case "进行中":
                return "进行中";
            case "未开始":
                return "未开始";
            case "未达成":
                return "未达成";
            default:
                return status;
        }
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold"><MixedText text="学习计划列表" /></h2>
                <ButtonGroup spacing="sm" margin="none">
                    <Button
                        onClick={() => handleOpenForm()}
                        className="h-9 text-white shadow-sm"
                        style={{ 
                            backgroundColor: '#1d4ed8', 
                            color: 'white',
                            transition: 'none',
                            transform: 'none'
                        }}
                        data-plan-button
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1d4ed8';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'none';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#1d4ed8';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'none';
                        }}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        <MixedText text="新建计划" />
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
                    data-plan-button
                    onMouseEnter={(e) => {
                        if (!showCompleted) {
                            e.currentTarget.style.backgroundColor = '#10b981';
                            e.currentTarget.style.color = 'white';
                        }
                        e.currentTarget.style.transform = 'none';
                    }}
                    onMouseLeave={(e) => {
                        if (!showCompleted) {
                            e.currentTarget.style.backgroundColor = '#10b981';
                            e.currentTarget.style.color = 'white';
                        }
                        e.currentTarget.style.transform = 'none';
                    }}
                >
                    <Clock className="w-5 h-5" />
                    <MixedText text="进行中" />
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
                    data-plan-button
                    onMouseEnter={(e) => {
                        if (showCompleted) {
                            e.currentTarget.style.backgroundColor = '#0284c7';
                            e.currentTarget.style.color = 'white';
                        }
                        e.currentTarget.style.transform = 'none';
                    }}
                    onMouseLeave={(e) => {
                        if (showCompleted) {
                            e.currentTarget.style.backgroundColor = '#0284c7';
                            e.currentTarget.style.color = 'white';
                        }
                        e.currentTarget.style.transform = 'none';
                    }}
                >
                    <CheckCircle className="w-5 h-5" />
                    <MixedText text="已完成" />
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-stretch">
                {(showCompleted ? completedPlans : activePlans).length > 0 ? (
                    (showCompleted ? completedPlans : activePlans).map(plan => (
                        <Card key={plan.id} className="shadow-md hover:shadow-lg transition-all duration-300 min-h-[220px] w-full flex flex-col">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-2 flex-1">
                                        {getStatusIcon(plan.status)}
                                        <MixedText text={plan.name} className="text-lg font-semibold truncate" />
                                    </div>
                                    <ButtonGroup spacing="sm" margin="none" className="flex-shrink-0">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        onClick={() => handleOpenForm(plan)}
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9"
                                                    >
                                                        <Edit className="w-5 h-5" />
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
                                                                className="h-9 w-9"
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
                                                    <AlertDialogTitle><MixedText text="确认删除计划？" /></AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        此操作将永久删除学习计划&quot;{plan.name}&quot;，删除后无法恢复。
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel><MixedText text="取消" /></AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        onClick={() => handleDelete(plan.id)}
                                                        className="bg-[#dc2626] text-white shadow-xs hover:bg-[#dc2626]/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40"
                                                    >
                                                        <MixedText text="确认删除" />
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </ButtonGroup>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 flex-1 flex flex-col justify-center">
                                <div className="space-y-4">
                                    <div className="text-sm text-muted-foreground break-words"><MixedText text={`${plan.startDate} ~ ${plan.endDate}`} /></div>
                                    <div className="text-xs text-gray-500 break-words">
                                        <MixedText text={`板块：${normalizeModuleName(plan.module)}`} />
                                    </div>
                                    <div className="text-xs break-words">
                                        <span style={{ color: plan.status === '已完成' ? '#0284c7' : plan.status === '进行中' ? '#10b981' : '#6b7280' }}>
                                            <MixedText text={`状态：${getStatusText(plan.status)}`} />
                                        </span>
                                    </div>
                                    {plan.description && (
                                        <div className="text-xs text-gray-400 line-clamp-3 break-words"><MixedText text={plan.description} /></div>
                                    )}
                                    <div className="text-xs text-gray-500 break-words">
                                        进度：{plan.type === '正确率' ? <MixedText text={`${plan.progress}%`} /> : <MixedText text={`${plan.progress}/${plan.target}${plan.type === '题量' ? '题' : plan.type === '错题数' ? '道错题' : ''}`} />}
                                    </div>
                                    <div className="mt-3">
                                        <Progress
                                            value={getProgressPercentage(plan)}
                                            variant="plan"
                                            showText={true}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="text-gray-400 mb-4">
                            {showCompleted ? (
                                <CheckCircle className="w-16 h-16" />
                            ) : (
                                <Clock className="w-16 h-16" />
                            )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">
                            {showCompleted ? (
                                <MixedText text="暂无已完成的计划" />
                            ) : (
                                <MixedText text="暂无进行中的计划" />
                            )}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {showCompleted ? (
                                <MixedText text="完成计划后，它们将显示在这里，帮助您回顾学习历程" />
                            ) : (
                                <MixedText text="创建一个新的学习计划开始您的学习之旅" />
                            )}
                        </p>
                        {!showCompleted && (
                            <Button
                                onClick={() => handleOpenForm()}
                                className="h-9 text-white"
                                style={{ 
                                    backgroundColor: '#1d4ed8', 
                                    color: 'white',
                                    transition: 'none',
                                    transform: 'none',
                                    boxShadow: 'inherit'
                                }}
                                data-plan-button
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#1d4ed8';
                                    e.currentTarget.style.color = 'white';
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'inherit';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#1d4ed8';
                                    e.currentTarget.style.color = 'white';
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'inherit';
                                }}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                <MixedText text="创建第一个计划" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>{editId ? <MixedText text="编辑计划" /> : <MixedText text="新建计划" />}</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="pt-0">
                                <div className="form-stack">
                                    <div className="relative">
                                        <FormField label={<MixedText text="计划名称" />} htmlFor="name" required>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={form.name || ''}
                                                onChange={handleFormChange}
                                                className={``}
                                            />
                                        </FormField>
                                        <FormError error={errors.name} />
                                    </div>
                                    <div>
                                        <FormField label={<MixedText text="计划时间范围" />}>
                                            <DateRangePicker
                                                dateRange={dateRange}
                                                onDateRangeChange={handleDateRangeChange}
                                                placeholder="选择开始和结束日期"
                                                error={!!errors.startDate || !!errors.endDate}
                                            />
                                        </FormField>
                                        <FormError error={errors.startDate || errors.endDate} />
                                    </div>
                                    <div className="form-grid-2">
                                        <div className="flex-1 relative form-field">
                                            <FormField label={<MixedText text="板块" />} htmlFor="module">
                                                <Select
                                                    value={form.module || ''}
                                                    onValueChange={v => {
                                                        setForm(f => ({ ...f, module: v }));
                                                        if (errors.module) {
                                                            setErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors.module;
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                >

                                                    <SelectTrigger className={``}>
                                                        <SelectValue placeholder="请选择板块">
                                                            {form.module ? normalizeModuleName(form.module) : '请选择板块'}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {/* 统一顺序：资料分析、政治理论、数量关系、言语理解、常识判断、判断推理 */}
                                                        <SelectItem value="data-analysis"><MixedText text="资料分析" /></SelectItem>
                                                        <SelectItem value="politics"><MixedText text="政治理论" /></SelectItem>
                                                        <SelectItem value="math"><MixedText text="数量关系" /></SelectItem>
                                                        <SelectItem value="verbal"><MixedText text="言语理解" /></SelectItem>
                                                        <SelectItem value="common"><MixedText text="常识判断" /></SelectItem>
                                                        <SelectItem value="logic"><MixedText text="判断推理" /></SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormField>
                                            <FormError error={errors.module} />
                                        </div>
                                        <div className="flex-1 relative form-field">
                                            <FormField label={<MixedText text="目标类型" />} htmlFor="type">
                                                <Select
                                                    value={form.type || ''}
                                                    onValueChange={v => {
                                                        setForm(f => ({ ...f, type: v as "题量" | "正确率" | "错题数" }));
                                                        if (errors.type) {
                                                            setErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors.type;
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className={``}>
                                                        <SelectValue placeholder="选择类型">
                                                            {form.type || '选择类型'}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="题量"><MixedText text="题量" /></SelectItem>
                                                        <SelectItem value="正确率"><MixedText text="正确率" /></SelectItem>
                                                        <SelectItem value="错题数"><MixedText text="错题数" /></SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormField>
                                            <FormError error={errors.type} />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <FormField label={<MixedText text="目标值" />} htmlFor="target" required>
                                            <Input
                                                id="target"
                                                name="target"
                                                type="number"
                                                value={form.target || ''}
                                                onChange={handleFormChange}
                                                className={``}
                                            />
                                        </FormField>
                                        <FormError error={errors.target} />
                                    </div>
                                    <div className="relative">
                                        <FormField label={<MixedText text="计划描述" />} htmlFor="description">
                                            <Textarea
                                                id="description"
                                                name="description"
                                                value={form.description || ''}
                                                onChange={handleFormChange}
                                                rows={3}
                                                placeholder="可选：添加计划描述"
                                            />
                                        </FormField>
                                    </div>
                                    <div className="form-actions">
                                        <ButtonGroup spacing="sm" margin="none" className="justify-end">
                                            <Button type="button" variant="outline" onClick={handleCloseForm}>
                                                <MixedText text="取消" />
                                            </Button>
                                            <Button type="submit" variant="default">
                                                {editId ? <MixedText text="更新计划" /> : <MixedText text="创建计划" />}
                                            </Button>
                                        </ButtonGroup>
                                    </div>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}