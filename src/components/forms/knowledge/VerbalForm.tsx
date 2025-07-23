'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/magicui/NotificationProvider";

interface VerbalFormProps {
    onAddKnowledge: (knowledge: { idiom: string; meaning: string }) => void;
}

const VerbalForm: React.FC<VerbalFormProps> = ({ onAddKnowledge }) => {
    const [idiom, setIdiom] = useState('');
    const [meaning, setMeaning] = useState('');
    const { notify } = useNotification();

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
                    <Input id="idiom" type="text" placeholder="请输入成语" value={idiom} onChange={e => setIdiom(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="meaning">含义</Label>
                    <Textarea id="meaning" placeholder="请输入成语含义..." value={meaning} onChange={e => setMeaning(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" type="button" onClick={handleSubmit}>保存知识点</Button>
            </CardFooter>
        </Card>
    );
};

export default VerbalForm; 