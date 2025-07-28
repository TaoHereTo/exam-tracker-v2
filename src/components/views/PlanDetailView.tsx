import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { MODULES } from '@/config/exam';
import { UnifiedButton } from "@/components/ui/UnifiedButton";

interface StudyPlan {
    id: string;
    name: string;
    module: string;
    type: "题量" | "正确率" | "错题数";
    startDate: string;
    endDate: string;
    target: number;
    progress: number;
    status: "未开始" | "进行中" | "已完成" | "未达成";
    description?: string;
}

interface PlanDetailProps {
    plan: StudyPlan;
    onBack: () => void;
    onEdit: () => void;
    onUpdate: (plan: StudyPlan) => void;
}

export default function PlanDetailView({ plan, onBack, onEdit }: PlanDetailProps) {
    return (
        <div className="max-w-3xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardAction>
                        <UnifiedButton
                            variant="reactbits"
                            onClick={onBack}
                            size="sm"
                        >
                            返回
                        </UnifiedButton>
                        <UnifiedButton
                            variant="reactbits"
                            onClick={onEdit}
                            className="ml-2 bg-blue-400 hover:bg-blue-500 text-white border-blue-400 hover:border-blue-500"
                            size="sm"
                        >
                            编辑
                        </UnifiedButton>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">{plan.startDate} ~ {plan.endDate}</div>
                    <div className="mt-2 text-xs text-gray-400">{plan.description}</div>
                    <div className="mt-2 text-xs text-gray-400">类型：{plan.type}</div>
                    <div className="mt-2 text-xs text-gray-400">板块：{MODULES.find(m => m.value === plan.module)?.label || plan.module}</div>
                    <div className="mt-2 text-xs text-gray-400">目标：{plan.type === '题量' ? `${plan.target}题` : plan.type === '正确率' ? `${plan.target}%` : `${plan.target}道错题`}</div>
                    <div className="mt-2 text-xs text-gray-400">进度：{plan.type === '正确率' ? `${plan.progress}%` : `${plan.progress}/${plan.target}${plan.type === '题量' ? '题' : plan.type === '错题数' ? '道错题' : ''}`}</div>
                    <div className="mt-2 text-xs text-gray-400">状态：{plan.status}</div>
                    <div className="w-full h-2 bg-gray-200 rounded mt-2">
                        <div className="h-2 bg-primary rounded" style={{ width: `${Math.min(100, plan.type === '正确率' ? plan.progress : Math.round((plan.progress / plan.target) * 100))}%` }} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}