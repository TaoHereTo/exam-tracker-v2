"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MODULES } from '@/config/exam';
import { BaseForm, FormField as BaseFormField, FormInput, FormSelect } from "./BaseForm";
import { FormField } from "@/components/ui/FormField";
import { ValidationSchema, FormData } from "@/lib/formValidation";
import type { RecordItem } from "@/types/record";
import { TimePicker } from "@/components/ui/TimePicker";
import { RainbowButton } from "@/components/magicui/rainbow-button";

interface EditRecordFormProps {
    record: RecordItem;
    onSave: (updatedRecord: RecordItem) => void;
    onCancel: () => void;
}

export function EditRecordForm({ record, onSave, onCancel }: EditRecordFormProps) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [dateOpen, setDateOpen] = useState(false);
    const [duration, setDuration] = useState<string>('');

    // 初始化日期和时长
    useEffect(() => {
        if (record.date) {
            setDate(new Date(record.date));
        }
        if (record.duration) {
            setDuration(record.duration);
        }
    }, [record.date, record.duration]);

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
        if (!date) return;

        if (!duration) {
            alert('请选择做题时长');
            return;
        }

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const updatedRecord: RecordItem = {
            ...record,
            date: dateStr,
            module: String(data.module),
            correct: Number(data.correct),
            total: Number(data.total),
            duration: duration,
        };

        onSave(updatedRecord);
    };

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        setDateOpen(false);
    };

    return (
        <Card className="max-w-2xl mx-auto w-full">
            <BaseForm
                onSubmit={handleSubmit}
                validationSchema={validationSchema}
                initialData={{
                    module: record.module,
                    total: record.total.toString(),
                    correct: record.correct.toString()
                }}
            >
                <CardHeader>
                    <CardTitle>编辑做题记录</CardTitle>
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

                    {/* 两列布局的表单字段 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 模块选择器 */}
                        <BaseFormField name="module">
                            <FormField label="模块">
                                <FormSelect name="module" placeholder="请选择模块">
                                    {MODULES.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </FormSelect>
                            </FormField>
                        </BaseFormField>

                        {/* 总题数 */}
                        <BaseFormField name="total">
                            <FormField label="总题数">
                                <FormInput
                                    name="total"
                                    type="number"
                                    placeholder="输入总题数"
                                />
                            </FormField>
                        </BaseFormField>

                        {/* 正确题数 */}
                        <BaseFormField name="correct">
                            <FormField label="正确题数">
                                <FormInput
                                    name="correct"
                                    type="number"
                                    placeholder="输入正确题数"
                                />
                            </FormField>
                        </BaseFormField>

                        {/* 做题时长 */}
                        <FormField label="做题时长">
                            <TimePicker
                                value={duration}
                                onChange={setDuration}
                                placeholder="选择做题时长"
                            />
                        </FormField>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2 justify-end">
                    <RainbowButton
                        variant="outline"
                        onClick={onCancel}
                        size="sm"
                    >
                        取消
                    </RainbowButton>
                    <RainbowButton
                        type="submit"
                        size="sm"
                    >
                        保存
                    </RainbowButton>
                </CardFooter>
            </BaseForm>
        </Card>
    );
} 