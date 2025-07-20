"use client";

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import type { RecordItem } from '@/components/forms/NewRecordForm';
import React from 'react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

const MODULES = [
    '政治理论',
    '常识判断',
    '判断推理',
    '言语理解',
    '数量关系',
    '资料分析',
];

const MODULE_COLORS: Record<string, string> = {
    '政治理论': '#2563eb',
    '常识判断': '#059669',
    '判断推理': '#f59e42',
    '言语理解': '#e11d48',
    '数量关系': '#a21caf',
    '资料分析': '#64748b',
};

export function TrendChart({ records }: { records: RecordItem[] }) {
    // 处理数据：每个模块，每天的平均每分钟得分
    const datasets = MODULES.map(module => {
        // 先筛选出该模块的所有记录
        const moduleRecords = records.filter(r => r.module === module);
        // 按日期分组
        const dateMap: Record<string, { totalScore: number; totalMinutes: number; count: number }> = {};
        moduleRecords.forEach(r => {
            // 日期格式统一为 yyyy-MM-dd
            const date = new Date(r.date);
            const dateStr = date.toLocaleDateString('zh-CN');
            // 计算每分钟得分
            const minutes = parseInt(r.duration.split(':')[0]) + (parseInt(r.duration.split(':')[1]) || 0) / 60;
            const scorePerMin = minutes > 0 ? r.correct / minutes : 0;
            if (!dateMap[dateStr]) {
                dateMap[dateStr] = { totalScore: 0, totalMinutes: 0, count: 0 };
            }
            dateMap[dateStr].totalScore += scorePerMin;
            dateMap[dateStr].count += 1;
        });
        // 转换为 Chart.js 需要的点集
        const data = Object.entries(dateMap).map(([date, { totalScore, count }]) => ({
            x: date,
            y: count > 0 ? (totalScore / count) : 0,
        })).sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
        return {
            label: module,
            data,
            borderColor: MODULE_COLORS[module],
            backgroundColor: MODULE_COLORS[module] + '33', // 透明度
            tension: 0.3,
            spanGaps: true,
        };
    });

    const chartData = {
        datasets,
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: '各模块每日每分钟得分趋势' },
            tooltip: { mode: 'index', intersect: false },
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: {
            x: {
                type: 'time' as const,
                time: { unit: 'day', tooltipFormat: 'yyyy-MM-dd' },
                title: { display: true, text: '日期' },
            },
            y: {
                title: { display: true, text: '每分钟得分' },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <Line data={chartData} options={options} />
        </div>
    );
} 