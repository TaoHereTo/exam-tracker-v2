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

interface Plan {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    description?: string;
    progress: number; // 0-100
}

interface PlanListViewProps {
    plans: Plan[];
    onCreate: (plan: Plan) => void;
    onUpdate: (plan: Plan) => void;
    onDelete: (id: string) => void;
    onShowDetail: (id: string) => void;
}

export default function PlanListView({ plans, onCreate, onUpdate, onDelete, onShowDetail }: PlanListViewProps) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Partial<Plan>>({});
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const handleOpenForm = (plan?: Plan) => {
        setShowForm(true);
        if (plan) {
            setForm(plan);
            setEditId(plan.id);
        } else {
            setForm({});
            setEditId(null);
        }
    };
    const handleCloseForm = () => {
        setShowForm(false);
        setForm({});
        setEditId(null);
    };
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        if (!form.name || !form.startDate || !form.endDate) return;
        if (editId) {
            onUpdate({ ...form, id: editId, progress: form.progress ?? 0 } as Plan);
        } else {
            onCreate({ ...form, id: Date.now().toString(), progress: 0 } as Plan);
        }
        handleCloseForm();
    };
    const handleDelete = (id: string) => {
        onDelete(id);
        setDeleteId(null);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">学习计划</h1>
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
                                        <Button size="sm" variant="destructive" className="ml-2" onClick={() => setDeleteId(plan.id)}>删除</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>确认删除？</AlertDialogTitle>
                                            <AlertDialogDescription>删除后无法恢复。</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel onClick={() => setDeleteId(null)}>取消</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(plan.id)}>确认删除</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardAction>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">{plan.startDate} ~ {plan.endDate}</div>
                            <div className="mt-2 text-xs text-gray-400">{plan.description}</div>
                            <div className="mt-2 text-xs text-gray-400">进度：{plan.progress}%</div>
                            <div className="w-full h-2 bg-gray-200 rounded mt-2">
                                <div className="h-2 bg-primary rounded" style={{ width: `${plan.progress}%` }} />
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