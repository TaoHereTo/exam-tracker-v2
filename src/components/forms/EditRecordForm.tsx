"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MODULES } from '@/config/exam';
import ReactBitsButton from "@/components/ui/ReactBitsButton";
import { BaseForm, FormField, FormInput, FormSelect, ValidationSchema, FormData } from "./BaseForm";
import type { RecordItem } from "./NewRecordForm";

interface EditRecordFormProps {
    record: RecordItem;
    onSave: (updatedRecord: RecordItem) => void;
    onCancel: () => void;
}

export function EditRecordForm({ record, onSave, onCancel }: EditRecordFormProps) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [dateOpen, setDateOpen] = useState(false);

    // 初始化日期
    useEffect(() => {
        if (record.date) {
            setDate(new Date(record.date));
        }
    }, [record.date]);

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
        if (!date) return;

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
            duration: String(data.duration),
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
                    correct: record.correct.toString(),
                    duration: record.duration
                }}
            >
                <CardHeader>
                    <CardTitle>编辑做题记录</CardTitle>
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

                    {/* 两列布局的表单字段 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 模块选择器 */}
                        <FormField name="module">
                            <Label>模块</Label>
                            <FormSelect name="module" placeholder="请选择模块">
                                {MODULES.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </FormSelect>
                        </FormField>

                        {/* 总题数 */}
                        <FormField name="total">
                            <Label>总题数</Label>
                            <FormInput
                                name="total"
                                type="number"
                                placeholder="输入总题数"
                            />
                        </FormField>

                        {/* 正确题数 */}
                        <FormField name="correct">
                            <Label>正确题数</Label>
                            <FormInput
                                name="correct"
                                type="number"
                                placeholder="输入正确题数"
                            />
                        </FormField>

                        {/* 做题时长 */}
                        <FormField name="duration">
                            <Label>做题时长(分钟)</Label>
                            <FormInput
                                name="duration"
                                type="number"
                                placeholder="输入做题时长"
                            />
                        </FormField>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2 justify-end">
                    <ReactBitsButton
                        variant="outline"
                        onClick={onCancel}
                        size="sm"
                    >
                        取消
                    </ReactBitsButton>
                    <ReactBitsButton
                        type="submit"
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        保存
                    </ReactBitsButton>
                </CardFooter>
            </BaseForm>
        </Card>
    );
} 