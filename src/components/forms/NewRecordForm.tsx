"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { MODULES } from '@/config/exam';

export type RecordItem = {
    id: number;
    date: string;
    module: string;
    total: number;
    correct: number;
    duration: string;
};

export function NewRecordForm({ onAddRecord }: { onAddRecord?: (newRecord: RecordItem) => void }) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [module, setModule] = useState("");
    const [correct, setCorrect] = useState("");
    const [total, setTotal] = useState("");
    const [duration, setDuration] = useState("");
    const { notify } = useNotification();

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!date || !module || !correct || !total || !duration) return;
        const newRecord: RecordItem = {
            id: Date.now(),
            date: date.toLocaleDateString(),
            module,
            correct: Number(correct),
            total: Number(total),
            duration,
        };
        onAddRecord?.(newRecord);
        notify({ type: "success", message: "保存成功" });
        setDate(undefined);
        setModule("");
        setCorrect("");
        setTotal("");
        setDuration("");
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>新的做题记录</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 日期选择器 */}
                    <div className="flex flex-col gap-2">
                        <Label>日期</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    {date ? date.toLocaleDateString() : <span className="text-muted-foreground">选择日期</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="min-w-[260px] flex justify-center p-0" align="center">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    {/* 模块选择器 */}
                    <div className="flex flex-col gap-2">
                        <Label>模块</Label>
                        <Select value={module} onValueChange={setModule}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="请选择模块" />
                            </SelectTrigger>
                            <SelectContent>
                                {MODULES.map(m => (
                                    <SelectItem key={m.value} value={m.label}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* 正确数和总题数 */}
                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                            <Label>正确数</Label>
                            <Input type="number" placeholder="请输入正确数" value={correct} onChange={e => setCorrect(e.target.value)} />
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            <Label>总题数</Label>
                            <Input type="number" placeholder="请输入总题数" value={total} onChange={e => setTotal(e.target.value)} />
                        </div>
                    </div>
                    {/* 考试时长 */}
                    <div className="flex flex-col gap-2">
                        <Label>考试时长</Label>
                        <Input type="text" placeholder="例如: 26:15" value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" type="submit" onClick={handleSubmit}>保存记录</Button>
                </CardFooter>
            </Card>
        </form>
    );
} 