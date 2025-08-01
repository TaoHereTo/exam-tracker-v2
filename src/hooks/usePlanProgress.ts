import { useEffect, useRef } from "react";
import type { StudyPlan, RecordItem } from "@/types/record";

export function usePlanProgress(
    plans: StudyPlan[],
    setPlans: (plans: StudyPlan[]) => void,
    records: RecordItem[],
    calcPlanProgress: (plan: StudyPlan, records: RecordItem[]) => { progress: number; status: StudyPlan["status"] }
) {
    const plansRef = useRef(plans);
    plansRef.current = plans;

    useEffect(() => {
        const updated = plansRef.current.map(plan => {
            const { progress, status } = calcPlanProgress(plan, records);
            return { ...plan, progress, status };
        });

        // 只有内容变化时才setPlans，避免死循环
        const isChanged = updated.some((p, i) => {
            const original = plansRef.current[i];
            return original && (p.progress !== original.progress || p.status !== original.status);
        });

        if (isChanged) {
            setPlans(updated);
        }
    }, [records, calcPlanProgress, setPlans]);
} 