import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocalStorageBoolean } from "@/hooks/useLocalStorage";
import { normalizeModuleName } from "@/config/exam";
import { timeStringToMinutes, minutesToTimeString } from "@/lib/utils";
import { MixedText } from "@/components/ui/MixedText";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/animate-ui/components/animate/tooltip";
import { HelpCircle } from "lucide-react";
import { Marquee } from "@/components/magicui/marquee";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from '@/components/ui/simple-tabs';
import { ThemeColorProvider, PAGE_THEME_COLORS } from "@/contexts/ThemeColorContext";
import { FlexCenter, FlexCenterBoth } from "@/components/ui/FlexCenter";
import { CardContainer } from "@/components/ui/CardContainer";

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

export const OverviewView = function OverviewView({ records }: OverviewViewProps) {
    // 动态计算屏幕高度
    const [screenHeight, setScreenHeight] = useState(0);

    useEffect(() => {
        const updateHeight = () => {
            setScreenHeight(window.innerHeight);
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);

        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // 使用useMemo优化模块数据计算，避免tabs切换时重新计算
    const moduleData = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const moduleNames = {
            'data-analysis': '资料分析',
            'math': '数量关系',
            'logic': '判断推理',
            'common': '常识判断',
            'politics': '政治常识',
            'verbal': '言语理解'
        };

        // 计算每个模块的数据
        return Object.keys(moduleNames).map(module => {
            const moduleRecords = records.filter(r => r.module === module);
            const todayRecords = moduleRecords.filter(r => r.date === today);
            const weekRecords = moduleRecords.filter(r => r.date >= oneWeekAgo);

            // 刷题数量数据
            const todayTotal = todayRecords.reduce((sum, r) => sum + r.total, 0);
            const weekTotal = weekRecords.reduce((sum, r) => sum + r.total, 0);
            const historicalAvg = moduleRecords.length > 0 ? moduleRecords.reduce((sum, r) => sum + r.total, 0) / moduleRecords.length : 0;
            const weekChange = weekTotal - (historicalAvg * 7);

            // 每分钟得分数据
            const todayScorePerMinute = todayRecords.length > 0 ?
                todayRecords.reduce((sum, r) => {
                    const time = timeStringToMinutes(r.duration);
                    return sum + (time > 0 ? r.correct / time : 0);
                }, 0) / todayRecords.length : 0;

            const historicalScorePerMinute = moduleRecords.length > 0 ?
                moduleRecords.reduce((sum, r) => {
                    const time = timeStringToMinutes(r.duration);
                    return sum + (time > 0 ? r.correct / time : 0);
                }, 0) / moduleRecords.length : 0;

            const scoreChange = todayScorePerMinute - historicalScorePerMinute;

            // 正确率数据
            const todayAccuracy = todayRecords.length > 0 ?
                todayRecords.reduce((sum, r) => sum + (r.total > 0 ? (r.correct / r.total) : 0), 0) / todayRecords.length : 0;

            const historicalAccuracy = moduleRecords.length > 0 ?
                moduleRecords.reduce((sum, r) => sum + (r.total > 0 ? (r.correct / r.total) : 0), 0) / moduleRecords.length : 0;

            const accuracyChange = todayAccuracy - historicalAccuracy;

            return {
                module,
                name: moduleNames[module as keyof typeof moduleNames],
                todayTotal,
                weekTotal,
                historicalAvg,
                weekChange,
                todayScorePerMinute,
                historicalScorePerMinute,
                scoreChange,
                todayAccuracy,
                historicalAccuracy,
                accuracyChange,
                hasTodayData: todayRecords.length > 0,
                hasWeekData: weekRecords.length > 0,
                hasHistoricalData: moduleRecords.length > 0
            };
        });
    }, [records]);

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

    // 将cards分成两半，就像官网例子一样
    const firstRow = cards.slice(0, Math.ceil(cards.length / 2));
    const secondRow = cards.slice(Math.ceil(cards.length / 2));

    // 计算数据总结分析
    const generateDataSummary = () => {
        const today = new Date().toISOString().split('T')[0];
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // 今天的数据
        const todayRecords = records.filter(record => record.date === today);
        const todayStats = {
            totalQuestions: todayRecords.reduce((sum, r) => sum + r.total, 0),
            totalCorrect: todayRecords.reduce((sum, r) => sum + r.correct, 0),
            accuracy: todayRecords.length > 0 ? todayRecords.reduce((sum, r) => sum + r.correct, 0) / todayRecords.reduce((sum, r) => sum + r.total, 0) : 0,
            modules: todayRecords.reduce((acc, r) => {
                if (!acc[r.module]) acc[r.module] = { total: 0, correct: 0 };
                acc[r.module].total += r.total;
                acc[r.module].correct += r.correct;
                return acc;
            }, {} as Record<string, { total: number; correct: number }>)
        };

        // 最近一周的数据
        const weekRecords = records.filter(record => record.date >= oneWeekAgo);
        const weekStats = {
            totalQuestions: weekRecords.reduce((sum, r) => sum + r.total, 0),
            totalCorrect: weekRecords.reduce((sum, r) => sum + r.correct, 0),
            accuracy: weekRecords.length > 0 ? weekRecords.reduce((sum, r) => sum + r.correct, 0) / weekRecords.reduce((sum, r) => sum + r.total, 0) : 0,
            modules: weekRecords.reduce((acc, r) => {
                if (!acc[r.module]) acc[r.module] = { total: 0, correct: 0 };
                acc[r.module].total += r.total;
                acc[r.module].correct += r.correct;
                return acc;
            }, {} as Record<string, { total: number; correct: number }>)
        };

        // 历史平均数据
        const historicalStats = {
            totalQuestions: records.reduce((sum, r) => sum + r.total, 0),
            totalCorrect: records.reduce((sum, r) => sum + r.correct, 0),
            accuracy: records.length > 0 ? records.reduce((sum, r) => sum + r.correct, 0) / records.reduce((sum, r) => sum + r.total, 0) : 0,
            modules: records.reduce((acc, r) => {
                if (!acc[r.module]) acc[r.module] = { total: 0, correct: 0 };
                acc[r.module].total += r.total;
                acc[r.module].correct += r.correct;
                return acc;
            }, {} as Record<string, { total: number; correct: number }>)
        };

        // 生成总结信息
        const summaries = [];

        // 1. 今天 vs 历史平均
        if (todayStats.totalQuestions > 0) {
            const accuracyDiff = todayStats.accuracy - historicalStats.accuracy;
            const questionsDiff = todayStats.totalQuestions - (historicalStats.totalQuestions / records.length);

            if (accuracyDiff > 0.05) {
                summaries.push({
                    type: 'success',
                    title: '今日表现优秀',
                    content: `正确率比历史平均高${(accuracyDiff * 100).toFixed(1)}%，刷题${todayStats.totalQuestions}道`
                });
            } else if (accuracyDiff < -0.05) {
                summaries.push({
                    type: 'warning',
                    title: '今日需要加强',
                    content: `正确率比历史平均低${Math.abs(accuracyDiff * 100).toFixed(1)}%，建议多练习`
                });
            } else {
                summaries.push({
                    type: 'info',
                    title: '今日表现稳定',
                    content: `正确率与历史平均相近，保持良好状态`
                });
            }
        }

        // 2. 最近一周 vs 历史平均
        if (weekStats.totalQuestions > 0) {
            const weekAccuracyDiff = weekStats.accuracy - historicalStats.accuracy;
            const weekAvgQuestions = weekStats.totalQuestions / 7;
            const historicalAvgQuestions = historicalStats.totalQuestions / records.length;

            if (weekAccuracyDiff > 0.03) {
                summaries.push({
                    type: 'success',
                    title: '本周进步明显',
                    content: `最近一周正确率比历史平均高${(weekAccuracyDiff * 100).toFixed(1)}%`
                });
            } else if (weekAccuracyDiff < -0.03) {
                summaries.push({
                    type: 'warning',
                    title: '本周状态下滑',
                    content: `最近一周正确率比历史平均低${Math.abs(weekAccuracyDiff * 100).toFixed(1)}%`
                });
            }
        }

        // 3. 各模块表现分析
        const moduleNames = {
            'data-analysis': '资料分析',
            'math': '数量关系',
            'logic': '判断推理',
            'common': '常识判断',
            'politics': '政治常识',
            'verbal': '言语理解'
        };

        const moduleAccuracies = Object.entries(historicalStats.modules).map(([module, stats]) => ({
            module,
            name: moduleNames[module as keyof typeof moduleNames] || module,
            accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
            total: stats.total
        })).filter(m => m.total > 0).sort((a, b) => b.accuracy - a.accuracy);

        if (moduleAccuracies.length > 0) {
            const bestModule = moduleAccuracies[0];
            const worstModule = moduleAccuracies[moduleAccuracies.length - 1];

            if (bestModule.accuracy - worstModule.accuracy > 0.1) {
                summaries.push({
                    type: 'info',
                    title: '模块表现差异',
                    content: `${bestModule.name}表现最佳(${(bestModule.accuracy * 100).toFixed(1)}%)，${worstModule.name}需要加强(${(worstModule.accuracy * 100).toFixed(1)}%)`
                });
            }
        }

        // 4. 学习建议
        if (todayStats.totalQuestions === 0) {
            summaries.push({
                type: 'warning',
                title: '今日未刷题',
                content: '建议每天保持一定的刷题量，维持学习状态'
            });
        } else if (todayStats.totalQuestions < 20) {
            summaries.push({
                type: 'info',
                title: '建议增加题量',
                content: '今日刷题量较少，建议适当增加练习量'
            });
        }

        return summaries;
    };

    const dataSummaries = generateDataSummary();

    return (
        <div className="relative w-full flex flex-col items-center justify-start gap-responsive p-responsive bg-transparent">

            {/* 第一行 - 前半部分数据，正向滚动 */}
            <Marquee
                className="w-full [--duration:60s] [--gap:1rem] sm:[--gap:1.5rem]"
                pauseOnHover={true}
                repeat={2}
            >
                {firstRow.map((item, idx) => (
                    <Card className="min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px] md:min-w-[220px] md:w-[220px] h-[80px] sm:h-[100px] md:h-[120px] p-0 flex-shrink-0 bg-transparent hover:bg-muted/50 transition-colors cursor-pointer" key={`row1-${item.title}-${idx}`}>
                        <FlexCenterBoth className="h-full">
                            <div className="flex flex-col items-center text-center w-full px-3 sm:px-6">
                                <FlexCenterBoth>
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
                                </FlexCenterBoth>
                                <FlexCenterBoth className="py-1 flex-grow">
                                    <div className="text-lg sm:text-2xl font-medium">
                                        <MixedText text={String(item.value)} />
                                    </div>
                                    {item.extra && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            <MixedText text={item.extra} />
                                        </div>
                                    )}
                                </FlexCenterBoth>
                            </div>
                        </FlexCenterBoth>
                    </Card>
                ))}
            </Marquee>

            {/* 第二行 - 后半部分数据，逆向滚动 */}
            <Marquee
                className="w-full [--duration:60s] [--gap:1rem] sm:[--gap:1.5rem]"
                pauseOnHover={true}
                repeat={2}
                reverse={true}
            >
                {secondRow.map((item, idx) => (
                    <Card className="min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px] md:min-w-[220px] md:w-[220px] h-[80px] sm:h-[100px] md:h-[120px] p-0 flex-shrink-0 bg-transparent hover:bg-muted/50 transition-colors cursor-pointer" key={`row2-${item.title}-${idx}`}>
                        <FlexCenterBoth className="h-full">
                            <div className="flex flex-col items-center text-center w-full px-3 sm:px-6">
                                <FlexCenterBoth>
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
                                </FlexCenterBoth>
                                <FlexCenterBoth className="py-1 flex-grow">
                                    <div className="text-lg sm:text-2xl font-medium">
                                        <MixedText text={String(item.value)} />
                                    </div>
                                    {item.extra && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            <MixedText text={item.extra} />
                                        </div>
                                    )}
                                </FlexCenterBoth>
                            </div>
                        </FlexCenterBoth>
                    </Card>
                ))}
            </Marquee>

            {/* 添加渐变遮罩，就像官网例子一样 */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-transparent"></div>

            {/* 添加间距，让tabs显示在屏幕底部 */}
            <div className="h-16"></div>

            {/* 学习分析区域 - 放在屏幕底部 */}
            <div className="w-full mt-16 mb-12 bg-transparent">
                {/* 使用Animate Tabs展示分析卡片 */}
                <ThemeColorProvider defaultColor={PAGE_THEME_COLORS.overview}>
                    <Tabs defaultValue="data-analysis" className="w-full" themeColor={PAGE_THEME_COLORS.overview}>
                        <div className="flex justify-center mb-4 sm:mb-8">
                            <TabsList className="grid w-fit min-w-[200px] grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2">
                                {moduleData.map((module) => (
                                    <TabsTrigger key={module.module} value={module.module} className="text-xs sm:text-sm px-2 sm:px-4 py-1 flex items-center justify-center">
                                        {module.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                        <TabsContents className="py-4 sm:py-6 px-2">
                            {moduleData.map((module) => (
                                <TabsContent key={module.module} value={module.module} className="outline-none flex flex-col gap-6">
                                    <div className="w-full max-w-4xl mx-auto pb-4 space-y-4 sm:space-y-6">
                                        {/* 原有数据分析卡片 */}
                                        <Card className="p-3 sm:p-4 bg-transparent dark:border-[#262626]">
                                            <div className="space-y-3 sm:space-y-4">
                                                <h3 className="font-medium text-center text-base sm:text-lg">{module.name}</h3>

                                                {/* 刷题数量 */}
                                                <div className="p-2 sm:p-3 border rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-sm sm:text-base">刷题数量</span>
                                                        {module.hasWeekData ? (
                                                            <div className={`flex items-center gap-2 ${module.weekChange > 0 ? 'text-green-600' :
                                                                module.weekChange < 0 ? 'text-red-600' :
                                                                    'text-gray-600'
                                                                }`}>
                                                                {module.weekChange > 0 ? '↗️' : module.weekChange < 0 ? '↘️' : '➡️'}
                                                                <span className="text-sm font-medium">
                                                                    {module.weekChange > 0 ? '增加' : module.weekChange < 0 ? '减少' : '持平'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">本周无数据</span>
                                                        )}
                                                    </div>

                                                    {module.hasWeekData ? (
                                                        <>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                                                <div>
                                                                    <div className="text-muted-foreground mb-1">今日刷题</div>
                                                                    <div className="font-medium">{module.todayTotal}题</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-muted-foreground mb-1">本周总计</div>
                                                                    <div className="font-medium">{module.weekTotal}题</div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-2 pt-2 border-t">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">与历史平均对比</span>
                                                                    <span className={`font-medium ${module.weekChange > 0 ? 'text-green-600' :
                                                                        module.weekChange < 0 ? 'text-red-600' :
                                                                            'text-gray-600'
                                                                        }`}>
                                                                        {module.weekChange > 0 ? '+' : ''}{module.weekChange.toFixed(0)}题
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">
                                                            {module.hasHistoricalData ? '有历史数据，本周未录入' : '暂无任何数据'}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 每分钟得分 */}
                                                <div className="p-2 sm:p-3 border rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-sm sm:text-base">每分钟得分</span>
                                                        {module.hasTodayData ? (
                                                            <div className={`flex items-center gap-2 ${module.scoreChange > 0 ? 'text-green-600' :
                                                                module.scoreChange < 0 ? 'text-red-600' :
                                                                    'text-gray-600'
                                                                }`}>
                                                                {module.scoreChange > 0 ? '↗️' : module.scoreChange < 0 ? '↘️' : '➡️'}
                                                                <span className="text-sm font-medium">
                                                                    {module.scoreChange > 0 ? '上升' : module.scoreChange < 0 ? '下降' : '持平'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">今日未录入</span>
                                                        )}
                                                    </div>

                                                    {module.hasTodayData ? (
                                                        <>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                                                <div>
                                                                    <div className="text-muted-foreground mb-1">今日每分钟得分</div>
                                                                    <div className="font-medium">{module.todayScorePerMinute.toFixed(3)}分/分钟</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-muted-foreground mb-1">历史平均每分钟得分</div>
                                                                    <div className="font-medium">{module.historicalScorePerMinute.toFixed(3)}分/分钟</div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-2 pt-2 border-t">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">变化幅度</span>
                                                                    <span className={`font-medium ${module.scoreChange > 0 ? 'text-green-600' :
                                                                        module.scoreChange < 0 ? 'text-red-600' :
                                                                            'text-gray-600'
                                                                        }`}>
                                                                        {module.scoreChange > 0 ? '+' : ''}{module.scoreChange.toFixed(3)}分/分钟
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">
                                                            {module.hasHistoricalData ? '有历史数据，今日未录入' : '暂无任何数据'}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 正确率 */}
                                                <div className="p-3 border rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium">正确率</span>
                                                        {module.hasTodayData ? (
                                                            <div className={`flex items-center gap-2 ${module.accuracyChange > 0 ? 'text-green-600' :
                                                                module.accuracyChange < 0 ? 'text-red-600' :
                                                                    'text-gray-600'
                                                                }`}>
                                                                {module.accuracyChange > 0 ? '↗️' : module.accuracyChange < 0 ? '↘️' : '➡️'}
                                                                <span className="text-sm font-medium">
                                                                    {module.accuracyChange > 0 ? '上升' : module.accuracyChange < 0 ? '下降' : '持平'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">今日未录入</span>
                                                        )}
                                                    </div>

                                                    {module.hasTodayData ? (
                                                        <>
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <div className="text-muted-foreground mb-1">今日正确率</div>
                                                                    <div className="font-medium">{(module.todayAccuracy * 100).toFixed(1)}%</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-muted-foreground mb-1">历史平均正确率</div>
                                                                    <div className="font-medium">{(module.historicalAccuracy * 100).toFixed(1)}%</div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-2 pt-2 border-t">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">变化幅度</span>
                                                                    <span className={`font-medium ${module.accuracyChange > 0 ? 'text-green-600' :
                                                                        module.accuracyChange < 0 ? 'text-red-600' :
                                                                            'text-gray-600'
                                                                        }`}>
                                                                        {module.accuracyChange > 0 ? '+' : ''}{(module.accuracyChange * 100).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">
                                                            {module.hasHistoricalData ? '有历史数据，今日未录入' : '暂无任何数据'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </TabsContent>
                            ))}
                        </TabsContents>
                    </Tabs>
                </ThemeColorProvider>
            </div>
        </div>
    );
};