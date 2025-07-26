'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/components/magicui/NotificationProvider";
import ReactBitsButton from "@/components/ui/ReactBitsButton";

interface VerbalFormProps {
    onAddKnowledge: (knowledge: { idiom: string; meaning: string }) => void;
    initialData?: { idiom: string; meaning: string };
}

const VerbalForm: React.FC<VerbalFormProps> = ({ onAddKnowledge, initialData }) => {
    const [idiom, setIdiom] = useState(initialData?.idiom || '');
    const [meaning, setMeaning] = useState(initialData?.meaning || '');
    const { notify } = useNotification();

    useEffect(() => {
        setIdiom(initialData?.idiom || '');
        setMeaning(initialData?.meaning || '');
    }, [initialData]);

    const handleSubmit = () => {
        if (!idiom.trim() && !meaning.trim()) return;
        onAddKnowledge({ idiom, meaning });
        notify({ type: "success", message: "保存成功" });
        setIdiom('');
        setMeaning('');
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>录入 - 言语理解</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="idiom">成语</Label>
                    <Input id="idiom" type="text" placeholder="请输入成语" value={idiom} onChange={e => setIdiom(e.target.value)}
                        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="meaning">含义</Label>
                    <Textarea id="meaning" placeholder="请输入成语含义..." value={meaning} onChange={e => setMeaning(e.target.value)}
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

export default VerbalForm; 