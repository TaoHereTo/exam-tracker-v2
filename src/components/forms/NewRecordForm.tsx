"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MODULES } from '@/config/exam';
import { UnifiedButton } from "@/components/ui/UnifiedButton";
import { BaseForm, FormField, FormInput, FormSelect } from "./BaseForm";
import { ValidationSchema, FormData } from "@/lib/formValidation";

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
    const [dateOpen, setDateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 定义验证规则
    const validationSchema: ValidationSchema = {
        module: { required: true },
        correct: {
            required: true,
            custom: (value, allValues) => {
                const num = Number(value);
                if (num < 0) return "正确数不能为负数";
                if (num > Number(allValues?.total)) return "正确数不能大于总题数";
                return null;
            }
        },
        total: {
            required: true,
            custom: (value) => {
                const num = Number(value);
                if (num <= 0) return "总题数必须大于0";
                return null;
            }
        },
        duration: { required: true }
    };

    const handleSubmit = (data: FormData) => {
        setIsSubmitting(true);
        if (!date) {
            alert('请选择日期');
            setIsSubmitting(false);
            return;
        }

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const newRecord: RecordItem = {
            id: Date.now(),
            date: dateStr,
            module: String(data.module),
            correct: Number(data.correct),
            total: Number(data.total),
            duration: String(data.duration),
        };

        onAddRecord?.(newRecord);
        setDate(undefined);
        setIsSubmitting(false);
    };

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        setDateOpen(false);
    };

    return (
        <BaseForm onSubmit={handleSubmit} validationSchema={validationSchema}>
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>新的做题记录</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 日期选择器 */}
                    <div className="flex flex-col gap-2">
                        <Label>日期</Label>
                        <Popover open={dateOpen} onOpenChange={setDateOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                >
                                    {date ? date.toLocaleDateString() : <span className="text-muted-foreground">选择日期</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="min-w-[260px] flex justify-center p-0" align="center">
                                <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 模块选择器 */}
                    <FormField name="module">
                        <Label>模块</Label>
                        <FormSelect name="module" placeholder="请选择模块">
                            {MODULES.map(m => (
                                <option key={m.value} value={m.label}>{m.label}</option>
                            ))}
                        </FormSelect>
                    </FormField>

                    {/* 正确数和总题数 */}
                    <div className="flex gap-4">
                        <FormField name="correct" className="flex-1">
                            <Label>正确数</Label>
                            <FormInput
                                name="correct"
                                type="number"
                                placeholder="请输入正确数"
                            />
                        </FormField>
                        <FormField name="total" className="flex-1">
                            <Label>总题数</Label>
                            <FormInput
                                name="total"
                                type="number"
                                placeholder="请输入总题数"
                            />
                        </FormField>
                    </div>

                    {/* 考试时长 */}
                    <FormField name="duration">
                        <Label>考试时长</Label>
                        <FormInput
                            name="duration"
                            type="text"
                            placeholder="例如: 26:15"
                        />
                    </FormField>
                </CardContent>
                <CardFooter>
                    <UnifiedButton variant="reactbits"
                        type="submit"
                        className="w-full bg-gradient-to-br from-gray-800 to-black"
                        disabled={isSubmitting}
                    >
                        保存记录
                    </UnifiedButton>
                </CardFooter>
            </Card>
        </BaseForm>
    );
} 