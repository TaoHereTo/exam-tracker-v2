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
    insertInlineMath?: (latex: string) => void;
    insertBlockMath?: (latex: string) => void;
    updateMathAtPosition?: (latex: string, type: 'inline' | 'block') => void;
    deleteMathAtPosition?: (type: 'inline' | 'block') => void;
    isEditing?: boolean; // 是否在编辑模式
}

// 数学公式分类
const mathCategories = [
    { id: 'all', name: '全部' },
    { id: 'basic', name: '基础数学' },
    { id: 'symbols', name: '符号' },
    { id: 'greek', name: '希腊字母' },
    { id: 'sets', name: '集合' },
    { id: 'calculus', name: '微积分' },
    { id: 'algebra', name: '代数' },
    { id: 'geometry', name: '几何' },
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
    { name: '不等于', latex: '\\ne', description: '不等于', category: 'symbols' },
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
    { name: '二重积分', latex: '\\iint_D f(x,y) dxdy', description: '二重积分', category: 'calculus' },
    { name: '三重积分', latex: '\\iiint_V f(x,y,z) dxdydz', description: '三重积分', category: 'calculus' },
    { name: '曲线积分', latex: '\\oint_C f(x,y) ds', description: '曲线积分', category: 'calculus' },
    { name: '梯度', latex: '\\nabla f', description: '梯度算子', category: 'calculus' },
    { name: '散度', latex: '\\nabla \\cdot \\vec{F}', description: '散度', category: 'calculus' },
    { name: '旋度', latex: '\\nabla \\times \\vec{F}', description: '旋度', category: 'calculus' },

    // 代数
    { name: '二次公式', latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', description: '二次方程求根公式', category: 'algebra' },
    { name: '二项式定理', latex: '(a+b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k}b^k', description: '二项式定理', category: 'algebra' },
    { name: '组合数', latex: '\\binom{n}{k} = \\frac{n!}{k!(n-k)!}', description: '组合数公式', category: 'algebra' },
    { name: '排列数', latex: 'P(n,k) = \\frac{n!}{(n-k)!}', description: '排列数公式', category: 'algebra' },
    { name: '对数', latex: '\\log_a b = \\frac{\\ln b}{\\ln a}', description: '换底公式', category: 'algebra' },
    { name: '指数', latex: 'e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!}', description: '指数函数展开', category: 'algebra' },

    // 几何
    { name: '勾股定理', latex: 'a^2 + b^2 = c^2', description: '勾股定理', category: 'geometry' },
    { name: '圆面积', latex: 'A = \\pi r^2', description: '圆面积公式', category: 'geometry' },
    { name: '圆周长', latex: 'C = 2\\pi r', description: '圆周长公式', category: 'geometry' },
    { name: '球体积', latex: 'V = \\frac{4}{3}\\pi r^3', description: '球体积公式', category: 'geometry' },
    { name: '球表面积', latex: 'S = 4\\pi r^2', description: '球表面积公式', category: 'geometry' },
    { name: '向量长度', latex: '|\\vec{v}| = \\sqrt{v_x^2 + v_y^2 + v_z^2}', description: '向量模长', category: 'geometry' },
    { name: '点积', latex: '\\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos\\theta', description: '向量点积', category: 'geometry' },
    { name: '叉积', latex: '\\vec{a} \\times \\vec{b} = |\\vec{a}||\\vec{b}|\\sin\\theta \\hat{n}', description: '向量叉积', category: 'geometry' },
];

export const MathDrawer: React.FC<MathDrawerProps> = ({
    editor,
    showMathDrawer,
    setShowMathDrawer,
    mathType,
    setMathType,
    mathLatex,
    setMathLatex,
    insertInlineMath,
    insertBlockMath,
    updateMathAtPosition,
    deleteMathAtPosition,
    isEditing = false
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

    // 插入或更新公式到编辑器
    const handleInsertMath = () => {
        if (!mathLatex.trim()) return;

        // 根据编辑模式决定使用更新还是插入
        if (isEditing && updateMathAtPosition) {
            // 编辑模式：更新现有数学公式
            updateMathAtPosition(mathLatex, mathType);
        } else if (insertInlineMath && insertBlockMath) {
            // 插入模式：插入新的数学公式
            if (mathType === 'inline') {
                insertInlineMath(mathLatex);
            } else {
                insertBlockMath(mathLatex);
            }
        } else if (editor) {
            // 回退到原始方法
            if (mathType === 'inline') {
                editor.chain().focus().insertInlineMath({ latex: mathLatex }).run();
            } else {
                editor.chain().focus().insertBlockMath({ latex: mathLatex }).run();
            }
        }

        setMathLatex('');
        setShowMathDrawer(false);
        // 重置编辑状态在父组件中处理
    };

    return (
        <Drawer open={showMathDrawer} onOpenChange={setShowMathDrawer}>
            <DrawerContent className="h-[90vh] min-h-[80vh] max-h-[95vh]">
                <DrawerHeader className="relative">
                    <DrawerTitle className="sr-only">数学公式</DrawerTitle>
                    <button
                        onClick={() => setShowMathDrawer(false)}
                        className="absolute right-4 top-4 h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </DrawerHeader>

                <div className="px-4 space-y-4 flex-1 overflow-y-auto min-h-[60vh]">
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
                                    className="cursor-pointer"
                                    onClick={() => setSelectedCategory(category.id)}
                                >
                                    {category.name}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {filteredTemplates.map((template, index) => {
                            // 为每个模板渲染预览
                            let templatePreview = '';
                            try {
                                templatePreview = katex.renderToString(template.latex, {
                                    throwOnError: false,
                                    strict: false,
                                    trust: true,
                                    macros: {
                                        '\\R': '\\mathbb{R}',
                                        '\\N': '\\mathbb{N}',
                                        '\\Z': '\\mathbb{Z}',
                                        '\\Q': '\\mathbb{Q}',
                                        '\\C': '\\mathbb{C}',
                                        '\\P': '\\mathbb{P}',
                                        '\\E': '\\mathbb{E}',
                                        '\\Var': '\\text{Var}',
                                        '\\Cov': '\\text{Cov}',
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

                <DrawerFooter>
                    <Button
                        onClick={handleInsertMath}
                        disabled={!mathLatex.trim()}
                        className="w-full rounded-full bg-[#0d9488] hover:bg-[#0d9488]/90 text-white"
                    >
                        {isEditing ? '更新公式' : '插入公式'}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};
