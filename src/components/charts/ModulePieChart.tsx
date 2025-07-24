"use client";

import React from "react";
import ReactECharts from 'echarts-for-react';
import { FULL_EXAM_CONFIG } from "@/config/exam";

interface ModulePieChartProps {
    data: Array<{
        date: string;
        module: string;
        score: number;
        duration: number;
    }>;
}

const moduleLabelMap: Record<string, string> = {
    'data-analysis': '资料分析',
    'politics': '政治理论',
    'math': '数量关系',
    'common': '常识判断',
    'verbal': '言语理解',
    'logic': '判断推理',
    '资料分析': '资料分析',
    '政治理论': '政治理论',
    '数量关系': '数量关系',
    '常识判断': '常识判断',
    '言语理解': '言语理解',
    '判断推理': '判断推理',
};
const moduleColors: Record<string, string> = {
    'data-analysis': '#A259FF',
    'politics': '#3366FF',
    'math': '#43D854',
    'common': '#FFB300',
    'verbal': '#FF4C4C',
    'logic': '#00B8D9',
    '资料分析': '#A259FF',
    '政治理论': '#3366FF',
    '数量关系': '#43D854',
    '常识判断': '#FFB300',
    '言语理解': '#FF4C4C',
    '判断推理': '#00B8D9',
};

export const ModulePieChart: React.FC<ModulePieChartProps> = ({ data }) => {
    // 统计每个模块的总耗时和总题数（只统计有效记录，单位均为分钟）
    const moduleStats: Record<string, { duration: number; questions: number }> = {};
    data.forEach(item => {
        const duration = Number(item.duration); // 你的 duration 单位就是分钟
        // const total = Number((item as { total: number }).total); // 错误：data 没有 total 字段
        const total = 1; // 或者用其它合适的字段，比如 score，或直接用 1 代表每条记录一题
        if (!item.module || !isFinite(duration) || !isFinite(total) || total <= 0 || duration <= 0) return;
        if (!moduleStats[item.module]) {
            moduleStats[item.module] = { duration: 0, questions: 0 };
        }
        moduleStats[item.module].duration += duration;
        moduleStats[item.module].questions += total;
    });
    const pieData = Object.entries(moduleStats).map(([name, stat]) => {
        const moduleKey = moduleLabelMap[name] as keyof typeof FULL_EXAM_CONFIG.modules;
        const standardQuestions = FULL_EXAM_CONFIG.modules[moduleKey]?.questions || 1;
        const avg = stat.questions > 0 ? stat.duration / stat.questions : 0;
        return {
            name: moduleLabelMap[name] || name,
            value: Number((standardQuestions * avg).toFixed(2)), // 标准题数 × 平均用时
            avg: Number(avg.toFixed(2)),
            standardQuestions
        };
    });
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params: Record<string, unknown>) => {
                const data = params.data as { standardQuestions: number; avg: number };
                return `${params.name}<br/>${data.standardQuestions}题 × ${data.avg}分钟/题 = <b>${params.value}分钟</b>`;
            }
        },
        legend: {
            orient: 'vertical',
            left: 10,
            formatter: (name: string) => name,
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