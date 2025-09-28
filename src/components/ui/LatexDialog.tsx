'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNotification } from '@/components/magicui/NotificationProvider';
import 'katex/dist/katex.min.css';

// LaTeX预览组件
const LatexPreview: React.FC<{ latex: string; displayMode: boolean }> = ({ latex, displayMode }) => {
    const [rendered, setRendered] = React.useState<string>('');

    React.useEffect(() => {
        const renderLatex = async () => {
            try {
                const katex = await import('katex');
                const html = katex.renderToString(latex, {
                    throwOnError: false,
                    displayMode
                });
                setRendered(html);
            } catch (error) {
                console.error('LaTeX渲染错误:', error);
                setRendered(`<span style="color: red;">$${latex}$</span>`);
            }
        };

        renderLatex();
    }, [latex, displayMode]);

    return <div dangerouslySetInnerHTML={{ __html: rendered }} />;
};

interface LatexDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInsert: (latex: string, displayMode: boolean) => void;
    initialLatex?: string;
    initialDisplayMode?: boolean;
}

export const LatexDialog: React.FC<LatexDialogProps> = ({
    open,
    onOpenChange,
    onInsert,
    initialLatex = '',
    initialDisplayMode = false
}) => {
    const [latex, setLatex] = useState(initialLatex);
    const [displayMode, setDisplayMode] = useState(initialDisplayMode);
    const { notify } = useNotification();

    useEffect(() => {
        if (open) {
            setLatex(initialLatex);
            setDisplayMode(initialDisplayMode);
        }
    }, [open, initialLatex, initialDisplayMode]);

    const handleInsert = () => {
        if (!latex.trim()) {
            notify({
                type: "error",
                message: "请输入LaTeX公式"
            });
            return;
        }

        onInsert(latex.trim(), displayMode);
        onOpenChange(false);

        notify({
            type: "success",
            message: "LaTeX公式已插入"
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>插入LaTeX数学公式</DialogTitle>
                    <DialogDescription>
                        输入LaTeX公式代码，支持行内公式和块级公式。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="latex-input">LaTeX公式代码</Label>
                            <Textarea
                                id="latex-input"
                                value={latex}
                                onChange={(e) => setLatex(e.target.value)}
                                placeholder="输入LaTeX公式，例如：\frac{a}{b} 或 \int_{0}^{\infty} e^{-x} dx"
                                className="min-h-[120px] font-mono text-sm"
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            <Label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    checked={!displayMode}
                                    onChange={() => setDisplayMode(false)}
                                    className="mr-2"
                                />
                                <span>行内公式 $...$</span>
                            </Label>
                            <Label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    checked={displayMode}
                                    onChange={() => setDisplayMode(true)}
                                    className="mr-2"
                                />
                                <span>块级公式 $$...$$</span>
                            </Label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>预览效果</Label>
                        <div className="min-h-[120px] p-4 border rounded-md bg-gray-50 dark:bg-gray-800 overflow-auto">
                            {latex ? (
                                <LatexPreview latex={latex} displayMode={displayMode} />
                            ) : (
                                <div className="text-gray-500 text-sm">输入LaTeX公式以查看预览</div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleInsert} className="bg-[#253985] hover:bg-[#253985]/90 text-white">
                        插入公式
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LatexDialog;
