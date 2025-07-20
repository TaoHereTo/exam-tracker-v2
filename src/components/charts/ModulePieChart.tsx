"use client";

import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

interface ModulePieChartProps {
    data: Array<{
        date: string;
        module: string;
        score: number;
        duration: number;
    }>;
}

const COLORS = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c", "#d0ed57", "#fa8072"
];

export const ModulePieChart: React.FC<ModulePieChartProps> = ({ data }) => {
    // 统计每个模块的总耗时
    const moduleDurationMap: Record<string, number> = {};
    data.forEach(item => {
        if (!moduleDurationMap[item.module]) {
            moduleDurationMap[item.module] = 0;
        }
        moduleDurationMap[item.module] += item.duration;
    });
    const pieData = Object.entries(moduleDurationMap).map(([name, value]) => ({ name, value }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    label
                >
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}; 