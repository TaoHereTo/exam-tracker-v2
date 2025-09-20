import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MODULES } from '@/config/exam';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MixedText } from "@/components/ui/MixedText";
import { StudyPlan } from "@/types/record";

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
        <div className="w-full">
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <MixedText text={plan.name} />
                        <Button
                            onClick={onBack}
                            variant="outline"
                            size="sm"
                            className="h-9"
                        >
                            返回
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground"><MixedText text={`${plan.startDate} ~ ${plan.endDate}`} /></div>
                    <div className="mt-2 text-xs text-gray-700 dark:text-gray-300"><MixedText text={plan.description || ''} /></div>
                    <div className="mt-2 text-xs text-gray-700 dark:text-gray-300"><MixedText text={`类型：${plan.type}`} /></div>
                    <div className="mt-2 text-xs text-gray-700 dark:text-gray-300"><MixedText text={`板块：${MODULES.find(m => m.value === plan.module)?.label || plan.module}`} /></div>
                    <div className="mt-2 text-xs text-gray-700 dark:text-gray-300"><MixedText text={`目标：${plan.type === '题量' ? `${plan.target}题` : plan.type === '正确率' ? `${plan.target}%` : `${plan.target}道错题`}`} /></div>
                    <div className="mt-2 text-xs text-gray-700 dark:text-gray-300"><MixedText text={`进度：${plan.type === '正确率' ? `${plan.progress}%` : `${plan.progress}/${plan.target}${plan.type === '题量' ? '题' : plan.type === '错题数' ? '道错题' : ''}`}`} /></div>
                    <div className="mt-2 text-xs text-gray-700 dark:text-gray-300"><MixedText text={`状态：${plan.status}`} /></div>
                    <div className="mt-4">
                        <Progress
                            value={getProgressPercentage(plan)}
                            variant="plan"
                            showText={true}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}