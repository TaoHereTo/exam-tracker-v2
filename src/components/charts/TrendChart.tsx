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
const moduleColors: Record<string, string> = {
    '政治理论': '#3366FF',    // 亮蓝
    '常识判断': '#FFB300',    // 亮橙
    '言语理解': '#FF4C4C',    // 亮红
    '判断推理': '#00B8D9',    // 青色
    '数量关系': '#43D854',    // 亮绿
    '资料分析': '#A259FF',    // 亮紫
    '全部': '#888888',
};

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
    // 获取所有日期，所有模块
    const allDates = Array.from(new Set(data.map(item => item.date))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const allModules = Array.from(new Set(data.map(item => item.module)));

    // 构造多模块折线数据结构
    const chartData = allDates.map(date => {
        const row: any = { date };
        allModules.forEach(module => {
            const found = data.find(item => item.date === date && item.module === module);
            row[module] = found ? found.score : null;
        });
        return row;
    });

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
            formatter: function (params: any) {
                let res = `<b>${params[0].axisValueLabel}</b><br/>`;
                params.forEach((item: any) => {
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