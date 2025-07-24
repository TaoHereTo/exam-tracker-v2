"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { MODULES, MODULE_SCORES, FULL_EXAM_CONFIG } from "@/config/exam";

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
    const score = record.correctCount * (MODULE_SCORES[record.module] || 0.8);
    return score / record.duration;
};

export function ScorePredictor({ records }: ScorePredictorProps) {
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);

    const handlePredictScore = () => {
        if (!records || records.length === 0) {
            alert("没有足够的刷题记录来进行预测。");
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

    return (
        <Card className="max-w-full mx-auto">
            <CardHeader>
                <CardTitle>预期成绩分析</CardTitle>
                <CardDescription>
                    根据您的历史“每分钟得分”数据，结合标准行测考试结构，为您预测理论上的最高得分。
                </CardDescription>
            </CardHeader>
            <CardContent className="relative pb-20">
                <Button className="mb-6" onClick={handlePredictScore}>
                    预测我的行测总分
                </Button>
                {prediction && (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>模块</TableHead>
                                    <TableHead>平均每分钟得分</TableHead>
                                    <TableHead>分配时间(分钟)</TableHead>
                                    <TableHead>预测得分</TableHead>
                                    <TableHead>满分</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {prediction.details.map((row: PredictionDetail) => (
                                    <TableRow key={row.moduleName}>
                                        <TableCell>{row.moduleName}</TableCell>
                                        <TableCell>
                                            <span className="font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                {row.avgSpm}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                                {row.timeAllocation}
                                            </span>
                                        </TableCell>
                                        <TableCell>{row.predictedScore}</TableCell>
                                        <TableCell>{row.maxScore}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {/* 预测总分右下角渐变大号数字 */}
                        <div className="absolute right-8 bottom-4 flex flex-row items-end gap-3">
                            <span className="text-2xl font-bold text-gray-700 mb-1">预测总分</span>
                            <span
                                className="text-5xl font-extrabold bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg"
                                style={{ letterSpacing: 2 }}
                            >
                                {prediction.total.toFixed(2)} 分
                            </span>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
} 