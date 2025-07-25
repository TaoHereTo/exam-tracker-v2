import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/components/magicui/NotificationProvider";
import ReactBitsButton from "@/components/ui/ReactBitsButton";

export interface KnowledgeFormProps {
    title: string;
    typePlaceholder: string;
    notePlaceholder: string;
    onAddKnowledge: (knowledge: { type: string; note: string }) => void;
    initialData?: { type: string; note: string };
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
    const { notify } = useNotification();

    useEffect(() => {
        setType(initialData?.type || '');
        setNote(initialData?.note || '');
    }, [initialData]);

    const handleSubmit = () => {
        if (!type.trim() && !note.trim()) return;
        onAddKnowledge({ type, note });
        notify({ type: "success", message: "保存成功" });
        setType('');
        setNote('');
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="type">类型</Label>
                    <Input id="type" type="text" placeholder={typePlaceholder} value={type} onChange={e => setType(e.target.value)}
                        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="note">技巧记录</Label>
                    <Textarea id="note" placeholder={notePlaceholder} value={note} onChange={e => setNote(e.target.value)}
                        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
                    />
                </div>
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
}; 