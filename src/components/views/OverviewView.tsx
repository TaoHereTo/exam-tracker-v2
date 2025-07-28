import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import React, { useState, useEffect, useMemo } from "react";
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
    const [reduceMotion, setReduceMotion] = useState(false);

    // 检查减弱动态效果设置
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkReduceMotion = () => {
                const isReduceMotion = localStorage.getItem('reduce-motion-enabled') === 'true';
                setReduceMotion(isReduceMotion);
            };

            // 初始化检查
            checkReduceMotion();

            // 监听设置变化
            window.addEventListener('reduceMotionChanged', checkReduceMotion);

            return () => {
                window.removeEventListener('reduceMotionChanged', checkReduceMotion);
            };
        }
    }, []);

    // 使用 useMemo 优化所有统计计算，避免重复遍历
    const stats = useMemo(() => {
        if (records.length === 0) {
            return {
                totalSessions: 0,
                totalQuestions: 0,
                totalCorrect: 0,
                totalDuration: 0,
                avgAccuracy: 0,
                avgDuration: 0,
                avgTimePerQuestion: 0,
                lastDate: "暂无记录",
                bestAccuracyDay: "暂无记录",
                bestAccuracy: 0,
                mostQuestionsDay: "暂无记录",
                mostQuestions: 0,
                longestSession: 0,
                longestSessionDate: "暂无记录",
                fastestSpeed: Infinity,
                fastestSpeedDate: "暂无记录",
                mostFrequentModule: "暂无记录",
                mostFrequentCount: 0,
                maxConsecutiveDays: 0,
                avgQuestionsPerDay: "0",
                bestSingleAccuracy: 0,
                bestSingleAccuracyDate: "暂无记录"
            };
        }

        // 基础统计
        const totalSessions = records.length;
        const totalQuestions = records.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
        const totalCorrect = records.reduce((sum, r) => sum + (Number(r.correct) || 0), 0);
        const totalDuration = records.reduce((sum, r) => sum + (parseFloat(r.duration) || 0), 0);
        const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
        const avgTimePerQuestion = totalQuestions > 0 ? totalDuration / totalQuestions : 0;

        // 最近一次刷题时间
        const maxDateStr = records.reduce((max, r) => {
            return new Date(r.date) > new Date(max) ? r.date : max;
        }, records[0].date);

        // 按日期分组统计
        const dayMap: Record<string, { correct: number; total: number; questions: number }> = {};
        const moduleMap: Record<string, number> = {};
        let longestSession = 0;
        let longestSessionDate = "暂无记录";
        let fastestSpeed = Infinity;
        let fastestSpeedDate = "暂无记录";
        let bestSingleAccuracy = 0;
        let bestSingleAccuracyDate = "暂无记录";

        records.forEach(r => {
            // 按日期分组
            if (!dayMap[r.date]) dayMap[r.date] = { correct: 0, total: 0, questions: 0 };
            dayMap[r.date].correct += Number(r.correct) || 0;
            dayMap[r.date].total += Number(r.total) || 0;
            dayMap[r.date].questions += Number(r.total) || 0;

            // 按模块分组
            moduleMap[r.module] = (moduleMap[r.module] || 0) + 1;

            // 最长连续刷题时间
            const duration = parseFloat(r.duration) || 0;
            if (duration > longestSession) {
                longestSession = duration;
                longestSessionDate = r.date;
            }

            // 最快刷题速度
            const total = Number(r.total) || 0;
            if (total > 0) {
                const speed = duration / total;
                if (speed < fastestSpeed) {
                    fastestSpeed = speed;
                    fastestSpeedDate = r.date;
                }
            }

            // 最佳单次正确率
            if (total > 0) {
                const accuracy = (Number(r.correct) || 0) / total;
                if (accuracy > bestSingleAccuracy) {
                    bestSingleAccuracy = accuracy;
                    bestSingleAccuracyDate = r.date;
                }
            }
        });

        // 正确率最高的一天
        let bestAccuracyDay = "暂无记录";
        let bestAccuracy = 0;
        Object.entries(dayMap).forEach(([date, { correct, total }]) => {
            if (total > 0) {
                const acc = correct / total;
                if (acc > bestAccuracy) {
                    bestAccuracy = acc;
                    bestAccuracyDay = date;
                }
            }
        });

        // 刷题最多的一天
        let mostQuestionsDay = "暂无记录";
        let mostQuestions = 0;
        Object.entries(dayMap).forEach(([date, { questions }]) => {
            if (questions > mostQuestions) {
                mostQuestions = questions;
                mostQuestionsDay = date;
            }
        });

        // 最常刷的模块
        let mostFrequentModule = "暂无记录";
        let mostFrequentCount = 0;
        Object.entries(moduleMap).forEach(([module, count]) => {
            if (count > mostFrequentCount) {
                mostFrequentCount = count;
                mostFrequentModule = module;
            }
        });

        // 连续刷题天数
        let maxConsecutiveDays = 0;
        let currentConsecutiveDays = 0;
        let lastConsecutiveDate: string | null = null;
        const sortedDates = [...new Set(records.map(r => r.date))].sort();
        sortedDates.forEach(date => {
            if (lastConsecutiveDate) {
                const lastDateObj = new Date(lastConsecutiveDate);
                const currentDateObj = new Date(date);
                const diffTime = currentDateObj.getTime() - lastDateObj.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                if (diffDays === 1) {
                    currentConsecutiveDays++;
                } else {
                    currentConsecutiveDays = 1;
                }
            } else {
                currentConsecutiveDays = 1;
            }

            if (currentConsecutiveDays > maxConsecutiveDays) {
                maxConsecutiveDays = currentConsecutiveDays;
            }

            lastConsecutiveDate = date;
        });

        // 平均每天刷题数
        const uniqueDays = sortedDates.length;
        const avgQuestionsPerDay = uniqueDays > 0 ? (totalQuestions / uniqueDays).toFixed(1) : "0";

        return {
            totalSessions,
            totalQuestions,
            totalCorrect,
            totalDuration,
            avgAccuracy,
            avgDuration,
            avgTimePerQuestion,
            lastDate: maxDateStr,
            bestAccuracyDay,
            bestAccuracy,
            mostQuestionsDay,
            mostQuestions,
            longestSession,
            longestSessionDate,
            fastestSpeed,
            fastestSpeedDate,
            mostFrequentModule,
            mostFrequentCount,
            maxConsecutiveDays,
            avgQuestionsPerDay,
            bestSingleAccuracy,
            bestSingleAccuracyDate
        };
    }, [records]);

    // 卡片内容数组
    const cards = [
        {
            title: "总刷题次数",
            value: stats.totalSessions,
        },
        {
            title: "总题数",
            value: stats.totalQuestions,
        },
        {
            title: "总正确数",
            value: stats.totalCorrect,
        },
        {
            title: "平均正确率",
            value: `${stats.avgAccuracy.toFixed(1)}%`,
        },
        {
            title: "总用时（分钟）",
            value: stats.totalDuration.toFixed(1),
        },
        {
            title: "平均用时（分钟/次）",
            value: stats.avgDuration.toFixed(1),
        },
        {
            title: "平均每题用时（分钟）",
            value: stats.avgTimePerQuestion.toFixed(2),
        },
        {
            title: "最近一次刷题时间",
            value: stats.lastDate,
        },
        {
            title: "正确率最高的一天",
            value: stats.bestAccuracyDay + (stats.bestAccuracy > 0 ? ` (${(stats.bestAccuracy * 100).toFixed(1)}%)` : ''),
        },
        {
            title: "刷题最多的一天",
            value: stats.mostQuestionsDay + (stats.mostQuestions > 0 ? ` (${stats.mostQuestions}题)` : ''),
        },
        {
            title: "最长连续刷题时间",
            value: stats.longestSession > 0 ? `${stats.longestSession.toFixed(1)}分钟` : "暂无记录",
        },
        {
            title: "最快刷题速度",
            value: stats.fastestSpeed < Infinity ? `${stats.fastestSpeed.toFixed(2)}分钟/题` : "暂无记录",
        },
        {
            title: "最常刷的模块",
            value: stats.mostFrequentModule + (stats.mostFrequentCount > 0 ? ` (${stats.mostFrequentCount}次)` : ''),
        },
        {
            title: "连续刷题天数",
            value: stats.maxConsecutiveDays > 0 ? `${stats.maxConsecutiveDays}天` : "暂无记录",
        },
        {
            title: "平均每天刷题数",
            value: `${stats.avgQuestionsPerDay}题`,
        },
        {
            title: "最佳单次正确率",
            value: stats.bestSingleAccuracy > 0 ? `${(stats.bestSingleAccuracy * 100).toFixed(1)}%` : "暂无记录",
        },
    ];

    // 如果开启减弱动态效果，显示静态网格布局
    if (reduceMotion) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6">数据概览</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {cards.map((item, idx) => (
                        <Card key={item.title + idx} className="min-h-[120px]">
                            <CardHeader>
                                <CardTitle className="text-sm">{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{item.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // 默认动画布局
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