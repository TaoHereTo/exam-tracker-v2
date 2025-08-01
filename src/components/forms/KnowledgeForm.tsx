import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormNotification } from "@/hooks/useFormNotification";
import { UnifiedImage } from "@/components/ui/UnifiedImage";
import { ValidationSchema, validateForm } from "@/lib/formValidation";
import { FormError } from "@/components/ui/form-error";
import { RainbowButton } from "@/components/magicui/rainbow-button";

export interface KnowledgeFormProps {
    title: string;
    typePlaceholder: string;
    notePlaceholder: string;
    onAddKnowledge: (knowledge: { type: string; note: string; imagePath?: string }) => void;
    initialData?: { type: string; note: string; imagePath?: string };
}

export const KnowledgeForm: React.FC<KnowledgeFormProps> = ({
    title,
    typePlaceholder,
    notePlaceholder,
    onAddKnowledge,
    initialData,
}) => {
    const [type, setType] = useState(initialData?.type || '');
    const [note, setNote] = useState(initialData?.note || '');
    const [imagePath, setImagePath] = useState<string | undefined>(initialData?.imagePath);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { showError, showSuccess } = useFormNotification();

    useEffect(() => {
        setType(initialData?.type || '');
        setNote(initialData?.note || '');
        setImagePath(initialData?.imagePath);
        setErrors({});
    }, [initialData]);

    const validationSchema: ValidationSchema = {
        type: {
            custom: (value, allValues) => {
                if (!value?.toString().trim() && !allValues?.note?.toString().trim()) {
                    return "请填写此项";
                }
                return null;
            }
        },
        note: {
            custom: (value, allValues) => {
                if (!value?.toString().trim() && !allValues?.type?.toString().trim()) {
                    return "请填写此项";
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

        onAddKnowledge({ type, note, imagePath });
        showSuccess();
        setType('');
        setNote('');
        setImagePath(undefined);
        setErrors({});
    };

    const handleTypeChange = (value: string) => {
        setType(value);
        if (errors.type) {
            setErrors(prev => ({ ...prev, type: "" }));
        }
    };

    const handleNoteChange = (value: string) => {
        setNote(value);
        if (errors.note) {
            setErrors(prev => ({ ...prev, note: "" }));
        }
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="relative flex flex-col gap-2">
                    <Label htmlFor="type">类型</Label>
                    <Input
                        id="type"
                        type="text"
                        placeholder={typePlaceholder}
                        value={type}
                        onChange={e => handleTypeChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
                        className={errors.type ? 'border-red-500 ring-red-500/20' : ''}
                    />
                    <FormError error={errors.type} />
                </div>
                <div className="relative flex flex-col gap-2">
                    <Label htmlFor="note">技巧记录</Label>
                    <Textarea
                        id="note"
                        placeholder={notePlaceholder}
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