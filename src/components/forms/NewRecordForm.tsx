"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn, generateUUID } from '@/lib/utils';

import { MixedText } from '@/components/ui/MixedText';
import { BaseForm, FormInput, FormSelect, useFormContext, FormField } from './BaseForm';
import type { RecordItem } from '@/types/record';
import { TimePicker } from '@/components/ui/TimePicker';
import { useThemeMode } from "@/hooks/useThemeMode";

interface NewRecordFormProps {
    onAddRecord?: (newRecord: RecordItem) => void;
}

export function NewRecordForm({ onAddRecord }: NewRecordFormProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [dateOpen, setDateOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date | undefined>(new Date());
    const { isDarkMode } = useThemeMode();

    const handleSubmit = (data: Record<string, string | number | boolean | undefined>) => {
        const dateToFormat = date ?? new Date();
        const newRecord: RecordItem = {
            id: generateUUID(),
            date: format(dateToFormat, 'yyyy-MM-dd'),
            module: String(data.module) as 'data-analysis' | 'politics' | 'math' | 'common' | 'verbal' | 'logic',
            total: parseInt(String(data.total)),
            correct: parseInt(String(data.correct)),
            duration: String(data.duration)
        };

        onAddRecord?.(newRecord);
    };

    // 日期字段组件
    function DateField() {
        const { setValue, errors, clearError, getValue } = useFormContext();
        const currentDate = getValue('date') as string;
        const [date, setDate] = useState<Date | undefined>(currentDate ? new Date(currentDate) : new Date());
        const [dateOpen, setDateOpen] = useState(false);
        const [currentMonth, setCurrentMonth] = useState<Date | undefined>(currentDate ? new Date(currentDate) : new Date());

        // 当外部表单值或已选日期变化时，同步月份到已选日期
        useEffect(() => {
            if (date) setCurrentMonth(date);
        }, [date?.getTime()]);

        const handleOpenChange = (open: boolean) => {
            if (open) {
                // 打开时对齐到当前已选日期
                if (date) setCurrentMonth(date);
            }
            setDateOpen(open);
        };

        return (
            <Popover open={dateOpen} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <button type="button" className="w-full flex items-center justify-start text-left font-normal border bg-input border-[color:var(--input-border)] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-md h-10">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP', { locale: zhCN }) : <span className="text-muted-foreground text-sm">选择日期</span>}
                    </button>
                </PopoverTrigger>
                <PopoverContent 
                    className="w-auto p-0 text-black dark:text-white" 
                    align="start"
                >
                    <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        selected={date}
                        onSelect={(d) => {
                            setDate(d);
                            const formatted = d ? format(d, 'yyyy-MM-dd') : '';
                            setValue('date', formatted);
                            if (errors['date']) clearError('date');
                            // 选择日期后关闭
                            setDateOpen(false);
                        }}
                        initialFocus={false}
                        locale={zhCN}
                    />
                </PopoverContent>
            </Popover>
        );
    }

    // 时长字段组件
    function DurationField() {
        const { setValue, errors, clearError, getValue } = useFormContext();
        const currentValue = getValue('duration') || '';

        return (
            <TimePicker
                value={String(currentValue)}
                onChange={(v) => {
                    setValue('duration', v);
                    if (errors['duration']) clearError('duration');
                }}
                placeholder="选择时长"
                className="h-10 text-sm"
            />
        );
    }

    return (
        <div className="flex items-start justify-center min-h-screen p-4 pt-6 sm:pt-10">
            <Card className="w-full max-w-md flex flex-col">
                <CardHeader className="pb-3">
                    <CardTitle className="text-2xl">
                        <MixedText text="新增做题记录" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                    <BaseForm
                        className="form-stack"
                        validationSchema={{
                            // 顺序即校验顺序：从上到下
                            module: { required: true },
                            total: {
                                required: true,
                                custom: (value) => {
                                    if (value === undefined || value === null || String(value).trim() === '') return '请填写此项';
                                    const num = Number(value);
                                    if (!Number.isFinite(num) || num <= 0) return '总题数必须大于0';
                                    return null;
                                }
                            },
                            correct: {
                                required: true,
                                custom: (value, allValues?: Record<string, unknown>) => {
                                    if (value === undefined || value === null || String(value).trim() === '') return '请填写此项';
                                    const num = Number(value);
                                    if (!Number.isFinite(num) || num < 0) return '正确数不能为负数';
                                    const totalRaw = allValues?.total as unknown;
                                    const hasTotal = !(totalRaw === undefined || totalRaw === null || String(totalRaw).trim() === '');
                                    if (hasTotal) {
                                        const totalNum = Number(totalRaw);
                                        if (Number.isFinite(totalNum) && num > totalNum) return '正确数不能大于总题数';
                                    }
                                    return null;
                                }
                            },
                            duration: { required: true }
                        }}
                        onSubmit={handleSubmit}
                        initialData={{
                            module: '',
                            total: '',
                            correct: '',
                            duration: '',
                            date: ''
                        }}
                    >
                        {/* 模块选择 */}
                        <FormField name="module" className="form-field">
                            <Label htmlFor="module" className="text-sm">
                                <MixedText text="选择模块" />
                            </Label>
                            <FormSelect
                                name="module"
                                placeholder="请选择模块"
                            >
                                <SelectItem value="data-analysis">资料分析</SelectItem>
                                <SelectItem value="politics">政治理论</SelectItem>
                                <SelectItem value="math">数量关系</SelectItem>
                                <SelectItem value="verbal">言语理解</SelectItem>
                                <SelectItem value="common">常识判断</SelectItem>
                                <SelectItem value="logic">判断推理</SelectItem>
                            </FormSelect>
                        </FormField>

                        {/* 日期选择 */}
                        <FormField name="date" className="form-field">
                            <Label htmlFor="date" className="text-sm">
                                <MixedText text="做题日期" />
                            </Label>
                            <DateField />
                        </FormField>

                        {/* 总题数和正确题数 */}
                        <div className="form-grid-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField name="total" className="form-field">
                                <Label htmlFor="total" className="text-sm">
                                    <MixedText text="总题数" />
                                </Label>
                                <FormInput
                                    name="total"
                                    type="number"
                                    placeholder="请输入总题数"
                                    className="h-10 text-sm"
                                />
                            </FormField>
                            <FormField name="correct" className="form-field">
                                <Label htmlFor="correct" className="text-sm">
                                    <MixedText text="正确题数" />
                                </Label>
                                <FormInput
                                    name="correct"
                                    type="number"
                                    placeholder="请输入正确题数"
                                    className="h-10 text-sm"
                                />
                            </FormField>
                        </div>

                        {/* 做题时长 */}
                        <FormField name="duration" className="form-field">
                            <Label htmlFor="duration" className="text-sm">
                                <MixedText text="做题时长" />
                            </Label>
                            <DurationField />
                        </FormField>

                        <div className="form-actions pt-4">
                            <Button type="submit" variant="primary" className="w-full py-2 text-sm h-10">
                                <MixedText text="保存记录" />
                            </Button>
                        </div>
                    </BaseForm>
                </CardContent>
            </Card>
        </div>
    );
}