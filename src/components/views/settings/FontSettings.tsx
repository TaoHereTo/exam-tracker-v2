"use client";

import React, { useState, useEffect } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFont } from "@/contexts/FontContext";
import { MixedText } from "@/components/ui/MixedText";
import { RefreshCw, Type, Save, ScanEye } from "lucide-react";

// 预定义的中文字体选项
const CHINESE_FONTS = [
    { value: 'Noto Serif SC', label: '思源宋体', icon: 'both' },
    { value: 'Noto Sans SC', label: '思源黑体', icon: 'both' },
    { value: 'PingFang SC', label: '苹方', icon: 'apple' },
    { value: 'Hiragino Sans GB', label: '冬青黑体', icon: 'apple' },
    { value: 'Microsoft YaHei', label: '微软雅黑', icon: 'windows' },
    { value: 'SimSun', label: '宋体', icon: 'windows' },
    { value: 'SimHei', label: '黑体', icon: 'windows' },
];

// 预定义的英文字体选项
const ENGLISH_FONTS = [
    { value: 'Times New Roman', label: 'Times New Roman', icon: 'both' },
    { value: 'Arial', label: 'Arial', icon: 'both' },
    { value: 'Helvetica', label: 'Helvetica', icon: 'apple' },
    { value: 'Georgia', label: 'Georgia', icon: 'both' },
    { value: 'Verdana', label: 'Verdana', icon: 'both' },
    { value: 'Courier New', label: 'Courier New', icon: 'both' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS', icon: 'windows' },
    { value: 'Palatino', label: 'Palatino', icon: 'apple' },
    { value: 'Garamond', label: 'Garamond', icon: 'both' },
    { value: 'Calibri', label: 'Calibri', icon: 'windows' },
];

export function FontSettings() {
    const { fontConfig, updateFontConfig, resetFontConfig } = useFont();
    const [chineseFont, setChineseFont] = useState('Noto Serif SC');
    const [englishFont, setEnglishFont] = useState('Times New Roman');
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // 当字体配置变化时更新本地状态
    useEffect(() => {
        console.log('FontSettings: fontConfig changed', fontConfig);
        console.log('FontSettings: chineseFont value:', chineseFont);
        console.log('FontSettings: available fonts:', CHINESE_FONTS.map(f => f.value));
        setChineseFont(fontConfig.chineseFont || 'Noto Serif SC');
        setEnglishFont(fontConfig.englishFont || 'Times New Roman');
    }, [fontConfig, chineseFont]);

    // 组件挂载时确保有默认值
    useEffect(() => {
        console.log('FontSettings: component mounted, chineseFont:', chineseFont);
        // 确保chineseFont是有效的字体选项
        const validFont = CHINESE_FONTS.find(f => f.value === chineseFont);
        if (!validFont) {
            console.log('FontSettings: chineseFont not valid, setting to Noto Serif SC');
            setChineseFont('Noto Serif SC');
        }
        if (!englishFont) {
            setEnglishFont('Times New Roman');
        }
    }, [chineseFont, englishFont]);

    // 应用字体设置
    const handleApplyFonts = () => {
        updateFontConfig({
            chineseFont,
            englishFont
        });
    };

    // 重置字体设置
    const handleResetFonts = () => {
        resetFontConfig();
        setChineseFont(fontConfig.chineseFont);
        setEnglishFont(fontConfig.englishFont);
    };

    // 预览字体效果
    const handlePreviewFonts = () => {
        setIsPreviewMode(true);
        updateGlobalFontCSS(chineseFont, englishFont);

        // 3秒后退出预览模式
        setTimeout(() => {
            setIsPreviewMode(false);
            updateGlobalFontCSS(fontConfig.chineseFont, fontConfig.englishFont);
        }, 3000);
    };

    // 更新全局CSS变量
    const updateGlobalFontCSS = (chineseFont: string, englishFont: string) => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;
        root.style.setProperty('--chinese-font', `'${chineseFont}'`);
        root.style.setProperty('--english-font', `'${englishFont}'`);

        // 更新全局字体样式
        let globalStyle = document.getElementById('global-font-style');
        if (!globalStyle) {
            globalStyle = document.createElement('style');
            globalStyle.id = 'global-font-style';
            document.head.appendChild(globalStyle);
        }

        globalStyle.textContent = `
      * {
        font-family: var(--chinese-font), var(--english-font), serif;
      }
    `;
    };

    return (
        <div className="space-y-6">
            {/* 中文字体选择 */}
            <div className="flex flex-row items-start sm:items-center justify-between py-4 gap-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground">
                        <MixedText text="中文字体" />
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        <MixedText text="选择用于显示中文内容的字体" />
                    </p>
                </div>
                <div className="w-auto">
                    <Select value={chineseFont} onValueChange={setChineseFont}>
                        <SelectTrigger className="w-[200px] h-8 sm:h-10 text-sm">
                            <SelectValue placeholder="选择中文字体" className="text-sm" />
                        </SelectTrigger>
                        <SelectContent className="w-[200px]" position="popper" sideOffset={4}>
                            {CHINESE_FONTS.map((font) => (
                                <SelectItem key={font.value} value={font.value} className="text-sm">
                                    <div className="flex items-center gap-2">
                                        <span>{font.label}</span>
                                        {font.icon === 'apple' && <i className="bi bi-apple text-xs text-muted-foreground"></i>}
                                        {font.icon === 'windows' && <i className="bi bi-windows text-xs text-muted-foreground"></i>}
                                        {font.icon === 'both' && (
                                            <div className="flex items-center gap-1">
                                                <i className="bi bi-windows text-xs text-muted-foreground"></i>
                                                <span className="text-xs text-muted-foreground">/</span>
                                                <i className="bi bi-apple text-xs text-muted-foreground"></i>
                                            </div>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 中文字体预览 */}
            <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                    中文字体预览：
                </p>
                <p
                    className="text-lg leading-relaxed"
                    style={{
                        fontFamily: `'${chineseFont}', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'SimSun', serif`,
                        fontWeight: chineseFont === 'SimHei' || chineseFont === 'Noto Sans SC' ? 'bold' : 'normal',
                        fontStyle: chineseFont === 'KaiTi' || chineseFont === 'STKaiti' ? 'italic' : 'normal'
                    }}
                >
                    这是一段中文预览文本，用于展示所选字体的显示效果。包含常用汉字和标点符号。
                </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* 英文字体选择 */}
            <div className="flex flex-row items-start sm:items-center justify-between py-4 gap-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground">
                        <MixedText text="英文字体" />
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        <MixedText text="选择用于显示英文内容的字体" />
                    </p>
                </div>
                <div className="w-auto">
                    <Select value={englishFont} onValueChange={setEnglishFont}>
                        <SelectTrigger className="w-[200px] h-8 sm:h-10 text-sm">
                            <SelectValue placeholder="选择英文字体" className="text-sm" />
                        </SelectTrigger>
                        <SelectContent className="w-[200px]" position="popper" sideOffset={4}>
                            {ENGLISH_FONTS.map((font) => (
                                <SelectItem key={font.value} value={font.value} className="text-sm">
                                    <div className="flex items-center gap-2">
                                        <span>{font.label}</span>
                                        {font.icon === 'apple' && <i className="bi bi-apple text-xs text-muted-foreground"></i>}
                                        {font.icon === 'windows' && <i className="bi bi-windows text-xs text-muted-foreground"></i>}
                                        {font.icon === 'both' && (
                                            <div className="flex items-center gap-1">
                                                <i className="bi bi-windows text-xs text-muted-foreground"></i>
                                                <span className="text-xs text-muted-foreground">/</span>
                                                <i className="bi bi-apple text-xs text-muted-foreground"></i>
                                            </div>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 英文字体预览 */}
            <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                    英文字体预览：
                </p>
                <p
                    className="text-lg leading-relaxed"
                    style={{ fontFamily: `'${englishFont}', serif` }}
                >
                    This is a preview text in English to demonstrate the selected font. It includes common letters, numbers, and punctuation marks.
                </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* 混合文本预览 */}
            <div className="py-4">
                <h3 className="font-semibold text-base sm:text-lg text-foreground mb-3">
                    混合文本预览
                </h3>
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                        混合文本预览：
                    </p>
                    <p
                        className="text-lg leading-relaxed"
                        style={{
                            fontFamily: `'${chineseFont}', '${englishFont}', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Arial', serif`,
                            fontWeight: chineseFont === 'SimHei' || chineseFont === 'Noto Sans SC' ? 'bold' : 'normal'
                        }}
                    >
                        这是一个中英文混合的预览文本。This is a mixed Chinese and English preview text. 它展示了字体在混合语言环境下的显示效果。The font rendering looks great in mixed language environments!
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end py-4">
                <Button
                    variant="outline"
                    onClick={handlePreviewFonts}
                    className="flex items-center gap-2 h-9 text-sm rounded-full"
                >
                    <ScanEye className="w-4 h-4" />
                    <MixedText text="预览效果" />
                </Button>

                <Button
                    variant="outline"
                    onClick={handleResetFonts}
                    className="flex items-center gap-2 h-9 text-sm rounded-full"
                >
                    <MixedText text="重置默认" />
                </Button>

                <Button
                    onClick={handleApplyFonts}
                    className="flex items-center justify-center h-9 w-32 text-sm font-medium shadow-none hover:shadow-none transition-all duration-200 rounded-full bg-[#db2777] hover:bg-[#db2777]/90 text-white dark:text-white"
                >
                    <div className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        <MixedText text="保存设置" />
                    </div>
                </Button>
            </div>

            {/* 预览模式提示 */}
            {isPreviewMode && (
                <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50">
                    <MixedText text="预览模式 - 3秒后自动恢复" />
                </div>
            )}
        </div>
    );
}
