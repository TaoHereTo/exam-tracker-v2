"use client";
import { useState } from "react";
import { UnifiedTable } from "@/components/ui/UnifiedTable";
import { MODULES, MODULE_SCORES, FULL_EXAM_CONFIG, normalizeModuleName } from "@/config/exam";
import { minutesToTimeString } from "@/lib/utils";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { Button } from "@/components/ui/button";
import { MixedText } from "@/components/ui/MixedText";
import { Bot } from "lucide-react";
import { SparklesText } from "@/components/magicui/sparkles-text";

interface RecordItem {
    module: keyof typeof MODULE_SCORES;
    correctCount: number;
    duration: number;
}

interface ScorePredictorProps {
    records: RecordItem[];
}

interface ModuleStats {
    avgSpm: number;
    recordCount: number;
}

interface PredictionDetail {
    moduleName: string;
    avgSpm: string;
    timeAllocation: string;
    predictedScore: string;
    maxScore: string;
}

interface PredictionResult {
    total: number;
    details: PredictionDetail[];
}

// Helper function to calculate score per minute
const getScorePerMinute = (record: RecordItem): number => {
    if (!record || !record.duration || record.duration === 0) return 0;
    const normalizedModule = normalizeModuleName(record.module);
    const score = record.correctCount * (MODULE_SCORES[normalizedModule as keyof typeof MODULE_SCORES] || 0.8);
    return score / record.duration;
};

export function ScorePredictor({ records }: ScorePredictorProps) {
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const { notify } = useNotification();

    const handlePredictScore = () => {
        if (!records || records.length === 0) {
            notify({ type: "warning", message: "数据不足", description: "没有足够的刷题历史来进行预测。" });
            return;
        }

        const moduleStats: Record<string, ModuleStats> = {};
        MODULES.forEach(module => {
            const moduleRecords = records.filter((r: RecordItem) => r.module === module.value || r.module === module.label);
            if (moduleRecords.length > 0) {
                const totalSpm = moduleRecords.reduce((sum: number, rec: RecordItem) => sum + getScorePerMinute(rec), 0);
                moduleStats[module.label] = { avgSpm: totalSpm / moduleRecords.length, recordCount: moduleRecords.length };
            } else {
                moduleStats[module.label] = { avgSpm: 0, recordCount: 0 };
            }
        });
        let totalPredictedScore = 0;
        const details: PredictionDetail[] = [];
        Object.entries(FULL_EXAM_CONFIG.modules).forEach(([moduleName, config]) => {
            const stats = moduleStats[moduleName];
            const timeAllocation = (config.questions / FULL_EXAM_CONFIG.totalQuestions) * FULL_EXAM_CONFIG.totalTime;
            const maxScore = config.questions * config.pointsPerQuestion;
            let predictedScore = 0;
            if (stats && stats.recordCount > 0) {
                predictedScore = stats.avgSpm * timeAllocation;
                predictedScore = Math.min(predictedScore, maxScore); // Cap at max score
            }
            totalPredictedScore += predictedScore;
            details.push({
                moduleName,
                avgSpm: stats.avgSpm.toFixed(2),
                timeAllocation: timeAllocation.toFixed(1),
                predictedScore: predictedScore.toFixed(2),
                maxScore: maxScore.toFixed(1),
            });
        });
        setPrediction({ total: totalPredictedScore, details });
    };

    // 定义表格列配置
    const columns = [
        {
            key: 'moduleName',
            label: (
                <div className="flex items-center gap-1">
                    <span>模块</span>
                </div>
            )
        },
        {
            key: 'avgSpm',
            label: (
                <div className="flex items-center gap-1">
                    <span>平均每分钟得分</span>
                </div>
            ),
            render: (row: PredictionDetail) => (
                <span className="font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {row.avgSpm}
                </span>
            )
        },
        {
            key: 'timeAllocation',
            label: (
                <div className="flex items-center gap-1">
                    <span>分配时间</span>
                </div>
            ),
            render: (row: PredictionDetail) => (
                <span className="font-bold bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    {minutesToTimeString(parseFloat(row.timeAllocation))}
                </span>
            )
        },
        {
            key: 'predictedScore',
            label: (
                <div className="flex items-center gap-1">
                    <span>预测得分</span>
                </div>
            )
        },
        {
            key: 'maxScore',
            label: (
                <div className="flex items-center gap-1">
                    <span>满分</span>
                </div>
            )
        }
    ];

    return (
        <div className="pt-4 px-2 md:px-8">
            <div className="w-full">
                {/* 标题和描述 */}
                <div className="mb-6">
                    <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white mb-2" style={{
                        fontWeight: '700',
                        fontSize: '1.5rem'
                    }}>
                        <MixedText text="预期成绩分析" style={{ fontWeight: '700' }} />
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        根据您的历史"每分钟得分"数据，结合标准行测考试结构，为您预测理论上的最高得分。
                    </p>
                </div>

                {/* 预测按钮 */}
                <div className="mb-6">
                    <Button
                        onClick={handlePredictScore}
                        variant="default"
                        className="h-9 rounded-full bg-[#6d28d9] hover:bg-[#6d28d9]/90 text-white"
                    >
                        <Bot className="w-5 h-5 mr-0.5" />
                        <MixedText text="预测我的行测总分" />
                    </Button>
                </div>

                {/* 预测结果 */}
                {prediction && (
                    <>
                        <div className="mb-6">
                            <UnifiedTable
                                columns={columns}
                                data={prediction.details}
                                rowKey={(row) => row.moduleName}
                                selectable={false}
                                selected={[]}
                                onSelect={() => { }}
                                showNew={false}
                                showEdit={false}
                                showDelete={false}
                                showExport={false}
                            />
                        </div>

                        {/* 预测总分显示 */}
                        <div className="flex justify-center items-center gap-4 py-8">
                            <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                                <MixedText text="预测总分" />
                            </span>
                            <SparklesText
                                colors={{ first: "#9E7AFF", second: "#FE8BBB" }}
                                sparklesCount={8}
                                className=""
                            >
                                <span
                                    className="text-5xl font-extrabold bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg"
                                    style={{ letterSpacing: 2 }}
                                >
                                    {prediction.total.toFixed(2)} 分
                                </span>
                            </SparklesText>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 