import { useState, useEffect, useRef } from "react";

// 防抖函数
function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: unknown[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    }) as T;
}

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

    const debouncedSetStorage = useRef(
        debounce((...args: unknown[]) => {
            const [storageKey, value] = args as [string, T];
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(storageKey, JSON.stringify(value));
                } catch (error) {
                    console.warn('Failed to save to localStorage:', error);
                }
            }
        }, 300) // 300ms 防抖
    ).current;

    useEffect(() => {
        debouncedSetStorage(key, state);
    }, [key, state, debouncedSetStorage]);

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

    const debouncedSetStorage = useRef(
        debounce((...args: unknown[]) => {
            const [storageKey, value] = args as [string, boolean];
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(storageKey, value.toString());
                } catch (error) {
                    console.warn('Failed to save to localStorage:', error);
                }
            }
        }, 300) // 300ms 防抖
    ).current;

    useEffect(() => {
        debouncedSetStorage(key, state);
    }, [key, state, debouncedSetStorage]);

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

    const debouncedSetStorage = useRef(
        debounce((...args: unknown[]) => {
            const [storageKey, value] = args as [string, string];
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(storageKey, value);
                } catch (error) {
                    console.warn('Failed to save to localStorage:', error);
                }
            }
        }, 300) // 300ms 防抖
    ).current;

    useEffect(() => {
        debouncedSetStorage(key, state);
    }, [key, state, debouncedSetStorage]);

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