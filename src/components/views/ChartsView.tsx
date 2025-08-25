import React, { useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { normalizeModuleName, getModuleScore, getModuleColor, UNIFIED_LEGEND_STYLE } from "@/config/exam";
import { TrendChart } from "@/components/ui/TrendChart";
import { ModulePieChart } from "@/components/ui/ModulePieChart";
import ReactECharts from 'echarts-for-react';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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

function ModuleRadarChart({ data }: { data: RecordItem[] }) {
    const { isDarkMode } = useThemeMode();

    // 统计每个模块的参数
    const moduleStats: Record<string, { correct: number; total: number; duration: number }> = {};
    data.forEach(item => {
        const key = normalizeModuleName(item.module);
        if (!moduleStats[key]) {
            moduleStats[key] = { correct: 0, total: 0, duration: 0 };
        }
        moduleStats[key].correct += Number(item.correct) || 0;
        moduleStats[key].total += Number(item.total) || 0;
        moduleStats[key].duration += timeStringToMinutes(item.duration) || 0;
    });

    // 只使用中文模块名称
    const modules = Object.keys(moduleStats).filter(m => !m.match(/^[a-z-]+$/));

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

    // 归一化参数
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

    // 构造线条渐变色
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

    // 根据主题动态设置颜色
    const backgroundColor = isDarkMode ? 'hsl(var(--background))' : '#F8F7F6';
    const textColor = isDarkMode ? '#e5e5e5' : '#333';
    // 图例文字在深色模式下使用黑色以提高可读性
    const legendTextColor = isDarkMode ? '#333' : '#333';
    const borderColor = isDarkMode ? '#404040' : '#e0e6f1';
    const splitLineColor = isDarkMode ? '#404040' : '#e0e6f1';
    const splitAreaColor1 = isDarkMode ? '#2a2a2a' : '#f5f7fa';
    const splitAreaColor2 = isDarkMode ? '#1a1a1a' : '#fff';
    const axisLineColor = isDarkMode ? '#666' : '#aaa';
    const tooltipBgColor = isDarkMode ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)';
    const tooltipBorderColor = isDarkMode ? '#404040' : '#e0e6f1';

    const option = {
        backgroundColor,
        tooltip: {
            trigger: 'item',
            backgroundColor: tooltipBgColor,
            borderColor: tooltipBorderColor,
            borderWidth: 1,
            textStyle: {
                color: textColor,
                fontFamily: '思源宋体, Times New Roman, serif'
            },
            formatter: function (params: Record<string, unknown>) {
                return `${params.marker}${params.seriesName}<br/>${(params.value as number[]).map((v: number, idx: number) => `${modules[idx]}：${v}`).join('<br/>')}`;
            }
        },
        radar: {
            indicator,
            splitNumber: 5,
            radius: '70%',
            axisName: {
                color: textColor,
                fontWeight: 'bold',
                fontSize: 15,
                fontFamily: '思源宋体, Times New Roman, serif'
            },
            splitLine: {
                lineStyle: {
                    color: splitLineColor,
                    type: 'solid'
                }
            },
            splitArea: {
                areaStyle: {
                    color: [splitAreaColor1, splitAreaColor2]
                }
            },
            axisLine: {
                lineStyle: {
                    color: axisLineColor
                }
            },
            legend: {
                ...UNIFIED_LEGEND_STYLE,
                // 覆盖主题相关的样式
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.9)',
                borderColor: isDarkMode ? '#e0e6f1' : '#e0e6f1',
                textStyle: { color: legendTextColor }
            }
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
                            width: 4,
                            shadowColor: '#3366FF',
                            shadowBlur: 10
                        },
                        symbol: 'circle',
                        symbolSize: 14,
                        itemStyle: {
                            color: function (params: unknown) {
                                const idx = (params as { dataIndex: number }).dataIndex;
                                return pointColors[idx] || '#3366FF';
                            },
                            borderColor: isDarkMode ? 'hsl(var(--background))' : '#F8F7F6',
                            borderWidth: 2,
                            shadowColor: function (params: unknown) {
                                const idx = (params as { dataIndex: number }).dataIndex;
                                return pointColors[idx] || '#3366FF';
                            },
                            shadowBlur: 8
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
                            color: textColor,
                            fontFamily: '思源宋体, Times New Roman, serif'
                        }
                    }
                ],
                animation: true
            }
        ]
    };
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    key={`radar-${isDarkMode}`}
                />
            </div>
            <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
                能力值 =
                <span className="mx-1 font-bold"><MixedText text="正确率 × 0.5 + 每分钟得分 × 0.3 + 做题量 × 0.2" /></span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="inline-block cursor-pointer ml-1 text-primary" style={{ fontSize: '1.1em' }}>？</span>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={4}>
                        能力值为归一化后的加权和。<br />
                        正确率、每分钟得分、做题量均归一化到0~1后加权。
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}

interface ChartsViewProps {
    records: RecordItem[];
}

export function ChartsView({ records }: ChartsViewProps) {
    // 使用useMemo优化数据处理
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

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] mt-0 w-full">
            <Tabs defaultValue="perMinute" className="w-full mb-6">
                <div className="flex justify-center mb-4 w-full">
                    <TabsList className="flex-nowrap overflow-x-auto scrollbar-hide w-full max-w-[calc(100vw-2rem)]">
                        <TabsTrigger value="perMinute" className="whitespace-nowrap"><MixedText text="每分钟得分" /></TabsTrigger>
                        <TabsTrigger value="accuracy" className="whitespace-nowrap"><MixedText text="正确率" /></TabsTrigger>
                        <TabsTrigger value="pie" className="whitespace-nowrap"><MixedText text="模块耗时分布" /></TabsTrigger>
                        <TabsTrigger value="radar" className="whitespace-nowrap"><MixedText text="模块能力" /></TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="perMinute">
                    <div style={{ height: '500px' }} className="flex items-center justify-center">
                        <TrendChart data={perMinuteData} yMax={2} />
                    </div>
                </TabsContent>
                <TabsContent value="accuracy">
                    <div style={{ height: '500px' }} className="flex items-center justify-center">
                        <TrendChart data={accuracyData} yMax={100} />
                    </div>
                </TabsContent>
                <TabsContent value="pie">
                    <div style={{ height: '500px' }} className="flex items-center justify-center">
                        <ModulePieChart data={records.map(r => {
                            return {
                                date: r.date,
                                module: normalizeModuleName(r.module),
                                score: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
                                duration: timeStringToMinutes(r.duration) || 0
                            };
                        })} />
                    </div>
                </TabsContent>
                <TabsContent value="radar">
                    <div style={{ height: '500px' }} className="flex items-center justify-center">
                        <ModuleRadarChart data={records} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
