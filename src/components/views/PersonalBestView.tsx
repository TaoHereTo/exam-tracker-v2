import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScorePredictor } from "@/components/features/ScorePredictor";
import { MODULE_SCORES, normalizeModuleName, getModuleScore, getModuleColor } from "@/config/exam";
import type { RecordItem } from "@/types/record";
import { timeStringToMinutes } from "@/lib/utils";


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
                    // 过滤出该模块的所有记录（使用统一的模块名称映射）
                    const moduleRecords = records.filter(r => normalizeModuleName(r.module) === module.label);
                    const best = moduleRecords.reduce<{ record: RecordItem; perMinute: number } | null>((acc, cur) => {
                        const duration = timeStringToMinutes(cur.duration);
                        const score = getModuleScore(cur.module);
                        const perMinute = duration > 0 ? score * cur.correct / duration : 0;
                        if (!acc || perMinute > acc.perMinute) {
                            return { record: cur, perMinute };
                        }
                        return acc;
                    }, null);
                    return (
                        <Card key={module.key} className="shadow-md" style={{ borderLeft: `6px solid ${getModuleColor(module.label)}` }}>
                            <CardHeader>
                                <CardTitle>{module.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {best ? (
                                    <div>
                                        <div className="text-2xl font-bold mb-2">{best.perMinute?.toFixed(2) || '0.00'} 分/分钟</div>
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
                    duration: timeStringToMinutes(r.duration),
                }))} />
            </div>
        </div>
    );
} 