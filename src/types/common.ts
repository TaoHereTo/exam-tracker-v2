// 通用类型定义

// 迁移结果类型
export interface MigrationResult {
    success: boolean;
    totalMigrated: number;
    results: {
        records: { success: boolean; count?: number; error?: Error | null };
        plans: { success: boolean; count?: number; error?: Error | null };
        knowledge: { success: boolean; count?: number; error?: Error | null };
        settings: { success: boolean; count?: number; error?: Error | null };
    };
}

// 通知类型
export interface NotificationData {
    title: string;
    description: string;
    type: "success" | "error" | "warning" | "info";
}

// 云端数据概览类型
import type { RecordItem, StudyPlan, KnowledgeItem } from './record';

export interface CloudDataOverview {
    records: { count: number; recent: RecordItem[] };
    plans: { count: number; recent: StudyPlan[] };
    knowledge: { count: number; recent: KnowledgeItem[] };
    settings: { hasSettings: boolean };
}

// 同步报告项类型

export interface SyncReportItem<T = RecordItem | StudyPlan | KnowledgeItem> {
    item: T;
    action: 'uploaded' | 'skipped' | 'failed';
    reason?: string;
}

// 用户设置类型
export interface UserSettings {
    [key: string]: string | number | boolean | null | undefined;
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