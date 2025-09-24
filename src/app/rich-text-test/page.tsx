'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle, XCircle, Star } from 'lucide-react';
import Link from 'next/link';

// 导入富文本编辑器组件
import SimpleRichTextEditor from '@/components/rich-text-editors/SimpleRichTextEditor';

export default function RichTextTestPage() {
    const [simpleContent, setSimpleContent] = useState('');

    const editorFeatures = [
        { name: '所见即所得', simple: true },
        { name: '加粗/斜体', simple: true },
        { name: '标题支持', simple: true },
        { name: '列表支持', simple: true },
        { name: '链接插入', simple: true },
        { name: '图片上传', simple: true },
        { name: '代码块', simple: false },
        { name: '表格支持', simple: false },
        { name: '协作编辑', simple: false },
        { name: 'TypeScript支持', simple: true },
        { name: '轻量级', simple: true },
        { name: '易于定制', simple: true },
    ];

    const editorInfo = {
        name: '简单富文本编辑器',
        description: '基于 contentEditable 的轻量级富文本编辑器，无需额外依赖',
        pros: ['轻量级', '无依赖', '易于定制', '快速实现'],
        cons: ['功能有限', '浏览器兼容性', '不支持复杂功能'],
        rating: 3
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* 头部 */}
                <div className="mb-6">
                    <Link href="/">
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            返回主页
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        富文本编辑器测试页面
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        测试不同的富文本编辑器，找到最适合您需求的解决方案
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧：编辑器信息 */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* 编辑器信息卡片 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {editorInfo.name}
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < editorInfo.rating
                                                    ? 'text-yellow-400 fill-current'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </CardTitle>
                                <CardDescription>
                                    {editorInfo.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">优点：</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {editorInfo.pros.map((pro, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {pro}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">缺点：</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {editorInfo.cons.map((con, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {con}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 功能列表 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>支持功能</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {editorFeatures.map((feature, index) => (
                                        <div key={index} className="flex items-center justify-between py-1">
                                            <span className="text-sm">{feature.name}</span>
                                            <div className="flex gap-2">
                                                {feature.simple && (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                )}
                                                {!feature.simple && (
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 右侧：编辑器测试区域 */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>编辑器测试</CardTitle>
                                <CardDescription>
                                    测试简单富文本编辑器的功能和用户体验
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                                        <SimpleRichTextEditor
                                            content={simpleContent}
                                            onChange={setSimpleContent}
                                            placeholder="开始输入内容..."
                                        />
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <strong>当前内容：</strong>
                                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto min-h-[60px]">
                                            {simpleContent || '(空内容)'}
                                        </pre>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
