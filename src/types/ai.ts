// AI功能相关类型定义

export interface AISettings {
    geminiApiKey?: string;
    aiAnalysisEnabled?: boolean;
    autoAnalysisEnabled?: boolean;
}

export interface AIAnalysisResult {
    id: string;
    module: string;
    analysisType: 'performance' | 'trend' | 'recommendation';
    title: string;
    content: string;
    confidence: number; // 0-1
    createdAt: string;
    data?: {
        period: string;
        metrics: Record<string, number>;
        trends: Record<string, 'up' | 'down' | 'stable'>;
    };
}

export interface AIAnalysisRequest {
    records: Array<{
        id: string;
        date: string;
        module: string;
        total: number;
        correct: number;
        duration: string;
    }>;
    analysisType: 'performance' | 'trend' | 'recommendation';
    module?: string;
    period?: 'week' | 'month' | 'all';
}

export interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}
