// 通用类型定义

// 通知类型
export interface NotificationData {
    title: string;
    description: string;
    type: "success" | "error" | "warning" | "info";
}

// 云端数据概览类型
import type { RecordItem, StudyPlan, KnowledgeItem, ExamCountdown, Note } from './record';

export interface CloudDataOverview {
    records: { count: number; recent: RecordItem[]; lastUpdated?: string };
    plans: { count: number; recent: StudyPlan[]; lastUpdated?: string };
    knowledge: { count: number; recent: KnowledgeItem[]; lastUpdated?: string };
    countdowns: { count: number; recent: ExamCountdown[]; lastUpdated?: string };
    notes: { count: number; recent: Note[]; lastUpdated?: string };
    settings: { hasSettings: boolean; lastUpdated?: string };
}

// 同步报告项类型
export interface SyncReportItem<T = RecordItem | StudyPlan | KnowledgeItem> {
    item: T;
    action: 'uploaded' | 'updated' | 'skipped' | 'failed';
    reason?: string;
}

// 认证错误类型
export interface AuthError {
    message: string;
    status?: number;
    code?: string;
}

// 进度回调类型
export interface ProgressCallback {
    current: number;
    total: number;
    currentItem: string;
}