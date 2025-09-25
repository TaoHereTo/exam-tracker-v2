import React, { useMemo, useState, useCallback } from "react";
import { UnifiedTabs, UnifiedTabsList, UnifiedTabsTrigger, UnifiedTabsContent, UnifiedTabsContents } from '@/components/ui/UnifiedTabs';
import { normalizeModuleName, getModuleScore, getModuleColor, UNIFIED_LEGEND_STYLE } from "@/config/exam";
import { TrendChart } from "@/components/ui/TrendChart";
import { ModulePieChart } from "@/components/ui/ModulePieChart";
import ReactECharts from 'echarts-for-react';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/animate-ui/components/animate/tooltip";
import type { RecordItem } from "@/types/record";
import { timeStringToMinutes } from "@/lib/utils";
import { MixedText } from "@/components/ui/MixedText";
import { useThemeMode } from "@/hooks/useThemeMode";


// 使用统一的配置，不再需要重复定义

// 能力指数计算函数
function calcAbilityIndex({ accuracy, perMinute, total }: { accuracy: number; perMinute: number; total: number }, weights = { accuracy: 0.5, perMinute: 0.3, total: 0.2 }) {
    // 参数均已归一化到0~1
    return (
        (accuracy * (weights.accuracy ?? 0)) +
        (perMinute * (weights.perMinute ?? 0)) +
        (total * (weights.total ?? 0))
    );
}

