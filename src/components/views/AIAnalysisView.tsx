import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { AIService } from "@/lib/aiService";
import { MixedText } from "@/components/ui/MixedText";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
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
    Minimize2,
    MessageCircleOff,
    BrickWallFire,
    History,
    ChevronUp
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
    const [isButtonsExpanded, setIsButtonsExpanded] = useState(false);

    const aiService = AIService.getInstance();

    // 初始化欢迎消息
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: 'welcome',
                type: 'ai',
                content: '👋 您好！我是您的AI学习助手。我可以帮您分析刷题数据、提供学习建议，或者回答任何关于学习的问题。\n\n您可以选择：\n• 点击"分析报告"获取智能分析报告\n• 在下方输入框中提问\n• 选择不同的AI模型获得不同的分析效果',
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
                message: "已复制到剪贴板"
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
        // 直接清空所有消息，不保存历史记录
        setMessages([{
            id: 'welcome',
            type: 'ai',
            content: '👋 您好！我是您的AI学习助手。我可以帮您分析刷题数据、提供学习建议，或者回答任何关于学习的问题。\n\n您可以选择：\n• 点击"分析报告"获取智能分析报告\n• 在下方输入框中提问\n• 选择不同的AI模型获得不同的分析效果',
            timestamp: new Date()
        }]);
    };


    return (
        <TooltipProvider>
            <div className="h-full flex flex-col w-full px-2 sm:px-4">
                {/* 聊天区域 */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
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

                            <div className={`max-w-[85%] sm:max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                                <div
                                    className={`rounded-2xl ${message.type === 'user'
                                        ? 'bg-blue-500 text-white ml-auto px-2 sm:px-3 py-2'
                                        : 'bg-muted p-3 sm:p-4'
                                        }`}
                                >
                                    {message.type === 'user' ? (
                                        <div className="text-sm leading-relaxed">
                                            {message.content}
                                        </div>
                                    ) : (
                                        <div className="text-sm leading-relaxed">
                                            <MarkdownRenderer
                                                content={message.content}
                                                className="text-sm leading-relaxed"
                                            />
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
                                                    className="h-6 w-6 p-0 transition-all duration-300 ease-in-out"
                                                    onClick={() => handleCopyMessage(message.content, message.id)}
                                                >
                                                    <div className="relative">
                                                        <Copy className={`w-3 h-3 transition-all duration-300 ${copiedMessageId === message.id ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'}`} />
                                                        <Check className={`w-3 h-3 text-green-500 absolute top-0 left-0 transition-all duration-300 ${copiedMessageId === message.id ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180'}`} />
                                                    </div>
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
                <div className="p-2 sm:p-4 border-t bg-background">
                    <div className="flex items-end gap-2 sm:gap-3">
                        {/* 左侧按钮组 - 可展开收起 */}
                        <div className="flex items-center">
                            {/* 箭头切换按钮 */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setIsButtonsExpanded(!isButtonsExpanded)}
                                        className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <ChevronUp className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ease-in-out ${isButtonsExpanded ? 'rotate-90' : 'rotate-0'
                                            }`} />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isButtonsExpanded ? '收起按钮' : '展开按钮'}</p>
                                </TooltipContent>
                            </Tooltip>

                            {/* 按钮组容器 - 带动画 */}
                            <div className={`flex items-center gap-1 overflow-hidden transition-all duration-500 ease-in-out ${isButtonsExpanded ? 'max-w-48 opacity-100' : 'max-w-0 opacity-0'
                                }`}>
                                {/* 分析报告按钮 */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={handleQuickAnalysis}
                                            disabled={isAnalyzing || records.length === 0}
                                            className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center text-orange-500 hover:text-orange-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isAnalyzing ? (
                                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                            ) : (
                                                <BrickWallFire className="w-4 h-4 sm:w-5 sm:h-5" />
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>分析报告</p>
                                    </TooltipContent>
                                </Tooltip>


                                {/* 清空对话按钮 */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={handleClearChat}
                                            className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center text-red-500 hover:text-red-600 transition-colors"
                                        >
                                            <MessageCircleOff className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>清空所有对话记录</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        {/* 输入框区域 */}
                        <div className="flex-1 max-w-4xl relative transition-all duration-500 ease-in-out">
                            <Textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="输入您的问题，比如：我的刷题表现如何？如何提高正确率？"
                                className={`w-full resize-none transition-all duration-300 ${isInputExpanded
                                    ? 'min-h-[100px] sm:min-h-[120px] rounded-2xl'
                                    : 'min-h-[40px] sm:min-h-[48px] rounded-full'
                                    } pr-24 sm:pr-32 pl-3 sm:pl-4 py-2 sm:py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-0 text-sm sm:text-base`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />

                            {/* 模型选择 - 在输入框内部右侧 */}
                            <div className="absolute right-8 sm:right-10 top-1/2 -translate-y-1/2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                                            <SelectTrigger className="w-auto min-w-20 sm:min-w-28 h-6 sm:h-8 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:w-3 [&>svg]:h-3 sm:[&>svg]:w-4 sm:[&>svg]:h-4 flex items-center [&>svg]:self-center">
                                                <SelectValue className="text-[8px] sm:text-[10px]" />
                                            </SelectTrigger>
                                            <SelectContent className="w-fit min-w-max">
                                                <SelectItem value="gemini-2.5-flash" className="whitespace-nowrap">
                                                    <span className="text-[8px] sm:text-[10px]">Gemini 2.5 快速版</span>
                                                </SelectItem>
                                                <SelectItem value="gemini-2.5-pro" className="whitespace-nowrap">
                                                    <span className="text-[8px] sm:text-[10px]">Gemini 2.5 专业版</span>
                                                </SelectItem>
                                                <SelectItem value="deepseek-chat" className="whitespace-nowrap">
                                                    <span className="text-[8px] sm:text-[10px]">DeepSeek 对话版</span>
                                                </SelectItem>
                                                <SelectItem value="deepseek-reasoner" className="whitespace-nowrap">
                                                    <span className="text-[8px] sm:text-[10px]">DeepSeek 推理版</span>
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
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-gray-100"
                                    >
                                        {isInputExpanded ? (
                                            <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                        ) : (
                                            <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isInputExpanded ? '缩小输入框' : '放大输入框'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* 发送按钮 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!customPrompt.trim() || isAnalyzing}
                                    className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center text-blue-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isAnalyzing ? '发送中...' : '发送消息'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        <MixedText text="按 Enter 发送，Shift + Enter 换行" />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                        <MixedText text="此程序不会保存任何对话历史记录" />
                    </p>
                </div>
            </div>
        </TooltipProvider>
    );
}
