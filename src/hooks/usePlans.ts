import { useState } from "react";

export interface StudyPlan {
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

export function usePlans(initialPlans: StudyPlan[] = []) {
    const [plans, setPlans] = useState<StudyPlan[]>(initialPlans);

    const createPlan = (plan: StudyPlan) => setPlans(prev => [plan, ...prev]);
    const updatePlan = (plan: StudyPlan) => setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
    const deletePlan = (id: string) => setPlans(prev => prev.filter(p => p.id !== id));

    return {
        plans,
        setPlans,
        createPlan,
        updatePlan,
        deletePlan,
    };
} 