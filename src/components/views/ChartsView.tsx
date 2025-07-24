import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendChart } from "@/components/ui/TrendChart";
import { MODULE_SCORES } from "@/config/exam";
import { ModulePieChart } from "@/components/ui/ModulePieChart";
import ReactECharts from 'echarts-for-react';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { RecordItem } from "@/types/record";

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
    // 统计每个模块的参数
    const moduleStats: Record<string, { correct: number; total: number; duration: number }> = {};
    data.forEach(item => {
        const key = moduleLabelMap[item.module] || item.module;
        if (!moduleStats[key]) {
            moduleStats[key] = { correct: 0, total: 0, duration: 0 };
        }
        moduleStats[key].correct += Number(item.correct) || 0;
        moduleStats[key].total += Number(item.total) || 0;
        moduleStats[key].duration += Number(item.duration) || 0;
    });
    const modules = Object.keys(moduleColors).filter(m => !m.match(/^[a-z-]+$/));
    // 归一化参数
    let maxTotal = 1, maxPerMinute = 1;
    const perMinuteMap: Record<string, number> = {};
    modules.forEach(module => {
        const stat = moduleStats[module] || { correct: 0, total: 0, duration: 0 };
        const scorePerQ = (module as keyof typeof MODULE_SCORES) in MODULE_SCORES ? MODULE_SCORES[module as keyof typeof MODULE_SCORES] : 1;
        const perMinute = stat.duration > 0 ? (scorePerQ * stat.correct) / stat.duration : 0;
        perMinuteMap[module] = perMinute;
        if (stat.total > maxTotal) maxTotal = stat.total;
        if (perMinute > maxPerMinute) maxPerMinute = perMinute;
    });
    // 能力指数=加权（归一化正确率、每分钟得分、做题量）
    const values = modules.map(module => {
        const stat = moduleStats[module] || { correct: 0, total: 0, duration: 0 };
        const accuracy = stat.total > 0 ? stat.correct / stat.total : 0;
        const perMinute = perMinuteMap[module] / maxPerMinute; // 归一化
        const totalNorm = stat.total / maxTotal; // 归一化
        return Number((calcAbilityIndex({ accuracy, perMinute, total: totalNorm }) * 100).toFixed(2));
    });
    // 构造点颜色数组
    const pointColors = modules.map(m => moduleColors[m]);
    // 构造线条渐变色
    const lineGradient = {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 1,
        y2: 1,
        colorStops: modules.map((m, i) => ({
            offset: i / (modules.length - 1),
            color: moduleColors[m]
        }))
    };
    const indicator = modules.map(module => ({
        name: module,
        max: 100
    }));
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function (params: Record<string, unknown>) {
                return `${params.marker}${params.seriesName}<br/>${(params.value as number[]).map((v: number, idx: number) => `${modules[idx]}：${v}`).join('<br/>')}`;
            }
        },
        radar: {
            indicator,
            splitNumber: 5,
            radius: '70%',
            axisName: {
                color: '#333',
                fontWeight: 'bold',
                fontSize: 15
            },
            splitLine: {
                lineStyle: {
                    color: '#e0e6f1',
                    type: 'solid'
                }
            },
            splitArea: {
                areaStyle: {
                    color: ['#f5f7fa', '#fff']
                }
            },
            axisLine: {
                lineStyle: {
                    color: '#aaa'
                }
            }
        },
        series: [
            {
                name: '模块正确率',
                type: 'radar',
                data: [
                    {
                        value: values,
                        name: '正确率',
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
                            borderColor: '#fff',
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
                        }
                    }
                ],
                animation: true
            }
        ]
    };
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactECharts option={option} style={{ height: 400, width: '100%' }} />
            <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
                能力值 =
                <span className="mx-1 font-bold">正确率 × 0.5 + 每分钟得分 × 0.3 + 做题量 × 0.2</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="inline-block cursor-pointer ml-1 text-primary" style={{ fontSize: '1.1em' }}>？</span>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={4}>
                        能力值为归一化后的加权和，权重可调整。<br />
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
    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">数据图表</h1>
            <div className="flex flex-col items-center justify-center min-h-[80vh] mt-0">
                <Tabs defaultValue="perMinute" className="w-full max-w-5xl mx-auto mb-6">
                    <TabsList className="w-full justify-center mb-4">
                        <TabsTrigger value="perMinute">每分钟得分</TabsTrigger>
                        <TabsTrigger value="accuracy">正确率</TabsTrigger>
                        <TabsTrigger value="pie">模块耗时分布</TabsTrigger>
                        <TabsTrigger value="radar">模块能力雷达图</TabsTrigger>
                    </TabsList>
                    <TabsContent value="perMinute">
                        <div style={{ height: '500px' }}>
                            {(() => {
                                const groupMap: Record<string, { date: string; module: string; correct: number; duration: number }> = {};
                                records.forEach(r => {
                                    const key = `${r.date}__${r.module}`;
                                    const correct = Number(r.correct) || 0;
                                    const duration = typeof r.duration === 'string' ? parseFloat(r.duration) || 0 : r.duration;
                                    if (!groupMap[key]) {
                                        groupMap[key] = { date: r.date, module: r.module, correct: 0, duration: 0 };
                                    }
                                    groupMap[key].correct += correct;
                                    groupMap[key].duration += duration;
                                });
                                const chartData = Object.values(groupMap).map(item => ({
                                    date: item.date,
                                    module: item.module,
                                    score: item.duration > 0 ? (MODULE_SCORES[item.module as keyof typeof MODULE_SCORES] || 1) * item.correct / item.duration : 0,
                                    duration: item.duration,
                                }));
                                return <TrendChart data={chartData} />;
                            })()}
                        </div>
                    </TabsContent>
                    <TabsContent value="accuracy">
                        <div style={{ height: '500px' }}>
                            {(() => {
                                const groupMap: Record<string, { date: string; module: string; correct: number; total: number }> = {};
                                records.forEach(r => {
                                    const key = `${r.date}__${r.module}`;
                                    const correct = Number(r.correct) || 0;
                                    const total = Number(r.total) || 0;
                                    if (!groupMap[key]) {
                                        groupMap[key] = { date: r.date, module: r.module, correct: 0, total: 0 };
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
                                return <TrendChart data={chartData} />;
                            })()}
                        </div>
                    </TabsContent>
                    <TabsContent value="pie">
                        <div style={{ height: '500px' }}>
                            <ModulePieChart data={records.map(r => ({
                                date: r.date,
                                module: r.module,
                                score: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
                                duration: typeof r.duration === 'string' ? parseFloat(r.duration) || 0 : r.duration
                            }))} />
                        </div>
                    </TabsContent>
                    <TabsContent value="radar">
                        <div style={{ height: '500px' }}>
                            <ModuleRadarChart data={records} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
} 