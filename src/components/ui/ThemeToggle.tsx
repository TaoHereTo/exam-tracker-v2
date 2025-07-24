"use client";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    const isDark = resolvedTheme === "dark";
    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label="切换深浅色模式"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="fixed top-4 right-4 z-50 bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 shadow hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
            {isDark ? <Sun className="size-6 text-yellow-400" /> : <Moon className="size-6 text-gray-700" />}
        </Button>
    );
} 