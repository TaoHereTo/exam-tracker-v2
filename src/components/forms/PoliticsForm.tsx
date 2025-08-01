'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useFormNotification } from "@/hooks/useFormNotification";
import { UnifiedImage } from "@/components/ui/UnifiedImage";
import { ValidationSchema, validateForm } from "@/lib/formValidation";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { FormError } from "@/components/ui/form-error";

interface PoliticsFormProps {
    onAddKnowledge: (knowledge: { date: Date | null; source: string; note: string; imagePath?: string }) => void;
    initialData?: { date: Date | null; source: string; note: string; imagePath?: string };
}

const PoliticsForm: React.FC<PoliticsFormProps> = ({ onAddKnowledge, initialData }) => {
    const [date, setDate] = useState<Date | null>(initialData?.date ? new Date(initialData.date) : null);
    const [source, setSource] = useState(initialData?.source || '');
    const [note, setNote] = useState(initialData?.note || '');
    const [imagePath, setImagePath] = useState<string | undefined>(initialData?.imagePath);
    const [dateOpen, setDateOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { showError, showSuccess } = useFormNotification();

    useEffect(() => {
        setDate(initialData?.date ? new Date(initialData.date) : null);
        setSource(initialData?.source || '');
        setNote(initialData?.note || '');
        setImagePath(initialData?.imagePath);
        setErrors({});
    }, [initialData]);

    const validationSchema: ValidationSchema = {
        source: {
            custom: (value, allValues) => {
                if (!value?.toString().trim() && !allValues?.note?.toString().trim()) {
                    return "请至少填写文件来源或相关重点中的一项";
                }
                return null;
            }
        },
        note: {
            custom: (value, allValues) => {
                if (!value?.toString().trim() && !allValues?.source?.toString().trim()) {
                    return "请至少填写文件来源或相关重点中的一项";
                }
                return null;
            }
        }
    };

    const validateFormLocal = () => {
        const formData = { source, note };
        const newErrors = validateForm(formData, validationSchema);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate ?? null);
        setDateOpen(false);
    };

    const handleSubmit = () => {
        if (!validateFormLocal()) {
            showError();
            return;
        }

        onAddKnowledge({ date, source, note, imagePath });
        showSuccess();
        setDate(null);
        setSource('');
        setNote('');
        setImagePath(undefined);
        setErrors({});
    };

    const handleSourceChange = (value: string) => {
        setSource(value);
        setErrors(prev => ({ ...prev, source: "" }));
    };

    const handleNoteChange = (value: string) => {
        setNote(value);
        setErrors(prev => ({ ...prev, note: "" }));
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>录入 - 政治理论</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>选择发布日期</Label>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                {date ? date.toLocaleDateString() : <span className="text-muted-foreground">选择日期</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="min-w-[260px] flex justify-center p-0" align="center">
                            <Calendar mode="single" selected={date ?? undefined} onSelect={handleDateSelect} initialFocus required={false} />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="source">文件来源</Label>
                    <Input
                        id="source"
                        type="text"
                        placeholder="请输入文件来源"
                        value={source}
                        onChange={e => handleSourceChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
                        className={errors.source ? 'border-red-500 ring-red-500/20' : ''}
                    />
                    <FormError error={errors.source} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="note">相关重点</Label>
                    <Textarea
                        id="note"
                        placeholder="请输入相关重点..."
                        value={note}
                        onChange={e => handleNoteChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
                        className={errors.note ? 'border-red-500 ring-red-500/20' : ''}
                    />
                    <FormError error={errors.note} />
                </div>

                {/* 图片上传组件 */}
                <div className="pt-0">
                    <UnifiedImage
                        mode="upload"
                        value={imagePath}
                        onChange={setImagePath}
                    />
                </div>
            </CardContent>
            <CardFooter className="pt-1">
                <RainbowButton
                    className="w-full"
                    type="button"
                    onClick={handleSubmit}
                    size="sm"
                >
                    保存知识点
                </RainbowButton>
            </CardFooter>
        </Card>
    );
};

export default PoliticsForm;
