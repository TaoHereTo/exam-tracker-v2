'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { UnifiedImage } from "@/components/ui/UnifiedImage";
import { ValidationSchema, validateForm } from "@/lib/formValidation";
import { useFormNotification } from "@/hooks/useFormNotification";
import { FormError } from "@/components/ui/form-error";

interface CommonFormProps {
    onAddKnowledge: (knowledge: { type: string; note: string; subCategory: '经济常识' | '法律常识' | '科技常识' | '人文常识' | '地理国情'; imagePath?: string }) => void;
    initialData?: { type: string; note: string; subCategory: '经济常识' | '法律常识' | '科技常识' | '人文常识' | '地理国情'; imagePath?: string };
}

const SUB_CATEGORIES = [
    { value: '经济常识', label: '经济常识' },
    { value: '法律常识', label: '法律常识' },
    { value: '科技常识', label: '科技常识' },
    { value: '人文常识', label: '人文常识' },
    { value: '地理国情', label: '地理国情' }
] as const;

export const CommonForm: React.FC<CommonFormProps> = ({
    onAddKnowledge,
    initialData,
}) => {
    const [type, setType] = useState(initialData?.type || '');
    const [note, setNote] = useState(initialData?.note || '');
    const [subCategory, setSubCategory] = useState<typeof SUB_CATEGORIES[number]['value']>(initialData?.subCategory || '经济常识');
    const [imagePath, setImagePath] = useState<string | undefined>(initialData?.imagePath);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { showError, showSuccess } = useFormNotification();

    useEffect(() => {
        setType(initialData?.type || '');
        setNote(initialData?.note || '');
        setSubCategory(initialData?.subCategory || '经济常识');
        setImagePath(initialData?.imagePath);
        setErrors({});
    }, [initialData]);

    const validationSchema: ValidationSchema = {
        type: {
            custom: (value, allValues) => {
                if (!value?.toString().trim() && !allValues?.note?.toString().trim()) {
                    return "请至少填写类型或技巧记录中的一项";
                }
                return null;
            }
        },
        note: {
            custom: (value, allValues) => {
                if (!value?.toString().trim() && !allValues?.type?.toString().trim()) {
                    return "请至少填写类型或技巧记录中的一项";
                }
                return null;
            }
        }
    };

    const validateFormLocal = () => {
        const formData = { type, note };
        const newErrors = validateForm(formData, validationSchema);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateFormLocal()) {
            showError();
            return;
        }

        onAddKnowledge({ type, note, subCategory, imagePath });
        showSuccess();
        setType('');
        setNote('');
        setSubCategory('经济常识');
        setImagePath(undefined);
        setErrors({});
    };

    const handleTypeChange = (value: string) => {
        setType(value);
        setErrors(prev => ({ ...prev, type: "" }));
    };

    const handleNoteChange = (value: string) => {
        setNote(value);
        setErrors(prev => ({ ...prev, note: "" }));
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>录入 - 常识判断</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="subCategory">常识类型</Label>
                    <Select value={subCategory} onValueChange={(value: typeof SUB_CATEGORIES[number]['value']) => setSubCategory(value)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="请选择常识类型" />
                        </SelectTrigger>
                        <SelectContent>
                            {SUB_CATEGORIES.map(category => (
                                <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">类型</Label>
                    <Input
                        id="type"
                        type="text"
                        placeholder="例如：常识技巧"
                        value={type}
                        onChange={e => handleTypeChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
                        className={errors.type ? 'border-red-500 ring-red-500/20' : ''}
                    />
                    <FormError error={errors.type} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="note">技巧记录</Label>
                    <Textarea
                        id="note"
                        placeholder="请输入具体的技巧或知识点..."
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
}