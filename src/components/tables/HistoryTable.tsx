import React from "react";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import type { RecordItem } from "@/components/forms/NewRecordForm";

export function HistoryTable({
    records,
    selectedIds,
    onSelectIds,
    onDeleteRecord,
    onBatchDelete
}: {
    records: RecordItem[];
    selectedIds: number[];
    onSelectIds: (ids: number[]) => void;
    onDeleteRecord: (id: number) => void;
    onBatchDelete: () => void;
}) {
    const columns: DataTableColumn<RecordItem>[] = [
        { key: 'date', label: '日期' },
        { key: 'module', label: '模块' },
        { key: 'total', label: '题目数' },
        { key: 'correctRate', label: '正确率', render: row => row.total > 0 ? `${Math.round((row.correct / row.total) * 100)}%` : '-' },
        { key: 'duration', label: '时长(分)' },
    ];
    return (
        <div className="max-w-6xl w-full mx-auto">
            <DataTable
                columns={columns}
                data={records}
                selected={selectedIds}
                onSelect={onSelectIds}
                onBatchDelete={onBatchDelete}
                rowKey={row => row.id}
                renderActions={row => (
                    <Button variant="destructive" size="sm" onClick={() => onDeleteRecord(row.id)}>删除</Button>
                )}
                batchDeleteText="批量删除"
            />
        </div>
    );
} 