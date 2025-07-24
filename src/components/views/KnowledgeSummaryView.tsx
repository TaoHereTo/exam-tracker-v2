import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import type { KnowledgeItem } from "@/types/record";
import * as XLSX from "xlsx";

interface KnowledgeSummaryViewProps {
    knowledge: KnowledgeItem[];
    onBatchDeleteKnowledge?: (ids: string[]) => void;
}

const MODULES = [
    { value: 'data-analysis', label: '资料分析' },
    { value: 'politics', label: '政治理论' },
    { value: 'math', label: '数量关系' },
    { value: 'common', label: '常识判断' },
    { value: 'verbal', label: '言语理解' },
    { value: 'logic', label: '判断推理' },
];

const getColumns = (module: string): DataTableColumn<KnowledgeItem>[] => {
    switch (module) {
        case 'data-analysis':
        case 'math':
        case 'common':
        case 'logic':
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
        case 'verbal':
            return [
                { key: 'idiom', label: '成语' },
                { key: 'meaning', label: '含义' },
            ];
        default:
            return [];
    }
};

const KnowledgeSummaryView: React.FC<KnowledgeSummaryViewProps> = ({ knowledge, onBatchDeleteKnowledge }) => {
    const [selectedModule, setSelectedModule] = useState('data-analysis');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const columns = getColumns(selectedModule);
    const filtered = knowledge.filter(item => item.module === selectedModule);

    useEffect(() => {
        setSelectedRows([]);
    }, [knowledge, selectedModule]);

    const handleDeleteSelected = () => {
        if (!onBatchDeleteKnowledge) return;
        onBatchDeleteKnowledge(selectedRows);
        setSelectedRows([]);
        setDeleteDialogOpen(false);
    };

    // 导出为Excel
    const handleExportExcel = () => {
        if (filtered.length === 0) return;
        // 只导出当前模块的知识点
        const ws = XLSX.utils.json_to_sheet(filtered.map(item => {
            if (selectedModule === 'politics') {
                const k = item as { date?: string; source?: string; note?: string };
                return {
                    '发布日期': k.date ?? '',
                    '文件来源': k.source ?? '',
                    '相关重点': k.note ?? '',
                };
            } else if (selectedModule === 'verbal') {
                const k = item as { idiom?: string; meaning?: string };
                return {
                    '成语': k.idiom ?? '',
                    '含义': k.meaning ?? '',
                };
            } else {
                const k = item as { type?: string; note?: string };
                return {
                    '类型': k.type ?? '',
                    '技巧记录': k.note ?? '',
                };
            }
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, MODULES.find(m => m.value === selectedModule)?.label || selectedModule);
        XLSX.writeFile(wb, `知识点_${MODULES.find(m => m.value === selectedModule)?.label || selectedModule}.xlsx`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <Card className="max-w-3xl w-full relative">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <Button variant="outline" onClick={handleExportExcel}>导出为Excel</Button>
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
                        <DataTable<KnowledgeItem, string>
                            columns={columns}
                            data={filtered}
                            selected={selectedRows}
                            onSelect={v => setSelectedRows(v as string[])}
                            rowKey={row => row.id}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default KnowledgeSummaryView; 