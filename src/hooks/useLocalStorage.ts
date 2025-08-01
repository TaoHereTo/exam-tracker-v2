import { useState, useEffect } from "react";

// 统一的localStorage操作hook
export function useLocalStorage<T>(key: string, defaultValue: T) {
    const [state, setState] = useState<T>(() => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                }
        }
    }, [key, state]);

    return [state, setState] as const;
}

// 布尔值localStorage hook
export function useLocalStorageBoolean(key: string, defaultValue: boolean) {
    const [state, setState] = useState<boolean>(() => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const saved = localStorage.getItem(key);
            return saved ? saved === 'true' : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(key, state.toString());
            } catch (error) {
                }
        }
    }, [key, state]);

    return [state, setState] as const;
}

// 字符串localStorage hook
export function useLocalStorageString(key: string, defaultValue: string) {
    const [state, setState] = useState<string>(() => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const saved = localStorage.getItem(key);
            return saved !== null ? saved : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(key, state);
            } catch (error) {
                }
        }
    }, [key, state]);

    return [state, setState] as const;
}

// 直接操作localStorage的工具函数
export const localStorageUtils = {
    get: <T>(key: string, defaultValue: T): T => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    },

    set: <T>(key: string, value: T): void => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            }
    },

    getBoolean: (key: string, defaultValue: boolean): boolean => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const saved = localStorage.getItem(key);
            return saved ? saved === 'true' : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    },

    setBoolean: (key: string, value: boolean): void => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(key, value.toString());
        } catch (error) {
            }
    },

    getString: (key: string, defaultValue: string): string => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const saved = localStorage.getItem(key);
            return saved !== null ? saved : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    },

    setString: (key: string, value: string): void => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            }
    },

    remove: (key: string): void => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.removeItem(key);
        } catch (error) {
            }
    }
}; 