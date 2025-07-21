import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

interface KnowledgeSummaryViewProps {
    knowledge: any[];
    onBatchDeleteKnowledge?: (ids: string[]) => void; // 假设知识点有唯一id字段
}

const MODULES = [
    { value: 'data-analysis', label: '资料分析' },
    { value: 'politics', label: '政治理论' },
    { value: 'math', label: '数量关系' },
    { value: 'common', label: '常识判断' },
    { value: 'verbal', label: '言语理解' },
    { value: 'logic', label: '判断推理' },
];

const getColumns = (module: string) => {
    switch (module) {
        case 'data-analysis':
            return [
                { key: 'type', label: '类型' },
                { key: 'note', label: '技巧记录' },
            ];
        case 'politics':
            return [
                { key: 'date', label: '发布日期' },
                { key: 'source', label: '文件来源' },
                { key: 'note', label: '相关重点' },
            ];
        case 'math':
            return [
                { key: 'type', label: '类型' },
                { key: 'note', label: '技巧记录' },
            ];
        case 'common':
            return [
                { key: 'type', label: '类型' },
                { key: 'note', label: '技巧记录' },
            ];
        case 'verbal':
            return [
                { key: 'idiom', label: '成语' },
                { key: 'meaning', label: '含义' },
            ];
        case 'logic':
            return [
                { key: 'type', label: '类型' },
                { key: 'note', label: '技巧记录' },
            ];
        default:
            return [];
    }
};

const KnowledgeSummaryView: React.FC<KnowledgeSummaryViewProps> = ({ knowledge, onBatchDeleteKnowledge }) => {
    const [selectedModule, setSelectedModule] = useState('data-analysis');
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const columns = getColumns(selectedModule);
    const filtered = knowledge.filter(item => item.module === selectedModule);

    // 关键：knowledge或模块变化时重置选中行
    useEffect(() => {
        setSelectedRows([]);
    }, [knowledge, selectedModule]);

    // 全选/取消全选
    const allChecked = filtered.length > 0 && selectedRows.length === filtered.length;
    const isIndeterminate = selectedRows.length > 0 && selectedRows.length < filtered.length;
    const handleCheckAll = () => {
        if (allChecked) setSelectedRows([]);
        else setSelectedRows(filtered.map((_, idx) => idx));
    };
    const handleCheckRow = (idx: number) => {
        setSelectedRows(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    };
    // 删除选中项
    const handleDeleteSelected = () => {
        if (!onBatchDeleteKnowledge) return;
        const selectedIds = selectedRows.map(idx => filtered[idx]?.id).filter(Boolean);
        onBatchDeleteKnowledge(selectedIds);
        setSelectedRows([]);
        setDeleteDialogOpen(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <Card className="max-w-3xl w-full relative">
                <div className="absolute top-4 right-4 z-10">
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                disabled={selectedRows.length === 0}
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                批量删除
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>确认批量删除？</AlertDialogTitle>
                                <AlertDialogDescription>
                                    此操作将删除所选的知识点，删除后无法恢复。是否确认？
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected}>确认删除</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <CardContent>
                    <div className="mb-4">
                        <Select value={selectedModule} onValueChange={setSelectedModule}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="请选择模块" />
                            </SelectTrigger>
                            <SelectContent>
                                {MODULES.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                            <thead>
                                <tr>
                                    <th className="border px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100">
                                        <Checkbox checked={allChecked} indeterminate={isIndeterminate} onCheckedChange={handleCheckAll} />
                                    </th>
                                    {columns.map(col => (
                                        <th key={col.key} className="border px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100">{col.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={columns.length + 1} className="text-center py-4 text-gray-400">暂无数据</td></tr>
                                ) : (
                                    filtered.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="border px-4 py-2 text-center">
                                                <Checkbox checked={selectedRows.includes(idx)} onCheckedChange={() => handleCheckRow(idx)} />
                                            </td>
                                            {columns.map(col => (
                                                <td key={col.key} className="border px-4 py-2">
                                                    {(() => {
                                                        const value = row[col.key];
                                                        if (value instanceof Date) {
                                                            return value.toLocaleDateString();
                                                        } else if (typeof value === 'string') {
                                                            // 尝试解析为日期字符串
                                                            const d = new Date(value);
                                                            if (col.key === 'date' && !isNaN(d.getTime()) && value.length > 6) {
                                                                return d.toLocaleDateString();
                                                            }
                                                            return value;
                                                        } else {
                                                            return value ?? '';
                                                        }
                                                    })()}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default KnowledgeSummaryView; 