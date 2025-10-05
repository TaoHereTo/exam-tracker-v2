'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import SimpleRichTextEditor from './SimpleRichTextEditor';

// 全局状态管理，防止组件重新渲染导致状态丢失
const globalFullscreenState = {
    isOpen: false,
    componentId: null as string | null,
    listeners: new Set<(isOpen: boolean) => void>()
};

const useGlobalFullscreen = (componentId: string) => {
    const [isFullscreen, setIsFullscreen] = useState(
        globalFullscreenState.isOpen && globalFullscreenState.componentId === componentId
    );

    useEffect(() => {
        const listener = (isOpen: boolean) => {
            setIsFullscreen(isOpen && globalFullscreenState.componentId === componentId);
        };

        globalFullscreenState.listeners.add(listener);
        return () => {
            globalFullscreenState.listeners.delete(listener);
        };
    }, [componentId]);

    const openFullscreen = useCallback(() => {
        globalFullscreenState.isOpen = true;
        globalFullscreenState.componentId = componentId;
        globalFullscreenState.listeners.forEach(listener => listener(true));
    }, [componentId]);

    const closeFullscreen = useCallback(() => {
        globalFullscreenState.isOpen = false;
        globalFullscreenState.componentId = null;
        globalFullscreenState.listeners.forEach(listener => listener(false));
    }, []);

    return { isFullscreen, openFullscreen, closeFullscreen };
};


interface FullscreenLatexEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    editorMinHeight?: string;
    editorMaxHeight?: string;
    stickyToolbar?: boolean;
    isInDialog?: boolean; // 新增：标识是否在Dialog中
}

