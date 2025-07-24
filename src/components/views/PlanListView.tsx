import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { PlanType } from "@/types/record";

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

const MODULES = [
    { value: 'data-analysis', label: '资料分析' },
    { value: 'politics', label: '政治理论' },
    { value: 'math', label: '数量关系' },
    { value: 'common', label: '常识判断' },
    { value: 'verbal', label: '言语理解' },
    { value: 'logic', label: '判断推理' },
];
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
    const [form, setForm] = useState<Partial<StudyPlan>>({});
    const [editId, setEditId] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const handleOpenForm = (plan?: StudyPlan) => {
        setShowForm(true);
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
    };
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleStartDateChange = (date?: Date) => {
        setStartDate(date);
        setForm({ ...form, startDate: date ? format(date, 'yyyy-MM-dd') : '' });
    };
    const handleEndDateChange = (date?: Date) => {
        setEndDate(date);
        setForm({ ...form, endDate: date ? format(date, 'yyyy-MM-dd') : '' });
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.startDate || !form.endDate || !form.type || !form.module || !form.target) return;
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

    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">制定计划</h1>
            <div className="mb-6">
                <Button onClick={() => handleOpenForm()}>新建计划</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.length === 0 && <div className="text-gray-400 col-span-2">暂无计划</div>}
                {plans.map(plan => (
                    <Card key={plan.id}>
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardAction>
                                <Button size="sm" variant="outline" onClick={() => onShowDetail(plan.id)}>详情</Button>
                                <Button size="sm" variant="ghost" className="ml-2" onClick={() => handleOpenForm(plan)}>编辑</Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDelete(plan.id)}>删除</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>确认删除？</AlertDialogTitle>
                                            <AlertDialogDescription>删除后无法恢复。</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel onClick={() => { }}>取消</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(plan.id)}>确认删除</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardAction>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">{plan.startDate} ~ {plan.endDate}</div>
                            <div className="mt-2 text-xs text-gray-400">{plan.description}</div>
                            <div className="mt-2 text-xs text-gray-400">进度：{plan.type === '正确率' ? `${plan.progress}%` : `${plan.progress}/${plan.target}${plan.type === '题量' ? '题' : plan.type === '错题数' ? '道错题' : ''}`}</div>
                            <div className="w-full h-2 bg-gray-200 rounded mt-2">
                                <div className="h-2 bg-primary rounded" style={{ width: `${Math.min(100, plan.type === '正确率' ? plan.progress : Math.round((plan.progress / plan.target) * 100))}%` }} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {showForm && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>{editId ? '编辑计划' : '新建计划'}</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                <div className="mb-4">
                                    <Label htmlFor="name">计划名称</Label>
                                    <Input id="name" name="name" value={form.name || ''} onChange={handleFormChange} required className="mt-2" />
                                </div>
                                <div className="mb-4 flex gap-4">
                                    <div className="flex-1">
                                        <Label>开始日期</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full mt-2 justify-start text-left font-normal">
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
                                    </div>
                                    <div className="flex-1">
                                        <Label>结束日期</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full mt-2 justify-start text-left font-normal">
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
                                    </div>
                                </div>
                                <div className="mb-4 flex gap-4">
                                    <div className="flex-1">
                                        <Label htmlFor="module">板块</Label>
                                        <Select value={form.module || ''} onValueChange={v => setForm(f => ({ ...f, module: v }))}>
                                            <SelectTrigger className="w-full mt-2">
                                                <SelectValue placeholder="请选择板块" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MODULES.map(m => (
                                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1">
                                        <Label htmlFor="type">计划类型</Label>
                                        <Select value={form.type || ''} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                                            <SelectTrigger className="w-full mt-2">
                                                <SelectValue placeholder="请选择类型" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PLAN_TYPES.map(t => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <Label htmlFor="target">目标{form.type === '正确率' ? '(%)' : form.type === '错题数' ? '(道)' : '(题)'}</Label>
                                    <Input id="target" name="target" type="number" value={form.target || ''} onChange={handleFormChange} required className="mt-2" min={1} />
                                </div>
                                <div className="mb-4">
                                    <Label htmlFor="description">描述</Label>
                                    <Textarea id="description" name="description" value={form.description || ''} onChange={handleFormChange} className="mt-2" />
                                </div>
                            </CardContent>
                            <div className="flex justify-end gap-2 px-6 pb-6">
                                <Button type="button" variant="ghost" onClick={handleCloseForm}>取消</Button>
                                <Button type="submit" variant="default">{editId ? '保存' : '创建'}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
} 