import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { RecordItem } from "@/components/forms/NewRecordForm";

export function HistoryTable({ records, onDeleteRecord }: { records: RecordItem[]; onDeleteRecord: (id: number) => void }) {
    return (
        <Table className="max-w-3xl mx-auto">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-10 text-center"><Checkbox /></TableHead>
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
                            <TableCell className="text-center"><Checkbox /></TableCell>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>{record.module}</TableCell>
                            <TableCell>{record.total}</TableCell>
                            <TableCell>{record.total > 0 ? `${Math.round((record.correct / record.total) * 100)}%` : '-'}</TableCell>
                            <TableCell>{record.duration}</TableCell>
                            <TableCell><Button variant="destructive" size="sm" onClick={() => onDeleteRecord(record.id)}>删除</Button></TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
} 