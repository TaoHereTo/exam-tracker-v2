import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface PlanTask {
    date: string;
    content: string;
    remark?: string;
    completed: boolean;
}

interface PlanDetailProps {
    plan: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        description?: string;
        progress: number;
        tasks: PlanTask[];
    };
    onBack: () => void;
    onEdit: () => void;
    onUpdate: (plan: any) => void;
}

export default function PlanDetailView({ plan, onBack, onEdit, onUpdate }: PlanDetailProps) {
    const [tasks, setTasks] = useState<PlanTask[]>(plan.tasks);
    useEffect(() => { setTasks(plan.tasks); }, [plan.tasks]);
    // 计算已完成天数
    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // 日历高亮已打卡日期
    const completedDates = tasks.filter(t => t.completed).map(t => t.date);

    const handleCheck = (idx: number) => {
        const newTasks = tasks.map((t, i) => i === idx ? { ...t, completed: !t.completed } : t);
        setTasks(newTasks);
        onUpdate({ ...plan, tasks: newTasks });
    };

    return (
        <div className="max-w-3xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardAction>
                        <Button size="sm" variant="outline" onClick={onBack}>返回</Button>
                        <Button size="sm" variant="ghost" className="ml-2" onClick={onEdit}>编辑</Button>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">{plan.startDate} ~ {plan.endDate}</div>
                    <div className="mt-2 text-xs text-gray-400">{plan.description}</div>
                    <div className="mt-2 text-xs text-gray-400">进度：{progress}%（{completedCount}/{totalCount} 天）</div>
                    <div className="w-full h-2 bg-gray-200 rounded mt-2">
                        <div className="h-2 bg-primary rounded" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-6">
                        <Calendar
                            mode="multiple"
                            selected={completedDates.map(d => new Date(d))}
                            disabled
                        />
                    </div>
                    <div className="mt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>日期</TableHead>
                                    <TableHead>任务</TableHead>
                                    <TableHead>备注</TableHead>
                                    <TableHead>打卡</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.map((task, idx) => (
                                    <TableRow key={task.date}>
                                        <TableCell>{task.date}</TableCell>
                                        <TableCell>{task.content}</TableCell>
                                        <TableCell>{task.remark || '-'}</TableCell>
                                        <TableCell>
                                            <Checkbox checked={task.completed} onCheckedChange={() => handleCheck(idx)} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 