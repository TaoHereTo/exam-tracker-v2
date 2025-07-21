import { useEffect } from "react";

export function usePlanProgress(plans, setPlans, records, calcPlanProgress) {
    useEffect(() => {
        setPlans((prevPlans: any[]) => prevPlans.map(plan => {
            const { progress, status } = calcPlanProgress(plan, records);
            return { ...plan, progress, status };
        }));
    }, [records, setPlans, calcPlanProgress]);
} 