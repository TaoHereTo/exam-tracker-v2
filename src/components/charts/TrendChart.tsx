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
    '政治理论': '#3366FF',    // 亮蓝
    '常识判断': '#FFB300',    // 亮橙
    '言语理解': '#FF4C4C',    // 亮红
    '判断推理': '#00B8D9',    // 青色
    '数量关系': '#43D854',    // 亮绿
    '资料分析': '#A259FF',    // 亮紫
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
                        stroke={moduleColors[module] || undefined}
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