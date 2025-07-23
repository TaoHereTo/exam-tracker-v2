import React, { useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StudyReportProps {
    records: any[];
    plans: any[];
    knowledge: any[];
}

export const StudyReport: React.FC<StudyReportProps> = ({ records, plans, knowledge }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState(false);

    // 总做题量、正确率、时长
    const total = records.reduce((sum, r) => sum + (r.total || 0), 0);
    const correct = records.reduce((sum, r) => sum + (r.correct || 0), 0);
    const duration = records.reduce((sum, r) => sum + (parseFloat(r.duration) || 0), 0);
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    // 近7天/30天趋势
    const now = new Date();
    const getDaysAgo = (n: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() - n);
        return d;
    };
    const recentRecords = (days: number) =>
        records.filter(r => new Date(r.date) >= getDaysAgo(days));
    const last7 = recentRecords(7);
    const last30 = recentRecords(30);
    const last7Total = last7.reduce((sum, r) => sum + (r.total || 0), 0);
    const last7Correct = last7.reduce((sum, r) => sum + (r.correct || 0), 0);
    const last7Accuracy = last7Total > 0 ? (last7Correct / last7Total) * 100 : 0;
    const last30Total = last30.reduce((sum, r) => sum + (r.total || 0), 0);
    const last30Correct = last30.reduce((sum, r) => sum + (r.correct || 0), 0);
    const last30Accuracy = last30Total > 0 ? (last30Correct / last30Total) * 100 : 0;

    // 各模块表现
    const moduleMap: Record<string, { total: number; correct: number }> = {};
    records.forEach(r => {
        if (!moduleMap[r.module]) moduleMap[r.module] = { total: 0, correct: 0 };
        moduleMap[r.module].total += r.total || 0;
        moduleMap[r.module].correct += r.correct || 0;
    });
    const moduleStats = Object.entries(moduleMap).map(([module, stat]) => ({
        module,
        total: stat.total,
        accuracy: stat.total > 0 ? (stat.correct / stat.total) * 100 : 0,
    }));

    // 亮点：最佳模块、进步最大模块
    const bestModule = moduleStats.reduce((best, cur) => (cur.accuracy > (best?.accuracy || 0) ? cur : best), null as any);
    const progressModule = (() => {
        // 近30天与历史平均对比
        const historyMap: Record<string, { total: number; correct: number }> = {};
        records.forEach(r => {
            if (!historyMap[r.module]) historyMap[r.module] = { total: 0, correct: 0 };
            historyMap[r.module].total += r.total || 0;
            historyMap[r.module].correct += r.correct || 0;
        });
        const last30Map: Record<string, { total: number; correct: number }> = {};
        last30.forEach(r => {
            if (!last30Map[r.module]) last30Map[r.module] = { total: 0, correct: 0 };
            last30Map[r.module].total += r.total || 0;
            last30Map[r.module].correct += r.correct || 0;
        });
        let maxDelta = -Infinity;
        let result = null;
        for (const m in last30Map) {
            const hist = historyMap[m] || { total: 0, correct: 0 };
            const histAcc = hist.total > 0 ? hist.correct / hist.total : 0;
            const lastAcc = last30Map[m].total > 0 ? last30Map[m].correct / last30Map[m].total : 0;
            const delta = lastAcc - histAcc;
            if (delta > maxDelta) {
                maxDelta = delta;
                result = { module: m, delta: delta * 100 };
            }
        }
        return result;
    })();

    // 修正 lab() 颜色为兼容色
    const fixLabColors = (el: HTMLElement) => {
        const all = el.querySelectorAll("*");
        all.forEach(node => {
            const style = window.getComputedStyle(node as Element);
            if (style.backgroundColor && style.backgroundColor.startsWith("lab(")) {
                (node as HTMLElement).style.backgroundColor = "#fff";
            }
            if (style.color && style.color.startsWith("lab(")) {
                (node as HTMLElement).style.color = "#222";
            }
        });
    };

    // 导出PDF
    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        if (typeof window === "undefined") return;
        setExporting(true);
        // 修正 lab() 颜色
        fixLabColors(reportRef.current);
        const html2pdf = (await import("html2pdf.js")).default;
        await html2pdf().set({
            margin: 0.5,
            filename: `学习报告_${new Date().toISOString().slice(0, 10)}.pdf`,
            html2canvas: { scale: 1 }, // 降低scale提升速度
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        }).from(reportRef.current).save();
        setExporting(false);
    };

    return (
        <Card className="max-w-3xl mx-auto my-8">
            <CardHeader>
                <CardTitle>学习报告</CardTitle>
            </CardHeader>
            <CardContent>
                <div ref={reportRef} className="bg-white p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-2">学习成果总览</h2>
                    <div className="mb-4">总做题量：<b>{total}</b>，总正确率：<b>{accuracy.toFixed(2)}%</b>，总用时：<b>{duration.toFixed(1)} 分钟</b></div>
                    <div className="mb-4">近7天做题量：<b>{last7Total}</b>，正确率：<b>{last7Accuracy.toFixed(2)}%</b></div>
                    <div className="mb-4">近30天做题量：<b>{last30Total}</b>，正确率：<b>{last30Accuracy.toFixed(2)}%</b></div>
                    <h3 className="font-bold mt-6 mb-2">各模块表现</h3>
                    <table className="w-full text-sm mb-4 border">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border px-2 py-1">模块</th>
                                <th className="border px-2 py-1">做题量</th>
                                <th className="border px-2 py-1">正确率</th>
                            </tr>
                        </thead>
                        <tbody>
                            {moduleStats.map(m => (
                                <tr key={m.module}>
                                    <td className="border px-2 py-1">{m.module}</td>
                                    <td className="border px-2 py-1">{m.total}</td>
                                    <td className="border px-2 py-1">{m.accuracy.toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <h3 className="font-bold mt-6 mb-2">亮点总结</h3>
                    <ul className="list-disc pl-6 mb-4">
                        {bestModule && <li>最佳模块：<b>{bestModule.module}</b>（正确率 {bestModule.accuracy.toFixed(2)}%）</li>}
                        {progressModule && <li>进步最大模块：<b>{progressModule.module}</b>（近30天提升 {progressModule.delta.toFixed(2)}%）</li>}
                        {plans.length > 0 && <li>当前学习计划数：<b>{plans.length}</b></li>}
                        {knowledge.length > 0 && <li>已录入知识点数：<b>{knowledge.length}</b></li>}
                    </ul>
                    <div className="text-xs text-gray-400">报告生成时间：{new Date().toLocaleString()}</div>
                </div>
                <Button className="mt-6" onClick={handleExportPDF} disabled={exporting}>
                    {exporting ? '正在生成PDF...' : '导出为PDF'}
                </Button>
            </CardContent>
        </Card>
    );
}; 