"use client";

import React from "react";
import ReactECharts from 'echarts-for-react';
import { FULL_EXAM_CONFIG, normalizeModuleName, getModuleColor, UNIFIED_LEGEND_STYLE } from "@/config/exam";
import { minutesToTimeString } from "@/lib/utils";

interface ModulePieChartProps {
    data: Array<{
        date: string;
        module: string;
        score: number;
        duration: number;
    }>;
}

// 使用统一的配置，不再需要重复定义

export const ModulePieChart: React.FC<ModulePieChartProps> = ({ data }) => {
    // 统计每个模块的总耗时和总题数（只统计有效记录，单位均为分钟）
    const moduleStats: Record<string, { duration: number; questions: number }> = {};
    data.forEach(item => {
        // 使用统一的模块名称映射
        const normalizedModule = normalizeModuleName(item.module);
        const duration = Number(item.duration); // 你的 duration 单位就是分钟
        // const total = Number((item as { total: number }).total); // 错误：data 没有 total 字段
        const total = 1; // 或者用其它合适的字段，比如 score，或直接用 1 代表每条记录一题
        if (!normalizedModule || !isFinite(duration) || !isFinite(total) || total <= 0 || duration <= 0) return;
        if (!moduleStats[normalizedModule]) {
            moduleStats[normalizedModule] = { duration: 0, questions: 0 };
        }
        moduleStats[normalizedModule].duration += duration;
        moduleStats[normalizedModule].questions += total;
    });

    const pieData = Object.entries(moduleStats).map(([name, stat]) => {
        const moduleKey = name as keyof typeof FULL_EXAM_CONFIG.modules;
        const standardQuestions = FULL_EXAM_CONFIG.modules[moduleKey]?.questions || 1;
        const avg = stat.questions > 0 ? stat.duration / stat.questions : 0;
        return {
            name: name, // 直接使用统一后的中文名称
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
                const totalTime = minutesToTimeString(data.avg * data.standardQuestions);
                const avgTime = minutesToTimeString(data.avg);
                return `${params.name}<br/>${data.standardQuestions}题 × ${avgTime}/题 = <b>${totalTime}</b>`;
            }
        },
        legend: {
            orient: 'vertical',
            left: 10,
            top: 20,
            formatter: (name: string) => name,
            ...UNIFIED_LEGEND_STYLE
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
                    fontFamily: 'Times New Roman, 思源宋体, serif',
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
                color: pieData.map(d => getModuleColor(d.name)),
                data: pieData,
            }
        ]
    };
    const baseTextStyle = { fontFamily: 'Times New Roman, 思源宋体, serif' } as const;
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
                theme={{ textStyle: baseTextStyle } as Record<string, unknown>}
            />
        </div>
    );
}; 