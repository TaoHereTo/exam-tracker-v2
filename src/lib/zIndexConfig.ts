/**
 * 统一的 z-index 层级配置
 * 用于管理整个项目的层级关系，避免 z-index 混乱
 * 
 * 层级设计原则：
 * 1. 基础元素：1-10
 * 2. 普通组件：20-50
 * 3. 浮动组件：100-200
 * 4. 模态层：300-400
 * 5. 全屏编辑器：1000-1100
 * 6. 最高层级：9999+
 */

export const Z_INDEX = {
    // 基础层级 (1-10)
    BASE: 1,
    ELEVATED: 2,
    FOCUSED: 10,

    // 普通组件层级 (20-50)
    DROPDOWN: 20,
    STICKY: 20,
    TOOLTIP: 30,
    POPOVER: 40,
    MODAL: 50,

    // 浮动组件层级 (100-200)
    OVERLAY: 100,
    DIALOG: 150,
    DRAWER: 200,

    // 模态层 (300-400) - 用于在 Dialog 内部的组件
    DIALOG_CONTENT: 300,
    DIALOG_POPOVER: 350,
    DIALOG_DROPDOWN: 360,
    DIALOG_TOOLTIP: 370,

    // 全屏编辑器层级 (1000-1100)
    FULLSCREEN_EDITOR: 1000,
    FULLSCREEN_EDITOR_TOOLBAR: 1001,
    FULLSCREEN_EDITOR_OVERLAY: 1002,
    FULLSCREEN_EDITOR_MENU: 1003, // 全屏编辑器内的菜单

    // 最高层级 (9999+)
    MAXIMUM: 9999,
    URGENT: 10000,
} as const;

/**
 * 获取 z-index 值的辅助函数
 * @param level - 层级名称
 * @returns z-index 数值
 */
export function getZIndex(level: keyof typeof Z_INDEX): number {
    return Z_INDEX[level];
}

/**
 * 生成 Tailwind CSS 类名的辅助函数
 * @param level - 层级名称
 * @returns Tailwind z-index 类名
 */
export function getZIndexClass(level: keyof typeof Z_INDEX): string {
    return `z-[${Z_INDEX[level]}]`;
}

/**
 * 生成 CSS 变量的辅助函数
 * @param level - 层级名称
 * @returns CSS 变量名
 */
export function getZIndexVar(level: keyof typeof Z_INDEX): string {
    return `--z-${level.toLowerCase()}`;
}
