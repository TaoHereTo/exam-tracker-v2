"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODULES } from '@/config/exam';
import { BaseForm, FormField as BaseFormField, FormInput, FormSelect, useFormContext } from "./BaseForm";
import { FormField } from "@/components/ui/FormField";
import { ValidationSchema, FormData } from "@/lib/formValidation";
import type { RecordItem } from "@/types/record";
import { TimePicker } from "@/components/ui/TimePicker";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { MixedText } from "@/components/ui/MixedText";
import { useNotification } from "@/components/magicui/NotificationProvider";

export function NewRecordForm({ onAddRecord }: { onAddRecord?: (newRecord: RecordItem) => void }) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [dateOpen, setDateOpen] = useState(false);
    const [duration, setDuration] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { notify } = useNotification();

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
            notify({
                type: 'error',
                message: '请选择日期',
                description: '请选择一个有效的日期'
            });
            setIsSubmitting(false);
            return;
        }

        if (!duration) {
            notify({
                type: 'error',
                message: '请选择做题时长',
                description: '请选择做题时长'
            });
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

    // 内部组件，用于访问表单上下文
    function FormContent() {
        const { values, setValue } = useFormContext();

        return (
            <Card className="max-w-md mx-auto mt-8">
                <CardHeader>
                    <CardTitle><MixedText text="新的做题记录" /></CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 日期选择器 */}
                    <FormField label={<MixedText text="日期" />}>
                        <Popover open={dateOpen} onOpenChange={setDateOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                >
                                    {date ? date.toLocaleDateString() : <span className="text-muted-foreground"><MixedText text="选择日期" /></span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="min-w-[260px] flex justify-center p-0" align="center">
                                <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </FormField>

                    {/* 模块选择器 */}
                    <BaseFormField name="module">
                        <FormField label={<MixedText text="模块" />}>
                            <Select
                                value={String(values?.module || '')}
                                onValueChange={(newValue) => setValue('module', newValue)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="请选择模块" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MODULES.map(m => (
                                        <SelectItem
                                            key={m.value}
                                            value={m.label}
                                        >
                                            <MixedText text={m.label} />
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </BaseFormField>

                    {/* 正确数和总题数 */}
                    <div className="flex gap-4">
                        <BaseFormField name="correct" className="flex-1">
                            <FormField label={<MixedText text="正确数" />}>
                                <FormInput
                                    name="correct"
                                    type="number"
                                    placeholder="请输入正确数"
                                />
                            </FormField>
                        </BaseFormField>
                        <BaseFormField name="total" className="flex-1">
                            <FormField label={<MixedText text="总题数" />}>
                                <FormInput
                                    name="total"
                                    type="number"
                                    placeholder="请输入总题数"
                                />
                            </FormField>
                        </BaseFormField>
                    </div>

                    {/* 考试时长 */}
                    <FormField label={<MixedText text="考试时长" />}>
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
                        className="w-full text-base font-medium"
                        disabled={isSubmitting}
                        size="default"
                    >
                        <MixedText text="保存记录" />
                    </RainbowButton>
                </CardFooter>
            </Card>
        );
    }

    return (
        <BaseForm onSubmit={handleSubmit} validationSchema={validationSchema}>
            <FormContent />
        </BaseForm>
    );
} 