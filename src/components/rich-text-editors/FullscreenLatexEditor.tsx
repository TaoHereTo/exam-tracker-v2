'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { LatexRichTextEditor } from './LatexRichTextEditor';

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

            // 如果在Dialog中，临时禁用Dialog的所有相关元素来防止事件拦截
            if (props.isInDialog) {
                console.log('Fullscreen in dialog - disabling dialog elements');

                // 查找并禁用所有可能拦截事件的Dialog元素
                const elementsToDisable: HTMLElement[] = [];

                // 1. 查找Dialog overlay (背景)
                const dialogOverlays = Array.from(document.querySelectorAll('div[data-state]')).filter(el => {
                    const element = el as HTMLElement;
                    const classes = element.className;
                    return classes.includes('fixed') && classes.includes('inset-0') && classes.includes('z-50');
                }) as HTMLElement[];

                // 2. 查找Dialog content (内容区域)
                const dialogContents = Array.from(document.querySelectorAll('div[role="dialog"]')).filter(el => {
                    const element = el as HTMLElement;
                    const classes = element.className;
                    return classes.includes('fixed') && classes.includes('z-50');
                }) as HTMLElement[];

                elementsToDisable.push(...dialogOverlays, ...dialogContents);

                console.log('Found dialog elements to disable:', elementsToDisable);

                // 保存原始状态并禁用元素
                const originalStates = elementsToDisable.map(element => ({
                    element,
                    pointerEvents: element.style.pointerEvents,
                    zIndex: element.style.zIndex,
                    display: element.style.display,
                    visibility: element.style.visibility
                }));

                // 完全禁用所有Dialog相关元素
                elementsToDisable.forEach(element => {
                    console.log('Disabling dialog element:', element);
                    element.style.setProperty('pointer-events', 'none', 'important');
                    element.style.setProperty('z-index', '-999999', 'important');
                    element.style.setProperty('visibility', 'hidden', 'important');
                    element.style.setProperty('display', 'none', 'important');
                    element.setAttribute('data-fullscreen-disabled', 'true');
                });

                // 不再禁用body的事件处理，这会影响工具栏按钮
                const originalBodyStyle = {
                    pointerEvents: document.body.style.pointerEvents,
                    userSelect: document.body.style.userSelect
                };
                // 注释掉body事件禁用，让工具栏正常工作
                // document.body.style.setProperty('pointer-events', 'none', 'important');
                // document.body.style.setProperty('user-select', 'none', 'important');

                // 保存observer引用
                let observer: MutationObserver | null = null;

                // 确保tooltip和popover能正确显示在全屏窗口上面
                setTimeout(() => {
                    const fullscreenContainer = document.querySelector('[data-fullscreen-container="true"]') as HTMLElement;
                    if (fullscreenContainer) {
                        fullscreenContainer.style.setProperty('pointer-events', 'auto', 'important');
                        fullscreenContainer.style.setProperty('user-select', 'auto', 'important');

                        // 确保全屏容器内的所有元素都能响应事件
                        const allChildElements = fullscreenContainer.querySelectorAll('*') as NodeListOf<HTMLElement>;
                        allChildElements.forEach(child => {
                            child.style.setProperty('pointer-events', 'auto', 'important');
                        });

                        // 特别确保按钮和可交互元素能正常工作
                        const interactiveElements = fullscreenContainer.querySelectorAll('button, input, textarea, select, [contenteditable], [tabindex]') as NodeListOf<HTMLElement>;
                        interactiveElements.forEach(element => {
                            element.style.setProperty('pointer-events', 'auto', 'important');
                            element.style.setProperty('user-select', 'auto', 'important');
                        });
                    }

                    // 修复tooltip和popover的z-index问题
                    const fixTooltipZIndex = () => {
                        // 查找所有tooltip和popover相关元素
                        const tooltipSelectors = [
                            '[data-radix-tooltip-content]',
                            '[data-radix-popover-content]',
                            '[data-slot="tooltip-content"]',
                            '[role="tooltip"]',
                            '.tooltip',
                            '[data-tooltip]'
                        ];

                        tooltipSelectors.forEach(selector => {
                            const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
                            elements.forEach(element => {
                                element.style.setProperty('z-index', '2147483650', 'important');
                                // 确保父容器也有足够高的z-index
                                let parent = element.parentElement;
                                while (parent && parent !== document.body) {
                                    if (parent.style.zIndex && parseInt(parent.style.zIndex) < 2147483650) {
                                        parent.style.setProperty('z-index', '2147483650', 'important');
                                    }
                                    parent = parent.parentElement;
                                }
                            });
                        });
                    };

                    // 立即修复现有的tooltip
                    fixTooltipZIndex();

                    // 更激进的解决方案：将tooltip移动到全屏容器内
                    const moveTooltipsToFullscreen = () => {
                        const fullscreenContainer = document.querySelector('[data-fullscreen-container="true"]');
                        if (!fullscreenContainer) return;

                        const tooltipSelectors = [
                            '[data-radix-tooltip-content]',
                            '[data-radix-popover-content]',
                            '[data-slot="tooltip-content"]',
                            '[role="tooltip"]'
                        ];

                        tooltipSelectors.forEach(selector => {
                            const tooltips = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
                            tooltips.forEach(tooltip => {
                                // 检查tooltip是否已经在全屏容器内
                                if (!fullscreenContainer.contains(tooltip) && tooltip.parentElement) {
                                    // 保存原始父元素
                                    tooltip.setAttribute('data-original-parent', 'true');
                                    // 移动到全屏容器
                                    fullscreenContainer.appendChild(tooltip);
                                    console.log('Moved tooltip to fullscreen container:', tooltip);
                                }
                            });
                        });
                    };

                    // 延迟执行，确保全屏容器已经创建
                    setTimeout(moveTooltipsToFullscreen, 100);

                    // 监听新创建的tooltip和popover
                    observer = new MutationObserver((mutations) => {
                        let needsFix = false;
                        mutations.forEach((mutation) => {
                            mutation.addedNodes.forEach((node) => {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    const element = node as HTMLElement;
                                    const hasTooltip = element.matches('[data-radix-tooltip-content], [data-radix-popover-content], [role="tooltip"], [data-slot="tooltip-content"]') ||
                                        element.querySelector('[data-radix-tooltip-content], [data-radix-popover-content], [role="tooltip"], [data-slot="tooltip-content"]');
                                    if (hasTooltip) {
                                        needsFix = true;
                                    }
                                }
                            });
                        });

                        if (needsFix) {
                            // 延迟执行，确保DOM完全更新
                            setTimeout(() => {
                                fixTooltipZIndex();
                                moveTooltipsToFullscreen();
                            }, 10);
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['data-state', 'data-side']
                    });
                }, 0);

                return () => {
                    document.removeEventListener('keydown', handleKeyDown, { capture: true });

                    // 停止MutationObserver
                    if (observer) {
                        observer.disconnect();
                    }

                    // 恢复Radix的默认Portal容器和appendChild方法
                    delete (window as unknown as Record<string, unknown>).__RADIX_PORTAL_CONTAINER__;

                    // 恢复原始的appendChild方法
                    if ((window as unknown as Record<string, unknown>).__ORIGINAL_APPEND_CHILD__) {
                        document.body.appendChild = (window as unknown as Record<string, unknown>).__ORIGINAL_APPEND_CHILD__ as typeof document.body.appendChild;
                        delete (window as unknown as Record<string, unknown>).__ORIGINAL_APPEND_CHILD__;
                    }

                    console.log('Restored default Portal container and appendChild method');

                    // 恢复所有Dialog元素的原始状态
                    console.log('Restoring dialog elements');
                    originalStates.forEach(({ element, pointerEvents, zIndex, display, visibility }) => {
                        element.style.removeProperty('pointer-events');
                        element.style.removeProperty('z-index');
                        element.style.removeProperty('visibility');
                        element.style.removeProperty('display');
                        element.removeAttribute('data-fullscreen-disabled');

                        if (pointerEvents) {
                            element.style.pointerEvents = pointerEvents;
                        }
                        if (zIndex) {
                            element.style.zIndex = zIndex;
                        }
                        if (display) {
                            element.style.display = display;
                        }
                        if (visibility) {
                            element.style.visibility = visibility;
                        }
                    });

                    // 恢复body的原始样式（虽然现在没有修改body）
                    document.body.style.removeProperty('pointer-events');
                    document.body.style.removeProperty('user-select');
                    if (originalBodyStyle.pointerEvents) {
                        document.body.style.pointerEvents = originalBodyStyle.pointerEvents;
                    }
                    if (originalBodyStyle.userSelect) {
                        document.body.style.userSelect = originalBodyStyle.userSelect;
                    }

                    // 清理tooltip的z-index修改和位置移动
                    const tooltipSelectors = [
                        '[data-radix-tooltip-content]',
                        '[data-radix-popover-content]',
                        '[data-slot="tooltip-content"]',
                        '[role="tooltip"]'
                    ];

                    tooltipSelectors.forEach(selector => {
                        const tooltips = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
                        tooltips.forEach(tooltip => {
                            // 恢复z-index
                            tooltip.style.removeProperty('z-index');

                            // 如果tooltip被移动到全屏容器，恢复到原始位置
                            if (tooltip.hasAttribute('data-original-parent')) {
                                tooltip.removeAttribute('data-original-parent');
                                // 将tooltip移回body（通常是Radix的默认位置）
                                if (tooltip.parentElement && tooltip.parentElement.getAttribute('data-fullscreen-container') === 'true') {
                                    document.body.appendChild(tooltip);
                                    console.log('Restored tooltip to original position:', tooltip);
                                }
                            }
                        });
                    });
                };
            }

            return () => {
                document.removeEventListener('keydown', handleKeyDown, { capture: true });

                // 恢复Radix的默认Portal容器和appendChild方法（非Dialog情况）
                delete (window as unknown as Record<string, unknown>).__RADIX_PORTAL_CONTAINER__;

                if ((window as unknown as Record<string, unknown>).__ORIGINAL_APPEND_CHILD__) {
                    document.body.appendChild = (window as unknown as Record<string, unknown>).__ORIGINAL_APPEND_CHILD__ as typeof document.body.appendChild;
                    delete (window as unknown as Record<string, unknown>).__ORIGINAL_APPEND_CHILD__;
                }
            };
        }
    }, [isFullscreen, closeFullscreen, props.isInDialog]);

    // 正常编辑器
    const normalEditor = (
        <LatexRichTextEditor
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
                        className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
                        style={{
                            zIndex: props.isInDialog ? 2147483640 : 9999,
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            visibility: 'visible'
                        }}
                        ref={(el) => {
                            if (el) {
                                el.style.setProperty('display', 'flex', 'important');
                                el.style.setProperty('visibility', 'visible', 'important');
                                el.style.setProperty('opacity', '1', 'important');

                                // 关键修复：创建tooltip容器并重定向Radix Portal
                                if (!el.querySelector('[data-tooltip-portal-container]')) {
                                    const tooltipContainer = document.createElement('div');
                                    tooltipContainer.setAttribute('data-tooltip-portal-container', 'true');
                                    tooltipContainer.style.position = 'absolute';
                                    tooltipContainer.style.top = '0';
                                    tooltipContainer.style.left = '0';
                                    tooltipContainer.style.width = '100%';
                                    tooltipContainer.style.height = '100%';
                                    tooltipContainer.style.pointerEvents = 'none';
                                    tooltipContainer.style.zIndex = '9999';
                                    el.appendChild(tooltipContainer);

                                    // 多种方式覆盖Portal容器
                                    (window as unknown as Record<string, unknown>).__RADIX_PORTAL_CONTAINER__ = tooltipContainer;

                                    // 备用方法：拦截Portal的appendChild
                                    const originalAppendChild = document.body.appendChild;
                                    document.body.appendChild = function <T extends Node>(child: T): T {
                                        // 如果是tooltip相关的元素，重定向到我们的容器
                                        if (child instanceof HTMLElement && (
                                            child.hasAttribute('data-radix-tooltip-content') ||
                                            child.hasAttribute('data-radix-popover-content') ||
                                            child.getAttribute('role') === 'tooltip' ||
                                            child.querySelector('[data-radix-tooltip-content], [data-radix-popover-content], [role="tooltip"]')
                                        )) {
                                            console.log('Redirecting tooltip to fullscreen container:', child);
                                            return tooltipContainer.appendChild(child) as T;
                                        }
                                        return originalAppendChild.call(this, child) as T;
                                    };

                                    // 保存原始方法以便恢复
                                    (window as unknown as Record<string, unknown>).__ORIGINAL_APPEND_CHILD__ = originalAppendChild;

                                    console.log('Created tooltip portal container with redirect in fullscreen');
                                }
                            }
                        }}
                        data-fullscreen-container="true"
                        onClickCapture={(e) => {
                            if (e.target === e.currentTarget) {
                                console.log('Background clicked (capture), closing fullscreen');
                                e.preventDefault();
                                e.stopPropagation();
                                closeFullscreen();
                            } else {
                                console.log('Non-background clicked (capture), preventing close');
                                e.stopPropagation();
                            }
                        }}
                        onMouseDownCapture={(e) => {
                            if (e.target !== e.currentTarget) {
                                e.stopPropagation();
                            }
                        }}
                    >
                        <div
                            className="w-full max-w-6xl bg-background rounded-lg shadow-2xl overflow-hidden flex flex-col"
                            style={{
                                height: '90vh',
                                maxHeight: '90vh'
                            }}
                            data-fullscreen-editor="true"
                            onClick={(e) => {
                                // 只阻止事件冒泡到背景，不阻止内部事件处理
                                e.stopPropagation();
                                console.log('Content area clicked, prevented bubbling to background');
                            }}
                        >
                            <LatexRichTextEditor
                                key="fullscreen-editor"
                                content={props.content}
                                onChange={props.onChange}
                                placeholder={props.placeholder || '开始输入...'}
                                className="flex-1"
                                editorMinHeight="calc(90vh - 120px)"
                                editorMaxHeight="calc(90vh - 120px)"
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
