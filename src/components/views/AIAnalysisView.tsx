import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { AIService } from "@/lib/aiService";
import { MixedText } from "@/components/ui/MixedText";
import { useLocalStorageString } from "@/hooks/useLocalStorage";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/animate-ui/components/animate/tooltip";
import {
    Brain,
    Loader2,
    Sparkles,
    Send,
    MessageSquare,
    Bot,
    User,
    Copy,
    Check,
    RefreshCw,
    TrendingUp,
    BarChart3,
    Target,
    Lightbulb,
    Maximize2,
    Minimize2
} from "lucide-react";
import type { AIAnalysisResult, AIAnalysisRequest } from '@/types/ai';

interface AIAnalysisViewProps {
    records: Array<{
        id: string;
        date: string;
        module: string;
        total: number;
        correct: number;
        duration: string;
    }>;
}

interface ChatMessage {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    isAnalysis?: boolean;
}

export function AIAnalysisView({ records }: AIAnalysisViewProps) {
    const { notify } = useNotification();
    const [selectedModel, setSelectedModel] = useLocalStorageString('ai-model', 'gemini-2.5-flash');
    const [customPrompt, setCustomPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [isInputExpanded, setIsInputExpanded] = useState(false);

    const aiService = AIService.getInstance();

    // 初始化欢迎消息
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: 'welcome',
                type: 'ai',
                content: '👋 您好！我是您的AI学习助手。我可以帮您分析刷题数据、提供学习建议，或者回答任何关于学习的问题。\n\n您可以选择：\n• 点击"快速分析"获取智能分析报告\n• 在下方输入框中提问\n• 选择不同的AI模型获得不同的分析效果',
                timestamp: new Date()
            }]);
        }
    }, [messages.length]);

    const handleQuickAnalysis = async () => {
        if (!aiService.hasApiKey()) {
            const modelName = selectedModel.startsWith('gemini') ? 'Gemini' : 'DeepSeek';
            notify({
                type: "error",
                message: "AI功能未配置",
                description: `请先在设置页面配置${modelName} API Key`
            });
            return;
        }

        setIsAnalyzing(true);

        // 添加用户消息
        const userMessage: ChatMessage = {
            id: `user_${Date.now()}`,
            type: 'user',
            content: '请分析我的刷题数据',
            timestamp: new Date(),
            isAnalysis: true
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            aiService.setModel(selectedModel);

            const request: AIAnalysisRequest = {
                records: records,
                analysisType: 'performance',
                module: 'all',
                period: 'all'
            };

            const result = await aiService.analyzePerformance(request);

            // 添加AI回复消息
            const aiMessage: ChatMessage = {
                id: `ai_${Date.now()}`,
                type: 'ai',
                content: result.content,
                timestamp: new Date(),
                isAnalysis: true
            };
            setMessages(prev => [...prev, aiMessage]);

            const modelName = selectedModel.startsWith('gemini') ? 'Gemini' : 'DeepSeek';
            notify({
                type: "success",
                message: "分析完成",
                description: `已使用${modelName}模型生成智能分析报告`
            });
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: `error_${Date.now()}`,
                type: 'ai',
                content: `抱歉，分析过程中出现错误：${error instanceof Error ? error.message : '未知错误'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);

            notify({
                type: "error",
                message: "分析失败",
                description: error instanceof Error ? error.message : "分析过程中发生错误"
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!customPrompt.trim()) return;

        if (!aiService.hasApiKey()) {
            const modelName = selectedModel.startsWith('gemini') ? 'Gemini' : 'DeepSeek';
            notify({
                type: "error",
                message: "AI功能未配置",
                description: `请先在设置页面配置${modelName} API Key`
            });
            return;
        }

        const userMessage: ChatMessage = {
            id: `user_${Date.now()}`,
            type: 'user',
            content: customPrompt,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        const currentPrompt = customPrompt;
        setCustomPrompt('');

        setIsAnalyzing(true);

        try {
            aiService.setModel(selectedModel);

            // 使用新的askQuestion方法
            const answer = await aiService.askQuestion(currentPrompt, records);

            const aiMessage: ChatMessage = {
                id: `ai_${Date.now()}`,
                type: 'ai',
                content: answer,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            const errorMessage: ChatMessage = {
                id: `error_${Date.now()}`,
                type: 'ai',
                content: `抱歉，处理您的问题时出现错误：${error instanceof Error ? error.message : '未知错误'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCopyMessage = async (content: string, messageId: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMessageId(messageId);
            setTimeout(() => setCopiedMessageId(null), 2000);
            notify({
                type: "success",
                message: "已复制到剪贴板",
                description: "内容已成功复制"
            });
        } catch (error) {
            notify({
                type: "error",
                message: "复制失败",
                description: "无法复制内容到剪贴板"
            });
        }
    };

    const handleClearChat = () => {
        setMessages([{
            id: 'welcome',
            type: 'ai',
            content: '👋 您好！我是您的AI学习助手。我可以帮您分析刷题数据、提供学习建议，或者回答任何关于学习的问题。\n\n您可以选择：\n• 点击"快速分析"获取智能分析报告\n• 在下方输入框中提问\n• 选择不同的AI模型获得不同的分析效果',
            timestamp: new Date()
        }]);
    };

    const formatMessageContent = (content: string) => {
        return content.split('\n').map((line, index) => {
            // 处理标题行
            if (line.startsWith('**') && line.endsWith('**')) {
                return (
                    <div key={index} className="font-semibold text-base mt-4 mb-2 first:mt-0 text-blue-600 dark:text-blue-400">
                        {line.replace(/\*\*/g, '')}
                    </div>
                );
            }
            // 处理列表项
            if (line.startsWith('- ')) {
                return (
                    <div key={index} className="ml-4 mb-1 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{line.substring(2)}</span>
                    </div>
                );
            }
            // 处理普通段落
            if (line.trim()) {
                return (
                    <div key={index} className="mb-2">
                        {line}
                    </div>
                );
            }
            // 空行
            return <div key={index} className="h-2" />;
        });
    };

    return (
        <TooltipProvider>
            <div className="h-full flex flex-col max-w-6xl mx-auto px-8">
                {/* 头部 */}
                <div className="flex items-center justify-end px-4 py-2 border-b bg-background">
                    <div className="flex items-center gap-3">
                        {/* 快速分析按钮 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={handleQuickAnalysis}
                                    disabled={isAnalyzing || records.length === 0}
                                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <BarChart3 className="w-4 h-4" />
                                    )}
                                    {isAnalyzing ? '分析中...' : '快速分析'}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>基于您的刷题数据生成智能分析报告</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* 清空对话 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={handleClearChat}
                                    variant="outline"
                                    size="sm"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>清空所有对话记录</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* 聊天区域 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {message.type === 'ai' && (
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            )}

                            <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                                <div
                                    className={`rounded-2xl ${message.type === 'user'
                                        ? 'bg-blue-500 text-white ml-auto px-3 py-2'
                                        : 'bg-muted p-4'
                                        }`}
                                >
                                    {message.type === 'user' ? (
                                        <div className="text-sm leading-relaxed">
                                            {message.content}
                                        </div>
                                    ) : (
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            {formatMessageContent(message.content)}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-muted-foreground">
                                        {message.timestamp.toLocaleTimeString('zh-CN')}
                                    </span>
                                    {message.isAnalysis && (
                                        <Badge variant="secondary" className="text-xs">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            智能分析
                                        </Badge>
                                    )}
                                    {message.type === 'ai' && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => handleCopyMessage(message.content, message.id)}
                                                >
                                                    {copiedMessageId === message.id ? (
                                                        <Check className="w-3 h-3 text-green-500" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{copiedMessageId === message.id ? '已复制' : '复制内容'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>

                            {message.type === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isAnalyzing && (
                        <div className="flex gap-3 justify-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-muted p-4 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">AI正在思考中...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 输入区域 */}
                <div className="p-4 border-t bg-background">
                    <div className="flex items-end gap-3">
                        <div className="flex-1 relative">
                            <Textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="输入您的问题，比如：我的数学模块表现如何？如何提高正确率？"
                                className={`w-full resize-none transition-all duration-300 ${isInputExpanded
                                    ? 'min-h-[120px] rounded-2xl'
                                    : 'min-h-[48px] rounded-full'
                                    } pr-32 pl-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-0`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />

                            {/* 模型选择 - 在输入框内部右侧 */}
                            <div className="absolute right-16 top-1/2 -translate-y-1/2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                                            <SelectTrigger className="w-32 h-8 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0">
                                                <SelectValue className="text-xs" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="gemini-2.5-flash">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-xs">Gemini 2.5 Flash</span>
                                                        <span className="text-xs text-muted-foreground">快速响应</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="gemini-2.5-pro">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-xs">Gemini 2.5 Pro</span>
                                                        <span className="text-xs text-muted-foreground">高质量分析</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="deepseek-chat">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-xs">DeepSeek Chat</span>
                                                        <span className="text-xs text-muted-foreground">通用对话</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="deepseek-reasoner">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-xs">DeepSeek Reasoner</span>
                                                        <span className="text-xs text-muted-foreground">深度思考</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>选择AI模型</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            {/* 放大缩小按钮 */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsInputExpanded(!isInputExpanded)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                                    >
                                        {isInputExpanded ? (
                                            <Minimize2 className="w-4 h-4" />
                                        ) : (
                                            <Maximize2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isInputExpanded ? '缩小输入框' : '放大输入框'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        {/* 发送按钮 - 移除外边框和填充，只显示图标 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!customPrompt.trim() || isAnalyzing}
                                    className="h-12 w-12 flex items-center justify-center text-blue-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isAnalyzing ? '发送中...' : '发送消息'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        <MixedText text="按 Enter 发送，Shift + Enter 换行" />
                    </p>
                </div>
            </div>
        </TooltipProvider>
    );
}
