/**
 * 修复select组件点击后滚动条消失导致页面左右移动的问题
 * 现在通过修复布局结构解决，无需JavaScript
 */

/**
 * 初始化滚动条修复
 */
export function initScrollbarFix(): void {
    console.log('🔧 滚动条修复已通过CSS布局修复完成');
    console.log('📊 现在只有一个滚动条，位于SidebarInset容器内');
}

// 自动初始化
if (typeof window !== 'undefined') {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollbarFix);
    } else {
        initScrollbarFix();
    }
}
