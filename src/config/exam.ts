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

// 页面标题映射（英文到中文）
export const PAGE_TITLE_MAP: Record<string, string> = {
    'overview': '成绩概览',
    'charts': '数据图表',
    'history': '刷题历史',
    'personal-best': '最佳成绩',
    'knowledge-summary': '知识点汇总',
    'knowledge-entry': '知识点录入',
    'plan-list': '学习计划',
    'plan-detail': '计划详情',
    'settings': '程序设置',
    'form': '新的记录',
    'best': '最佳成绩',
    'modules': '知识点汇总',
    'settings-basic': '程序设置',
    'settings-advanced': '程序设置',
    'plan': '制定计划',
    'countdown': '倒计时',
    'calendar': '日程管理',
};

// 统一的模块颜色配置
export const MODULE_COLORS: Record<string, string> = {
    '资料分析': '#3b82f6',    // More vibrant blue (instead of #60a5fa)
    '政治理论': '#06b6d4',    // More vibrant cyan (instead of #67e8f9)
    '数量关系': '#10b981',    // More vibrant green (instead of #34d399)
    '常识判断': '#f59e0b',    // Keep the same amber (good balance)
    '言语理解': '#ef4444',    // More vibrant red (instead of #f87171)
    '判断推理': '#a855f7',    // More vibrant purple (instead of #d8b4fe)
};

// 统一的图例样式配置
// 注意：背景颜色和边框颜色将在组件中根据主题动态设置
export const UNIFIED_LEGEND_STYLE = {
    itemWidth: 18,
    itemHeight: 12,
    borderRadius: 6,
    textStyle: {
        fontWeight: 'bold',
        fontSize: 14,
        fontFamily: 'Times New Roman, 思源宋体, serif'
    },
    icon: 'roundRect' as const,
    // backgroundColor 和 borderColor 将在组件中根据主题动态设置
    backgroundColor: 'rgba(255,255,255,0.9)', // 默认亮色主题
    borderColor: '#e0e6f1',
    borderWidth: 1,
    padding: [8, 12] as [number, number],
    shadowColor: 'rgba(51,102,255,0.08)',
    shadowBlur: 8
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

// 工具函数：统一页面标题
export function normalizePageTitle(pageName: string): string {
    return PAGE_TITLE_MAP[pageName] || pageName;
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

