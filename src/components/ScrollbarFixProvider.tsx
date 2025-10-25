"use client";

import React, { useEffect } from 'react';
import { initScrollbarFix } from '@/lib/scrollbarFix';

export function ScrollbarFixProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        initScrollbarFix();
    }, []);

    return <>{children}</>;
}