const ModuleRadarChart = React.memo(function ModuleRadarChart({ data }: { data: RecordItem[] }) {
    const { isDarkMode, mounted } = useThemeMode();

    // 统计每个模块的参数 - 使用useMemo优化
    const moduleStats = useMemo(() => {
        const stats: Record<string, { correct: number; total: number; duration: number }> = {};
        data.forEach(item => {
            const key = normalizeModuleName(item.module);
            if (!stats[key]) {
                stats[key] = { correct: 0, total: 0, duration: 0 };
            }
            stats[key].correct += Number(item.correct) || 0;
            stats[key].total += Number(item.total) || 0;
            stats[key].duration += timeStringToMinutes(item.duration) || 0;
        });
        return stats;
    }, [data]);

    // 只使用中文模块名称 - 使用useMemo优化
    const modules = useMemo(() => {
        return Object.keys(moduleStats).filter(m => !m.match(/^[a-z-]+$/));
    }, [moduleStats]);

    // 根据主题动态设置颜色 - 使用更稳定的依赖项
    const themeColors = useMemo(() => ({
        backgroundColor: isDarkMode ? '#161618' : '#F5F4F7',
        textColor: isDarkMode ? '#e5e5e5' : '#333',
        legendTextColor: isDarkMode ? '#333' : '#333',
        borderColor: isDarkMode ? '#404040' : '#e0e6f1',
        splitLineColor: isDarkMode ? '#404040' : '#e0e6f1',
        splitAreaColor1: isDarkMode ? '#2a2a2a' : '#f5f7fa',
        splitAreaColor2: isDarkMode ? '#1a1a1a' : '#fff',
        axisLineColor: isDarkMode ? '#666' : '#aaa',
        tooltipBgColor: isDarkMode ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)',
        tooltipBorderColor: isDarkMode ? '#404040' : '#e0e6f1',
    }), [isDarkMode]);

    // 归一化参数 - 使用useMemo优化
    const { maxTotal, maxPerMinute, perMinuteMap, values, pointColors } = useMemo(() => {
        if (modules.length === 0) {
            return { maxTotal: 1, maxPerMinute: 1, perMinuteMap: {}, values: [], pointColors: [] };
        }
        let maxTotal = 1, maxPerMinute = 1;
        const perMinuteMap: Record<string, number> = {};
        modules.forEach(module => {
            const stat = moduleStats[module] || { correct: 0, total: 0, duration: 0 };
            const scorePerQ = getModuleScore(module);
            const perMinute = stat.duration > 0 ? (scorePerQ * stat.correct) / stat.duration : 0;
            perMinuteMap[module] = perMinute;
            if (stat.total > maxTotal) maxTotal = stat.total;
            if (perMinute > maxPerMinute) maxPerMinute = perMinute;
        });

        // 能力指数=加权（归一化正确率、每分钟得分、做题量）
        const values = modules.map(module => {
            const stat = moduleStats[module] || { correct: 0, total: 0, duration: 0 };
            const accuracy = stat.total > 0 ? stat.correct / stat.total : 0;
            const perMinute = stat.duration > 0 ? perMinuteMap[module] / maxPerMinute : 0; // 归一化
            const totalNorm = stat.total / maxTotal; // 归一化
            return Number((calcAbilityIndex({ accuracy, perMinute, total: totalNorm }) * 100).toFixed(2));
        });

        // 构造点颜色数组
        const pointColors = modules.map(m => getModuleColor(m));

        return { maxTotal, maxPerMinute, perMinuteMap, values, pointColors };
    }, [modules, moduleStats]);

    // 构造线条渐变色和指示器 - 使用useMemo优化
    const { lineGradient, indicator } = useMemo(() => {
        if (modules.length === 0) {
            return { lineGradient: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [] }, indicator: [] };
        }
        const lineGradient = {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: modules.map((m, i) => ({
                offset: modules.length > 1 ? i / (modules.length - 1) : 0,
                color: getModuleColor(m)
            }))
        };

        const indicator = modules.map(module => ({
            name: module,
            max: 100
        }));

        return { lineGradient, indicator };
    }, [modules]);

    const option = useMemo(() => {
        if (modules.length === 0) {
            return {
                backgroundColor: themeColors.backgroundColor,
                tooltip: { show: false },
                radar: { show: false },
                legend: { show: false },
                series: []
            };
        }
        return {
            backgroundColor: themeColors.backgroundColor,
            tooltip: {
                trigger: 'item',
                backgroundColor: themeColors.tooltipBgColor,
                borderColor: themeColors.tooltipBorderColor,
                borderWidth: 1,
                textStyle: {
                    color: themeColors.textColor,
                    fontFamily: '思源宋体, Times New Roman, serif'
                },
                formatter: function (params: Record<string, unknown>) {
                    return `${params.marker}${params.seriesName}<br/>${(params.value as number[]).map((v: number, idx: number) => `${modules[idx]}：${v}`).join('<br/>')}`;
                }
            },
            radar: {
                indicator,
                splitNumber: 5,
                radius: typeof window !== 'undefined' && window.innerWidth < 768 ? '60%' : '75%',
                center: ['50%', '50%'],  // 居中显示
                axisName: {
                    color: themeColors.textColor,
                    fontWeight: 'bold',
                    fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 12 : 15,
                    fontFamily: '思源宋体, Times New Roman, serif'
                },
                splitLine: {
                    lineStyle: {
                        color: themeColors.splitLineColor,
                        type: 'solid'
                    }
                },
                splitArea: {
                    areaStyle: {
                        color: [themeColors.splitAreaColor1, themeColors.splitAreaColor2]
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: themeColors.axisLineColor
                    }
                },
            },
            legend: {
                show: false
            },
            series: [
                {
                    name: '模块能力值',
                    type: 'radar',
                    data: [
                        {
                            value: values,
                            name: '能力值',
                            areaStyle: {
                                color: 'rgba(51,102,255,0.10)'
                            },
                            lineStyle: {
                                color: lineGradient,
                                width: typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 4,
                                shadowColor: '#3366FF',
                                shadowBlur: typeof window !== 'undefined' && window.innerWidth < 768 ? 5 : 10
                            },
                            symbol: 'circle',
                            symbolSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : 14,
                            itemStyle: {
                                color: function (params: unknown) {
                                    const idx = (params as { dataIndex: number }).dataIndex;
                                    return pointColors[idx] || '#3366FF';
                                },
                                borderColor: isDarkMode ? 'hsl(var(--background))' : '#FFFFFF',
                                borderWidth: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 2,
                                shadowColor: function (params: unknown) {
                                    const idx = (params as { dataIndex: number }).dataIndex;
                                    return pointColors[idx] || '#3366FF';
                                },
                                shadowBlur: typeof window !== 'undefined' && window.innerWidth < 768 ? 4 : 8
                            },
                            markPoint: {
                                symbol: 'circle',
                                symbolSize: 18,
                                label: { show: false },
                                data: values.map((v, i) => ({
                                    coord: [modules[i], v],
                                    value: v,
                                    itemStyle: { color: pointColors[i] }
                                })),
                                tooltip: { show: true }
                            },
                            label: {
                                color: themeColors.textColor,
                                fontFamily: '思源宋体, Times New Roman, serif'
                            }
                        }
                    ],
                    animation: true
                }
            ]
        };
    }, [themeColors, indicator, modules, values, pointColors, lineGradient, isDarkMode]);
    // 如果组件还未挂载，返回占位符避免闪烁
    if (!mounted) {
        return <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">加载中...</div>;
    }

    // 如果没有模块数据，显示提示信息
    if (modules.length === 0) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="text-center text-gray-500">
                    <p className="text-lg"><MixedText text="暂无数据" /></p>
                    <p className="text-sm mt-2"><MixedText text="请先添加刷题记录以查看模块能力分析" /></p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1">
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    key={`radar-${isDarkMode}`}
                />
            </div>
            <div className="text-center text-xs text-gray-500 mt-2 pb-2">
                能力值 = <span className="font-bold"><MixedText text="正确率 × 0.5 + 每分钟得分 × 0.3 + 做题量 × 0.2" /></span>
            </div>
        </div>
    );
});

