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
    { id: string; module: 'data-analysis' | 'math' | 'common' | 'logic'; type: string; note: string } |
    { id: string; module: 'politics'; date: string | null; source: string; note: string } |
    { id: string; module: 'verbal'; idiom: string; meaning: string }
); 