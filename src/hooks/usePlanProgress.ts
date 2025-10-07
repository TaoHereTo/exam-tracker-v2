import { useEffect, useRef, useCallback } from "react";
import type { StudyPlan, RecordItem } from "@/types/record";

export function usePlanProgress(
    plans: StudyPlan[],
    setPlans: (plans: StudyPlan[]) => void,
    records: RecordItem[],
    calcPlanProgress: (plan: StudyPlan, records: RecordItem[]) => { progress: number; status: StudyPlan["status"] },
    onPlanCompleted?: (plan: StudyPlan) => void
) {
    const plansRef = useRef(plans);
    const recordsRef = useRef(records);
    const lastUpdateRef = useRef<string>('');

    // 深度比较函数
    const deepEqual = useCallback((a: unknown, b: unknown): boolean => {
        if (a === b) return true;
        if (typeof a !== typeof b) return false;
        if (typeof a !== 'object' || a === null || b === null) return false;

        const keysA = Object.keys(a as Record<string, unknown>);
        const keysB = Object.keys(b as Record<string, unknown>);

        if (keysA.length !== keysB.length) return false;

        for (const key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
        }

        return true;
    }, []);

    useEffect(() => {
        // 更新refs
        plansRef.current = plans;
        recordsRef.current = records;

        // 创建当前状态的哈希值用于比较
        const currentState = JSON.stringify({
            plans: plans.map(p => ({ id: p.id, progress: p.progress, status: p.status })),
            records: records.map(r => ({ id: r.id, date: r.date, module: r.module }))
        });

        // 如果状态没有变化，跳过更新
        if (currentState === lastUpdateRef.current) {
            return;
        }

        const updated = plans.map(plan => {
            const { progress, status } = calcPlanProgress(plan, records);
            return { ...plan, progress, status };
        });

        // 检查是否有计划完成状态的变化
        updated.forEach((updatedPlan, index) => {
            const originalPlan = plans[index];
            if (originalPlan &&
                originalPlan.status !== "已完成" &&
                updatedPlan.status === "已完成" &&
                onPlanCompleted) {
                // 计划刚刚完成，触发回调
                onPlanCompleted(updatedPlan);
            }
        });

        // 深度比较检查是否有实际变化
        const hasChanges = updated.some((updatedPlan, index) => {
            const originalPlan = plans[index];
            return !deepEqual(
                { progress: updatedPlan.progress, status: updatedPlan.status },
                { progress: originalPlan.progress, status: originalPlan.status }
            );
        });

        if (hasChanges) {
            lastUpdateRef.current = currentState;
            setPlans(updated);
        }
    }, [plans, records, calcPlanProgress, setPlans, onPlanCompleted]);
} 