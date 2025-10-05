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
    // 新增：预览相关属性
    previewContent?: string;
    isPreviewMode?: boolean;
    onPreviewModeChange?: (isPreviewMode: boolean) => void;
}

export const FullscreenLatexEditor: React.FC<FullscreenLatexEditorProps> = (props) => {
    // 解构props以避免useCallback依赖问题
    const { onChange, previewContent: externalPreviewContent, onPreviewModeChange } = props;

    // 生成稳定的组件ID，避免使用随机数导致的状态丢失
    const componentId = useMemo(() => {
        // 使用组件在DOM中的位置或其他稳定标识符
        const timestamp = Date.now();
        return `fullscreen-editor-${timestamp}`;
    }, []); // 空依赖数组确保ID在组件生命周期内保持不变
    const { isFullscreen, openFullscreen, closeFullscreen } = useGlobalFullscreen(componentId);
    const [isAnimating, setIsAnimating] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const [editorPosition, setEditorPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

    // 预览状态管理
    const [internalPreviewContent, setInternalPreviewContent] = useState(props.content);
    const [internalIsPreviewMode, setInternalIsPreviewMode] = useState(false);

    // 使用外部传入的状态或内部状态
    const previewContent = externalPreviewContent !== undefined ? externalPreviewContent : internalPreviewContent;
    const isPreviewMode = props.isPreviewMode !== undefined ? props.isPreviewMode : internalIsPreviewMode;

    // 预览模式变化处理
    const handlePreviewModeChange = useCallback((newIsPreviewMode: boolean) => {
        if (onPreviewModeChange) {
            onPreviewModeChange(newIsPreviewMode);
        } else {
            setInternalIsPreviewMode(newIsPreviewMode);
        }
    }, [onPreviewModeChange]);

    // 预览内容变化处理
    const handleContentChange = useCallback((newContent: string) => {
        onChange(newContent);
        if (externalPreviewContent === undefined) {
            setInternalPreviewContent(newContent);
        }
    }, [onChange, externalPreviewContent]);


    const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
        console.log('Toggling fullscreen:', { isFullscreen, componentId, isInDialog: props.isInDialog });

        // 如果是点击事件，确保事件不会被阻止
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (isFullscreen) {
            console.log('Closing fullscreen...');
            setIsAnimating(true);
            // 延迟关闭，让退出动画完成
            setTimeout(() => {
                closeFullscreen();
                setIsAnimating(false);
            }, 300);
        } else {
            console.log('Opening fullscreen...');
            // 记录当前编辑器位置
            if (editorRef.current) {
                const rect = editorRef.current.getBoundingClientRect();
                setEditorPosition({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
            }
            setIsAnimating(false);
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
                    setIsAnimating(true);
                    // 延迟关闭，让退出动画完成
                    setTimeout(() => {
                        closeFullscreen();
                        setIsAnimating(false);
                    }, 300);
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
        <div
            ref={editorRef}
            className={`transition-all duration-300 ${isFullscreen && !isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
        >
            <SimpleRichTextEditor
                {...props}
                onChange={handleContentChange}
                showFullscreenButton={true}
                onFullscreenToggle={toggleFullscreen}
                // 传递预览相关属性
                previewContent={previewContent}
                isPreviewMode={isPreviewMode}
                onPreviewModeChange={handlePreviewModeChange}
                // 正常模式下不标识为全屏
                isInFullscreen={false}
            />
        </div>
    );

    if (isFullscreen) {

        return (
            <>
                {/* 简化的全屏编辑器 */}
                {createPortal(
                    <div
                        className={`fixed inset-0 bg-black/80 flex items-center justify-center ${isAnimating
                            ? 'animate-out fade-out-0 duration-300'
                            : 'animate-in fade-in-0 duration-300'
                            }`}
                        style={{ zIndex: 100000 }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setIsAnimating(true);
                                // 延迟关闭，让退出动画完成
                                setTimeout(() => {
                                    closeFullscreen();
                                    setIsAnimating(false);
                                }, 300);
                            }
                        }}
                    >
                        <div className="w-full h-full bg-background flex flex-col animate-in zoom-in-95 duration-300">
                            <SimpleRichTextEditor
                                key="fullscreen-editor"
                                content={props.content}
                                onChange={handleContentChange}
                                placeholder={props.placeholder || '开始输入...'}
                                className="flex-1"
                                customMinHeight="calc(100vh - 80px)"
                                customMaxHeight="calc(100vh - 80px)"
                                stickyToolbar={props.stickyToolbar}
                                showFullscreenButton={true}
                                onFullscreenToggle={toggleFullscreen}
                                // 传递预览相关属性
                                previewContent={previewContent}
                                isPreviewMode={isPreviewMode}
                                onPreviewModeChange={handlePreviewModeChange}
                                // 标识这是全屏模式
                                isInFullscreen={true}
                            />
                        </div>
                    </div>,
                    document.body
                )}
                {/* 正常编辑器 - 根据动画阶段显示 */}
                {normalEditor}
            </>
        );
    }

    return normalEditor;
};

export default FullscreenLatexEditor;