export const FullscreenLatexEditor: React.FC<FullscreenLatexEditorProps> = (props) => {
    // 生成稳定的组件ID，避免使用随机数导致的状态丢失
    const componentId = useMemo(() => {
        // 使用组件在DOM中的位置或其他稳定标识符
        const timestamp = Date.now();
        return `fullscreen-editor-${timestamp}`;
    }, []); // 空依赖数组确保ID在组件生命周期内保持不变
    const { isFullscreen, openFullscreen, closeFullscreen } = useGlobalFullscreen(componentId);


    const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
        console.log('Toggling fullscreen:', { isFullscreen, componentId, isInDialog: props.isInDialog });

        // 如果是点击事件，确保事件不会被阻止
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (isFullscreen) {
            console.log('Closing fullscreen...');
            closeFullscreen();
        } else {
            console.log('Opening fullscreen...');
            openFullscreen();
            // 在Dialog中时，添加额外的调试信息
            if (props.isInDialog) {
                setTimeout(() => {
                    const fullscreenContainer = document.querySelector('[data-fullscreen-container="true"]');
                    console.log('Fullscreen container after mount:', fullscreenContainer);
                    if (fullscreenContainer) {
                        console.log('Container computed styles:', getComputedStyle(fullscreenContainer));
                    }
                }, 100);
            }
        }
    }, [isFullscreen, openFullscreen, closeFullscreen, componentId, props.isInDialog]);

    // 添加键盘事件监听，ESC键关闭全屏
    useEffect(() => {
        if (isFullscreen) {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    closeFullscreen();
                }
            };

            // 在全屏模式下，如果在Dialog中，防止Dialog的ESC处理
            document.addEventListener('keydown', handleKeyDown, { capture: true });

            // 简化Dialog处理逻辑，只处理必要的z-index问题
            if (props.isInDialog) {
                console.log('Fullscreen in dialog - applying simplified fixes');

                // 延迟执行，确保全屏容器已经创建
                setTimeout(() => {
                    const fullscreenContainer = document.querySelector('[data-fullscreen-container="true"]') as HTMLElement;
                    if (fullscreenContainer) {
                        // 确保全屏容器和其子元素都能正常响应事件
                        fullscreenContainer.style.setProperty('pointer-events', 'auto', 'important');
                        fullscreenContainer.style.setProperty('user-select', 'auto', 'important');
                        fullscreenContainer.style.setProperty('z-index', '99999', 'important');

                        // 确保所有子元素都能响应事件
                        const allChildElements = fullscreenContainer.querySelectorAll('*') as NodeListOf<HTMLElement>;
                        allChildElements.forEach(child => {
                            child.style.setProperty('pointer-events', 'auto', 'important');
                        });

                        // 特别确保交互元素能正常工作
                        const interactiveElements = fullscreenContainer.querySelectorAll('button, input, textarea, select, [contenteditable], [tabindex], [role="button"]') as NodeListOf<HTMLElement>;
                        interactiveElements.forEach(element => {
                            element.style.setProperty('pointer-events', 'auto', 'important');
                            element.style.setProperty('user-select', 'auto', 'important');
                            element.style.setProperty('z-index', 'auto', 'important');
                        });

                        // 确保编辑器获得焦点 - 使用重试机制，但避免重复聚焦
                        const focusEditor = () => {
                            const editorElement = fullscreenContainer.querySelector('[contenteditable]') as HTMLElement;
                            if (editorElement) {
                                // 检查是否已经有焦点，避免重复聚焦
                                if (document.activeElement === editorElement) {
                                    return true;
                                }

                                editorElement.focus();
                                // 确保光标在编辑器末尾
                                const range = document.createRange();
                                const sel = window.getSelection();
                                range.selectNodeContents(editorElement);
                                range.collapse(false);
                                sel?.removeAllRanges();
                                sel?.addRange(range);
                                return true;
                            }
                            return false;
                        };

                        // 延迟聚焦，避免与组件初始化冲突
                        setTimeout(() => {
                            if (!focusEditor()) {
                                // 如果失败，再次重试
                                setTimeout(focusEditor, 100);
                            }
                        }, 200);
                    }
                }, 100);
            }

            return () => {
                document.removeEventListener('keydown', handleKeyDown, { capture: true });
            };
        }
    }, [isFullscreen, closeFullscreen, props.isInDialog]);

    // 正常编辑器
    const normalEditor = (
        <SimpleRichTextEditor
            {...props}
            showFullscreenButton={true}
            onFullscreenToggle={toggleFullscreen}
        />
    );

    if (isFullscreen) {

        return (
            <>
                {/* 隐藏的正常编辑器，保持状态同步 */}
                <div style={{ display: 'none' }}>
                    {normalEditor}
                </div>
                {/* 全屏编辑器，使用 createPortal 保持 React 上下文 */}
                {createPortal(
                    <div
                        className="fixed inset-0 bg-black/80 flex items-center justify-center"
                        style={{
                            zIndex: 100000,
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            visibility: 'visible',
                            padding: 0,
                            pointerEvents: 'auto'
                        }}
                        ref={(el) => {
                            if (el) {
                                el.style.setProperty('display', 'flex', 'important');
                                el.style.setProperty('visibility', 'visible', 'important');
                                el.style.setProperty('opacity', '1', 'important');
                                el.style.setProperty('z-index', '100000', 'important');
                                el.style.setProperty('position', 'fixed', 'important');
                                el.style.setProperty('top', '0', 'important');
                                el.style.setProperty('left', '0', 'important');
                                el.style.setProperty('right', '0', 'important');
                                el.style.setProperty('bottom', '0', 'important');
                                el.style.setProperty('pointer-events', 'auto', 'important');

                                // 确保编辑器获得焦点 - 使用多个时机尝试，但避免重复聚焦
                                const focusEditor = () => {
                                    const editorElement = el.querySelector('[contenteditable]') as HTMLElement;
                                    if (editorElement) {
                                        // 检查是否已经有焦点，避免重复聚焦
                                        if (document.activeElement === editorElement) {
                                            return true;
                                        }

                                        editorElement.focus();
                                        // 确保光标在编辑器末尾
                                        const range = document.createRange();
                                        const sel = window.getSelection();
                                        range.selectNodeContents(editorElement);
                                        range.collapse(false);
                                        sel?.removeAllRanges();
                                        sel?.addRange(range);
                                        return true;
                                    }
                                    return false;
                                };

                                // 延迟聚焦，避免与组件初始化冲突
                                setTimeout(() => {
                                    if (!focusEditor()) {
                                        // 如果失败，使用MutationObserver监听DOM变化
                                        const observer = new MutationObserver(() => {
                                            if (focusEditor()) {
                                                observer.disconnect();
                                            }
                                        });

                                        observer.observe(el, {
                                            childList: true,
                                            subtree: true
                                        });

                                        // 设置超时，避免无限等待
                                        setTimeout(() => {
                                            observer.disconnect();
                                        }, 1000);
                                    }
                                }, 200);
                            }
                        }}
                        data-fullscreen-container="true"
                        onClick={(e) => {
                            // 只有点击背景时才关闭全屏
                            if (e.target === e.currentTarget) {
                                console.log('Background clicked, closing fullscreen');
                                closeFullscreen();
                            }
                        }}
                        onMouseDown={(e) => {
                            // 只有点击背景时才阻止默认行为
                            if (e.target === e.currentTarget) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <div
                            className="w-full h-full bg-background overflow-hidden flex flex-col"
                            style={{
                                height: '100vh',
                                maxHeight: '100vh',
                                borderRadius: 0,
                                pointerEvents: 'auto'
                            }}
                            data-fullscreen-editor="true"
                            onClick={(e) => {
                                // 不阻止任何点击事件，让二级菜单正常工作
                            }}
                            onMouseDown={(e) => {
                                // 不阻止任何mousedown事件，让二级菜单正常工作
                            }}
                        >
                            <SimpleRichTextEditor
                                key="fullscreen-editor"
                                content={props.content}
                                onChange={props.onChange}
                                placeholder={props.placeholder || '开始输入...'}
                                className="flex-1"
                                customMinHeight="calc(100vh - 80px)"
                                customMaxHeight="calc(100vh - 80px)"
                                stickyToolbar={props.stickyToolbar}
                                showFullscreenButton={true}
                                onFullscreenToggle={toggleFullscreen}
                            />
                        </div>
                    </div>,
                    document.body
                )}
            </>
        );
    }

    return normalEditor;
};

export default FullscreenLatexEditor;
