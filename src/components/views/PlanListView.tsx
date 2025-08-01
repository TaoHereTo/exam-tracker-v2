import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/FormField";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { PlanType } from "@/types/record";
import { MODULES } from '@/config/exam';
import { BeautifulProgress } from "@/components/ui/BeautifulProgress";
import { FormError } from "@/components/ui/form-error";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";



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

const PLAN_TYPES = [
    { value: '题量', label: '题量计划' },
    { value: '正确率', label: '正确率计划' },
    { value: '错题数', label: '错题数计划' },
];

interface PlanListViewProps {
    plans: StudyPlan[];
    onCreate: (plan: StudyPlan) => void;
    onUpdate: (plan: StudyPlan) => void;
    onDelete: (id: string) => void;
    onShowDetail: (id: string) => void;
}

export default function PlanListView({ plans, onCreate, onUpdate, onDelete, onShowDetail }: PlanListViewProps) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<StudyPlan>>({});
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    // 模拟加载时间
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleOpenForm = (plan?: StudyPlan) => {
        setShowForm(true);
        setErrors({});
        if (plan) {
            setForm(plan);
            setEditId(plan.id);
            setStartDate(plan.startDate ? new Date(plan.startDate) : undefined);
            setEndDate(plan.endDate ? new Date(plan.endDate) : undefined);
        } else {
            setForm({});
            setEditId(null);
            setStartDate(undefined);
            setEndDate(undefined);
        }
    };
    const handleCloseForm = () => {
        setShowForm(false);
        setForm({});
        setEditId(null);
        setErrors({});
    };
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        // 清除该字段的错误
        if (errors[e.target.name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[e.target.name];
                return newErrors;
            });
        }
    };
    const handleStartDateChange = (date?: Date) => {
        setStartDate(date);
        setForm({ ...form, startDate: date ? format(date, 'yyyy-MM-dd') : '' });
        setStartDateOpen(false); // 选择日期后关闭Popover
        // 清除错误
        if (errors.startDate) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.startDate;
                return newErrors;
            });
        }
    };
    const handleEndDateChange = (date?: Date) => {
        setEndDate(date);
        setForm({ ...form, endDate: date ? format(date, 'yyyy-MM-dd') : '' });
        setEndDateOpen(false); // 选择日期后关闭Popover
        // 清除错误
        if (errors.endDate) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.endDate;
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.name?.trim()) {
            newErrors.name = '请填写此项';
        }

        if (!form.startDate) {
            newErrors.startDate = '请填写此项';
        }

        if (!form.endDate) {
            newErrors.endDate = '请填写此项';
        } else if (form.startDate && new Date(form.endDate) <= new Date(form.startDate)) {
            newErrors.endDate = '结束日期必须晚于开始日期';
        }

        if (!form.module) {
            newErrors.module = '请填写此项';
        }

        if (!form.type) {
            newErrors.type = '请填写此项';
        }

        if (!form.target || Number(form.target) <= 0) {
            newErrors.target = '请填写此项';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const plan: StudyPlan = {
            id: editId || Date.now().toString(),
            name: form.name!,
            module: form.module!,
            type: form.type as PlanType,
            startDate: form.startDate!,
            endDate: form.endDate!,
            target: Number(form.target),
            progress: 0,
            status: "未开始",
            description: form.description || '',
        };
        if (editId) {
            onUpdate(plan);
        } else {
            onCreate(plan);
        }
        handleCloseForm();
    };
    const handleDelete = (id: string) => {
        onDelete(id);
    };

    // 计算进度百分比
    const getProgressPercentage = (plan: StudyPlan) => {
        if (plan.type === '正确率') {
            return plan.progress; // 正确率本身就是百分比
        } else {
            return plan.target > 0 ? Math.min((plan.progress / plan.target) * 100, 100) : 0;
        }
    };

    return (
        <LoadingWrapper loading={isLoading} size="large">
            <div className="space-y-6">
                <div>
                    <RainbowButton
                        onClick={() => handleOpenForm()}
                        size="default"
                    >
                        新建计划
                    </RainbowButton>
                </div>
                <div className="grid gap-4">
                    {plans.map(plan => (
                        <Card key={plan.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start">
                                    <span>{plan.name}</span>
                                    <div className="flex gap-2">
                                        <InteractiveHoverButton
                                            onClick={() => onShowDetail(plan.id)}
                                            hoverColor="#059669"
                                            compact={true}
                                        >
                                            详情
                                        </InteractiveHoverButton>
                                        <InteractiveHoverButton
                                            onClick={() => handleOpenForm(plan)}
                                            hoverColor="rgb(43, 127, 255)"
                                            compact={true}
                                        >
                                            编辑
                                        </InteractiveHoverButton>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <InteractiveHoverButton
                                                    hoverColor="#EF4444"
                                                    compact={true}
                                                >
                                                    删除
                                                </InteractiveHoverButton>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>确认删除计划？</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        此操作将永久删除该学习计划，无法撤销。
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(plan.id)}>确认删除</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">{plan.startDate} ~ {plan.endDate}</div>
                                <div className="mt-2 text-xs text-gray-400">{plan.description}</div>
                                <div className="mt-2 text-xs text-gray-400">进度：{plan.type === '正确率' ? `${plan.progress}%` : `${plan.progress}/${plan.target}${plan.type === '题量' ? '题' : plan.type === '错题数' ? '道错题' : ''}`}</div>
                                <div className="mt-3">
                                    <BeautifulProgress
                                        value={getProgressPercentage(plan)}
                                        max={100}
                                        height={16}
                                        showText={true}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                                <CardTitle>{editId ? '编辑计划' : '新建计划'}</CardTitle>
                            </CardHeader>
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-4">
                                    <div className="relative mb-4">
                                        <FormField label="计划名称" htmlFor="name" required>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={form.name || ''}
                                                onChange={handleFormChange}
                                                required
                                                className={`${errors.name ? 'border-red-500 ring-red-500/20' : ''}`}
                                            />
                                        </FormField>
                                        <FormError error={errors.name} />
                                    </div>
                                    <div className="mb-4 flex gap-4">
                                        <div className="flex-1 relative">
                                            <FormField label="开始日期">
                                                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={`w-full justify-start text-left font-normal ${errors.startDate ? 'border-red-500 ring-red-500/20' : ''}`}
                                                        >
                                                            {startDate ? format(startDate, 'yyyy-MM-dd') : '选择开始日期'}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={startDate}
                                                            onSelect={handleStartDateChange}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormField>
                                            <FormError error={errors.startDate} />
                                        </div>
                                        <div className="flex-1 relative">
                                            <FormField label="结束日期">
                                                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={`w-full justify-start text-left font-normal ${errors.endDate ? 'border-red-500 ring-red-500/20' : ''}`}
                                                        >
                                                            {endDate ? format(endDate, 'yyyy-MM-dd') : '选择结束日期'}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={endDate}
                                                            onSelect={handleEndDateChange}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormField>
                                            <FormError error={errors.endDate} />
                                        </div>
                                    </div>
                                    <div className="mb-4 flex gap-4">
                                        <div className="flex-1 relative">
                                            <FormField label="板块" htmlFor="module">
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
                                                    <SelectTrigger className={`w-full ${errors.module ? 'border-red-500 ring-red-500/20' : ''}`}>
                                                        <SelectValue placeholder="请选择板块" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {MODULES.map(m => (
                                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormField>
                                            <FormError error={errors.module} />
                                        </div>
                                        <div className="flex-1 relative">
                                            <FormField label="计划类型" htmlFor="type">
                                                <Select
                                                    value={form.type || ''}
                                                    onValueChange={v => {
                                                        setForm(f => ({ ...f, type: v as PlanType }));
                                                        if (errors.type) {
                                                            setErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors.type;
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className={`w-full ${errors.type ? 'border-red-500 ring-red-500/20' : ''}`}>
                                                        <SelectValue placeholder="请选择类型" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PLAN_TYPES.map(t => (
                                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormField>
                                            <FormError error={errors.type} />
                                        </div>
                                    </div>
                                    <div className="relative mb-4">
                                        <FormField label={`目标${form.type === '正确率' ? '(%)' : form.type === '错题数' ? '(道)' : '(题)'}`} htmlFor="target" required>
                                            <Input
                                                id="target"
                                                name="target"
                                                type="number"
                                                value={form.target || ''}
                                                onChange={handleFormChange}
                                                required
                                                className={`${errors.target ? 'border-red-500 ring-red-500/20' : ''}`}
                                                min={1}
                                            />
                                        </FormField>
                                        <FormError error={errors.target} />
                                    </div>
                                    <div className="mb-4">
                                        <FormField label="描述" htmlFor="description">
                                            <Textarea
                                                id="description"
                                                name="description"
                                                value={form.description || ''}
                                                onChange={handleFormChange}
                                            />
                                        </FormField>
                                    </div>
                                </CardContent>
                                <div className="flex justify-end gap-2 px-6 pb-6">
                                    <Button
                                        type="button"
                                        onClick={handleCloseForm}
                                        size="sm"
                                        variant="outline"
                                    >
                                        取消
                                    </Button>
                                    <RainbowButton
                                        type="submit"
                                        size="sm"
                                    >
                                        {editId ? '保存' : '创建'}
                                    </RainbowButton>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </LoadingWrapper>
    );
} 