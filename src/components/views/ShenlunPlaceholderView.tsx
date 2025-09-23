"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileEdit, Lightbulb } from "lucide-react";

export default function ShenlunPlaceholderView() {
    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center gap-3">
                <FileEdit className="h-8 w-8 text-orange-600" />
                <div>
                    <h1 className="text-3xl font-bold">暂定</h1>
                    <p className="text-muted-foreground">此功能正在规划中，敬请期待</p>
                </div>
            </div>

            {/* 占位内容 */}
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="relative mb-6">
                        <FileEdit className="h-16 w-16 text-muted-foreground" />
                        <Lightbulb className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
                    </div>

                    <h3 className="text-xl font-semibold mb-4">功能开发中</h3>

                    <div className="text-center text-muted-foreground max-w-md">
                        <p className="mb-4">
                            这个板块的具体功能还在规划中。如果您有任何想法或建议，欢迎提出！
                        </p>

                        <div className="bg-muted/50 rounded-lg p-4 text-sm">
                            <p className="font-medium mb-2">可能的功能方向：</p>
                            <ul className="text-left space-y-1">
                                <li>• 申论写作练习</li>
                                <li>• 素材库管理</li>
                                <li>• 写作模板</li>
                                <li>• 评分系统</li>
                                <li>• 其他相关功能...</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
