import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TrendChart } from "@/components/charts/TrendChart";
import { MODULE_SCORES } from "@/config/exam";
import { ModulePieChart } from "@/components/charts/ModulePieChart";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
    const radarData = modules.map(module => {
        const stat = moduleStats[module] || { correct: 0, total: 0 };
        return {
            module,
            [module]: stat.total > 0 ? (stat.correct / stat.total) * 100 : 0,
        };
    });
    return (
        <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="module" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                {modules.map(module => (
                    <Radar
                        key={module}
                        name={module}
                        dataKey={module}
                        stroke={moduleColors[module]}
                        fill={moduleColors[module]}
                        fillOpacity={0.5}
                        isAnimationActive
                    />
                ))}
                <Tooltip formatter={v => typeof v === 'number' ? `${v.toFixed(2)}%` : v} />
                <Legend />
            </RadarChart>
        </ResponsiveContainer>
    );
}

interface ChartsViewProps {
    records: any[];
    chartModuleFilter: string;
    setChartModuleFilter: (v: string) => void;
}

export function ChartsView({ records, chartModuleFilter, setChartModuleFilter }: ChartsViewProps) {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">数据图表</h1>
            <div className="mb-4 flex justify-end">
                <Select value={chartModuleFilter} onValueChange={setChartModuleFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="筛选模块" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="全部">全部模块</SelectItem>
                        <SelectItem value="政治理论">政治理论</SelectItem>
                        <SelectItem value="常识判断">常识判断</SelectItem>
                        <SelectItem value="言语理解">言语理解</SelectItem>
                        <SelectItem value="判断推理">判断推理</SelectItem>
                        <SelectItem value="数量关系">数量关系</SelectItem>
                        <SelectItem value="资料分析">资料分析</SelectItem>
                    </SelectContent>
                </Select>
            </div>
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
                                if (chartModuleFilter !== '全部' && r.module !== chartModuleFilter) return;
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
                                if (chartModuleFilter !== '全部' && r.module !== chartModuleFilter) return;
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
    );
} 