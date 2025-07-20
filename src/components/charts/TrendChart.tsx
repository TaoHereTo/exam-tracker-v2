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

// data: 做题记录数组，score 字段为百分比（如 85 表示 85%）或每分钟得分
interface TrendChartProps {
    data: Array<{
        date: string;
        module: string;
        score: number;
        duration: number;
    }>;
}

// 颜色分配
const moduleColors: Record<string, string> = {
    '政治理论': '#8884d8',
    '常识判断': '#82ca9d',
    '言语理解': '#ffc658',
    '判断推理': '#ff7300',
    '数量关系': '#0088fe',
    '资料分析': '#00c49f',
    '全部': '#888888',
};

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
    // 获取所有日期，所有模块
    const allDates = Array.from(new Set(data.map(item => item.date))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const allModules = Array.from(new Set(data.map(item => item.module)));

    // 构造多模块折线数据结构
    const chartData = allDates.map(date => {
        const row: any = { date };
        allModules.forEach(module => {
            const found = data.find(item => item.date === date && item.module === module);
            row[module] = found ? found.score : undefined;
        });
        return row;
    });

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="date"
                    interval={0}
                    tickFormatter={date => {
                        // 只显示月日
                        const d = new Date(date);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    angle={-45}
                    textAnchor="end"
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value} />
                <Legend />
                {allModules.map(module => (
                    <Line
                        key={module}
                        type="monotone"
                        dataKey={module}
                        stroke={moduleColors[module] ? darkenColor(moduleColors[module], 0.7) : undefined}
                        name={module}
                        dot={false}
                        strokeWidth={3}
                        connectNulls={true}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};

function darkenColor(hex: string, factor = 0.7) {
    // hex: #RRGGBB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.floor(r * factor);
    g = Math.floor(g * factor);
    b = Math.floor(b * factor);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
} 