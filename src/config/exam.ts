export const MODULES = [
    { value: 'data-analysis', label: '资料分析' },
    { value: 'politics', label: '政治理论' },
    { value: 'math', label: '数量关系' },
    { value: 'common', label: '常识判断' },
    { value: 'verbal', label: '言语理解' },
    { value: 'logic', label: '判断推理' },
];

// 统一的模块名称映射（英文到中文）
export const MODULE_NAME_MAP: Record<string, string> = {
    'data-analysis': '资料分析',
    'politics': '政治理论',
    'math': '数量关系',
    'common': '常识判断',
    'verbal': '言语理解',
    'logic': '判断推理',
};

// 统一的模块颜色配置
export const MODULE_COLORS: Record<string, string> = {
    '资料分析': '#A259FF',
    '政治理论': '#3366FF',
    '数量关系': '#43D854',
    '常识判断': '#FFB300',
    '言语理解': '#FF4C4C',
    '判断推理': '#00B8D9',
};

export const MODULE_SCORES = {
    '政治理论': 0.7, '常识判断': 0.8, '判断推理': 0.8,
    '言语理解': 0.8, '数量关系': 0.8, '资料分析': 0.7
};

export const FULL_EXAM_CONFIG = {
    totalTime: 120, totalQuestions: 130,
    modules: {
        '政治理论': { questions: 20, pointsPerQuestion: 0.7 },
        '常识判断': { questions: 15, pointsPerQuestion: 0.8 },
        '言语理解': { questions: 30, pointsPerQuestion: 0.8 },
        '判断推理': { questions: 35, pointsPerQuestion: 0.8 },
        '数量关系': { questions: 10, pointsPerQuestion: 0.8 },
        '资料分析': { questions: 20, pointsPerQuestion: 0.7 },
    }
};

// 工具函数：统一模块名称
export function normalizeModuleName(moduleName: string): string {
    return MODULE_NAME_MAP[moduleName] || moduleName;
}

// 工具函数：获取模块颜色
export function getModuleColor(moduleName: string): string {
    const normalizedName = normalizeModuleName(moduleName);
    return MODULE_COLORS[normalizedName] || '#888';
}

// 工具函数：获取模块分数
export function getModuleScore(moduleName: string): number {
    const normalizedName = normalizeModuleName(moduleName);
    return MODULE_SCORES[normalizedName as keyof typeof MODULE_SCORES] || 1;
}

/*
使用示例：

1. 统一模块名称：
   import { normalizeModuleName } from '@/config/exam';
   const moduleName = normalizeModuleName('data-analysis'); // 返回 '资料分析'

2. 获取模块颜色：
   import { getModuleColor } from '@/config/exam';
   const color = getModuleColor('politics'); // 返回 '#3366FF'

3. 获取模块分数：
   import { getModuleScore } from '@/config/exam';
   const score = getModuleScore('math'); // 返回 0.8

4. 在组件中使用：
   // 替换原来的重复定义
   const normalizedModule = normalizeModuleName(record.module);
   const moduleColor = getModuleColor(normalizedModule);
   const moduleScore = getModuleScore(normalizedModule);

这样可以确保整个应用中模块名称、颜色、分数的一致性。
*/ 