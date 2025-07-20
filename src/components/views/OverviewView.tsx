import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import React from "react";

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
    // 最近一次刷题时间，取最大日期
    let lastDate = "暂无记录";
    if (records.length > 0) {
        const maxDateStr = records.reduce((max, r) => {
            return new Date(r.date) > new Date(max) ? r.date : max;
        }, records[0].date);
        lastDate = maxDateStr;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">数据概览</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>总刷题次数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSessions}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>总题数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalQuestions}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>总正确数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCorrect}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>平均正确率</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgAccuracy.toFixed(1)}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>总用时（分钟）</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDuration.toFixed(1)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>平均用时（分钟/次）</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgDuration.toFixed(1)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>最近一次刷题时间</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lastDate}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 