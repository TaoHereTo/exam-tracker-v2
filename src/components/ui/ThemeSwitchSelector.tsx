"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { BeautifulThemeSwitch } from "./BeautifulThemeSwitch";
import "./theme-switches/bb8-switch.css";

// 定义主题切换按钮的类型
export type ThemeSwitchType = 'simple' | 'beautiful' | 'bb8';

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
            case 'simple':
                return (
                    <button
                        onClick={handleThemeToggle}
                        className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
                        aria-label="切换主题"
                    >
                        {isDark ? (
                            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                        )}
                    </button>
                );

            case 'beautiful':
                return <BeautifulThemeSwitch previewOnly={previewOnly} previewState={previewState} onPreviewChange={setPreviewState} />;

            case 'bb8':
                return (
                    <label className="bb8-toggle">
                        <input
                            className="bb8-toggle__checkbox"
                            type="checkbox"
                            checked={isDark}
                            onChange={handleThemeToggle}
                        />
                        <div className="bb8-toggle__container">
                            <div className="bb8-toggle__scenery">
                                <div className="bb8-toggle__star"></div>
                                <div className="bb8-toggle__star"></div>
                                <div className="bb8-toggle__star"></div>
                                <div className="bb8-toggle__star"></div>
                                <div className="bb8-toggle__star"></div>
                                <div className="bb8-toggle__star"></div>
                                <div className="bb8-toggle__star"></div>
                                <div className="tatto-1"></div>
                                <div className="tatto-2"></div>
                                <div className="gomrassen"></div>
                                <div className="hermes"></div>
                                <div className="chenini"></div>
                                <div className="bb8-toggle__cloud"></div>
                                <div className="bb8-toggle__cloud"></div>
                                <div className="bb8-toggle__cloud"></div>
                            </div>
                            <div className="bb8">
                                <div className="bb8__head-container">
                                    <div className="bb8__antenna"></div>
                                    <div className="bb8__antenna"></div>
                                    <div className="bb8__head"></div>
                                </div>
                                <div className="bb8__body"></div>
                            </div>
                            <div className="artificial__hidden">
                                <div className="bb8__shadow"></div>
                            </div>
                        </div>
                    </label>
                );

            default:
                return null;
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