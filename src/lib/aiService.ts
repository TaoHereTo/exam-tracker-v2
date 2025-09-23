import type { AIAnalysisRequest, AIAnalysisResult, GeminiResponse } from '@/types/ai';

export class AIService {
    private static instance: AIService;
    private apiKey: string = '';
    private model: string = 'gemini-2.5-flash';

    private constructor() {
        // 在构造函数中初始化时从localStorage加载保存的配置
        this.loadFromLocalStorage();
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    private loadFromLocalStorage(): void {
        // 只在浏览器环境中执行
        if (typeof window !== 'undefined') {
            const savedModel = localStorage.getItem('ai-model');
            if (savedModel) {
                this.model = savedModel;
            }

            // 根据当前选择的模型加载对应的API Key
            if (this.model.startsWith('gemini')) {
                const geminiKey = localStorage.getItem('gemini-api-key');
                if (geminiKey) {
                    this.apiKey = geminiKey;
                }
            } else if (this.model.startsWith('deepseek')) {
                const deepseekKey = localStorage.getItem('deepseek-api-key');
                if (deepseekKey) {
                    this.apiKey = deepseekKey;
                }
            }
        }
    }

    public setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
    }

    public setModel(model: string): void {
        this.model = model;
        // 模型改变时，自动加载对应的API Key
        this.loadApiKeyForModel();
    }

    private loadApiKeyForModel(): void {
        // 只在浏览器环境中执行
        if (typeof window !== 'undefined') {
            if (this.model.startsWith('gemini')) {
                const geminiKey = localStorage.getItem('gemini-api-key');
                this.apiKey = geminiKey || '';
            } else if (this.model.startsWith('deepseek')) {
                const deepseekKey = localStorage.getItem('deepseek-api-key');
                this.apiKey = deepseekKey || '';
            }
        }
    }

    public getModel(): string {
        return this.model;
    }

    public hasApiKey(): boolean {
        return !!this.apiKey;
    }

    public async analyzePerformance(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
        if (!this.apiKey) {
            throw new Error('API Key 未设置');
        }

        const prompt = this.buildAnalysisPrompt(request);

        try {
            // 使用Next.js API路由来代理请求，避免CORS问题
            const response = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: this.apiKey,
                    model: this.model,
                    prompt: prompt
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'AI分析失败');
            }

