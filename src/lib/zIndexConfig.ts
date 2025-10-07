/**
 * 统一的 z-index 层级配置
 * 用于管理整个项目的层级关系，避免 z-index 混乱
 */

export const Z_INDEX = {
    // 基础层级 (1-10)
    BASE: 1,
    ELEVATED: 2,
    FOCUSED: 10,

    // 组件层级 (20-50)
    DROPDOWN: 20,
    STICKY: 20,
    TOOLTIP: 30,
    POPOVER: 40,
    MODAL: 50,

    // 覆盖层级 (100-200)
    OVERLAY: 100,
    DIALOG: 150,
    DRAWER: 200,

    // 全屏编辑器层级 (1000-1100)
    FULLSCREEN_EDITOR: 1000,
    FULLSCREEN_EDITOR_TOOLBAR: 1001,
    FULLSCREEN_EDITOR_OVERLAY: 1002,

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
