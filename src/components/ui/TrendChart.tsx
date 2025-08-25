"use client";

import React, { useMemo, useState, useEffect } from "react";
import ReactECharts from 'echarts-for-react';
import { getModuleColor, UNIFIED_LEGEND_STYLE } from "@/config/exam";
import { useThemeMode } from "@/hooks/useThemeMode";
import { MixedText } from "@/components/ui/MixedText";

// data: 做题记录数组，score 字段为百分比（如 85 表示 85%）或每分钟得分
interface TrendChartProps {
    data: Array<{
        date: string;
        module: string;
        score: number;
        duration: number;
    }>;
    yMax?: number;
}

// 使用统一的配置，不再需要重复定义

export const TrendChart: React.FC<TrendChartProps & { onlyModule?: string }> = ({ data, onlyModule, yMax }) => {
    // 添加强制重新渲染的机制
    const [forceUpdate, setForceUpdate] = useState(0);
    const { isDarkMode } = useThemeMode();

    // 当数据变化时强制重新渲染
    useEffect(() => {
        setForceUpdate(prev => prev + 1);
    }, [data]);

    // 简化去重逻辑，只基于日期和模块去重，避免误删新记录
    const dedupedData = data.filter((item, idx, arr) =>
        arr.findIndex(other =>
            other.date === item.date &&
            other.module === item.module
        ) === idx
    );

    const { allModules, allDates, chartData } = useMemo(() => {
        let modules: string[] = [];
        let dates: string[] = [];
        let data: Record<string, unknown>[] = [];

        if (dedupedData.length > 0) {
            if (onlyModule) {
                modules = [onlyModule];
                dates = dedupedData.map(item => item.date);
                data = dedupedData;
            } else if ('module' in dedupedData[0]) {
                modules = Array.from(new Set(dedupedData.map(item => (item as { module: string }).module)));
                // 确保日期按时间顺序排序
                dates = Array.from(new Set(dedupedData.map(item => item.date))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

                data = dates.map(date => {
                    const row: Record<string, unknown> = { date };
                    modules.forEach(module => {
                        const found = dedupedData.find(item => item.date === date && item.module === module);
                        // 直接使用原始模块名称，不进行映射转换
                        row[module] = found ? found.score : null;
                    });
                    return row;
                });
                // 不进行模块名称映射，直接使用原始名称
            } else {
                modules = Object.keys(dedupedData[0]).filter(k => k !== 'date' && k !== 'duration');
                dates = dedupedData.map(item => item.date);
                data = dedupedData;
            }
        }

        return { allModules: modules, allDates: dates, chartData: data };
    }, [dedupedData, onlyModule]);

    // 如果没有数据，显示提示信息
    const renderNoDataMessage = () => {
        if (allModules.length === 0 || allDates.length === 0) {
            return (
                <div className="flex items-center justify-center h-full w-full">
                    <div className="text-center text-gray-500">
                        <p className="text-lg"><MixedText text="暂无数据" /></p>
                        <p className="text-sm mt-2"><MixedText text="请先添加刷题记录以查看趋势图表" /></p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const option = useMemo(() => {
        // 根据主题动态设置颜色
        const backgroundColor = isDarkMode ? 'hsl(var(--background))' : '#F8F7F6';
        const textColor = isDarkMode ? '#e5e5e5' : '#333';
        // 图例文字在深色模式下使用黑色以提高可读性
        const legendTextColor = isDarkMode ? '#333' : '#333';
        const borderColor = isDarkMode ? '#404040' : '#e0e6f1';
        const splitLineColor = isDarkMode ? '#2a2a2a' : '#f5f7fa';
        const tooltipBgColor = isDarkMode ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)';
        const tooltipBorderColor = isDarkMode ? '#404040' : '#e0e6f1';

        return {
            backgroundColor,
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'line' },
                backgroundColor: tooltipBgColor,
                borderColor: tooltipBorderColor,
                borderWidth: 1,
                textStyle: { color: textColor, fontSize: 14, fontFamily: 'Times New Roman, 思源宋体, serif' },
                extraCssText: 'box-shadow: 0 4px 16px rgba(51,102,255,0.08); border-radius: 8px;',
                formatter: function (params: Array<Record<string, unknown>>) {
                    let res = `<b>${params[0].axisValueLabel}</b><br/>`;
                    params.forEach((item: Record<string, unknown>) => {
                        const val = (typeof item.value === 'number' && !isNaN(item.value))
                            ? item.value
                            : (Array.isArray(item.value) && typeof item.value[1] === 'number' ? item.value[1] : null);
                        if (val !== null) {
                            res += `${item.marker}${item.seriesName}：<b>${Number(val).toFixed(2)}</b><br/>`;
                        }
                    });
                    return res;
                }
            },
            legend: {
                data: allModules,
                top: 20,
                left: 0,
                orient: 'vertical',
                ...UNIFIED_LEGEND_STYLE,
                // 覆盖主题相关的样式
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.9)',
                borderColor: isDarkMode ? '#e0e6f1' : '#e0e6f1',
                textStyle: {
                    color: legendTextColor,
                    fontSize: 14,
                    fontWeight: 'bold',
                    fontFamily: 'Times New Roman, 思源宋体, serif'
                }
            },
            // Add a separate legend for mobile with two-column layout at the bottom
            media: [
                {
                    query: { maxWidth: 768 },
                    option: {
                        legend: {
                            orient: 'horizontal',
                            left: 'center',
                            top: 'bottom',
                            bottom: 10,
                            itemGap: 10,
                            itemWidth: 14,
                            itemHeight: 14,
                            padding: [10, 10, 10, 10],
                            textStyle: {
                                width: 40,
                                overflow: 'truncate'
                            },
                            // Set a specific width and use flex wrap to create two rows
                            width: 150,
                            height: 40,
                            align: 'auto'
                        },
                        grid: {
                            left: 60,
                            right: 20,
                            top: 20,
                            bottom: 100
                        }
                    }
                }
            ],
            grid: {
                left: 130,
                right: 80,
                top: 40,
                bottom: 60,
                borderColor: borderColor,
                borderWidth: 1,
                containLabel: true,
                // Mobile responsive grid adjustments for two-column legend
                responsive: [
                    {
                        query: { maxWidth: 768 },
                        option: {
                            left: 60,
                            right: 20,
                            top: 20,
                            bottom: 100
                        }
                    }
                ]
            },
            xAxis: {
                type: 'category',
                data: allDates,
                axisLabel: {
                    formatter: function (value: string) {
                        const d = new Date(value);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                    },
                    rotate: -45,
                    fontSize: 13,
                    color: textColor,
                    fontWeight: 500,
                    fontFamily: 'Times New Roman, 思源宋体, serif'
                },
                axisTick: { alignWithLabel: true },
                axisLine: { lineStyle: { color: borderColor, width: 2 } },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                max: yMax,
                axisLabel: { fontSize: 13, color: textColor, fontWeight: 500, fontFamily: 'Times New Roman, 思源宋体, serif' },
                axisLine: { lineStyle: { color: borderColor, width: 2 } },
                splitLine: { lineStyle: { color: splitLineColor, width: 1, type: 'dashed' } }
            },
            series: allModules.map(module => ({
                name: module,
                type: 'line',
                data: chartData.map(row => row[module]),
                smooth: false,
                showSymbol: false,
                symbol: 'circle',
                symbolSize: 10,
                lineStyle: {
                    width: 5,
                    color: getModuleColor(module),
                    shadowColor: getModuleColor(module),
                    shadowBlur: 10,
                    shadowOffsetY: 2,
                    cap: 'round',
                    join: 'round'
                },
                itemStyle: {
                    color: getModuleColor(module),
                    borderColor: isDarkMode ? 'hsl(var(--background))' : '#F8F7F6',
                    borderWidth: 2,
                    shadowColor: getModuleColor(module),
                    shadowBlur: 8
                },
                connectNulls: true, // 连接null值，保持线条连续
                emphasis: {
                    focus: 'series',
                    showSymbol: true,
                    lineStyle: { width: 7 },
                    itemStyle: { borderWidth: 4 }
                }
            }))
        };
    }, [allModules, allDates, chartData, yMax, isDarkMode]);

    // 如果没有数据，显示提示信息
    const noDataMessage = renderNoDataMessage();
    if (noDataMessage) {
        return noDataMessage;
    }

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                key={`${forceUpdate}-${allDates.join(',')}-${allModules.join(',')}-${isDarkMode}`}
                notMerge={true}
                lazyUpdate={false}
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
}; 