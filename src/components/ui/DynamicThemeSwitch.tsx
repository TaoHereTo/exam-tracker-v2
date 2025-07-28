"use client";
import { useEffect, useState } from "react";
import { ThemeSwitchSelector, ThemeSwitchType } from "./ThemeSwitchSelector";

export function DynamicThemeSwitch() {
    const [themeSwitchType, setThemeSwitchType] = useState<ThemeSwitchType>('beautiful');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedType = localStorage.getItem('theme-switch-type') as ThemeSwitchType;
        if (savedType) {
            setThemeSwitchType(savedType);
        }
    }, []);

    useEffect(() => {
        const handleStorageChange = () => {
            const savedType = localStorage.getItem('theme-switch-type') as ThemeSwitchType;
            if (savedType && savedType !== themeSwitchType) {
                setThemeSwitchType(savedType);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [themeSwitchType]);

    if (!mounted) return null;

    return <ThemeSwitchSelector type={themeSwitchType} />;
} 