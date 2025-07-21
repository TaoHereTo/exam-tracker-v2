import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScorePredictor } from "@/components/features/ScorePredictor";
import { MODULE_SCORES } from "@/config/exam";

export interface RecordItem {
    id: number;
    date: string;
    module: keyof typeof MODULE_SCORES;
    total: number;
    correct: number;
    duration: string;
}

export function PersonalBestView({ records }: { records: RecordItem[] }) {
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
                    // 过滤出该模块的所有记录
                    const moduleRecords = records.filter(r => r.module === module.label);
                    const best = moduleRecords.reduce<{ record: RecordItem; perMinute: number } | null>((acc, cur) => {
                        const duration = parseFloat(cur.duration) || 0;
                        const perMinute = duration > 0 ? (MODULE_SCORES[cur.module] || 1) * cur.correct / duration : 0;
                        if (!acc || perMinute > acc.perMinute) {
                            return { record: cur, perMinute };
                        }
                        return acc;
                    }, null);
                    return (
                        <Card key={module.key} className="shadow-md">
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
            <div className="mt-8 max-w-3xl mx-auto w-full">
                <ScorePredictor records={records.map(r => ({
                    module: r.module,
                    correctCount: r.correct,
                    duration: typeof r.duration === 'string' ? parseFloat(r.duration) || 0 : r.duration,
                }))} />
            </div>
        </div>
    );
} 