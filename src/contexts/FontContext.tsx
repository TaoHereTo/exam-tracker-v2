"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FontConfig, defaultFontConfig } from '@/lib/fontUtils';

interface FontContextType {
    fontConfig: FontConfig;
    updateFontConfig: (config: Partial<FontConfig>) => void;
    resetFontConfig: () => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

interface FontProviderProps {
    children: ReactNode;
    initialConfig?: Partial<FontConfig>;
}

export function FontProvider({ children, initialConfig = {} }: FontProviderProps) {
    const [fontConfig, setFontConfig] = useState<FontConfig>({
        ...defaultFontConfig,
        ...initialConfig
    });

    const updateFontConfig = (config: Partial<FontConfig>) => {
        setFontConfig(prev => ({ ...prev, ...config }));
    };

    const resetFontConfig = () => {
        setFontConfig(defaultFontConfig);
    };

    return (
        <FontContext.Provider value={{ fontConfig, updateFontConfig, resetFontConfig }}>
            {children}
        </FontContext.Provider>
    );
}

export function useFont() {
    const context = useContext(FontContext);
    if (context === undefined) {
        throw new Error('useFont must be used within a FontProvider');
    }
    return context;
}