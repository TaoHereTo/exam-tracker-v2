"use client";

import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

// data: 做题记录数组，score 字段为百分比（如 85 表示 85%）
interface TrendChartProps {
    data: Array<{
        date: string;
        module: string;
        score: number;
        duration: number;
    }>;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
    // 将 score 转为 0-1 之间的小数用于 Y 轴
    const chartData = data.map(item => ({ ...item, score: item.score / 100 }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} />
                <Tooltip formatter={(value, name) => name === 'score' ? `${Math.round((value as number) * 100)}%` : value} />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#8884d8" name="正确率" />
            </LineChart>
        </ResponsiveContainer>
    );
}; 