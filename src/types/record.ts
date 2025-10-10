// 统一的数据格式定义 - 版本 7.0

// 导入笔记类型
export interface Note {
    id: string;
    title: string;
    content: string;
    tags: Array<{ name: string; color: string }>;
    createdAt: string;
    updatedAt: string;
    isFavorite?: boolean;
}

// 刷题历史类型
export type RecordItem = {
    id: string; // UUID 格式
    date: string;
    module: 'data-analysis' | 'math' | 'logic' | 'common' | 'politics' | 'verbal';
    total: number;
    correct: number;
    duration: string;
    createdAt?: string; // ISO 8601 格式
    updatedAt?: string; // ISO 8601 格式
};

// 计划类型
export type PlanType = "题量" | "正确率" | "错题数";

export interface StudyPlan {
    id: string; // UUID 格式
    name: string;
    module: 'data-analysis' | 'math' | 'logic' | 'common' | 'politics' | 'verbal';
    type: PlanType;
    startDate: string; // YYYY-MM-DD 格式
    endDate: string; // YYYY-MM-DD 格式
    target: number; // 目标值（题量/正确率/错题数）
    progress: number; // 当前进度（自动计算）
    status: "未开始" | "进行中" | "已完成" | "未达成";
    description?: string;
    isPinned?: boolean; // 是否置顶
    createdAt?: string; // ISO 8601 格式
    updatedAt?: string; // ISO 8601 格式
};

// 考试倒计时类型
export interface ExamCountdown {
    id: string; // UUID 格式
    name: string;
    examDate: string; // YYYY-MM-DD 格式
    description?: string;
    isPinned?: boolean; // 是否置顶
    createdAt?: string; // ISO 8601 格式
    updatedAt?: string; // ISO 8601 格式
};

// 知识点类型定义 - 统一使用 type 和 note 字段
export type KnowledgeItem = {
    id: string; // UUID 格式
    module: 'data-analysis' | 'math' | 'logic' | 'common' | 'politics' | 'verbal';
    type: string;
    note: string;
    subCategory?: '图形推理' | '定义判断' | '类比推理' | '逻辑判断' | '经济常识' | '法律常识' | '科技常识' | '人文常识' | '地理国情' | '逻辑填空' | '片段阅读' | '成语积累';
    date?: string | null; // YYYY-MM-DD 格式
    source?: string;
    createdAt?: string; // ISO 8601 格式
    updatedAt?: string; // ISO 8601 格式
};


// 用户设置类型
export interface UserSettings {
    'exam-tracker-nav-mode'?: string;
    'eye-care-enabled'?: string;
    'notify-change-enabled'?: string;
    'page-size'?: string;
    'theme'?: string;
    'theme-switch-type'?: string;
    'other-switch-type'?: string;
    [key: string]: string | undefined;
}

// 导出数据格式（无版本字段）
export interface ExportData {
    exportedAt: string; // ISO 8601 格式
    records: RecordItem[];
    knowledge: KnowledgeItem[];
    plans: StudyPlan[];
    countdowns: ExamCountdown[];
    notes: Note[]; // 添加笔记数据
    settings: UserSettings;
    metadata: {
        totalRecords: number;
        totalKnowledge: number;
        totalPlans: number;
        totalCountdowns: number;
        totalNotes: number; // 添加笔记数量统计
        appVersion?: string;
    };
}

// 导入导出相关类型
export type ImportStats = {
    total: number;
    added: number;
    repeated: number;
    updated: number;
    failed: number;
};

export type PendingImport = {
    records: RecordItem[];
    knowledge: KnowledgeItem[];
    plans?: StudyPlan[];
    countdowns?: ExamCountdown[];
    notes?: Note[];
    settings?: UserSettings;
    importStats?: ImportStats;
};