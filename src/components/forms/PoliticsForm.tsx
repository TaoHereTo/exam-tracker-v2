'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useNotification } from "@/components/magicui/NotificationProvider";
import ReactBitsButton from "@/components/ui/ReactBitsButton";

interface PoliticsFormProps {
    onAddKnowledge: (knowledge: { date: Date | null; source: string; note: string }) => void;
    initialData?: { date: Date | null; source: string; note: string };
}

const PoliticsForm: React.FC<PoliticsFormProps> = ({ onAddKnowledge, initialData }) => {
    const [date, setDate] = useState<Date | null>(initialData?.date ? new Date(initialData.date) : null);
    const [source, setSource] = useState(initialData?.source || '');
    const [note, setNote] = useState(initialData?.note || '');
    const [dateOpen, setDateOpen] = useState(false);
    const { notify } = useNotification();

    useEffect(() => {
        setDate(initialData?.date ? new Date(initialData.date) : null);
        setSource(initialData?.source || '');
        setNote(initialData?.note || '');
    }, [initialData]);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate ?? null);
        setDateOpen(false); // 选择日期后关闭Popover
    };

    const handleSubmit = () => {
        if (!source.trim() && !note.trim()) return;
        onAddKnowledge({ date, source, note });
        notify({ type: "success", message: "保存成功" });
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
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                {date ? date.toLocaleDateString() : <span className="text-muted-foreground">选择日期</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="min-w-[260px] flex justify-center p-0" align="center">
                            <Calendar mode="single" selected={date ?? undefined} onSelect={handleDateSelect} initialFocus required={false} />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="source">文件来源</Label>
                    <Input id="source" type="text" placeholder="请输入文件来源" value={source} onChange={e => setSource(e.target.value)}
                        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); }}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="note">相关重点</Label>
                    <Textarea id="note" placeholder="请输入相关重点..." value={note} onChange={e => setNote(e.target.value)}
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

export default PoliticsForm; 