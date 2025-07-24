import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScorePredictor } from "@/components/features/ScorePredictor";
import { MODULE_SCORES } from "@/config/exam";

export interface RecordItem {
    id: number;
    date: string;
    module: string;
    total: number;
    correct: number;
    duration: string;
}

export function PersonalBestView({ records }: { records: RecordItem[] }) {
    // 英文key转中文
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
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { key: 'politics', label: '政治理论' },
                    { key: 'common', label: '常识判断' },
                    { key: 'logic', label: '判断推理' },
                    { key: 'verbal', label: '言语理解' },
                    { key: 'math', label: '数量关系' },
                    { key: 'data-analysis', label: '资料分析' },
                ].map(module => {
                    // 过滤出该模块的所有记录（兼容中英文key）
                    const moduleRecords = records.filter(r => moduleLabelMap[r.module] === module.label || r.module === module.label);
                    const best = moduleRecords.reduce<{ record: RecordItem; perMinute: number } | null>((acc, cur) => {
                        const duration = parseFloat(cur.duration) || 0;
                        const score = (MODULE_SCORES as Record<string, number>)[cur.module];
                        const perMinute = duration > 0 ? (score ?? 1) * cur.correct / duration : 0;
                        if (!acc || perMinute > acc.perMinute) {
                            return { record: cur, perMinute };
                        }
                        return acc;
                    }, null);
                    return (
                        <Card key={module.key} className="shadow-md" style={{ borderLeft: `6px solid ${moduleColors[module.key] || moduleColors[module.label] || '#888'}` }}>
                            <CardHeader>
                                <CardTitle>{module.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {best ? (
                                    <div>
                                        <div className="text-2xl font-bold mb-2">{best.perMinute.toFixed(2)} 分/分钟</div>
                                        <div className="text-sm text-gray-500">日期：{best.record.date}</div>
                                    </div>
                                ) : (
                                    <div className="text-gray-400">暂无记录</div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            {/* 预测成绩分析 */}
            <div className="mt-8 max-w-7xl mx-auto w-full">
                <ScorePredictor records={records.map(r => ({
                    module: (r.module as keyof typeof MODULE_SCORES),
                    correctCount: r.correct,
                    duration: typeof r.duration === 'string' ? parseFloat(r.duration) || 0 : r.duration,
                }))} />
            </div>
        </div>
    );
} 