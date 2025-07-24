import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/magicui/NotificationProvider";

export interface KnowledgeFormProps {
    title: string;
    typePlaceholder: string;
    notePlaceholder: string;
    onAddKnowledge: (knowledge: { type: string; note: string }) => void;
}

export const KnowledgeForm: React.FC<KnowledgeFormProps> = ({
    title,
    typePlaceholder,
    notePlaceholder,
    onAddKnowledge,
}) => {
    const [type, setType] = useState('');
    const [note, setNote] = useState('');
    const { notify } = useNotification();

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
                    <Input id="type" type="text" placeholder={typePlaceholder} value={type} onChange={e => setType(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="note">技巧记录</Label>
                    <Textarea id="note" placeholder={notePlaceholder} value={note} onChange={e => setNote(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" type="button" onClick={handleSubmit}>保存知识点</Button>
            </CardFooter>
        </Card>
    );
}; 