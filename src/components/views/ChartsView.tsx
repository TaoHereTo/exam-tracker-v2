import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TrendChart } from "@/components/charts/TrendChart";
import { MODULE_SCORES } from "@/config/exam";
import { ModulePieChart } from "@/components/charts/ModulePieChart";
import ReactECharts from 'echarts-for-react';

const moduleColors: Record<string, string> = {
    '政治理论': '#3366FF',    // 亮蓝
    '常识判断': '#FFB300',    // 亮橙
    '言语理解': '#FF4C4C',    // 亮红
    '判断推理': '#00B8D9',    // 青色
    '数量关系': '#43D854',    // 亮绿
    '资料分析': '#A259FF',    // 亮紫
};

function ModuleRadarChart({ data }: { data: any[] }) {
    // 统计每个模块的正确率
    const moduleStats: Record<string, { correct: number; total: number }> = {};
    data.forEach(item => {
        if (!moduleStats[item.module]) {
            moduleStats[item.module] = { correct: 0, total: 0 };
        }
        moduleStats[item.module].correct += Number(item.correct) || 0;
        moduleStats[item.module].total += Number(item.total) || 0;
    });
    const modules = Object.keys(moduleColors);
    const indicator = modules.map(module => ({
        name: module,
        max: 100
    }));
    const values = modules.map(module => {
        const stat = moduleStats[module] || { correct: 0, total: 0 };
        return stat.total > 0 ? Number(((stat.correct / stat.total) * 100).toFixed(2)) : 0;
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
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function (params: any) {
                // params.value 是一个数组，依次对应各模块
                // params.name 是系列名
                // params.marker 是颜色小圆点
                let res = `${params.marker}${params.seriesName}<br/>`;
                modules.forEach((module, idx) => {
                    res += `${module}：${values[idx] !== undefined ? values[idx].toFixed(2) : '--'}%<br/>`;
                });
                return res;
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
                            color: function (params: any) {
                                return pointColors[params.dataIndex] || '#3366FF';
                            },
                            borderColor: '#fff',
                            borderWidth: 2,
                            shadowColor: function (params: any) {
                                return pointColors[params.dataIndex] || '#3366FF';
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
    return <ReactECharts option={option} style={{ height: 400, width: '100%' }} />;
}

interface ChartsViewProps {
    records: any[];
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
                                ...r,
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