"use client";

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';

interface PasteContextType {
    registerPasteHandler: (id: string, handler: (e: ClipboardEvent) => Promise<void>) => void;
    unregisterPasteHandler: (id: string) => void;
    setActiveHandler: (id: string | null) => void;
}

const PasteContext = createContext<PasteContextType | null>(null);

export const usePasteContext = () => {
    const context = useContext(PasteContext);
    if (!context) {
        throw new Error('usePasteContext must be used within a PasteProvider');
    }
    return context;
};

interface PasteProviderProps {
    children: React.ReactNode;
}

export const PasteProvider: React.FC<PasteProviderProps> = ({ children }) => {
    const pasteHandlers = useRef<Map<string, (e: ClipboardEvent) => Promise<void>>>(new Map());
    const activeHandlerId = useRef<string | null>(null);
    const globalListenerAdded = useRef(false);

    const handleGlobalPaste = useCallback(async (e: ClipboardEvent) => {
        // 检查是否有激活的处理器
        if (activeHandlerId.current && pasteHandlers.current.has(activeHandlerId.current)) {
            await pasteHandlers.current.get(activeHandlerId.current)!(e);
        } else {
            // 如果没有激活的处理器，尝试找到当前可见的组件
            const visibleComponents = document.querySelectorAll('[data-paste-handler="true"]');

            // 找到第一个可见的组件
            for (const element of visibleComponents) {
                const rect = element.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 &&
                    rect.top >= 0 && rect.left >= 0 &&
                    rect.bottom <= window.innerHeight &&
                    rect.right <= window.innerWidth;

                if (isVisible) {
                    const componentId = element.getAttribute('data-component-id');
                    if (componentId && pasteHandlers.current.has(componentId)) {
                        await pasteHandlers.current.get(componentId)!(e);
                        return;
                    }
                }
            }
        }
    }, []);

    const registerPasteHandler = useCallback((id: string, handler: (e: ClipboardEvent) => Promise<void>) => {
        pasteHandlers.current.set(id, handler);

        // 如果是第一个处理器，添加全局事件监听器
        if (!globalListenerAdded.current) {
            globalListenerAdded.current = true;
            document.addEventListener('paste', handleGlobalPaste);
        }
    }, [handleGlobalPaste]);

    const unregisterPasteHandler = useCallback((id: string) => {
        pasteHandlers.current.delete(id);

        // 如果没有处理器了，移除全局事件监听器
        if (pasteHandlers.current.size === 0 && globalListenerAdded.current) {
            globalListenerAdded.current = false;
            document.removeEventListener('paste', handleGlobalPaste);
        }
    }, [handleGlobalPaste]);

    const setActiveHandler = useCallback((id: string | null) => {
        activeHandlerId.current = id;
    }, []);

    useEffect(() => {
        return () => {
            // 清理全局事件监听器
            if (globalListenerAdded.current) {
                document.removeEventListener('paste', handleGlobalPaste);
            }
        };
    }, [handleGlobalPaste]);

    return (
        <PasteContext.Provider value={{
            registerPasteHandler,
            unregisterPasteHandler,
            setActiveHandler
        }}>
            {children}
        </PasteContext.Provider>
    );
};