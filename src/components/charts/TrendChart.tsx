"use client";

import React from "react";
import ReactECharts from 'echarts-for-react';

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
    '全部': '#888888',
};

export const TrendChart: React.FC<TrendChartProps & { onlyModule?: string }> = ({ data, onlyModule }) => {
    let allModules: string[] = [];
    let allDates: string[] = [];
    let chartData: Record<string, unknown>[] = [];

    if (data.length > 0) {
        if (onlyModule) {
            allModules = [onlyModule];
            allDates = data.map(item => item.date);
            chartData = data;
        } else if ('module' in data[0]) {
            allModules = Array.from(new Set(data.map(item => (item as { module: string }).module)));
            allDates = Array.from(new Set(data.map(item => item.date))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            chartData = allDates.map(date => {
                const row: Record<string, unknown> = { date };
                allModules.forEach(module => {
                    const found = data.find(item => item.date === date && item.module === module);
                    row[moduleLabelMap[module] || module] = found ? found.score : null;
                });
                return row;
            });
            allModules = allModules.map(m => moduleLabelMap[m] || m);
        } else {
            allModules = Object.keys(data[0]).filter(k => k !== 'date' && k !== 'duration');
            allDates = data.map(item => item.date);
            chartData = data;
        }
    }

    const option = {
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
                    let val = (typeof item.value === 'number' && !isNaN(item.value))
                        ? item.value
                        : (item.data && typeof item.data[item.seriesName] === 'number' && !isNaN(item.data[item.seriesName]))
                            ? item.data[item.seriesName]
                            : null;
                    res += `<span style='display:inline-block;margin-right:4px;border-radius:50%;width:10px;height:10px;background:${item.color}'></span>${item.seriesName}：<b>${val !== null ? val.toFixed(2) : '--'}</b><br/>`;
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
                color: moduleColors[module] || '#888',
                shadowColor: moduleColors[module] || '#888',
                shadowBlur: 10,
                shadowOffsetY: 2,
                cap: 'round',
                join: 'round'
            },
            itemStyle: {
                color: moduleColors[module] || '#888',
                borderColor: '#fff',
                borderWidth: 2,
                shadowColor: moduleColors[module] || '#888',
                shadowBlur: 8
            },
            connectNulls: true,
            emphasis: {
                focus: 'series',
                lineStyle: { width: 7 },
                itemStyle: { borderWidth: 4 }
            }
        }))
    };

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactECharts option={option} style={{ height: 400, width: '100%' }} />
        </div>
    );
}; 