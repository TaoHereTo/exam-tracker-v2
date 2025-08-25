import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import React, { useState, useEffect, useMemo } from "react";
import { Marquee } from "@/components/magicui/marquee";
import { useLocalStorageBoolean } from "@/hooks/useLocalStorage";
import { normalizeModuleName } from "@/config/exam";
import { timeStringToMinutes, minutesToTimeString } from "@/lib/utils";
import { MixedText } from "@/components/ui/MixedText";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface OverviewViewProps {
    records: Array<{
        id: string;
        date: string;
        module: string;
        total: number;
        correct: number;
        duration: string;
    }>;
}

export function OverviewView({ records }: OverviewViewProps) {
    const [overviewAnimate] = useLocalStorageBoolean('overview-animate', true);

    // 获取tooltip提示文本
    const getTooltipText = (title: string): string => {
        const tooltipMap: Record<string, string> = {
            "平均每题用时": "平均每道题目的用时",
            "连续刷题天数": "连续刷题的最长天数",
            "最佳单次正确率": "单次刷题中正确率最高的一次"
        };
        return tooltipMap[title] || "";
    };

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
        const totalDuration = records.reduce((sum, r) => sum + (timeStringToMinutes(r.duration) || 0), 0);
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

        let fastestModule = '';
        records.forEach(r => {
            // 按日期分组
            if (!dayMap[r.date]) dayMap[r.date] = { correct: 0, total: 0, questions: 0 };
            dayMap[r.date].correct += Number(r.correct) || 0;
            dayMap[r.date].total += Number(r.total) || 0;
            dayMap[r.date].questions += Number(r.total) || 0;

            // 按模块分组
            const moduleName = normalizeModuleName(r.module);
            moduleMap[moduleName] = (moduleMap[moduleName] || 0) + 1;

            // 最长单次刷题时间
            const sessionDuration = timeStringToMinutes(r.duration) || 0;
            if (sessionDuration > longestSession) {
                longestSession = sessionDuration;
                longestSessionDate = r.date;
            }

            // 最快刷题速度（分钟/题）
            const speed = sessionDuration / (Number(r.total) || 1);
            if (speed < fastestSpeed && speed > 0) {
                fastestSpeed = speed;
                fastestSpeedDate = r.date;
                fastestModule = normalizeModuleName(r.module);
            }

            // 最佳单次正确率
            const accuracy = Number(r.correct) / Number(r.total);
            if (accuracy > bestSingleAccuracy) {
                bestSingleAccuracy = accuracy;
                bestSingleAccuracyDate = r.date;
            }
        });

        // 计算最佳正确率的一天
        let bestAccuracy = 0;
        let bestAccuracyDay = "暂无记录";
        Object.entries(dayMap).forEach(([date, data]) => {
            const accuracy = data.total > 0 ? data.correct / data.total : 0;
            if (accuracy > bestAccuracy) {
                bestAccuracy = accuracy;
                bestAccuracyDay = date;
            }
        });

        // 计算刷题最多的一天
        let mostQuestions = 0;
        let mostQuestionsDay = "暂无记录";
        Object.entries(dayMap).forEach(([date, data]) => {
            if (data.questions > mostQuestions) {
                mostQuestions = data.questions;
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

        // 计算连续刷题天数
        const sortedDates = Object.keys(dayMap).sort();
        let maxConsecutiveDays = 0;
        let currentConsecutiveDays = 0;
        let lastDate: Date | null = null;

        sortedDates.forEach(dateStr => {
            const currentDate = new Date(dateStr);
            if (lastDate) {
                const diffTime = currentDate.getTime() - lastDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentConsecutiveDays++;
                } else {
                    currentConsecutiveDays = 1;
                }
            } else {
                currentConsecutiveDays = 1;
            }
            maxConsecutiveDays = Math.max(maxConsecutiveDays, currentConsecutiveDays);
            lastDate = currentDate;
        });

        // 平均每天刷题数
        const avgQuestionsPerDay = sortedDates.length > 0 ? (totalQuestions / sortedDates.length).toFixed(1) : "0";

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
            fastestModule,
            mostFrequentModule,
            mostFrequentCount,
            maxConsecutiveDays,
            avgQuestionsPerDay,
            bestSingleAccuracy,
            bestSingleAccuracyDate
        };
    }, [records]);

    // 卡片内容数组类型与数据
    type CardItem = { title: string; value: number | string; tooltip?: string; extra?: string };
    const cards: CardItem[] = [
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
            title: "总用时",
            value: minutesToTimeString(stats.totalDuration),
        },
        {
            title: "平均用时/次",
            value: minutesToTimeString(stats.avgDuration),
        },
        {
            title: "平均每题用时",
            value: minutesToTimeString(stats.avgTimePerQuestion),
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
            value: stats.longestSession > 0 ? minutesToTimeString(stats.longestSession) : "暂无记录",
        },
        {
            title: "最快刷题速度",
            value: stats.fastestSpeed < Infinity ? `${minutesToTimeString(stats.fastestSpeed)}/题` : "暂无记录",
            tooltip: stats.fastestSpeed < Infinity ? `来源模块：${stats.fastestModule}` : '',
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

    // 动画布局
    // 均分为两组
    const half = Math.ceil(cards.length / 2);
    const group1 = cards.slice(0, half);
    const group2 = cards.slice(half);

    return (
        <TooltipProvider>
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 sm:gap-8">
                {overviewAnimate ? (
                    <Marquee className="w-full" pauseOnHover repeat={2}>
                        <div className="flex gap-4 sm:gap-6">
                            {group1.map((item, idx) => (
                                <Card className="min-w-[160px] sm:min-w-[220px] h-[100px] sm:h-[120px] flex items-center justify-center p-0" key={item.title + idx}>
                                    <div className="flex flex-col items-center text-center w-full px-3 sm:px-6">
                                        <div className="flex flex-row items-center justify-center">
                                            <CardTitle className="text-sm sm:text-base">{item.title}</CardTitle>
                                            {item.tooltip && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-help ml-1" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p><MixedText text={item.tooltip} /></p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center justify-center py-1 flex-grow">
                                            <div className="text-lg sm:text-2xl font-bold">
                                                <MixedText text={String(item.value)} />
                                            </div>
                                            {item.extra && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    <MixedText text={item.extra} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </Marquee>
                ) : (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-6 py-4 sm:py-6">
                        {cards.map((item, idx) => (
                            <Card className="min-w-[160px] sm:min-w-[220px] h-[100px] sm:h-[120px] flex items-center justify-center p-0" key={item.title + idx}>
                                <div className="flex flex-col items-center text-center w-full px-3 sm:px-6">
                                    <div className="flex flex-row items-center justify-center">
                                        <CardTitle className="text-sm sm:text-base">{item.title}</CardTitle>
                                        {item.tooltip && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-help ml-1" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p><MixedText text={item.tooltip} /></p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center justify-center py-1 flex-grow">
                                        <div className="text-lg sm:text-2xl font-bold">
                                            <MixedText text={String(item.value)} />
                                        </div>
                                        {item.extra && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                <MixedText text={item.extra} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
                {overviewAnimate ? (
                    <Marquee className="w-full" pauseOnHover reverse repeat={2}>
                        <div className="flex gap-4 sm:gap-6">
                            {group2.map((item, idx) => (
                                <Card className="min-w-[160px] sm:min-w-[220px] h-[100px] sm:h-[120px] flex items-center justify-center p-0" key={item.title + idx}>
                                    <div className="flex flex-col items-center text-center w-full px-3 sm:px-6">
                                        <div className="flex flex-row items-center justify-center">
                                            <CardTitle className="text-sm sm:text-base">{item.title}</CardTitle>
                                            {item.tooltip && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-help ml-1" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p><MixedText text={item.tooltip} /></p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center justify-center py-1 flex-grow">
                                            <div className="text-lg sm:text-2xl font-bold">
                                                <MixedText text={String(item.value)} />
                                            </div>
                                            {item.extra && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    <MixedText text={item.extra} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </Marquee>
                ) : null}
            </div>
        </TooltipProvider>
    );
}