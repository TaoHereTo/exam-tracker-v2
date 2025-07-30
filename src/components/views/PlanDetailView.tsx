import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MODULES } from '@/config/exam';
import { UnifiedButton } from "@/components/ui/UnifiedButton";
import { BeautifulProgress } from "@/components/ui/BeautifulProgress";


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

export default function PlanDetailView({ plan, onBack }: PlanDetailProps) {
    // 计算进度百分比
    const getProgressPercentage = (plan: StudyPlan) => {
        if (plan.type === '正确率') {
            return plan.progress; // 正确率本身就是百分比
        } else {
            return plan.target > 0 ? Math.min((plan.progress / plan.target) * 100, 100) : 0;
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>{plan.name}</span>
                        <UnifiedButton
                            variant="reactbits"
                            onClick={onBack}
                            size="sm"
                            gradient="gray"
                        >
                            返回
                        </UnifiedButton>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">{plan.startDate} ~ {plan.endDate}</div>
                    <div className="mt-2 text-xs text-gray-400">{plan.description}</div>
                    <div className="mt-2 text-xs text-gray-400">类型：{plan.type}</div>
                    <div className="mt-2 text-xs text-gray-400">板块：{MODULES.find(m => m.value === plan.module)?.label || plan.module}</div>
                    <div className="mt-2 text-xs text-gray-400">目标：{plan.type === '题量' ? `${plan.target}题` : plan.type === '正确率' ? `${plan.target}%` : `${plan.target}道错题`}</div>
                    <div className="mt-2 text-xs text-gray-400">进度：{plan.type === '正确率' ? `${plan.progress}%` : `${plan.progress}/${plan.target}${plan.type === '题量' ? '题' : plan.type === '错题数' ? '道错题' : ''}`}</div>
                    <div className="mt-2 text-xs text-gray-400">状态：{plan.status}</div>
                    <div className="mt-4">
                        <BeautifulProgress
                            value={getProgressPercentage(plan)}
                            max={100}
                            height={20}
                            showText={true}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}