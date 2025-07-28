// 刷题记录类型
export type RecordItem = {
    id: number;
    date: string;
    module: string;
    total: number;
    correct: number;
    duration: string;
};

// 计划类型
export type PlanType = "题量" | "正确率" | "错题数";

export interface StudyPlan {
    id: string;
    name: string;
    module: string; // 板块
    type: PlanType;
    startDate: string;
    endDate: string;
    target: number; // 目标值（题量/正确率/错题数）
    progress: number; // 当前进度（自动计算）
    status: "未开始" | "进行中" | "已完成" | "未达成";
    description?: string;
}

// 知识点类型定义
export type KnowledgeItem = (
    { id: string; module: 'data-analysis' | 'math'; type: string; note: string; imagePath?: string } |
    { id: string; module: 'logic'; type: string; note: string; subCategory: '图形推理' | '定义判断' | '类比推理' | '逻辑判断'; imagePath?: string } |
    { id: string; module: 'common'; type: string; note: string; subCategory: '经济常识' | '法律常识' | '科技常识' | '人文常识' | '地理国情'; imagePath?: string } |
    { id: string; module: 'politics'; date: string | null; source: string; note: string; imagePath?: string } |
    { id: string; module: 'verbal'; idiom: string; meaning: string; subCategory: '逻辑填空' | '片段阅读' | '成语积累'; imagePath?: string }
);

// 导入导出相关类型
export type ImportStats = { total: number; added: number; repeated: number };

export type PendingImport = {
    records: RecordItem[];
    knowledge: KnowledgeItem[];
    plans?: StudyPlan[];
    settings?: Record<string, string>;
    importStats?: ImportStats;
}; 