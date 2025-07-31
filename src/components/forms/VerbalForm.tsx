'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useFormNotification } from "@/hooks/useFormNotification";
import { UnifiedButton } from "@/components/ui/UnifiedButton";
import { UnifiedImage } from "@/components/ui/UnifiedImage";
import { ValidationSchema, validateForm } from "@/lib/formValidation";

interface VerbalFormProps {
    onAddKnowledge: (knowledge: { idiom: string; meaning: string; subCategory: '逻辑填空' | '片段阅读' | '成语积累'; imagePath?: string }) => void;
    initialData?: { idiom: string; meaning: string; subCategory: '逻辑填空' | '片段阅读' | '成语积累'; imagePath?: string };
}

const SUB_CATEGORIES = [
    { value: '逻辑填空', label: '逻辑填空' },
    { value: '片段阅读', label: '片段阅读' },
    { value: '成语积累', label: '成语积累' }
] as const;

const VerbalForm: React.FC<VerbalFormProps> = ({ onAddKnowledge, initialData }) => {
    const [idiom, setIdiom] = useState(initialData?.idiom || '');
    const [meaning, setMeaning] = useState(initialData?.meaning || '');
    const [subCategory, setSubCategory] = useState<typeof SUB_CATEGORIES[number]['value']>(initialData?.subCategory || '逻辑填空');
    const [imagePath, setImagePath] = useState<string | undefined>(initialData?.imagePath);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { showError, showSuccess } = useFormNotification();

    useEffect(() => {
        setIdiom(initialData?.idiom || '');
        setMeaning(initialData?.meaning || '');
        setSubCategory(initialData?.subCategory || '逻辑填空');
        setImagePath(initialData?.imagePath);
        setErrors({});
    }, [initialData]);

    // 根据子分类获取字段配置
    const getFieldConfig = (subCategory: typeof SUB_CATEGORIES[number]['value']) => {
        switch (subCategory) {
            case '成语积累':
                return {
                    firstField: { label: '成语', placeholder: '请输入成语' },
                    secondField: { label: '含义', placeholder: '请输入成语含义...' }
                };
            case '逻辑填空':
            case '片段阅读':
            default:
                return {
                    firstField: { label: '类型', placeholder: '请输入类型...' },
                    secondField: { label: '技巧记录', placeholder: '请输入技巧记录...' }
                };
        }
    };

    const validationSchema: ValidationSchema = {
        idiom: {
            custom: (value, allValues) => {
                if (!value?.toString().trim() && !allValues?.meaning?.toString().trim()) {
                    return "请至少填写类型或技巧记录中的一项";
                }
                return null;
            }
        },
        meaning: {
            custom: (value, allValues) => {
                if (!value?.toString().trim() && !allValues?.idiom?.toString().trim()) {
                    return "请至少填写类型或技巧记录中的一项";
                }
                return null;
            }
        }
    };

    const fieldConfig = getFieldConfig(subCategory);

    const validateFormLocal = () => {
        const formData = { idiom, meaning };
        const newErrors = validateForm(formData, validationSchema);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateFormLocal()) {
            showError();
            return;
        }

        onAddKnowledge({ idiom, meaning, subCategory, imagePath });
        showSuccess();
        setIdiom('');
        setMeaning('');
        setSubCategory('逻辑填空');
        setImagePath(undefined);
        setErrors({});
    };

    const handleIdiomChange = (value: string) => {
        setIdiom(value);
        setErrors(prev => ({ ...prev, idiom: "" }));
    };

    const handleMeaningChange = (value: string) => {
        setMeaning(value);
        setErrors(prev => ({ ...prev, meaning: "" }));
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>录入 - 言语理解</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="subCategory">言语类型</Label>
                    <Select value={subCategory} onValueChange={(value: typeof SUB_CATEGORIES[number]['value']) => setSubCategory(value)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="请选择言语类型" />
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
                    <Label htmlFor="idiom">{fieldConfig.firstField.label}</Label>
                    <Input
                        id="idiom"
                        type="text"
                        placeholder={fieldConfig.firstField.placeholder}
                        value={idiom}
                        onChange={e => handleIdiomChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="meaning">{fieldConfig.secondField.label}</Label>
                    <Textarea
                        id="meaning"
                        placeholder={fieldConfig.secondField.placeholder}
                        value={meaning}
                        onChange={e => handleMeaningChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
                    />
                </div>

                {/* 图片上传组件 */}
                <UnifiedImage
                    mode="upload"
                    value={imagePath}
                    onChange={setImagePath}

                />

                {/* 错误提示 */}
                {(errors.idiom || errors.meaning) && (
                    <div className="text-sm text-red-500 text-center">
                        {errors.idiom || errors.meaning}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <UnifiedButton
                    variant="reactbits"
                    className="w-full bg-gradient-to-br from-gray-800 to-black"
                    type="button"
                    onClick={handleSubmit}
                    size="sm"
                >
                    保存知识点
                </UnifiedButton>
            </CardFooter>
        </Card>
    );
};

export default VerbalForm;
