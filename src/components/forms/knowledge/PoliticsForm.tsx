'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface PoliticsFormProps {
    onAddKnowledge: (knowledge: { date: Date | null; source: string; note: string }) => void;
}

const PoliticsForm: React.FC<PoliticsFormProps> = ({ onAddKnowledge }) => {
    const [date, setDate] = useState<Date | null>(null);
    const [source, setSource] = useState('');
    const [note, setNote] = useState('');

    const handleSubmit = () => {
        if (!source.trim() && !note.trim()) return;
        onAddKnowledge({ date, source, note });
        setDate(null);
        setSource('');
        setNote('');
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>录入 - 政治理论</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>选择发布日期</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                {date ? date.toLocaleDateString() : <span className="text-muted-foreground">选择日期</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                            <Calendar mode="single" selected={date!} onSelect={setDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="source">文件来源</Label>
                    <Input id="source" type="text" placeholder="请输入文件来源" value={source} onChange={e => setSource(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="note">相关重点</Label>
                    <Textarea id="note" placeholder="请输入相关重点..." value={note} onChange={e => setNote(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" type="button" onClick={handleSubmit}>保存知识点</Button>
            </CardFooter>
        </Card>
    );
};

export default PoliticsForm; 