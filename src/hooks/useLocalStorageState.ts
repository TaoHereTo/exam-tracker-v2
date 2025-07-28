import { useState, useEffect } from "react";

export function useLocalStorageState<T>(key: string, defaultValue: T) {
    const [state, setState] = useState<T>(() => {
        if (typeof window === 'undefined') return defaultValue;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    });
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(state));
        }
    }, [key, state]);
    return [state, setState] as const;
} 