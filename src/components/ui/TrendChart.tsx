"use client";

import React, { useMemo, useState, useEffect } from "react";
import ReactECharts from 'echarts-for-react';
import { getModuleColor } from "@/config/exam";

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

    const option = useMemo(() => {
        return {
            backgroundColor: '#fff',
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'line' },
                backgroundColor: 'rgba(255,255,255,0.95)',
                borderColor: '#e0e6f1',
                borderWidth: 1,
                textStyle: { color: '#333', fontSize: 14 },
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
                itemWidth: 18,
                itemHeight: 12,
                borderRadius: 6,
                textStyle: { fontWeight: 'bold', fontSize: 14 },
                icon: 'roundRect',
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderColor: '#e0e6f1',
                borderWidth: 1,
                padding: [8, 12],
                shadowColor: 'rgba(51,102,255,0.08)',
                shadowBlur: 8
            },
            grid: {
                left: 130,
                right: 80,
                top: 40,
                bottom: 60,
                borderColor: '#e0e6f1',
                borderWidth: 1,
                containLabel: true,
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
                    color: '#333',
                    fontWeight: 500
                },
                axisTick: { alignWithLabel: true },
                axisLine: { lineStyle: { color: '#e0e6f1', width: 2 } },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                max: yMax,
                axisLabel: { fontSize: 13, color: '#333', fontWeight: 500 },
                axisLine: { lineStyle: { color: '#e0e6f1', width: 2 } },
                splitLine: { lineStyle: { color: '#f5f7fa', width: 1, type: 'dashed' } }
            },
            series: allModules.map(module => ({
                name: module,
                type: 'line',
                data: chartData.map(row => row[module]),
                smooth: false,
                showSymbol: true,
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
                    borderColor: '#fff',
                    borderWidth: 2,
                    shadowColor: getModuleColor(module),
                    shadowBlur: 8
                },
                connectNulls: true, // 连接null值，保持线条连续
                emphasis: {
                    focus: 'series',
                    lineStyle: { width: 7 },
                    itemStyle: { borderWidth: 4 }
                }
            }))
        };
    }, [allModules, allDates, chartData, yMax]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactECharts
                option={option}
                style={{ height: 400, width: '100%' }}
                key={`${forceUpdate}-${allDates.join(',')}-${allModules.join(',')}`}
                notMerge={true}
                lazyUpdate={false}
            />
        </div>
    );
}; 