'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
    Drawer,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/animate-ui/components/radix/radio-group';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Sigma, Search, X } from 'lucide-react';

interface LatexFormulaSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInsert: (latex: string, displayMode: boolean) => void;
}

// 常用LaTeX公式模板
const latexTemplates = {
    '基础数学': [
        { name: '分数', latex: '\\frac{a}{b}', preview: '\\frac{a}{b}' },
        { name: '根号', latex: '\\sqrt{x}', preview: '\\sqrt{x}' },
        { name: 'n次方根', latex: '\\sqrt[n]{x}', preview: '\\sqrt[n]{x}' },
        { name: '上标', latex: 'x^{2}', preview: 'x^{2}' },
        { name: '下标', latex: 'x_{1}', preview: 'x_{1}' },
        { name: '上下标', latex: 'x_{1}^{2}', preview: 'x_{1}^{2}' },
    ],
    '希腊字母': [
        { name: 'α', latex: '\\alpha', preview: '\\alpha' },
        { name: 'β', latex: '\\beta', preview: '\\beta' },
        { name: 'γ', latex: '\\gamma', preview: '\\gamma' },
        { name: 'δ', latex: '\\delta', preview: '\\delta' },
        { name: 'ε', latex: '\\epsilon', preview: '\\epsilon' },
        { name: 'θ', latex: '\\theta', preview: '\\theta' },
        { name: 'λ', latex: '\\lambda', preview: '\\lambda' },
        { name: 'μ', latex: '\\mu', preview: '\\mu' },
        { name: 'π', latex: '\\pi', preview: '\\pi' },
        { name: 'σ', latex: '\\sigma', preview: '\\sigma' },
        { name: 'τ', latex: '\\tau', preview: '\\tau' },
        { name: 'φ', latex: '\\phi', preview: '\\phi' },
        { name: 'ω', latex: '\\omega', preview: '\\omega' },
    ],
    '运算符': [
        { name: '加号', latex: '+', preview: '+' },
        { name: '减号', latex: '-', preview: '-' },
        { name: '乘号', latex: '\\times', preview: '\\times' },
        { name: '除号', latex: '\\div', preview: '\\div' },
        { name: '等于', latex: '=', preview: '=' },
        { name: '不等于', latex: '\\neq', preview: '\\neq' },
        { name: '小于', latex: '<', preview: '<' },
        { name: '大于', latex: '>', preview: '>' },
        { name: '小于等于', latex: '\\leq', preview: '\\leq' },
        { name: '大于等于', latex: '\\geq', preview: '\\geq' },
        { name: '约等于', latex: '\\approx', preview: '\\approx' },
        { name: '正负', latex: '\\pm', preview: '\\pm' },
    ],
    '集合符号': [
        { name: '属于', latex: '\\in', preview: '\\in' },
        { name: '不属于', latex: '\\notin', preview: '\\notin' },
        { name: '子集', latex: '\\subset', preview: '\\subset' },
        { name: '真子集', latex: '\\subsetneq', preview: '\\subsetneq' },
        { name: '并集', latex: '\\cup', preview: '\\cup' },
        { name: '交集', latex: '\\cap', preview: '\\cap' },
        { name: '空集', latex: '\\emptyset', preview: '\\emptyset' },
        { name: '全集', latex: '\\Omega', preview: '\\Omega' },
    ],
    '积分微积分': [
        { name: '积分', latex: '\\int', preview: '\\int' },
        { name: '定积分', latex: '\\int_{a}^{b}', preview: '\\int_{a}^{b}' },
        { name: '二重积分', latex: '\\iint', preview: '\\iint' },
        { name: '三重积分', latex: '\\iiint', preview: '\\iiint' },
        { name: '偏导数', latex: '\\frac{\\partial f}{\\partial x}', preview: '\\frac{\\partial f}{\\partial x}' },
        { name: '全导数', latex: '\\frac{df}{dx}', preview: '\\frac{df}{dx}' },
        { name: '极限', latex: '\\lim_{x \\to \\infty}', preview: '\\lim_{x \\to \\infty}' },
        { name: '求和', latex: '\\sum_{i=1}^{n}', preview: '\\sum_{i=1}^{n}' },
    ],
    '矩阵': [
        { name: '2x2矩阵', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', preview: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
        { name: '3x3矩阵', latex: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}', preview: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}' },
        { name: '行列式', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', preview: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
    ],
};

// LaTeX预览组件
const LatexPreview: React.FC<{ latex: string; displayMode: boolean }> = ({ latex, displayMode }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        // 清空容器，避免重复渲染
        ref.current.innerHTML = '';

        try {
            katex.render(latex, ref.current, {
                throwOnError: false,
                displayMode: displayMode
            });
        } catch (error) {
            console.error('LaTeX渲染错误:', error);
            ref.current.innerHTML = displayMode ? `$$${latex}$$` : `$${latex}$`;
        }
    }, [latex, displayMode]);

    return (
        <div
            ref={ref}
            className={displayMode ? "block" : "inline-block"}
        />
    );
};

