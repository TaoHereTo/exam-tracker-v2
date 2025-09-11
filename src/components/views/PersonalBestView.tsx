import { ScorePredictor } from "@/components/features/ScorePredictor";
import { MODULE_SCORES, normalizeModuleName, getModuleColor, getModuleScore } from "@/config/exam";
import type { RecordItem } from "@/types/record";
import { timeStringToMinutes } from "@/lib/utils";
import { MixedText } from "@/components/ui/MixedText";
import { BorderBeamCard } from "@/components/magicui/border-beam-card";


export function PersonalBestView({ records }: { records: RecordItem[] }) {
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full items-stretch">
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
                    
                    // 获取模块颜色
                    const moduleColor = getModuleColor(module.label);
                    
                    return (
                        <BorderBeamCard 
                            key={module.key} 
                            className="w-full rounded-2xl overflow-hidden"
                            colorFrom={moduleColor}
                            colorTo={moduleColor}
                            size={100}
                        >
                            <div className="p-6">
                                <div className="pb-3">
                                    <div className="text-lg font-bold flex items-center">
                                        <div 
                                            className="w-3 h-3 rounded-full mr-2" 
                                            style={{ backgroundColor: moduleColor }}
                                        />
                                        <MixedText text={module.label} />
                                    </div>
                                </div>
                                <div className="pt-0">
                                    {best ? (
                                        <div className="text-center">
                                            <div className="text-3xl font-bold mb-2">
                                                <MixedText text={`${best.perMinute?.toFixed(2) || '0.00'}`} />
                                                <span className="text-lg text-muted-foreground ml-1">分/分钟</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <MixedText text={`日期：${best.record.date}`} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="text-muted-foreground">
                                                <MixedText text="暂无记录" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </BorderBeamCard>
                    );
                })}
            </div>
            {/* 预测成绩分析 */}
            <div className="mt-8 w-full">
                <ScorePredictor records={records.map(r => ({
                    module: (r.module as keyof typeof MODULE_SCORES),
                    correctCount: r.correct,
                    duration: timeStringToMinutes(r.duration),
                }))} />
            </div>
        </div>
    );
}