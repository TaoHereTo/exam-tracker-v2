"use client";

import React from "react";
import ReactECharts from 'echarts-for-react';
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
            value: Number((standardQuestions * avg).toFixed(2)), // 标准题数 × 平均用时
            avg: Number(avg.toFixed(2)),
            standardQuestions
        };
    });
    // 颜色与模块一一对应
    const moduleColors: Record<string, string> = {
        '政治理论': '#3366FF',
        '常识判断': '#FFB300',
        '言语理解': '#FF4C4C',
        '判断推理': '#00B8D9',
        '数量关系': '#43D854',
        '资料分析': '#A259FF',
    };
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                return `${params.name}<br/>${params.data.standardQuestions}题 × ${params.data.avg}分钟/题 = <b>${params.value}分钟</b>`;
            }
        },
        legend: {
            orient: 'vertical',
            left: 10,
        },
        series: [
            {
                name: '模块耗时分布',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#fff',
                    borderWidth: 2,
                },
                label: {
                    show: true,
                    formatter: '{b} ({d}%)',
                },
                emphasis: {
                    scale: true,
                    scaleSize: 12,
                    itemStyle: {
                        shadowBlur: 20,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.3)'
                    }
                },
                color: pieData.map(d => moduleColors[d.name] || '#888'),
                data: pieData,
            }
        ]
    };
    return <ReactECharts option={option} style={{ height: 400, width: '100%' }} />;
}; 