export const LatexFormulaSelector: React.FC<LatexFormulaSelectorProps> = ({
    open,
    onOpenChange,
    onInsert
}) => {
    const [displayMode, setDisplayMode] = useState<'inline' | 'block'>('inline');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // 扁平化所有公式数据
    const allFormulas = useMemo(() => {
        const formulas: Array<{ name: string; latex: string; preview: string; category: string }> = [];
        Object.entries(latexTemplates).forEach(([category, formulaList]) => {
            formulaList.forEach(formula => {
                formulas.push({
                    ...formula,
                    category
                });
            });
        });
        return formulas;
    }, []);

    // 根据分类筛选公式
    const filteredFormulas = useMemo(() => {
        let filtered = allFormulas;

        // 如果选择了分类，则筛选该分类的公式
        if (selectedCategory) {
            filtered = filtered.filter(formula => formula.category === selectedCategory);
        }

        // 如果有搜索词，则进一步筛选
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(formula =>
                formula.name.toLowerCase().includes(searchLower) ||
                formula.latex.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [allFormulas, selectedCategory, searchTerm]);

    // 获取所有分类
    const categories = Object.keys(latexTemplates);

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
    };


    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sigma className="h-5 w-5" />
                            <div>
                                <DrawerTitle className="inline">LaTeX公式选择器</DrawerTitle>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                    可以点击下方公式选中后插入，也可以直接在输入框中输入公式（注意使用$包裹）
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DrawerHeader>

                <div className="flex-1 overflow-auto p-4">
                    <div className="space-y-6">
                        {/* 分类选择、搜索和公式模式选择区域 */}
                        <div className="flex gap-4 items-center">
                            <div className="flex gap-2 items-center">
                                <Label className="text-sm font-medium">选择分类:</Label>
                                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="选择分类" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2 items-center">
                                <Label className="text-sm font-medium">搜索:</Label>
                                <Input
                                    placeholder="搜索公式..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-[200px]"
                                />
                            </div>

                            <div className="flex gap-2 items-center">
                                <Label className="text-sm font-medium">公式模式:</Label>
                                <RadioGroup value={displayMode} onValueChange={(value) => setDisplayMode(value as 'inline' | 'block')} className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="inline"
                                            id="inline"
                                            className="border-2 border-gray-400 dark:border-gray-500 data-[state=checked]:border-blue-600 dark:data-[state=checked]:border-blue-400"
                                        />
                                        <Label htmlFor="inline" className="text-sm">行内公式</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="block"
                                            id="block"
                                            className="border-2 border-gray-400 dark:border-gray-500 data-[state=checked]:border-blue-600 dark:data-[state=checked]:border-blue-400"
                                        />
                                        <Label htmlFor="block" className="text-sm">行间公式</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>

                        {/* 公式展示区域 */}
                        <div className="space-y-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedCategory ? `${selectedCategory} 分类共有` : '全部'} {filteredFormulas.length} 个公式
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredFormulas.map((formula, index) => (
                                    <div
                                        key={`${formula.category}-${index}`}
                                        className="p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors bg-white dark:bg-transparent"
                                        onClick={() => onInsert(formula.latex, displayMode === 'block')}
                                    >
                                        <div className="text-sm font-medium mb-2">{formula.name}</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all mb-2">
                                            {formula.latex}
                                        </div>
                                        <div className="text-center bg-transparent p-2 rounded min-h-[40px] flex items-center justify-center">
                                            <LatexPreview latex={formula.preview} displayMode={displayMode === 'block'} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </DrawerContent>
        </Drawer>
    );
};

export default LatexFormulaSelector;
