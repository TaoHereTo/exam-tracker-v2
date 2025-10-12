'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import { cn } from '@/lib/utils';
import EditorCatalog from './EditorCatalog';

interface WangEditorWrapperProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    customMinHeight?: string;
    customMaxHeight?: string;
    showCatalog?: boolean; // 是否显示目录
}

export const WangEditorWrapper: React.FC<WangEditorWrapperProps> = ({
    content,
    onChange,
    placeholder = '开始输入...',
    className,
    customMinHeight = '300px',
    customMaxHeight = '800px',
    showCatalog = false
}) => {
    const [editor, setEditor] = useState<IDomEditor | null>(null);
    const [html, setHtml] = useState(content);
    const [catalogVisible, setCatalogVisible] = useState<boolean>(true); // 目录是否可见

    // 工具栏配置 - 使用官方的菜单分组功能
    const toolbarConfig: Partial<IToolbarConfig> = useMemo(() => ({
        toolbarKeys: [
            'headerSelect',
            // 格式按钮组 - 包含加粗、斜体、下划线、删除线、文字颜色、背景颜色和清除格式
            'bold',
            'italic',
            'underline',
            'through',
            'color',
            'bgColor',
            'clearStyle',
            '|',
            // 布局按钮组 - 包含列表、对齐和缩进功能
            {
                key: 'listGroup',
                title: '列表',
                iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M384 64h640v128H384V64z m0 384h640v128H384v-128z m0 384h640v128H384v-128zM0 128a128 128 0 1 1 256 0 128 128 0 0 1-256 0z m0 384a128 128 0 1 1 256 0 128 128 0 0 1-256 0z m0 384a128 128 0 1 1 256 0 128 128 0 0 1-256 0z"></path></svg>',
                menuKeys: ['bulletedList', 'numberedList']
            },
            // 使用官方的菜单分组功能，将对齐按钮放在一个下拉组中
            {
                key: 'alignGroup',
                title: '对齐',
                iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8zM972.8 102.4v102.4H51.2V102.4h921.6z"></path></svg>',
                menuKeys: ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyJustify']
            },
            // 缩进菜单分组
            {
                key: 'indentGroup',
                title: '缩进',
                iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M0 64h1024v128H0z m384 192h640v128H384z m0 192h640v128H384z m0 192h640v128H384zM0 832h1024v128H0z m0-128V320l256 192z"></path></svg>',
                menuKeys: ['indent', 'delIndent']
            },
            '|',
            'fontSize',
            'fontFamily',
            'lineHeight', // 行高
            '|',
            'insertLink',
            // 插入元素按钮组 - 包含图片、表格、分割线和引用
            {
                key: 'imageGroup',
                title: '图片',
                iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-384 256 320h64l224.01-192z"></path></svg>',
                menuKeys: ['uploadImage', 'insertImage']
            },
            'insertTable',
            'divider',
            'blockquote',
            '|',
            'undo',
            'redo',
            '|',
            'fullScreen',
        ],
    }), []);

    // 编辑器配置
    const editorConfig: Partial<IEditorConfig> = useMemo(() => ({
        placeholder,
        autoFocus: false,
        scroll: true,
        MENU_CONF: {
            // 上传图片配置（可以根据需要配置）
            uploadImage: {
                // 自定义上传
                async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
                    // 这里可以实现图片上传逻辑
                    // 暂时使用 base64
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64 = e.target?.result as string;
                        insertFn(base64, '', '');
                    };
                    reader.readAsDataURL(file);
                },
            },
            // 丰富的颜色配置
            color: {
                colors: [
                    '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
                    '#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#00ccff', '#0066ff',
                    '#6600ff', '#ff0066', '#ff3366', '#ff6633', '#ffcc33', '#ccff33',
                    '#33ffcc', '#3366ff', '#6633ff', '#cc33ff', '#ff3399', '#ff6666',
                    '#ff9966', '#ffcc66', '#ccff66', '#66ffcc', '#6699ff', '#9966ff',
                    '#cc66ff', '#ff6699', '#ff9999', '#ffcc99', '#ccff99', '#99ffcc',
                    '#99ccff', '#cc99ff', '#ff99cc'
                ]
            },
            bgColor: {
                colors: [
                    '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
                    '#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#00ccff', '#0066ff',
                    '#6600ff', '#ff0066', '#ff3366', '#ff6633', '#ffcc33', '#ccff33',
                    '#33ffcc', '#3366ff', '#6633ff', '#cc33ff', '#ff3399', '#ff6666',
                    '#ff9966', '#ffcc66', '#ccff66', '#66ffcc', '#6699ff', '#9966ff',
                    '#cc66ff', '#ff6699', '#ff9999', '#ffcc99', '#ccff99', '#99ffcc',
                    '#99ccff', '#cc99ff', '#ff99cc'
                ]
            }
        },
    }), [placeholder]);

    // 当 content prop 变化时更新编辑器
    useEffect(() => {
        if (editor && html !== content) {
            setHtml(content);
        }
    }, [content, editor, html]);

    // 当编辑器内容变化时
    const handleChange = useCallback((editor: IDomEditor) => {
        const newHtml = editor.getHtml();
        setHtml(newHtml);
        onChange(newHtml);
    }, [onChange]);

    // 创建编辑器实例后
    useEffect(() => {
        if (editor) {
            // 强制修复弹出菜单方向和箭头大小
            const fixDropdownDirection = () => {

                // 监听所有弹出菜单
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node: Node) => {
                            if (node.nodeType === 1) { // Element node
                                // 查找弹出菜单
                                const element = node as Element;
                                const dropdowns = element.querySelectorAll ?
                                    element.querySelectorAll('.w-e-select-list, .w-e-drop-panel, .w-e-panel-container') : [];

                                dropdowns.forEach((dropdown: Element) => {
                                    if (dropdown) {
                                        const htmlElement = dropdown as HTMLElement;
                                        htmlElement.style.top = '100%';
                                        htmlElement.style.bottom = 'auto';
                                        htmlElement.style.transform = 'none';
                                        htmlElement.style.zIndex = '9999';
                                    }
                                });

                                // 如果节点本身就是弹出菜单
                                if (element.classList && (
                                    element.classList.contains('w-e-select-list') ||
                                    element.classList.contains('w-e-drop-panel') ||
                                    element.classList.contains('w-e-panel-container')
                                )) {
                                    const htmlElement = element as HTMLElement;
                                    htmlElement.style.top = '100%';
                                    htmlElement.style.bottom = 'auto';
                                    htmlElement.style.transform = 'none';
                                    htmlElement.style.zIndex = '9999';
                                }
                            }
                        });
                    });

                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });


                return () => {
                    observer.disconnect();
                };
            };

            const cleanup = fixDropdownDirection();

            return () => {
                if (cleanup) cleanup();
                // 组件销毁时销毁编辑器
                if (editor) {
                    editor.destroy();
                }
            };
        }
    }, [editor]);


    // 计算字数
    const wordCount = useMemo(() => {
        if (!editor) return 0;
        const text = editor.getText();
        const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
        const englishWords = text.replace(/[\u4e00-\u9fff]/g, '').replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(w => w.length > 0);
        return chineseChars.length + englishWords.length;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor, html]); // html 依赖是必要的，因为编辑器内容变化时需要重新计算

    const charCount = useMemo(() => {
        if (!editor) return 0;
        return editor.getText().length;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor, html]); // html 依赖是必要的，因为编辑器内容变化时需要重新计算

    return (
        <div className={cn("wang-editor-with-catalog flex gap-4 flex-row-reverse", className)}>
            {/* 目录 - 显示在左侧，可收起 */}
            {showCatalog && (
                <EditorCatalog
                    editor={editor}
                    className={cn(
                        "sticky top-4 order-first transition-all duration-300",
                        catalogVisible ? "w-64 min-w-[256px]" : "w-10 min-w-[40px]"
                    )}
                    isVisible={catalogVisible}
                    onToggle={() => setCatalogVisible(!catalogVisible)}
                />
            )}

            <div
                className={cn(
                    "wang-editor-wrapper border border-gray-200 dark:border-gray-700 rounded-lg",
                    showCatalog ? "flex-1" : "w-full"
                )}
            >
                {/* Toolbar 和 Editor 必须直接在同一个父元素下，不能有额外包装 */}
                <div className="editor-main-container">
                    <Toolbar
                        editor={editor}
                        defaultConfig={toolbarConfig}
                        mode="default"
                        style={{
                            borderBottom: 'none',
                            backgroundColor: 'transparent'
                        }}
                    />

                    <Editor
                        defaultConfig={editorConfig}
                        value={html}
                        onCreated={setEditor}
                        onChange={handleChange}
                        mode="default"
                        style={{
                            height: customMinHeight,
                            overflowY: 'hidden'
                        }}
                    />
                </div>

                {/* 字数统计 */}
                <div className="flex items-center justify-end px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#303030]">
                    <div className="flex items-center gap-2">
                        <span>字数: {wordCount}</span>
                        <span>字符: {charCount}</span>
                    </div>
                </div>

                {/* 自定义样式 */}
                <style jsx global>{`
                    /* 基础样式 - 按照官方文档的推荐方式 */
                    .wang-editor-wrapper .w-e-text-container {
                        border: none !important;
                    }
                    
                    .wang-editor-wrapper .w-e-scroll {
                        overflow-y: auto !important;
                    }
                    
                    /* 工具栏毛玻璃效果 */
                    .wang-editor-wrapper .w-e-toolbar {
                        background-color: transparent !important;
                        backdrop-filter: blur(8px) !important;
                        background: rgba(var(--muted-rgb, 240, 240, 240), 0.3) !important;
                        border-bottom: 1px solid hsl(var(--border)) !important;
                        position: sticky !important;
                        top: 0 !important;
                        z-index: 10 !important;
                        padding: 8px 12px !important;
                    }
                    
                    .dark .wang-editor-wrapper .w-e-toolbar {
                        background: rgba(48, 48, 48, 0.3) !important;
                    }
                    
                    /* 工具栏按钮美化 - 保守版本，不影响 tooltip */
                    .wang-editor-wrapper .w-e-bar-item button {
                        border-radius: 6px !important;
                        transition: background-color 0.2s ease, border-color 0.2s ease !important;
                        border: 1px solid transparent !important;
                    }
                    
                    /* 调整工具栏按钮间距 - 根据官方文档使用正确的选择器 */
                    .wang-editor-wrapper .w-e-toolbar .w-e-bar-item {
                        margin: 0 1px !important;
                    }
                    
                    /* 进一步调整工具栏整体间距 */
                    .wang-editor-wrapper .w-e-toolbar {
                        gap: 1px !important;
                    }
                    
                    /* 针对分隔符的特殊处理 */
                    .wang-editor-wrapper .w-e-toolbar .w-e-bar-item-divider {
                        margin: 0 2px !important;
                    }
                    
                    /* 确保按钮组内间距更紧凑 */
                    .wang-editor-wrapper .w-e-toolbar .w-e-bar-item:not(.w-e-bar-item-divider) {
                        margin: 0 1px !important;
                    }
                    
                    /* 直接针对工具栏按钮的间距调整 */
                    .wang-editor-wrapper .w-e-toolbar > div {
                        margin: 0 1px !important;
                    }
                    
                    /* 更通用的工具栏间距调整 */
                    .wang-editor-wrapper .w-e-toolbar [class*="w-e-bar-item"] {
                        margin: 0 1px !important;
                    }
                    
                    /* 针对所有工具栏子元素的间距调整 */
                    .wang-editor-wrapper .w-e-toolbar > * {
                        margin: 0 1px !important;
                    }
                    
                    .wang-editor-wrapper .w-e-bar-item button:hover {
                        background-color: rgba(0, 0, 0, 0.06) !important;
                        border-color: rgba(0, 0, 0, 0.1) !important;
                    }
                    
                    .dark .wang-editor-wrapper .w-e-bar-item button:hover {
                        background-color: rgba(255, 255, 255, 0.1) !important;
                        border-color: rgba(255, 255, 255, 0.12) !important;
                    }
                    
                    /* 激活状态的按钮 */
                    .wang-editor-wrapper .w-e-bar-item button.active,
                    .wang-editor-wrapper .w-e-bar-item button[data-selected="true"] {
                        background-color: hsl(var(--primary) / 0.1) !important;
                        border-color: hsl(var(--primary) / 0.3) !important;
                        color: hsl(var(--primary)) !important;
                    }
                    
                    /* 下拉菜单美化 */
                    .wang-editor-wrapper .w-e-select-list,
                    .wang-editor-wrapper .w-e-drop-panel {
                        border-radius: 8px !important;
                        border: 1px solid hsl(var(--border)) !important;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
                    }
                    
                    /* 确保浮动工具栏不被裁剪 */
                    .wang-editor-wrapper {
                        overflow: visible !important;
                    }
                    
                    /* 调整固定工具栏下拉菜单的位置 */
                    .wang-editor-wrapper .w-e-toolbar .w-e-select-list,
                    .wang-editor-wrapper .w-e-toolbar .w-e-drop-panel {
                        top: 100% !important;
                        margin-top: 2px !important;
                    }
                    
                    
                    
                    
                    
                    .dark .wang-editor-wrapper .w-e-select-list,
                    .dark .wang-editor-wrapper .w-e-drop-panel {
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
                    }
                    
                    /* 下拉菜单项 */
                    .wang-editor-wrapper .w-e-select-list ul li,
                    .wang-editor-wrapper .w-e-drop-panel-item {
                        border-radius: 4px !important;
                        margin: 2px 4px !important;
                        transition: background-color 0.15s ease !important;
                    }
                    
                    .wang-editor-wrapper .w-e-select-list ul li:hover,
                    .wang-editor-wrapper .w-e-drop-panel-item:hover {
                        background-color: hsl(var(--accent)) !important;
                    }
                    
                    /* Modal 弹窗优化 */
                    .wang-editor-wrapper .w-e-modal {
                        border-radius: 12px !important;
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
                    }
                    
                    .wang-editor-wrapper .w-e-modal input,
                    .wang-editor-wrapper .w-e-modal textarea {
                        border-radius: 6px !important;
                        transition: border-color 0.2s ease !important;
                    }
                    
                    .wang-editor-wrapper .w-e-modal input:focus,
                    .wang-editor-wrapper .w-e-modal textarea:focus {
                        border-color: hsl(var(--primary)) !important;
                        outline: 2px solid hsl(var(--primary) / 0.2) !important;
                        outline-offset: 0px !important;
                    }
                    
                    /* 全屏模式样式 */
                    .w-e-full-screen-container {
                        z-index: 9999 !important;
                        background-color: hsl(var(--background)) !important;
                    }
                    
                    .w-e-full-screen-container .w-e-toolbar {
                        backdrop-filter: blur(8px) !important;
                    }
                    
                    /* wangEditor 暗黑模式适配 */
                    .dark .w-e-text-container {
                        background-color: #303030 !important;
                        color: #e5e5e5 !important;
                    }
                    
                    .dark .w-e-text-placeholder {
                        color: #9CA3AF !important;
                    }
                    
                    .dark .w-e-drop-panel {
                        background-color: #303030 !important;
                        border-color: #404040 !important;
                        color: #e5e5e5 !important;
                    }
                    
                    .dark .w-e-modal {
                        background-color: #303030 !important;
                        border-color: #404040 !important;
                        color: #e5e5e5 !important;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default WangEditorWrapper;

