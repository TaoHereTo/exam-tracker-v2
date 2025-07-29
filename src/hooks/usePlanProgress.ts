import { useEffect } from "react";
import type { StudyPlan, RecordItem } from "@/types/record";

export function usePlanProgress(
    plans: StudyPlan[],
    setPlans: (plans: StudyPlan[]) => void,
    records: RecordItem[],
    calcPlanProgress: (plan: StudyPlan, records: RecordItem[]) => { progress: number; status: StudyPlan["status"] }
) {
    useEffect(() => {
        const updated = plans.map(plan => {
            const { progress, status } = calcPlanProgress(plan, records);
            return { ...plan, progress, status };
        });

        // 只有内容变化时才setPlans，避免死循环
        const isChanged = updated.some((p, i) => p.progress !== plans[i]?.progress || p.status !== plans[i]?.status);

        if (isChanged) {
            setPlans(updated);
        }
    }, [records, plans, calcPlanProgress, setPlans]);
} 