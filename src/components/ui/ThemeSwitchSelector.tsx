"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { BeautifulThemeSwitch } from "./BeautifulThemeSwitch";
import PlaneSwitch from "./PlaneSwitch";

// 定义主题切换按钮的类型
export type ThemeSwitchType = 'sun-moon' | 'plane';

interface ThemeSwitchSelectorProps {
    type: ThemeSwitchType;
    onTypeChange?: (type: ThemeSwitchType) => void;
    previewOnly?: boolean; // 新增：仅预览模式
}

export function ThemeSwitchSelector({ type, previewOnly = false }: ThemeSwitchSelectorProps) {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    // 预览模式下的状态
    const [previewState, setPreviewState] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = previewOnly ? previewState : resolvedTheme === "dark";

    const handleThemeToggle = () => {
        if (previewOnly) {
            // 预览模式：只切换预览状态
            setPreviewState(!previewState);
        } else {
            // 正常模式：切换实际主题
            setTheme(isDark ? "light" : "dark");
        }
    };

    // 根据类型渲染不同的主题切换按钮
    const renderThemeSwitch = () => {
        switch (type) {
            case 'sun-moon':
                return <BeautifulThemeSwitch previewOnly={previewOnly} previewState={previewState} onPreviewChange={setPreviewState} />;

            case 'plane':
                return (
                    <PlaneSwitch
                        checked={isDark}
                        onChange={handleThemeToggle}
                        disabled={false}
                    />
                );

            default:
                return <BeautifulThemeSwitch previewOnly={previewOnly} previewState={previewState} onPreviewChange={setPreviewState} />;
        }
    };

    return (
        <div className={`flex items-center w-full h-full ${previewOnly ? 'justify-start' : 'justify-center'}`}>
            <div className="scale-75">
                {renderThemeSwitch()}
            </div>
        </div>
    );
} 