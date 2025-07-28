// localStorage使用量监控工具

export interface StorageInfo {
    totalSize: number;
    totalSizeMB: number;
    usedSize: number;
    usedSizeMB: number;
    availableSize: number;
    availableSizeMB: number;
    usagePercentage: number;
    items: Array<{
        key: string;
        size: number;
        sizeKB: number;
    }>;
}

/**
 * 计算字符串的字节大小（UTF-8编码）
 */
function getStringSize(str: string): number {
    return new Blob([str]).size;
}

/**
 * 获取localStorage使用情况
 */
export function getLocalStorageInfo(): StorageInfo {
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    let totalSize = 0;
    const items: Array<{ key: string; size: number; sizeKB: number }> = [];

    // 遍历所有localStorage项
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            const value = localStorage.getItem(key);
            if (value) {
                const size = getStringSize(key + value);
                totalSize += size;
                items.push({
                    key,
                    size,
                    sizeKB: Math.round(size / 1024 * 100) / 100
                });
            }
        }
    }

    // 按大小排序
    items.sort((a, b) => b.size - a.size);

    return {
        totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        usedSize: totalSize,
        usedSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        availableSize: maxSize - totalSize,
        availableSizeMB: Math.round((maxSize - totalSize) / (1024 * 1024) * 100) / 100,
        usagePercentage: Math.round((totalSize / maxSize) * 100 * 100) / 100,
        items
    };
}

/**
 * 清理localStorage中的特定数据
 */
export function clearLocalStorageData(dataTypes: ('records' | 'knowledge' | 'plans' | 'settings')[] = []) {
    // 根据指定的数据类型清理对应的键
    const keysToRemove: string[] = [];

    if (dataTypes.length === 0 || dataTypes.includes('records')) {
        keysToRemove.push('exam-tracker-records-v2');
    }
    if (dataTypes.length === 0 || dataTypes.includes('knowledge')) {
        keysToRemove.push('exam-tracker-knowledge-v2');
    }
    if (dataTypes.length === 0 || dataTypes.includes('plans')) {
        keysToRemove.push('exam-tracker-plans-v2');
    }
    if (dataTypes.length === 0 || dataTypes.includes('settings')) {
        keysToRemove.push(
            'exam-tracker-nav-mode',
            'eye-care-enabled',
            'reduce-motion-enabled',
            'notify-change-enabled',
            'page-size',
            'theme',
            'theme-switch-type',
            'other-switch-type'
        );
    }

    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });

    return getLocalStorageInfo();
}

/**
 * 获取最大的localStorage项
 */
export function getLargestStorageItems(count: number = 5) {
    const info = getLocalStorageInfo();
    return info.items.slice(0, count);
}

/**
 * 检查localStorage是否接近限制
 */
export function isStorageNearLimit(threshold: number = 80): boolean {
    const info = getLocalStorageInfo();
    return info.usagePercentage >= threshold;
}

/**
 * 格式化存储大小显示
 */
export function formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 