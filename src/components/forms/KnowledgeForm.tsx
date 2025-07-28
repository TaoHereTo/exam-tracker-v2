import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/components/magicui/NotificationProvider";
import ReactBitsButton from "@/components/ui/ReactBitsButton";
import { ImageUpload } from "@/components/ui/ImageUpload";

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
    const { notify } = useNotification();

    useEffect(() => {
        setType(initialData?.type || '');
        setNote(initialData?.note || '');
        setImagePath(initialData?.imagePath);
        setErrors({});
    }, [initialData]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!type.trim() && !note.trim()) {
            newErrors.general = "请至少填写类型或技巧记录中的一项";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            notify({ type: "error", message: "请完善表单信息" });
            return;
        }

        onAddKnowledge({ type, note, imagePath });
        notify({ type: "success", message: "保存成功" });
        setType('');
        setNote('');
        setImagePath(undefined);
        setErrors({});
    };

    const handleTypeChange = (value: string) => {
        setType(value);
        setErrors(prev => ({ ...prev, general: "" }));
    };

    const handleNoteChange = (value: string) => {
        setNote(value);
        setErrors(prev => ({ ...prev, general: "" }));
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="type">类型</Label>
                    <Input
                        id="type"
                        type="text"
                        placeholder={typePlaceholder}
                        value={type}
                        onChange={e => handleTypeChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="note">技巧记录</Label>
                    <Textarea
                        id="note"
                        placeholder={notePlaceholder}
                        value={note}
                        onChange={e => handleNoteChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
                    />
                </div>

                {/* 图片上传组件 */}
                <ImageUpload
                    value={imagePath}
                    onChange={setImagePath}
                />

                {/* 错误提示 */}
                {errors.general && (
                    <div className="text-sm text-red-500 text-center">
                        {errors.general}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <ReactBitsButton
                    className="w-full bg-gradient-to-br from-gray-800 to-black"
                    type="button"
                    onClick={handleSubmit}
                    size="sm"
                >
                    保存知识点
                </ReactBitsButton>
            </CardFooter>
        </Card>
    );
}