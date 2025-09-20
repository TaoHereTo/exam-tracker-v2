import { useState, useCallback } from 'react';

/**
 * 统一的 Loading 状态管理 Hook
 * 提供 loading 状态和异步操作的包装器
 */
export const useLoading = (initialState: boolean = false) => {
    const [loading, setLoading] = useState(initialState);

    /**
     * 执行异步操作并自动管理 loading 状态
     * @param asyncFn 异步函数
     * @returns Promise<void>
     */
    const withLoading = useCallback(async (asyncFn: () => Promise<void>) => {
        setLoading(true);
        try {
            await asyncFn();
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * 手动设置 loading 状态
     * @param value loading 状态值
     */
    const setLoadingState = useCallback((value: boolean) => {
        setLoading(value);
    }, []);

    return {
        loading,
        setLoading: setLoadingState,
        withLoading,
    };
};

