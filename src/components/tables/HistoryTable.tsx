import React, { useState } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import type { RecordItem } from "@/components/forms/NewRecordForm";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export function HistoryTable({
    records,
    selectedIds,
    onSelectIds,
    onBatchDelete
}: {
    records: RecordItem[];
    selectedIds: number[];
    onSelectIds: (ids: number[]) => void;
    onBatchDelete: () => void;
}) {
    const moduleLabelMap: Record<string, string> = {
        'data-analysis': '资料分析',
        'politics': '政治理论',
        'math': '数量关系',
        'common': '常识判断',
        'verbal': '言语理解',
        'logic': '判断推理',
        '资料分析': '资料分析',
        '政治理论': '政治理论',
        '数量关系': '数量关系',
        '常识判断': '常识判断',
        '言语理解': '言语理解',
        '判断推理': '判断推理',
    };
    const columns: DataTableColumn<RecordItem>[] = [
        { key: 'date', label: '日期' },
        { key: 'module', label: '模块', render: row => moduleLabelMap[row.module] || row.module },
        { key: 'total', label: '题目数' },
        { key: 'correctRate', label: '正确率', render: row => row.total > 0 ? `${Math.round((row.correct / row.total) * 100)}%` : '-' },
        { key: 'duration', label: '时长(分)' },
    ];
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
    return (
        <div className="max-w-6xl w-full mx-auto">
            <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
                <DataTable<RecordItem, number>
                    columns={columns}
                    data={records}
                    selected={selectedIds}
                    onSelect={v => onSelectIds(v as number[])}
                    onBatchDelete={() => setShowBatchDeleteDialog(true)}
                    rowKey={row => row.id}
                    batchDeleteText="批量删除"
                />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认批量删除？</AlertDialogTitle>
                        <AlertDialogDescription>删除后无法恢复，确定要删除选中的历史记录吗？</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { setShowBatchDeleteDialog(false); onBatchDelete(); }}>确认删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 