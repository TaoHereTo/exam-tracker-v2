import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export function useThemeMode() {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 确保组件已挂载后再返回主题状态
    const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');

    // 获取背景样式
    const getBackgroundStyle = () => {
        if (!mounted) {
            // 服务端渲染时返回默认样式
            return {
                background: 'linear-gradient(to bottom right, rgb(249, 250, 251), rgb(248, 250, 252), rgb(243, 244, 246))'
            };
        }

        return {
            background: isDarkMode
                ? 'rgb(27, 28, 29)'
                : 'linear-gradient(to bottom right, rgb(249, 250, 251), rgb(248, 250, 252), rgb(243, 244, 246))'
        };
    };

    return {
        isDarkMode,
        mounted,
        theme,
        resolvedTheme,
        getBackgroundStyle
    };
}
