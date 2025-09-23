import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocalStorageString } from "@/hooks/useLocalStorage";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { AIService } from "@/lib/aiService";
import { MixedText } from "@/components/ui/MixedText";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Save,
    TestTube,
    Key,
    Brain,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye,
    EyeOff,
    Settings
} from "lucide-react";

export function AISettings() {
    const { notify } = useNotification();
    const [geminiApiKey, setGeminiApiKey] = useLocalStorageString('gemini-api-key', '');
    const [deepseekApiKey, setDeepseekApiKey] = useLocalStorageString('deepseek-api-key', '');
    const [selectedModel, setSelectedModel] = useLocalStorageString('ai-model', 'gemini-2.5-flash');
    const [aiAnalysisEnabled, setAiAnalysisEnabled] = useLocalStorageString('ai-analysis-enabled', 'false');
    const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useLocalStorageString('auto-analysis-enabled', 'false');

    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [showDeepseekKey, setShowDeepseekKey] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isSaving, setIsSaving] = useState(false);

    const aiService = AIService.getInstance();

    // 初始化AI服务
    useEffect(() => {
        const currentApiKey = selectedModel.startsWith('gemini') ? geminiApiKey : deepseekApiKey;
        if (currentApiKey) {
            aiService.setApiKey(currentApiKey);
            aiService.setModel(selectedModel);
        }
    }, [geminiApiKey, deepseekApiKey, selectedModel, aiService]);

    const handleTestConnection = async () => {
        const currentApiKey = selectedModel.startsWith('gemini') ? geminiApiKey : deepseekApiKey;
        const modelName = selectedModel.startsWith('gemini') ? 'Gemini' : 'DeepSeek';

        if (!currentApiKey.trim()) {
            notify({
                type: "error",
                message: "请输入API Key",
                description: `请先输入${modelName} API Key再进行连接测试`
            });
            return;
        }

        setIsTestingConnection(true);
        setConnectionStatus('idle');

        try {
            aiService.setApiKey(currentApiKey);
            aiService.setModel(selectedModel);
            const isConnected = await aiService.testConnection();

            if (isConnected) {
                setConnectionStatus('success');
                // 连接成功后自动保存API Key
                if (selectedModel.startsWith('gemini')) {
                    localStorage.setItem('gemini-api-key', geminiApiKey);
                } else {
                    localStorage.setItem('deepseek-api-key', deepseekApiKey);
                }
                notify({
                    type: "success",
                    message: "连接成功并已保存",
                    description: `${modelName} API连接测试通过，API Key已自动保存`
                });
            } else {
                setConnectionStatus('error');
                notify({
                    type: "error",
                    message: "连接失败",
                    description: "请检查API Key是否正确"
                });
            }
        } catch (error) {
            setConnectionStatus('error');
            notify({
                type: "error",
                message: "连接测试失败",
                description: error instanceof Error ? error.message : "未知错误"
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleTestGeminiConnection = async () => {
        if (!geminiApiKey.trim()) {
            notify({
                type: "error",
                message: "请输入Gemini API Key",
                description: "请先输入Gemini API Key再进行连接测试"
            });
            return;
        }

        setIsTestingConnection(true);
        setConnectionStatus('idle');

        try {
            aiService.setApiKey(geminiApiKey);
            aiService.setModel('gemini-2.5-flash');
            const isConnected = await aiService.testConnection();

            if (isConnected) {
                setConnectionStatus('success');
                localStorage.setItem('gemini-api-key', geminiApiKey);
                notify({
                    type: "success",
                    message: "Gemini连接成功并已保存",
                    description: "Gemini API连接测试通过，API Key已自动保存"
                });
            } else {
                setConnectionStatus('error');
                notify({
                    type: "error",
                    message: "Gemini连接失败",
                    description: "请检查Gemini API Key是否正确"
                });
            }
        } catch (error) {
            setConnectionStatus('error');
            notify({
                type: "error",
                message: "Gemini连接测试失败",
                description: error instanceof Error ? error.message : "未知错误"
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleTestDeepseekConnection = async () => {
        if (!deepseekApiKey.trim()) {
            notify({
                type: "error",
                message: "请输入DeepSeek API Key",
                description: "请先输入DeepSeek API Key再进行连接测试"
            });
            return;
        }

        setIsTestingConnection(true);
        setConnectionStatus('idle');

        try {
            aiService.setApiKey(deepseekApiKey);
            aiService.setModel('deepseek-chat');
            const isConnected = await aiService.testConnection();

            if (isConnected) {
                setConnectionStatus('success');
                localStorage.setItem('deepseek-api-key', deepseekApiKey);
                notify({
                    type: "success",
                    message: "DeepSeek连接成功并已保存",
                    description: "DeepSeek API连接测试通过，API Key已自动保存"
                });
            } else {
                setConnectionStatus('error');
                notify({
                    type: "error",
                    message: "DeepSeek连接失败",
                    description: "请检查DeepSeek API Key是否正确"
                });
            }
        } catch (error) {
            setConnectionStatus('error');
            notify({
                type: "error",
                message: "DeepSeek连接测试失败",
                description: error instanceof Error ? error.message : "未知错误"
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);

        try {
            // 保存设置到localStorage
            localStorage.setItem('ai-analysis-enabled', aiAnalysisEnabled);
            localStorage.setItem('auto-analysis-enabled', autoAnalysisEnabled);
            localStorage.setItem('ai-model', selectedModel);

            // 如果API Key还没有保存（连接测试失败的情况），则保存它
            const currentApiKey = selectedModel.startsWith('gemini') ? geminiApiKey : deepseekApiKey;
            if (currentApiKey && connectionStatus !== 'success') {
                if (selectedModel.startsWith('gemini')) {
                    localStorage.setItem('gemini-api-key', geminiApiKey);
                } else {
                    localStorage.setItem('deepseek-api-key', deepseekApiKey);
                }
                aiService.setApiKey(currentApiKey);
                aiService.setModel(selectedModel);
            }

            notify({
                type: "success",
                message: "设置已保存",
                description: "AI功能设置已成功保存"
            });
        } catch (error) {
            notify({
                type: "error",
                message: "保存失败",
                description: "保存AI设置时发生错误"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const getConnectionStatusIcon = () => {
        switch (connectionStatus) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
        }
    };

    const getConnectionStatusText = () => {
        switch (connectionStatus) {
            case 'success':
                return '连接正常';
            case 'error':
                return '连接失败';
            default:
                return '未测试';
        }
    };

    return (
        <div className="space-y-6">
            {/* 模型选择 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        <MixedText text="AI模型设置" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ai-model">
                            <MixedText text="选择AI模型" />
                        </Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择AI模型" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gemini-2.5-flash">
                                    <span>Gemini 2.5 Flash - 快速响应</span>
                                </SelectItem>
                                <SelectItem value="gemini-2.5-pro">
                                    <span>Gemini 2.5 Pro - 高质量分析</span>
                                </SelectItem>
                                <SelectItem value="deepseek-chat">
                                    <span>DeepSeek Chat - 通用对话</span>
                                </SelectItem>
                                <SelectItem value="deepseek-reasoner">
                                    <span>DeepSeek Reasoner - 深度思考</span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            <MixedText text="选择不同的AI模型来获得不同的分析效果" />
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* API Key 设置 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        <MixedText text="API Key 设置" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Gemini API Key */}
                    <div className="space-y-2">
                        <Label htmlFor="gemini-api-key">
                            <MixedText text="Gemini API Key" />
                        </Label>
                        <div className="relative">
                            <Input
                                id="gemini-api-key"
                                type={showGeminiKey ? "text" : "password"}
                                value={geminiApiKey}
                                onChange={(e) => setGeminiApiKey(e.target.value)}
                                placeholder="请输入您的Gemini API Key"
                                className="pr-20"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                onClick={() => setShowGeminiKey(!showGeminiKey)}
                            >
                                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleTestGeminiConnection}
                                disabled={isTestingConnection || !geminiApiKey.trim()}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <TestTube className="w-4 h-4" />
                                {isTestingConnection ? '测试中...' : '测试Gemini'}
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                <MixedText text="您可以在Google AI Studio获取免费的Gemini API Key" />
                            </p>
                        </div>
                    </div>

                    {/* DeepSeek API Key */}
                    <div className="space-y-2">
                        <Label htmlFor="deepseek-api-key">
                            <MixedText text="DeepSeek API Key" />
                        </Label>
                        <div className="relative">
                            <Input
                                id="deepseek-api-key"
                                type={showDeepseekKey ? "text" : "password"}
                                value={deepseekApiKey}
                                onChange={(e) => setDeepseekApiKey(e.target.value)}
                                placeholder="请输入您的DeepSeek API Key"
                                className="pr-20"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                            >
                                {showDeepseekKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleTestDeepseekConnection}
                                disabled={isTestingConnection || !deepseekApiKey.trim()}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <TestTube className="w-4 h-4" />
                                {isTestingConnection ? '测试中...' : '测试DeepSeek'}
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                <MixedText text="您可以在DeepSeek官网获取API Key" />
                            </p>
                        </div>
                    </div>

                    {connectionStatus === 'error' && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <MixedText text="连接测试失败，请检查API Key是否正确，或网络连接是否正常" />
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* AI功能开关 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        <MixedText text="AI功能设置" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="ai-analysis-enabled">
                                <MixedText text="启用AI分析" />
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                <MixedText text="开启后可以在成绩概览页面使用AI智能分析功能" />
                            </p>
                        </div>
                        <Switch
                            id="ai-analysis-enabled"
                            checked={aiAnalysisEnabled === 'true'}
                            onCheckedChange={(checked) => setAiAnalysisEnabled(checked ? 'true' : 'false')}
                            disabled={!geminiApiKey.trim() && !deepseekApiKey.trim()}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="auto-analysis-enabled">
                                <MixedText text="自动分析" />
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                <MixedText text="开启后每次录入新数据时自动进行AI分析" />
                            </p>
                        </div>
                        <Switch
                            id="auto-analysis-enabled"
                            checked={autoAnalysisEnabled === 'true'}
                            onCheckedChange={(checked) => setAutoAnalysisEnabled(checked ? 'true' : 'false')}
                            disabled={(!geminiApiKey.trim() && !deepseekApiKey.trim()) || aiAnalysisEnabled !== 'true'}
                        />
                    </div>

                    {(!geminiApiKey.trim() && !deepseekApiKey.trim()) && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <MixedText text="请至少设置一个API Key（Gemini或DeepSeek）" />
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* 使用说明 */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        <MixedText text="使用说明" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div>
                        <p className="font-medium mb-1">
                            <MixedText text="1. 选择AI模型" />
                        </p>
                        <p>
                            <MixedText text="选择Gemini或DeepSeek模型，不同模型有不同的分析特点" />
                        </p>
                    </div>
                    <div>
                        <p className="font-medium mb-1">
                            <MixedText text="2. 获取API Key" />
                        </p>
                        <p>
                            <MixedText text="Gemini: 访问Google AI Studio (https://aistudio.google.com/)" />
                        </p>
                        <p>
                            <MixedText text="DeepSeek: 访问DeepSeek官网 (https://platform.deepseek.com/)" />
                        </p>
                    </div>
                    <div>
                        <p className="font-medium mb-1">
                            <MixedText text="3. 配置设置" />
                        </p>
                        <p>
                            <MixedText text="输入API Key后点击对应的测试按钮，连接成功后会自动保存" />
                        </p>
                        <p>
                            <MixedText text="可以只配置一个API Key，也可以同时配置两个" />
                        </p>
                    </div>
                    <div>
                        <p className="font-medium mb-1">
                            <MixedText text="4. 使用AI分析" />
                        </p>
                        <p>
                            <MixedText text="在成绩概览页面的模块分析区域，点击AI分析按钮获取智能分析报告" />
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* 保存按钮 */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? '保存中...' : '保存设置'}
                </Button>
            </div>
        </div>
    );
}
