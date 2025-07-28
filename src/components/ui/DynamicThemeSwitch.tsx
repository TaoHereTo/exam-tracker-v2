"use client";
import { useEffect, useState } from "react";
import { ThemeSwitchSelector, ThemeSwitchType } from "./ThemeSwitchSelector";
import { useLocalStorageString } from "@/hooks/useLocalStorage";

export function DynamicThemeSwitch() {
    const [themeSwitchType] = useLocalStorageString('theme-switch-type', 'beautiful');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return <ThemeSwitchSelector type={themeSwitchType as ThemeSwitchType} />;
} 