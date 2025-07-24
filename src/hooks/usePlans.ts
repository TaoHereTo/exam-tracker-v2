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

// usePlans 已被移除，全部由 useLocalStorageState 取代 