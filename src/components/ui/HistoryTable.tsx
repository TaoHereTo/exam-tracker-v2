import React from "react";
import { UnifiedTable, DataTableColumn } from "@/components/ui/UnifiedTable";
import type { RecordItem } from "@/components/forms/NewRecordForm";
import { normalizeModuleName } from "@/config/exam";
import { Trash2 } from "lucide-react";

export function HistoryTable({
    records,
    selectedIds,
    onSelectIds,
    onSingleDelete
}: {
    records: RecordItem[];
    selectedIds: number[];
    onSelectIds: (ids: number[]) => void;
    onSingleDelete?: (record: RecordItem) => void;
}) {

    const columns: DataTableColumn<RecordItem>[] = [
        { key: 'date', label: '日期' },
        { key: 'module', label: '模块', render: row => normalizeModuleName(row.module) },
        { key: 'total', label: '题目数' },
        { key: 'correctRate', label: '正确率', render: row => row.total > 0 ? `${Math.round((row.correct / row.total) * 100)}%` : '-' },
        { key: 'duration', label: '时长(分)' },
    ];

    return (
        <UnifiedTable<RecordItem, number>
            columns={columns}
            data={records}
            selected={selectedIds}
            onSelect={v => onSelectIds(v as number[])}
            rowKey={row => row.id}
            contextMenuItems={[
                {
                    label: "删除",
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: (record) => {
                        if (onSingleDelete) {
                            onSingleDelete(record);
                        }
                    },
                    variant: "destructive",
                },
            ]}
        />
    );
} 