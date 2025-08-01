"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SelectItem } from "@/components/ui/select";
import { MODULES } from '@/config/exam';
import { BaseForm, FormField as BaseFormField, FormInput, FormSelect } from "./BaseForm";
import { FormField } from "@/components/ui/FormField";
import { ValidationSchema, FormData } from "@/lib/formValidation";
import type { RecordItem } from "@/types/record";
import { TimePicker } from "@/components/ui/TimePicker";
import { RainbowButton } from "@/components/magicui/rainbow-button";

export function NewRecordForm({ onAddRecord }: { onAddRecord?: (newRecord: RecordItem) => void }) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [dateOpen, setDateOpen] = useState(false);
    const [duration, setDuration] = useState<string>('');
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
        }
    };

    const handleSubmit = (data: FormData) => {
        setIsSubmitting(true);
        if (!date) {
            alert('请选择日期');
            setIsSubmitting(false);
            return;
        }

        if (!duration) {
            alert('请选择做题时长');
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
            duration: duration || '00:00',
        };

        onAddRecord?.(newRecord);
        setDate(undefined);
        setDuration('');
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
                    <FormField label="日期">
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
                    </FormField>

                    {/* 模块选择器 */}
                    <BaseFormField name="module">
                        <FormField label="模块">
                            <FormSelect name="module" placeholder="请选择模块">
                                {MODULES.map(m => (
                                    <SelectItem key={m.value} value={m.label}>{m.label}</SelectItem>
                                ))}
                            </FormSelect>
                        </FormField>
                    </BaseFormField>

                    {/* 正确数和总题数 */}
                    <div className="flex gap-4">
                        <BaseFormField name="correct" className="flex-1">
                            <FormField label="正确数">
                                <FormInput
                                    name="correct"
                                    type="number"
                                    placeholder="请输入正确数"
                                />
                            </FormField>
                        </BaseFormField>
                        <BaseFormField name="total" className="flex-1">
                            <FormField label="总题数">
                                <FormInput
                                    name="total"
                                    type="number"
                                    placeholder="请输入总题数"
                                />
                            </FormField>
                        </BaseFormField>
                    </div>

                    {/* 考试时长 */}
                    <FormField label="考试时长">
                        <TimePicker
                            value={duration}
                            onChange={setDuration}
                            placeholder="选择做题时长"
                        />
                    </FormField>
                </CardContent>
                <CardFooter>
                    <RainbowButton
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        保存记录
                    </RainbowButton>
                </CardFooter>
            </Card>
        </BaseForm>
    );
} 