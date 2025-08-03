import React, { useEffect } from 'react';

interface GlobalFontProviderProps {
    children: React.ReactNode;
}

export function GlobalFontProvider({ children }: GlobalFontProviderProps) {
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            /* 全局字体样式 - 使用混合字体系统 */
            .font-chinese { font-family: '思源宋体', serif !important; }
            .font-english { font-family: 'Times New Roman', serif !important; }
            .font-mixed { font-family: '思源宋体', 'Times New Roman', serif !important; }
            
            /* 对话框和弹出框的字体样式 */
            [data-slot="alert-dialog-content"], [data-slot="dialog-content"], [data-slot="popover-content"] {
                font-family: '思源宋体', 'Times New Roman', serif !important;
            }
            
            /* 表单标签和描述的字体样式 */
            label, .form-label, .form-description { 
                font-family: '思源宋体', 'Times New Roman', serif !important; 
            }
            
            /* 按钮文本的字体样式 */
            button { 
                font-family: '思源宋体', 'Times New Roman', serif !important; 
            }
            
            /* 输入框占位符的字体样式 - 增强版 */
            input::placeholder, textarea::placeholder, 
            input[placeholder], textarea[placeholder] { 
                font-family: '思源宋体', 'Times New Roman', serif !important; 
            }
            
            /* Select 组件的占位符和选项 */
            [data-slot="select-trigger"] [data-slot="select-value"],
            [data-slot="select-trigger"] span,
            [data-slot="select-content"] [data-slot="select-item"],
            [data-slot="select-content"] div {
                font-family: '思源宋体', 'Times New Roman', serif !important;
            }
            
            /* Radix UI Select 组件 */
            [data-radix-select-trigger],
            [data-radix-select-value],
            [data-radix-select-item] {
                font-family: '思源宋体', 'Times New Roman', serif !important;
            }
            
            /* 时间选择器相关样式 */
            .time-picker-container *,
            .time-picker-popover *,
            [data-radix-popper-content-wrapper] * {
                font-family: '思源宋体', 'Times New Roman', serif !important;
            }
            
            /* 日历组件样式 */
            [data-slot="calendar"] *,
            [data-slot="calendar-cell"] *,
            [data-slot="calendar-grid"] * {
                font-family: '思源宋体', 'Times New Roman', serif !important;
            }
            
            /* 通知组件的字体样式 */
            .notification-message, .notification-description { 
                font-family: '思源宋体', 'Times New Roman', serif !important; 
            }
            
            /* 卡片标题和描述的字体样式 */
            .card-title, .card-description { 
                font-family: '思源宋体', 'Times New Roman', serif !important; 
            }
            
            /* 确保所有输入框的占位符都使用正确字体 */
            input[type="text"]::placeholder,
            input[type="email"]::placeholder,
            input[type="password"]::placeholder,
            input[type="number"]::placeholder,
            input[type="search"]::placeholder,
            input[type="tel"]::placeholder,
            input[type="url"]::placeholder,
            textarea::placeholder {
                font-family: '思源宋体', 'Times New Roman', serif !important;
            }
            
            /* 针对特定组件的占位符 */
            .relative input::placeholder,
            .relative textarea::placeholder {
                font-family: '思源宋体', 'Times New Roman', serif !important;
            }
            
            /* 下拉框选项和占位符 */
            select option,
            select::placeholder,
            .select-trigger,
            .select-content,
            .select-item {
                font-family: '思源宋体', 'Times New Roman', serif !important;
            }
            
            /* 时间选择器特定样式 */
            .time-input,
            .time-display,
            .time-unit {
                font-family: '思源宋体', 'Times New Roman', serif !important;
            }
            
            /* 弹出框内容 */
            [role="dialog"] *,
            [role="menu"] *,
            [role="listbox"] * {
                font-family: '思源宋体', 'Times New Roman', serif !important;
            }
            
            /* 确保所有文本元素都使用混合字体 */
            * {
                font-family: '思源宋体', 'Times New Roman', serif;
            }
            
            /* 特定元素的字体覆盖 */
            .text-sm,
            .text-base,
            .text-lg,
            .text-xl,
            .text-2xl,
            .text-3xl {
                font-family: '思源宋体', 'Times New Roman', serif !important;
            }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    return <>{children}</>;
} 