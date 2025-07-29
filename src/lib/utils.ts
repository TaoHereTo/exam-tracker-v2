import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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


