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
        // 检查是否在UnifiedImage组件区域内
        const target = e.target as HTMLElement;
        const isInUnifiedImage = target?.closest('[data-unified-image="true"]');

        if (isInUnifiedImage) {
            // 检查是否是当前激活的模块
            const carouselContainer = target?.closest('[data-carousel-container]');
            if (carouselContainer) {
                const activeSlide = carouselContainer.querySelector('[data-carousel-item][data-active="true"]');
                const currentUnifiedImage = target?.closest('[data-unified-image="true"]');

                // 只处理当前激活模块中的UnifiedImage组件
                if (activeSlide && currentUnifiedImage && activeSlide.contains(currentUnifiedImage)) {
                    const componentId = currentUnifiedImage.getAttribute('data-component-id');
                    if (componentId && pasteHandlers.current.has(componentId)) {
                        await pasteHandlers.current.get(componentId)!(e);
                    }
                } else {
                    }
            } else {
                // 如果没有轮播容器，则直接处理
                const componentId = target?.closest('[data-unified-image="true"]')?.getAttribute('data-component-id');
                if (componentId && pasteHandlers.current.has(componentId)) {
                    await pasteHandlers.current.get(componentId)!(e);
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