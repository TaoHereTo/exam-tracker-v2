import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 时间格式转换工具函数
export function timeStringToMinutes(timeString: string): number {
  if (!timeString || typeof timeString !== 'string') return 0;

  // 如果是 "MM:SS" 格式
  if (timeString.includes(':')) {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return (minutes || 0) + (seconds || 0) / 60;
  }

  // 如果是纯数字（旧格式，直接是分钟数）
  const numValue = parseFloat(timeString);
  return isNaN(numValue) ? 0 : numValue;
}

export function minutesToTimeString(minutes: number): string {
  if (!minutes || minutes <= 0) return '00:00';

  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDuration(duration: string | number): string {
  if (typeof duration === 'number') {
    return minutesToTimeString(duration);
  }

  if (typeof duration === 'string') {
    // 如果已经是 "MM:SS" 格式，直接返回
    if (duration.includes(':')) {
      return duration;
    }

    // 如果是纯数字字符串，转换为 "MM:SS" 格式
    const minutes = parseFloat(duration);
    if (!isNaN(minutes)) {
      return minutesToTimeString(minutes);
    }
  }

  return '00:00';
}

// 智能排序函数：处理数字命名和非数字命名的图片
export function smartImageSort(a: { originalName: string }, b: { originalName: string }): number {
  const nameA = a.originalName.toLowerCase();
  const nameB = b.originalName.toLowerCase();

  // 提取文件名中的数字部分
  const extractNumbers = (str: string): number[] => {
    const matches = str.match(/\d+/g);
    return matches ? matches.map(Number) : [];
  };

  const numbersA = extractNumbers(nameA);
  const numbersB = extractNumbers(nameB);

  // 如果两个文件名都包含数字，按数字倒序排列
  if (numbersA.length > 0 && numbersB.length > 0) {
    // 比较第一个数字（通常是最重要的）
    const firstNumA = numbersA[0];
    const firstNumB = numbersB[0];

    if (firstNumA !== firstNumB) {
      return firstNumB - firstNumA; // 倒序：大数字在前
    }

    // 如果第一个数字相同，比较后续数字
    const maxLength = Math.max(numbersA.length, numbersB.length);
    for (let i = 1; i < maxLength; i++) {
      const numA = numbersA[i] || 0;
      const numB = numbersB[i] || 0;
      if (numA !== numB) {
        return numB - numA; // 倒序
      }
    }

    // 如果数字完全相同，按原始名称字母顺序排列
    return nameA.localeCompare(nameB);
  }

  // 如果只有一个包含数字，数字命名的排在前面
  if (numbersA.length > 0 && numbersB.length === 0) {
    return -1;
  }
  if (numbersA.length === 0 && numbersB.length > 0) {
    return 1;
  }

  // 如果都不包含数字，按字母顺序排列
  return nameA.localeCompare(nameB);
}

/**
 * 生成UUID格式的ID，与数据库兼容
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * 检查ID是否为UUID格式
 */
export const isUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};


