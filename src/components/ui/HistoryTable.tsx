import React, { useState } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import type { RecordItem } from "@/components/forms/NewRecordForm";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { normalizeModuleName } from "@/config/exam";

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
    const columns: DataTableColumn<RecordItem>[] = [
        { key: 'date', label: '日期' },
        { key: 'module', label: '模块', render: row => normalizeModuleName(row.module) },
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