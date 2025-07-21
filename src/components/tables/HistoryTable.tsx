import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
    const allSelected = records.length > 0 && selectedIds.length === records.length;
    const indeterminate = selectedIds.length > 0 && selectedIds.length < records.length;

    return (
        <div className="max-w-6xl w-full mx-auto">
            <div className="mb-2 flex justify-between items-center">
                <span className="text-gray-500 text-sm">共 {records.length} 条记录</span>
                <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedIds.length === 0}
                    onClick={onBatchDelete}
                >
                    批量删除
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10 text-center">
                            <Checkbox
                                checked={allSelected}
                                indeterminate={indeterminate ? true : undefined}
                                onCheckedChange={checked => {
                                    if (checked) {
                                        onSelectIds(records.map(r => r.id));
                                    } else {
                                        onSelectIds([]);
                                    }
                                }}
                            />
                        </TableHead>
                        <TableHead>日期</TableHead>
                        <TableHead>模块</TableHead>
                        <TableHead>题目数</TableHead>
                        <TableHead>正确率</TableHead>
                        <TableHead>时长(分)</TableHead>
                        <TableHead>操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-400">暂无记录</TableCell>
                        </TableRow>
                    ) : (
                        records.map(record => (
                            <TableRow key={record.id}>
                                <TableCell className="text-center">
                                    <Checkbox
                                        checked={selectedIds.includes(record.id)}
                                        onCheckedChange={checked => {
                                            if (checked) {
                                                onSelectIds([...selectedIds, record.id]);
                                            } else {
                                                onSelectIds(selectedIds.filter(id => id !== record.id));
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>{record.date}</TableCell>
                                <TableCell>{record.module}</TableCell>
                                <TableCell>{record.total}</TableCell>
                                <TableCell>{record.total > 0 ? `${Math.round((record.correct / record.total) * 100)}%` : '-'}</TableCell>
                                <TableCell>{record.duration}</TableCell>
                                <TableCell>
                                    <Button variant="destructive" size="sm" onClick={() => onDeleteRecord(record.id)}>删除</Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
} 