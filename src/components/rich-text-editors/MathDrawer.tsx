'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import katex from 'katex';
import { X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/animate-ui/components/radix/radio-group';

interface MathDrawerProps {
    editor: Editor | null;
    showMathDrawer: boolean;
    setShowMathDrawer: (show: boolean) => void;
    mathType: 'inline' | 'block';
    setMathType: (type: 'inline' | 'block') => void;
    mathLatex: string;
    setMathLatex: (latex: string) => void;
}

// 数学公式分类
const mathCategories = [
    { id: 'all', name: '全部' },
    { id: 'basic', name: '基础数学' },
    { id: 'symbols', name: '符号' },
    { id: 'greek', name: '希腊字母' },
    { id: 'sets', name: '集合' },
    { id: 'calculus', name: '微积分' },
];

// 常用数学公式模板（按分类组织）
const mathTemplates = [
    // 基础数学
    { name: '分数', latex: '\\frac{a}{b}', description: '分数 a/b', category: 'basic' },
    { name: '根号', latex: '\\sqrt{x}', description: '平方根', category: 'basic' },
    { name: 'n次根号', latex: '\\sqrt[n]{x}', description: 'n次方根', category: 'basic' },
    { name: '上标', latex: 'x^2', description: 'x的平方', category: 'basic' },
    { name: '下标', latex: 'x_1', description: 'x下标1', category: 'basic' },
    { name: '上下标', latex: 'x_1^2', description: 'x下标1上标2', category: 'basic' },

    // 符号
    { name: '不等于', latex: '\\neq', description: '不等于', category: 'symbols' },
    { name: '小于等于', latex: '\\leq', description: '小于等于', category: 'symbols' },
    { name: '大于等于', latex: '\\geq', description: '大于等于', category: 'symbols' },
    { name: '约等于', latex: '\\approx', description: '约等于', category: 'symbols' },
    { name: '正负号', latex: '\\pm', description: '正负号', category: 'symbols' },
    { name: '无穷大', latex: '\\infty', description: '无穷大符号', category: 'symbols' },

    // 希腊字母
    { name: '阿尔法', latex: '\\alpha', description: '希腊字母α', category: 'greek' },
    { name: '贝塔', latex: '\\beta', description: '希腊字母β', category: 'greek' },
    { name: '伽马', latex: '\\gamma', description: '希腊字母γ', category: 'greek' },
    { name: '德尔塔', latex: '\\delta', description: '希腊字母δ', category: 'greek' },
    { name: '西塔', latex: '\\theta', description: '希腊字母θ', category: 'greek' },
    { name: '拉姆达', latex: '\\lambda', description: '希腊字母λ', category: 'greek' },
    { name: '派', latex: '\\pi', description: '希腊字母π', category: 'greek' },
    { name: '西格玛', latex: '\\sigma', description: '希腊字母σ', category: 'greek' },

    // 集合
    { name: '实数集', latex: '\\R', description: '实数集合', category: 'sets' },
    { name: '自然数集', latex: '\\N', description: '自然数集合', category: 'sets' },
    { name: '整数集', latex: '\\Z', description: '整数集合', category: 'sets' },
    { name: '有理数集', latex: '\\Q', description: '有理数集合', category: 'sets' },
    { name: '复数集', latex: '\\C', description: '复数集合', category: 'sets' },
    { name: '属于', latex: '\\in', description: '属于符号', category: 'sets' },
    { name: '不属于', latex: '\\notin', description: '不属于符号', category: 'sets' },
    { name: '子集', latex: '\\subset', description: '子集符号', category: 'sets' },

    // 微积分
    { name: '积分', latex: '\\int_{a}^{b} f(x) dx', description: '定积分', category: 'calculus' },
    { name: '不定积分', latex: '\\int f(x) dx', description: '不定积分', category: 'calculus' },
    { name: '求和', latex: '\\sum_{i=1}^{n} x_i', description: '求和符号', category: 'calculus' },
    { name: '极限', latex: '\\lim_{x \\to \\infty} f(x)', description: '极限', category: 'calculus' },
    { name: '导数', latex: '\\frac{d}{dx}f(x)', description: '导数', category: 'calculus' },
    { name: '偏导数', latex: '\\frac{\\partial}{\\partial x}f(x,y)', description: '偏导数', category: 'calculus' },
];

export const MathDrawer: React.FC<MathDrawerProps> = ({
    editor,
    showMathDrawer,
    setShowMathDrawer,
    mathType,
    setMathType,
    mathLatex,
    setMathLatex
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // 筛选模板
    const filteredTemplates = mathTemplates.filter(template =>
        selectedCategory === 'all' || template.category === selectedCategory
    );

    // 模板点击处理 - 插入到输入框
    const handleTemplateClick = (template: string) => {
        setMathLatex(template);
    };

    // 插入公式到编辑器
    const handleInsertMath = () => {
        if (!editor || !mathLatex.trim()) return;

        if (mathType === 'inline') {
            editor.chain().focus().insertInlineMath({ latex: mathLatex }).run();
        } else {
            editor.chain().focus().insertBlockMath({ latex: mathLatex }).run();
        }

        setMathLatex('');
        setShowMathDrawer(false);
    };

    return (
        <Drawer open={showMathDrawer} onOpenChange={setShowMathDrawer}>
            <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="relative">
                    <DrawerTitle className="sr-only">数学公式</DrawerTitle>
                    <button
                        onClick={() => setShowMathDrawer(false)}
                        className="absolute right-4 top-4 h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </DrawerHeader>

                <div className="px-4 space-y-4 flex-1 overflow-y-auto">
                    <div className="space-y-2">
                        <RadioGroup
                            value={mathType}
                            onValueChange={(value) => setMathType(value as 'inline' | 'block')}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="inline"
                                    id="inline"
                                    className="border-2 border-border data-[state=checked]:border-primary"
                                />
                                <Label htmlFor="inline" className="text-sm font-normal cursor-pointer">
                                    内联公式
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="block"
                                    id="block"
                                    className="border-2 border-border data-[state=checked]:border-primary"
                                />
                                <Label htmlFor="block" className="text-sm font-normal cursor-pointer">
                                    块级公式
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* 公式输入框 */}
                    <div className="space-y-2">
                        <Input
                            value={mathLatex}
                            onChange={(e) => setMathLatex(e.target.value)}
                            placeholder="输入LaTeX公式代码，或从下方选择模板"
                            className="font-mono"
                        />
                    </div>

                    {/* 分类筛选 */}
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {mathCategories.map((category) => (
                                <Badge
                                    key={category.id}
                                    variant={selectedCategory === category.id ? "default" : "outline"}
                                    className="cursor-pointer hover:bg-accent transition-colors"
                                    onClick={() => setSelectedCategory(category.id)}
                                >
                                    {category.name}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                            {filteredTemplates.map((template, index) => {
                                // 为每个模板渲染预览
                                let templatePreview = '';
                                try {
                                    templatePreview = katex.renderToString(template.latex, {
                                        throwOnError: false,
                                        displayMode: false,
                                        macros: {
                                            '\\R': '\\mathbb{R}',
                                            '\\N': '\\mathbb{N}',
                                            '\\Z': '\\mathbb{Z}',
                                            '\\Q': '\\mathbb{Q}',
                                            '\\C': '\\mathbb{C}',
                                        },
                                    });
                                } catch (error) {
                                    templatePreview = '<span style="color: red;">渲染错误</span>';
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleTemplateClick(template.latex)}
                                        className="text-left p-2 rounded-lg hover:bg-accent transition-colors border border-border bg-card"
                                        title={template.description}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="font-semibold text-sm truncate">{template.name}</div>
                                                <Badge variant="secondary" className="text-xs shrink-0">
                                                    {mathCategories.find(cat => cat.id === template.category)?.name}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono break-all">
                                                {template.latex}
                                            </div>
                                            <div
                                                className="text-sm text-center"
                                                dangerouslySetInnerHTML={{ __html: templatePreview }}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>

                <DrawerFooter>
                    <Button
                        onClick={handleInsertMath}
                        disabled={!mathLatex.trim()}
                        className="w-full rounded-full bg-[#0d9488] hover:bg-[#0d9488]/90 text-white"
                    >
                        插入公式
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};
