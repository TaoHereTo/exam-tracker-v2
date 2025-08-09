'use client';

import React, { createContext, useContext } from 'react';
import { useLocalStorageString } from '@/hooks/useLocalStorage';

type OtherSwitchType = 'default' | 'sparkle' | '3d' | 'glass' | 'plane';

interface SwitchStyleContextType {
    otherSwitchType: OtherSwitchType;
    setOtherSwitchType: (type: OtherSwitchType) => void;
}

const SwitchStyleContext = createContext<SwitchStyleContextType | undefined>(undefined);

export function SwitchStyleProvider({ children }: { children: React.ReactNode }) {
    const [otherSwitchType, setOtherSwitchType] = useLocalStorageString('other-switch-type', 'default');

    return (
        <SwitchStyleContext.Provider value={{ otherSwitchType: otherSwitchType as OtherSwitchType, setOtherSwitchType }}>
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