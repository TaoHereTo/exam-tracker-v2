import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import React from "react";
import { Marquee } from "@/components/magicui/marquee";

interface OverviewViewProps {
    records: Array<{
        id: number;
        date: string;
        module: string;
        total: number;
        correct: number;
        duration: string;
    }>;
}

export function OverviewView({ records }: OverviewViewProps) {
    // 统计数据
    const totalSessions = records.length;
    const totalQuestions = records.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const totalCorrect = records.reduce((sum, r) => sum + (Number(r.correct) || 0), 0);
    const totalDuration = records.reduce((sum, r) => sum + (parseFloat(r.duration) || 0), 0);
    const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
    // 平均每题用时
    const avgTimePerQuestion = totalQuestions > 0 ? totalDuration / totalQuestions : 0;
    // 最近一次刷题时间，取最大日期
    let lastDate = "暂无记录";
    if (records.length > 0) {
        const maxDateStr = records.reduce((max, r) => {
            return new Date(r.date) > new Date(max) ? r.date : max;
        }, records[0].date);
        lastDate = maxDateStr;
    }
    // 正确率最高的一天
    let bestAccuracyDay = "暂无记录";
    let bestAccuracy = 0;
    if (records.length > 0) {
        const dayMap: Record<string, { correct: number; total: number }> = {};
        records.forEach(r => {
            if (!dayMap[r.date]) dayMap[r.date] = { correct: 0, total: 0 };
            dayMap[r.date].correct += Number(r.correct) || 0;
            dayMap[r.date].total += Number(r.total) || 0;
        });
        Object.entries(dayMap).forEach(([date, { correct, total }]) => {
            if (total > 0) {
                const acc = correct / total;
                if (acc > bestAccuracy) {
                    bestAccuracy = acc;
                    bestAccuracyDay = date;
                }
            }
        });
    }
    // 刷题最多的一天
    let mostQuestionsDay = "暂无记录";
    let mostQuestions = 0;
    if (records.length > 0) {
        const dayMap: Record<string, number> = {};
        records.forEach(r => {
            dayMap[r.date] = (dayMap[r.date] || 0) + (Number(r.total) || 0);
        });
        Object.entries(dayMap).forEach(([date, total]) => {
            if (total > mostQuestions) {
                mostQuestions = total;
                mostQuestionsDay = date;
            }
        });
    }

    // 卡片内容数组
    const cards = [
        {
            title: "总刷题次数",
            value: totalSessions,
        },
        {
            title: "总题数",
            value: totalQuestions,
        },
        {
            title: "总正确数",
            value: totalCorrect,
        },
        {
            title: "平均正确率",
            value: `${avgAccuracy.toFixed(1)}%`,
        },
        {
            title: "总用时（分钟）",
            value: totalDuration.toFixed(1),
        },
        {
            title: "平均用时（分钟/次）",
            value: avgDuration.toFixed(1),
        },
        {
            title: "平均每题用时（分钟）",
            value: avgTimePerQuestion.toFixed(2),
        },
        {
            title: "最近一次刷题时间",
            value: lastDate,
        },
        {
            title: "正确率最高的一天",
            value: bestAccuracyDay + (bestAccuracy > 0 ? ` (${(bestAccuracy * 100).toFixed(1)}%)` : ''),
        },
        {
            title: "刷题最多的一天",
            value: mostQuestionsDay + (mostQuestions > 0 ? ` (${mostQuestions}题)` : ''),
        },
    ];
    // 均分为两组
    const half = Math.ceil(cards.length / 2);
    const group1 = cards.slice(0, half);
    const group2 = cards.slice(half);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">数据概览</h1>
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
                <Marquee className="w-full max-w-5xl" pauseOnHover repeat={2}>
                    <div className="flex gap-6">
                        {group1.map((item, idx) => (
                            <Card className="min-w-[220px]" key={item.title + idx}>
                                <CardHeader><CardTitle>{item.title}</CardTitle></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{item.value}</div></CardContent>
                            </Card>
                        ))}
                    </div>
                </Marquee>
                <Marquee className="w-full max-w-5xl" pauseOnHover reverse repeat={2}>
                    <div className="flex gap-6">
                        {group2.map((item, idx) => (
                            <Card className="min-w-[220px]" key={item.title + idx}>
                                <CardHeader><CardTitle>{item.title}</CardTitle></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{item.value}</div></CardContent>
                            </Card>
                        ))}
                    </div>
                </Marquee>
            </div>
        </div>
    );
} 