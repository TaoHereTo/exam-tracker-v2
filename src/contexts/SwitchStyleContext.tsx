'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type OtherSwitchType = 'default' | 'sparkle' | '3d' | 'glass' | 'plane';

interface SwitchStyleContextType {
    otherSwitchType: OtherSwitchType;
    setOtherSwitchType: (type: OtherSwitchType) => void;
}

const SwitchStyleContext = createContext<SwitchStyleContextType | undefined>(undefined);

export function SwitchStyleProvider({ children }: { children: React.ReactNode }) {
    const [otherSwitchType, setOtherSwitchType] = useState<OtherSwitchType>('default');

    useEffect(() => {
        // 从localStorage读取保存的开关样式
        const savedType = localStorage.getItem('other-switch-type') as OtherSwitchType;
        if (savedType) {
            setOtherSwitchType(savedType);
        }
    }, []);

    useEffect(() => {
        // 保存开关样式到localStorage
        localStorage.setItem('other-switch-type', otherSwitchType);
    }, [otherSwitchType]);

    return (
        <SwitchStyleContext.Provider value={{ otherSwitchType, setOtherSwitchType }}>
            {children}
        </SwitchStyleContext.Provider>
    );
}

export function useSwitchStyle() {
    const context = useContext(SwitchStyleContext);
    if (context === undefined) {
        throw new Error('useSwitchStyle must be used within a SwitchStyleProvider');
    }
    return context;
} 