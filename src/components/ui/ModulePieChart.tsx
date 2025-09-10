"use client";

import React from "react";
import ReactECharts from 'echarts-for-react';
import { FULL_EXAM_CONFIG, normalizeModuleName, getModuleColor, UNIFIED_LEGEND_STYLE } from "@/config/exam";
import { minutesToTimeString } from "@/lib/utils";
import { useThemeMode } from "@/hooks/useThemeMode";
import { MixedText } from "@/components/ui/MixedText";

interface ModulePieChartProps {
    data: Array<{
        date: string;
        module: string;
        score: number;
        duration: number;
    }>;
    showLegend?: boolean;
}

// 使用统一的配置，不再需要重复定义

export const ModulePieChart: React.FC<ModulePieChartProps> = ({ data, showLegend = true }) => {
    const { isDarkMode } = useThemeMode();

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

    // 如果没有数据，显示提示信息
    if (pieData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="text-center text-gray-500">
                    <p className="text-lg"><MixedText text="暂无数据" /></p>
                    <p className="text-sm mt-2"><MixedText text="请先添加刷题记录以查看模块耗时分布" /></p>
                </div>
            </div>
        );
    }

    // 根据主题动态设置颜色
    const backgroundColor = isDarkMode ? '#101010' : '#F8F7F6';
    const textColor = isDarkMode ? '#e5e5e5' : '#333';
    // 图例文字在深色模式下使用黑色以提高可读性
    const legendTextColor = isDarkMode ? '#333' : '#333';
    const borderColor = isDarkMode ? '#101010' : '#F8F7F6';
    const tooltipBgColor = isDarkMode ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)';
    const tooltipBorderColor = isDarkMode ? '#404040' : '#e0e6f1';

    const option = {
        backgroundColor,
        tooltip: {
            show: false // Disable tooltip entirely
        },
        legend: showLegend ? {
            // Change to horizontal legend at the bottom for all screen sizes
            orient: 'horizontal',
            left: 'center',
            top: 'bottom',
            bottom: typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : 50,  // Increased mobile spacing
            itemGap: 15,
            itemWidth: 25,
            itemHeight: 14,
            padding: [10, 20, 10, 20],
            // Set width to 90% of container for better legend sizing
            width: '90%',
            height: 'auto',
            align: 'auto',
            type: 'plain',
            formatter: (name: string) => name,
            // Manually apply the unified legend style properties we want
            borderRadius: UNIFIED_LEGEND_STYLE.borderRadius,
            icon: UNIFIED_LEGEND_STYLE.icon,
            // 覆盖主题相关的样式
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.9)',
            borderColor: isDarkMode ? '#e0e6f1' : '#e0e6f1',
            borderWidth: UNIFIED_LEGEND_STYLE.borderWidth,
            shadowColor: UNIFIED_LEGEND_STYLE.shadowColor,
            shadowBlur: UNIFIED_LEGEND_STYLE.shadowBlur,
            textStyle: {
                ...UNIFIED_LEGEND_STYLE.textStyle,
                color: legendTextColor,
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: 'Times New Roman, 思源宋体, serif'
            }
        } : {
            show: false
        },
        // Remove the separate mobile legend configuration since we're using the same for all sizes
        series: [
            {
                name: '模块耗时分布',
                type: 'pie',
                radius: ['45%', '85%'],  // Increased size to better fill the container
                center: ['50%', '40%'],  // Move chart further upward
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: borderColor,
                    borderWidth: 2,
                },
                label: {
                    show: true,
                    formatter: '{b} ({d}%)',
                    color: textColor,
                    fontFamily: 'Times New Roman, 思源宋体, serif',
                },
                emphasis: {
                    scale: true,
                    scaleSize: 12,
                    itemStyle: {
                        shadowBlur: 20,
                        shadowOffsetX: 0,
                        shadowColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
                    }
                },
                color: pieData.map(d => getModuleColor(d.name)),
                data: pieData,
            }
        ]
    };
    const baseTextStyle = { fontFamily: 'Times New Roman, 思源宋体, serif' } as const;
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: showLegend ? (typeof window !== 'undefined' && window.innerWidth < 768 ? '0 0 120px 0' : '0 0 100px 0') : '0' }} className="chart-wrapper">
            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
                theme={{ textStyle: baseTextStyle } as Record<string, unknown>}
                key={`pie-${isDarkMode}`}
                className="chart-container"
            />
        </div>
    );
};
