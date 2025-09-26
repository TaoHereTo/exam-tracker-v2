"use client";
import { useState } from "react";
import { UnifiedTable } from "@/components/ui/UnifiedTable";
import { MODULES, MODULE_SCORES, FULL_EXAM_CONFIG, normalizeModuleName } from "@/config/exam";
import { minutesToTimeString } from "@/lib/utils";
import { useNotification } from "@/components/magicui/NotificationProvider";
import { Button } from "@/components/ui/button";
import { MixedText } from "@/components/ui/MixedText";
import { Bot, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/animate-ui/components/animate/tooltip";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Counter from "@/components/Counter";
import { motion } from "motion/react";

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

// 时间分配配置
interface TimeAllocation {
    '资料分析': number;
    '数量关系': number;
    '判断推理': number;
    '常识判断': number;
    '政治理论': number;
    '言语理解': number;
}

// 默认时间分配（分钟）
const DEFAULT_TIME_ALLOCATION: TimeAllocation = {
    '资料分析': 30,
    '数量关系': 10,
    '判断推理': 40,
    '常识判断': 10,
    '政治理论': 10,
    '言语理解': 20,
};

// Helper function to calculate score per minute
const getScorePerMinute = (record: RecordItem): number => {
    if (!record || !record.duration || record.duration === 0) return 0;
    const normalizedModule = normalizeModuleName(record.module);
    const score = record.correctCount * (MODULE_SCORES[normalizedModule as keyof typeof MODULE_SCORES] || 0.8);
    return score / record.duration;
};

export function ScorePredictor({ records }: ScorePredictorProps) {
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [timeAllocation, setTimeAllocation] = useState<TimeAllocation>(DEFAULT_TIME_ALLOCATION);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
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
            const allocatedTime = timeAllocation[moduleName as keyof TimeAllocation] || 0;
            const maxScore = config.questions * config.pointsPerQuestion;
            let predictedScore = 0;
            if (stats && stats.recordCount > 0) {
                predictedScore = stats.avgSpm * allocatedTime;
                predictedScore = Math.min(predictedScore, maxScore); // Cap at max score
            }
            totalPredictedScore += predictedScore;
            details.push({
                moduleName,
                avgSpm: stats.avgSpm.toFixed(2),
                timeAllocation: allocatedTime.toFixed(1),
                predictedScore: predictedScore.toFixed(2),
                maxScore: maxScore.toFixed(1),
            });
        });
        setPrediction({ total: totalPredictedScore, details });
    };

    // 处理时间分配更新
    const handleTimeAllocationChange = (moduleName: keyof TimeAllocation, value: string) => {
        const numValue = parseInt(value) || 0;
        setTimeAllocation(prev => ({
            ...prev,
            [moduleName]: numValue
        }));

        // 如果已经有预测结果，自动重新计算
        if (prediction) {
            setTimeout(() => {
                handlePredictScore();
            }, 0);
        }
    };

    // 重置为默认时间分配
    const resetToDefault = () => {
        setTimeAllocation(DEFAULT_TIME_ALLOCATION);

        // 如果已经有预测结果，自动重新计算
        if (prediction) {
            setTimeout(() => {
                handlePredictScore();
            }, 0);
        }
    };

    // 计算总时间
    const totalAllocatedTime = Object.values(timeAllocation).reduce((sum, time) => sum + time, 0);

    // 定义表格列配置
    const columns = [
        {
            key: 'moduleName',
            label: (
                <div className="flex items-center justify-center gap-1">
                    <span className="text-xs sm:text-sm">模块</span>
                </div>
            ),
            className: 'text-center',
            render: (row: PredictionDetail) => (
                <div className="text-center">
                    <MixedText text={row.moduleName} />
                </div>
            )
        },
        {
            key: 'avgSpm',
            label: (
                <div className="flex items-center justify-center gap-1">
                    <span className="text-xs sm:text-sm">平均每分钟得分</span>
                </div>
            ),
            className: 'text-center',
            render: (row: PredictionDetail) => (
                <div className="text-center">
                    <span className="font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        <MixedText text={row.avgSpm} />
                    </span>
                </div>
            )
        },
        {
            key: 'timeAllocation',
            label: (
                <div className="flex items-center justify-center gap-1">
                    <span className="text-xs sm:text-sm">分配时间</span>
                </div>
            ),
            className: 'text-center',
            render: (row: PredictionDetail) => (
                <div className="text-center">
                    <span className="font-bold bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        <MixedText text={minutesToTimeString(parseFloat(row.timeAllocation))} />
                    </span>
                </div>
            )
        },
        {
            key: 'predictedScore',
            label: (
                <div className="flex items-center justify-center gap-1">
                    <span className="text-xs sm:text-sm">预测得分</span>
                </div>
            ),
            className: 'text-center',
            render: (row: PredictionDetail) => (
                <div className="text-center">
                    <MixedText text={row.predictedScore} />
                </div>
            )
        },
        {
            key: 'maxScore',
            label: (
                <div className="flex items-center justify-center gap-1">
                    <span className="text-xs sm:text-sm">满分</span>
                </div>
            ),
            className: 'text-center',
            render: (row: PredictionDetail) => (
                <div className="text-center">
                    <MixedText text={row.maxScore} />
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

                {/* 预测按钮和时间分配编辑 */}
                <div className="mb-6 flex gap-3 items-center">
                    <Button
                        onClick={handlePredictScore}
                        variant="default"
                        className="h-9 rounded-full bg-[#6d28d9] hover:bg-[#6d28d9]/90 text-white"
                    >
                        <Bot className="w-5 h-5 mr-0.5" />
                        <MixedText text="预测我的行测总分" />
                    </Button>

                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </Button>
                                    </SheetTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p><MixedText text="编辑时间分配" /></p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <SheetContent className="w-[400px] sm:w-[540px]">
                            <SheetHeader>
                                <SheetTitle>
                                    <MixedText text="时间分配设置" />
                                </SheetTitle>
                                <SheetDescription>
                                    <MixedText text="设置各模块的考试时间分配（总时间：120分钟）" />
                                </SheetDescription>
                            </SheetHeader>

                            <div className="mt-6 px-6 space-y-4">
                                {Object.entries(timeAllocation).map(([moduleName, time]) => (
                                    <div key={moduleName} className="flex items-center justify-between">
                                        <Label htmlFor={moduleName} className="text-sm font-medium">
                                            <MixedText text={moduleName} />
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleTimeAllocationChange(moduleName as keyof TimeAllocation, Math.max(0, time - 1).toString())}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    -
                                                </Button>
                                                <div className="w-16 flex justify-center">
                                                    <Counter
                                                        value={time}
                                                        fontSize={20}
                                                        places={[10, 1]}
                                                        gap={2}
                                                        textColor="hsl(var(--foreground))"
                                                        fontWeight="bold"
                                                        gradientHeight={0}
                                                        gradientFrom="transparent"
                                                        gradientTo="transparent"
                                                    />
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleTimeAllocationChange(moduleName as keyof TimeAllocation, Math.min(120, time + 1).toString())}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    +
                                                </Button>
                                            </div>
                                            <span className="text-sm text-muted-foreground">分钟</span>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-medium">
                                            <MixedText text="总分配时间" />
                                        </span>
                                        <span className={`text-sm font-bold ${totalAllocatedTime === 120 ? 'text-green-600' : 'text-orange-600'}`}>
                                            <MixedText text={`${totalAllocatedTime} / 120 分钟`} />
                                        </span>
                                    </div>

                                    {totalAllocatedTime !== 120 && (
                                        <div className="text-xs text-orange-600 mb-3">
                                            <MixedText text={`时间分配${totalAllocatedTime > 120 ? '超出' : '不足'} ${Math.abs(totalAllocatedTime - 120)} 分钟`} />
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                setIsSheetOpen(false);
                                                // 如果已经有预测结果，自动重新计算
                                                if (prediction) {
                                                    setTimeout(() => {
                                                        handlePredictScore();
                                                    }, 100);
                                                }
                                            }}
                                            size="sm"
                                            className="flex-1 rounded-full bg-[#be185d] hover:bg-[#be185d]/90"
                                        >
                                            <MixedText text="确定" />
                                        </Button>
                                        <Button
                                            onClick={resetToDefault}
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 rounded-full"
                                        >
                                            <MixedText text="重置默认" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* 预测结果 */}
                {prediction && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.6,
                                delay: 0.2,
                                ease: "easeOut"
                            }}
                            className="mb-6"
                        >
                            <div className="overflow-hidden rounded-md border">
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
                        </motion.div>

                        {/* 预测总分显示 */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.8,
                                delay: 0.8,
                                ease: "easeOut",
                                type: "spring",
                                damping: 15,
                                stiffness: 300
                            }}
                            className="flex justify-center items-center gap-4 py-8"
                        >
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
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
} 