"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import "./theme-switches/sun-moon-switch.css";

interface BeautifulThemeSwitchProps {
    previewOnly?: boolean;
    previewState?: boolean;
    onPreviewChange?: (state: boolean) => void;
    disabled?: boolean;
}

export function BeautifulThemeSwitch({
    previewOnly = false,
    previewState = false,
    onPreviewChange,
    disabled = false
}: BeautifulThemeSwitchProps) {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = previewOnly ? previewState : resolvedTheme === "dark";
    const inputId = previewOnly ? "preview-theme-switch-input" : "theme-switch-input";
    const switchClass = previewOnly ? "switch preview-switch" : "switch";

    const handleThemeToggle = () => {
        if (previewOnly && onPreviewChange) {
            // 预览模式：只切换预览状态
            onPreviewChange(!previewState);
        } else {
            // 正常模式：切换实际主题
            setTheme(isDark ? "light" : "dark");
        }
    };

    return (
        <label className={switchClass}>
            <input
                id={inputId}
                type="checkbox"
                checked={isDark}
                onChange={handleThemeToggle}
                disabled={disabled}
            />
            <div className="slider round">
                <div className="sun-moon">
                    <svg id="moon-dot-1" className="moon-dot" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                    <svg id="moon-dot-2" className="moon-dot" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                    <svg id="moon-dot-3" className="moon-dot" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                    <svg id="light-ray-1" className="light-ray" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                    <svg id="light-ray-2" className="light-ray" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                    <svg id="light-ray-3" className="light-ray" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                    </svg>

                    <svg id="cloud-1" className="cloud-dark" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                    <svg id="cloud-2" className="cloud-dark" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                    <svg id="cloud-3" className="cloud-dark" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                    <svg id="cloud-4" className="cloud-light" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                    <svg id="cloud-5" className="cloud-light" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                    <svg id="cloud-6" className="cloud-light" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                    </svg>
                </div>
                <div className="stars">
                    <svg id="star-1" className="star" viewBox="0 0 20 20">
                        <path
                            d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
                        ></path>
                    </svg>
                    <svg id="star-2" className="star" viewBox="0 0 20 20">
                        <path
                            d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
                        ></path>
                    </svg>
                    <svg id="star-3" className="star" viewBox="0 0 20 20">
                        <path
                            d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
                        ></path>
                    </svg>
                    <svg id="star-4" className="star" viewBox="0 0 20 20">
                        <path
                            d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
                        ></path>
                    </svg>
                </div>
            </div>
        </label>
    );
} 