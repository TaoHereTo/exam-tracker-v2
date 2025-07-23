import { useEffect } from "react";
import type { StudyPlan, RecordItem } from "@/types/record";

export function usePlanProgress(
    plans: StudyPlan[],
    setPlans: (plans: StudyPlan[]) => void,
    records: RecordItem[],
    calcPlanProgress: (plan: StudyPlan, records: RecordItem[]) => { progress: number; status: StudyPlan["status"] }
) {
    useEffect(() => {
        setPlans((prevPlans: any[]) => prevPlans.map(plan => {
            const { progress, status } = calcPlanProgress(plan, records);
            return { ...plan, progress, status };
        }));
    }, [records, setPlans, calcPlanProgress]);
} 