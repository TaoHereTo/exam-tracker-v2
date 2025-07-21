"use client";

import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Sector
} from "recharts";
import { FULL_EXAM_CONFIG } from "@/config/exam";
import { useState } from "react";

interface ModulePieChartProps {
    data: Array<{
        date: string;
        module: string;
        score: number;
        duration: number;
    }>;
}

const moduleColors: Record<string, string> = {
    '政治理论': '#3366FF',    // 亮蓝
    '常识判断': '#FFB300',    // 亮橙
    '言语理解': '#FF4C4C',    // 亮红
    '判断推理': '#00B8D9',    // 青色
    '数量关系': '#43D854',    // 亮绿
    '资料分析': '#A259FF',    // 亮紫
};

export const ModulePieChart: React.FC<ModulePieChartProps> = ({ data }) => {
    // 统计每个模块的总耗时和总题数（只统计有效记录，单位均为分钟）
    const moduleStats: Record<string, { duration: number; questions: number }> = {};
    data.forEach(item => {
        let duration = Number(item.duration); // 你的 duration 单位就是分钟
        let total = Number((item as any).total);
        if (!item.module || !isFinite(duration) || !isFinite(total) || total <= 0 || duration <= 0) return;
        if (!moduleStats[item.module]) {
            moduleStats[item.module] = { duration: 0, questions: 0 };
        }
        moduleStats[item.module].duration += duration;
        moduleStats[item.module].questions += total;
    });
    const pieData = Object.entries(moduleStats).map(([name, stat]) => {
        const standardQuestions = FULL_EXAM_CONFIG.modules[name]?.questions || 1;
        const avg = stat.questions > 0 ? stat.duration / stat.questions : 0;
        return {
            name,
            value: standardQuestions * avg, // 标准题数 × 平均用时
            avg,
            standardQuestions
        };
    });

    // 鼠标悬停高亮
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const onPieEnter = (_: any, index: number) => setActiveIndex(index);
    const onPieLeave = () => setActiveIndex(null);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    label={({ name, value }) => `${name}（${value.toFixed(2)}分钟）`}
                    activeIndex={activeIndex ?? undefined}
                    activeShape={props => (
                        <g>
                            <Sector {...props} outerRadius={130} />
                        </g>
                    )}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    isAnimationActive={true}
                    animationDuration={400}
                >
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={moduleColors[entry.name] || '#888888'} />
                    ))}
                </Pie>
                <Tooltip formatter={(_v, _n, { payload }) => {
                    if (!payload) return '';
                    const d = payload as any;
                    return [
                        `${d.standardQuestions}题 × ${d.avg.toFixed(2)}分钟/题 = ${(d.value).toFixed(2)}分钟`,
                        d.name
                    ];
                }} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}; 