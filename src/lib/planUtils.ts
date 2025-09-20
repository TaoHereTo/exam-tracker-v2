import type { StudyPlan, RecordItem } from "@/types/record";
import { MODULE_NAME_MAP } from "@/config/exam";

// 统计计划进度
export function calcPlanProgress(plan: StudyPlan, records: RecordItem[]): { progress: number; status: StudyPlan["status"] } {
    // 只统计在计划时间范围内、指定板块的记录
    const start = new Date(plan.startDate + 'T00:00:00').getTime();
    const end = new Date(plan.endDate + 'T23:59:59').getTime();

    const filtered = records.filter(r => {
        const recordDate = new Date(r.date + 'T00:00:00').getTime();
        const isInRange = recordDate >= start && recordDate <= end;

        // 支持两种模块名称格式的匹配
        const isSameModule = r.module === plan.module ||
            r.module === MODULE_NAME_MAP[plan.module] ||
            plan.module === MODULE_NAME_MAP[r.module];

        return isSameModule && isInRange;
    });

    if (plan.type === "题量") {
        const total = filtered.reduce((sum, r) => sum + (r.total || 0), 0);
        let status: StudyPlan["status"] = "进行中";
        if (filtered.length === 0) status = "未开始";
        else if (total >= plan.target) status = "已完成";
        else if (new Date().getTime() > end) status = "未达成";
        return { progress: total, status };
    } else if (plan.type === "正确率") {
        const totalQ = filtered.reduce((sum, r) => sum + (r.total || 0), 0);
        const totalC = filtered.reduce((sum, r) => sum + (r.correct || 0), 0);
        const rate = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
        let status: StudyPlan["status"] = "进行中";
        if (filtered.length === 0) status = "未开始";
        else if (rate >= plan.target) status = "已完成";
        else if (new Date().getTime() > end) status = "未达成";
        return { progress: rate, status };
    } else if (plan.type === "错题数") {
        const wrong = filtered.reduce((sum, r) => sum + ((r.total || 0) - (r.correct || 0)), 0);
        let status: StudyPlan["status"] = "进行中";
        if (filtered.length === 0) status = "未开始";
        else if (wrong <= plan.target) status = "已完成";
        else if (new Date().getTime() > end) status = "未达成";
        return { progress: wrong, status };
    }
    return { progress: 0, status: "未开始" };
} 