            return this.parseAnalysisResult(data.analysisText, request);
        } catch (error) {
            console.error('AI分析失败:', error);
            throw error;
        }
    }

    public async askQuestion(question: string, records: Array<{ id: string; date: string; module: string; total: number; correct: number; duration: string }>): Promise<string> {
        if (!this.apiKey) {
            throw new Error('API Key 未设置');
        }

        // 构建包含刷题数据的上下文
        const contextPrompt = `你是一个专业的学习助手。用户有一些刷题数据，请根据用户的问题提供帮助。

用户数据概览：
- 总刷题次数：${records.length}次
- 最近5次刷题记录：${JSON.stringify(records.slice(0, 5), null, 2)}

用户问题：${question}

请直接回答用户的问题，如果问题与刷题数据相关，可以结合数据进行分析。如果问题与刷题数据无关，请直接回答用户的问题。`;

        try {
            const response = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: this.apiKey,
                    model: this.model,
                    prompt: contextPrompt
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'AI回答失败');
            }

            return data.analysisText;
        } catch (error) {
            console.error('AI问答失败:', error);
            throw error;
        }
    }

    private buildAnalysisPrompt(request: AIAnalysisRequest): string {
        const { records, analysisType, module, period } = request;

        // 分析指定模块的数据，如果是"all"则分析所有数据
        const moduleRecords = module === 'all' ? records : records.filter(r => r.module === module);

        if (moduleRecords.length === 0) {
            const moduleName = module === 'all' ? '整体' : module;
            return `请分析${moduleName}的刷题数据。目前暂无刷题记录。`;
        }

        // 计算基础统计数据
        const totalQuestions = moduleRecords.reduce((sum, r) => sum + r.total, 0);
        const totalCorrect = moduleRecords.reduce((sum, r) => sum + r.correct, 0);
        const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

        // 按日期排序，获取不同时间段的数据
        const sortedRecords = moduleRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const recentRecords = sortedRecords.slice(0, 7); // 最近7次
        const midRecords = sortedRecords.slice(7, 14); // 前7-14次
        const earlyRecords = sortedRecords.slice(14, 21); // 前14-21次

        // 计算不同时间段的数据
        const recentQuestions = recentRecords.reduce((sum, r) => sum + r.total, 0);
        const recentCorrect = recentRecords.reduce((sum, r) => sum + r.correct, 0);
        const recentAccuracy = recentQuestions > 0 ? (recentCorrect / recentQuestions) * 100 : 0;

        const midQuestions = midRecords.reduce((sum, r) => sum + r.total, 0);
        const midCorrect = midRecords.reduce((sum, r) => sum + r.correct, 0);
        const midAccuracy = midQuestions > 0 ? (midCorrect / midQuestions) * 100 : 0;

        const earlyQuestions = earlyRecords.reduce((sum, r) => sum + r.total, 0);
        const earlyCorrect = earlyRecords.reduce((sum, r) => sum + r.correct, 0);
        const earlyAccuracy = earlyQuestions > 0 ? (earlyCorrect / earlyQuestions) * 100 : 0;

        // 计算平均每次刷题量
        const avgQuestionsPerSession = totalQuestions / moduleRecords.length;
        const avgCorrectPerSession = totalCorrect / moduleRecords.length;

        // 计算时间效率（如果有duration数据）
        const recordsWithTime = moduleRecords.filter(r => r.duration && r.duration !== '00:00');
        const avgTimePerQuestion = recordsWithTime.length > 0 ?
            recordsWithTime.reduce((sum, r) => {
                const timeInMinutes = this.parseDurationToMinutes(r.duration);
                return sum + (timeInMinutes / r.total);
            }, 0) / recordsWithTime.length : 0;

        // 计算每分钟得分
        const avgScorePerMinute = recordsWithTime.length > 0 ?
            recordsWithTime.reduce((sum, r) => {
                const timeInMinutes = this.parseDurationToMinutes(r.duration);
                return sum + (timeInMinutes > 0 ? r.correct / timeInMinutes : 0);
            }, 0) / recordsWithTime.length : 0;

        // 计算不同时间段的每分钟得分
        const recentRecordsWithTime = recentRecords.filter(r => r.duration && r.duration !== '00:00');
        const recentScorePerMinute = recentRecordsWithTime.length > 0 ?
            recentRecordsWithTime.reduce((sum, r) => {
                const timeInMinutes = this.parseDurationToMinutes(r.duration);
                return sum + (timeInMinutes > 0 ? r.correct / timeInMinutes : 0);
            }, 0) / recentRecordsWithTime.length : 0;

        const earlyRecordsWithTime = earlyRecords.filter(r => r.duration && r.duration !== '00:00');
        const earlyScorePerMinute = earlyRecordsWithTime.length > 0 ?
            earlyRecordsWithTime.reduce((sum, r) => {
                const timeInMinutes = this.parseDurationToMinutes(r.duration);
                return sum + (timeInMinutes > 0 ? r.correct / timeInMinutes : 0);
            }, 0) / earlyRecordsWithTime.length : 0;

        const moduleNames = {
            'data-analysis': '资料分析',
            'math': '数量关系',
            'logic': '判断推理',
            'common': '常识判断',
            'politics': '政治常识',
            'verbal': '言语理解',
            'all': '整体'
        };

        const moduleName = moduleNames[module as keyof typeof moduleNames] || module;

        const prompt = `你是一个专业的考试数据分析师。请分析以下${moduleName}模块的刷题数据，并提供详细的智能分析报告。

=== 数据概览 ===
• 总刷题次数：${moduleRecords.length}次
• 总题数：${totalQuestions}题
• 总正确数：${totalCorrect}题
• 整体正确率：${accuracy.toFixed(1)}%
• 平均每次刷题：${avgQuestionsPerSession.toFixed(1)}题
• 平均每次正确：${avgCorrectPerSession.toFixed(1)}题
${avgTimePerQuestion > 0 ? `• 平均每题用时：${avgTimePerQuestion.toFixed(1)}分钟` : ''}
${avgScorePerMinute > 0 ? `• 平均每分钟得分：${avgScorePerMinute.toFixed(2)}分/分钟` : ''}

=== 时间段对比分析 ===
• 最近7次：${recentQuestions}题，正确率${recentAccuracy.toFixed(1)}%，平均每次${recentRecords.length > 0 ? (recentQuestions / recentRecords.length).toFixed(1) : 0}题
• 前7-14次：${midQuestions}题，正确率${midAccuracy.toFixed(1)}%，平均每次${midRecords.length > 0 ? (midQuestions / midRecords.length).toFixed(1) : 0}题
• 前14-21次：${earlyQuestions}题，正确率${earlyAccuracy.toFixed(1)}%，平均每次${earlyRecords.length > 0 ? (earlyQuestions / earlyRecords.length).toFixed(1) : 0}题

=== 趋势变化 ===
• 正确率变化：${earlyAccuracy > 0 && recentAccuracy > 0 ? (recentAccuracy - earlyAccuracy > 0 ? `上升${(recentAccuracy - earlyAccuracy).toFixed(1)}%` : `下降${Math.abs(recentAccuracy - earlyAccuracy).toFixed(1)}%`) : '数据不足'}
• 刷题量变化：${earlyQuestions > 0 && recentQuestions > 0 ? (recentQuestions - earlyQuestions > 0 ? `增加${recentQuestions - earlyQuestions}题` : `减少${Math.abs(recentQuestions - earlyQuestions)}题`) : '数据不足'}
• 每分钟得分变化：${earlyScorePerMinute > 0 && recentScorePerMinute > 0 ? (recentScorePerMinute - earlyScorePerMinute > 0 ? `提升${(recentScorePerMinute - earlyScorePerMinute).toFixed(2)}分/分钟` : `下降${Math.abs(recentScorePerMinute - earlyScorePerMinute).toFixed(2)}分/分钟`) : '数据不足'}

=== 详细记录 ===
${recentRecords.slice(0, 5).map((r, i) =>
            `${i + 1}. ${r.date}：${r.total}题，正确${r.correct}题，正确率${((r.correct / r.total) * 100).toFixed(1)}%`
        ).join('\n')}

${module === 'all' ? `=== 各模块表现 ===
${Object.entries(moduleRecords.reduce((acc, r) => {
            if (!acc[r.module]) {
                acc[r.module] = { total: 0, correct: 0, count: 0 };
            }
            acc[r.module].total += r.total;
            acc[r.module].correct += r.correct;
            acc[r.module].count += 1;
            return acc;
        }, {} as Record<string, { total: number; correct: number; count: number }>)).map(([mod, stats]) => {
            const moduleAccuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
            const moduleName = moduleNames[mod as keyof typeof moduleNames] || mod;
            return `• ${moduleName}：${stats.total}题，正确率${moduleAccuracy.toFixed(1)}%，刷题${stats.count}次`;
        }).join('\n')}` : ''}

=== 分析要求 ===
请按以下格式提供分析报告：

**📊 数据表现**
- 用具体数字说明当前水平
- 对比不同时间段的表现差异

**📈 趋势分析**  
- 分析正确率变化趋势（上升/下降/稳定）
- 分析刷题量变化趋势
- 分析做题效率变化（每分钟得分）

**💡 学习建议**
- 基于趋势数据给出3-4条具体建议
- 包含改进方向和目标
- 针对薄弱环节提出解决方案

**🎯 重点关注**
- 指出需要加强的方面
- 设定具体的学习目标
- 建议重点关注的时间段

请用中文回答，分析要具体、有数据支撑，重点关注历史趋势和变化，避免笼统描述。`;

        return prompt;
    }

    private parseDurationToMinutes(duration: string): number {
        if (!duration || duration === '00:00') return 0;
        const parts = duration.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return 0;
    }

    private parseAnalysisResult(analysisText: string, request: AIAnalysisRequest): AIAnalysisResult {
        const moduleName = request.module || 'all';
        const analysisType = request.analysisType;

        // 提取标题和内容
        const lines = analysisText.split('\n').filter(line => line.trim());
        const title = lines[0] || `${moduleName}模块分析`;
        const content = analysisText;

        return {
            id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            module: moduleName,
            analysisType,
            title,
            content,
            confidence: 0.8, // 默认置信度
            createdAt: new Date().toISOString(),
            data: {
                period: request.period || 'all',
                metrics: {},
                trends: {}
            }
        };
    }

    public async testConnection(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            const response = await fetch('/api/ai/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: this.apiKey,
                    model: this.model
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('AI连接测试失败:', response.status, errorData);
                return false;
            }

            const data = await response.json();
            return data.success === true;
        } catch (error) {
            console.error('AI连接测试失败:', error);
            return false;
        }
    }
}
