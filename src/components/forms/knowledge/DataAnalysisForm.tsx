'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DataAnalysisFormProps {
    onAddKnowledge: (knowledge: { type: string; note: string }) => void;
}

const DataAnalysisForm: React.FC<DataAnalysisFormProps> = ({ onAddKnowledge }) => {
    const [type, setType] = useState('');
    const [note, setNote] = useState('');

    const handleSubmit = () => {
        if (!type.trim() && !note.trim()) return;
        onAddKnowledge({ type, note });
        toast.success("保存成功");
        setType('');
        setNote('');
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>录入 - 资料分析</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="type">类型</Label>
                    <Input id="type" type="text" placeholder="例如：速算技巧" value={type} onChange={e => setType(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="note">技巧记录</Label>
                    <Textarea id="note" placeholder="请输入具体的技巧或知识点..." value={note} onChange={e => setNote(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" type="button" onClick={handleSubmit}>保存知识点</Button>
            </CardFooter>
        </Card>
    );
};

export default DataAnalysisForm; 