interface ChartsViewProps {
    records: RecordItem[];
}

export const ChartsView = function ChartsView({ records }: ChartsViewProps) {
    // 使用useMemo优化数据处理 - 添加更稳定的依赖项
    const perMinuteData = useMemo(() => {
        const groupMap: Record<string, { date: string; module: string; correct: number; duration: number }> = {};
        records.forEach(r => {
            // 使用统一的模块名称映射
            const normalizedModule = normalizeModuleName(r.module);
            const key = `${r.date}__${normalizedModule}`;
            const correct = Number(r.correct) || 0;
            const duration = timeStringToMinutes(r.duration) || 0;
            if (!groupMap[key]) {
                groupMap[key] = { date: r.date, module: normalizedModule, correct: 0, duration: 0 };
            }
            groupMap[key].correct += correct;
            groupMap[key].duration += duration;
        });

        const chartData = Object.values(groupMap).map(item => ({
            date: item.date,
            module: item.module,
            score: item.duration > 0 ? getModuleScore(item.module) * item.correct / item.duration : 0,
            duration: item.duration,
        }));

        // 按日期排序
        chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return chartData;
    }, [records]);

    const accuracyData = useMemo(() => {
        const groupMap: Record<string, { date: string; module: string; correct: number; total: number }> = {};
        records.forEach(r => {
            // 使用统一的模块名称映射
            const normalizedModule = normalizeModuleName(r.module);
            const key = `${r.date}__${normalizedModule}`;
            const correct = Number(r.correct) || 0;
            const total = Number(r.total) || 0;
            if (!groupMap[key]) {
                groupMap[key] = { date: r.date, module: normalizedModule, correct: 0, total: 0 };
            }
            groupMap[key].correct += correct;
            groupMap[key].total += total;
        });

        const chartData = Object.values(groupMap).map(item => ({
            date: item.date,
            module: item.module,
            score: item.total > 0 ? (item.correct / item.total) * 100 : 0,
            duration: 0,
        }));

        // 按日期排序
        chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return chartData;
    }, [records]);

    // 为pie chart添加useMemo优化，避免tabs切换时重新计算
    const pieChartData = useMemo(() => {
        return records.map(r => {
            return {
                date: r.date,
                module: normalizeModuleName(r.module),
                score: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
                duration: timeStringToMinutes(r.duration) || 0
            };
        });
    }, [records]);

    return (
        <UnifiedTabs defaultValue="perMinute" className="w-full">
            <div className="flex justify-center mb-4 sm:mb-8">
                <UnifiedTabsList className="grid w-fit min-w-[200px] grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
                    <UnifiedTabsTrigger value="perMinute" className="text-xs sm:text-sm px-2 sm:px-4 py-1 flex items-center justify-center"><MixedText text="每分钟得分" /></UnifiedTabsTrigger>
                    <UnifiedTabsTrigger value="accuracy" className="text-xs sm:text-sm px-2 sm:px-4 py-1 flex items-center justify-center"><MixedText text="正确率" /></UnifiedTabsTrigger>
                    <UnifiedTabsTrigger value="pie" className="text-xs sm:text-sm px-2 sm:px-4 py-1 flex items-center justify-center"><MixedText text="模块耗时分布" /></UnifiedTabsTrigger>
                    <UnifiedTabsTrigger value="radar" className="text-xs sm:text-sm px-2 sm:px-4 py-1 flex items-center justify-center"><MixedText text="模块能力" /></UnifiedTabsTrigger>
                </UnifiedTabsList>
            </div>

            <UnifiedTabsContents className="py-4 sm:py-8">
                <UnifiedTabsContent value="perMinute" className="outline-none">
                    <div className="w-full h-[300px] sm:h-[450px] md:h-[500px] relative">
                        <TrendChart data={perMinuteData} yMax={2} />
                    </div>
                </UnifiedTabsContent>

                <UnifiedTabsContent value="accuracy" className="outline-none">
                    <div className="w-full h-[300px] sm:h-[450px] md:h-[500px] relative">
                        <TrendChart data={accuracyData} yMax={100} />
                    </div>
                </UnifiedTabsContent>

                <UnifiedTabsContent value="pie" className="outline-none">
                    <div className="w-full h-[300px] sm:h-[450px] md:h-[500px] relative">
                        <ModulePieChart data={pieChartData} />
                    </div>
                </UnifiedTabsContent>

                <UnifiedTabsContent value="radar" className="outline-none">
                    <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] relative mt-2 sm:mt-4">
                        <ModuleRadarChart data={records} />
                    </div>
                </UnifiedTabsContent>
            </UnifiedTabsContents>
        </UnifiedTabs>
    );
};
