import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import type { KnowledgeItem } from "@/types/record";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { format } from 'date-fns';
import { MODULES } from '@/config/exam';

interface KnowledgeSummaryViewProps {
    knowledge: KnowledgeItem[];
    onBatchDeleteKnowledge?: (ids: string[]) => void;
}

const getColumns = (module: string): DataTableColumn<KnowledgeItem>[] => {
    switch (module) {
        case 'data-analysis':
        case 'math':
        case 'common':
        case 'logic':
            return [
                { key: 'type', label: '类型', className: 'w-24' },
                { key: 'note', label: '技巧记录', className: 'w-48' },
            ];
        case 'politics':
            return [
                { key: 'date', label: '发布日期', className: 'w-24' },
                { key: 'source', label: '文件来源', className: 'w-32' },
                { key: 'note', label: '相关重点', className: 'w-48' },
            ];
        case 'verbal':
            return [
                { key: 'idiom', label: '成语', className: 'w-24' },
                { key: 'meaning', label: '含义', className: 'w-48' },
            ];
        default:
            return [];
    }
};

const KnowledgeSummaryView: React.FC<KnowledgeSummaryViewProps> = ({ knowledge, onBatchDeleteKnowledge }) => {
    const [selectedModule, setSelectedModule] = useState('data-analysis');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const columns = getColumns(selectedModule).map(col => {
        if (selectedModule === 'politics' && col.key === 'date') {
            return {
                ...col,
                render: (row: KnowledgeItem) => {
                    const value = (row as Record<string, unknown>)[col.key];
                    if (!value || typeof value !== 'string') return '';
                    const d = new Date(value);
                    if (!isNaN(d.getTime())) {
                        return format(d, 'yyyy-MM-dd');
                    }
                    return value;
                }
            };
        }
        return col;
    });
    // 先按模块过滤
    let filtered = knowledge.filter(item => item.module === selectedModule);
    // 再按关键词过滤
    const searchLower = search.trim().toLowerCase();
    if (searchLower) {
        filtered = filtered.filter(item =>
            Object.values(item).some(
                v => typeof v === 'string' && v.toLowerCase().includes(searchLower)
            )
        );
    }
    // 分页
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
    useEffect(() => {
        setSelectedRows([]);
        setPage(1); // 切换模块或搜索时重置页码
    }, [knowledge, selectedModule, search]);

    const handleDeleteSelected = () => {
        if (!onBatchDeleteKnowledge) return;
        onBatchDeleteKnowledge(selectedRows);
        setSelectedRows([]);
        setDeleteDialogOpen(false);
    };

    // 导出为Excel
    const handleExportExcel = () => {
        if (filtered.length === 0) return;
        const today = format(new Date(), 'yyyyMMdd');
        const ws = XLSX.utils.json_to_sheet(filtered.map(item => {
            if (selectedModule === 'politics') {
                const k = item as { date?: string; source?: string; note?: string };
                // 格式化日期
                let dateStr = '';
                if (k.date) {
                    const d = new Date(k.date);
                    if (!isNaN(d.getTime())) {
                        dateStr = format(d, 'yyyy-MM-dd');
                    } else {
                        dateStr = k.date;
                    }
                }
                return {
                    '发布日期': dateStr,
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
        XLSX.writeFile(wb, `知识点_${MODULES.find(m => m.value === selectedModule)?.label || selectedModule}_${today}.xlsx`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-2 md:px-8">
            <Card className="max-w-6xl w-full relative">
                <CardContent>
                    {/* 顶部操作区：下拉、搜索、按钮一行对齐 */}
                    <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 flex-1">
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
                            <div className="flex-1 min-w-[120px] max-w-xs">
                                <Input
                                    id="knowledge-search"
                                    placeholder="输入关键词搜索..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full max-w-xs h-9 py-2"
                                />
                            </div>
                        </div>
                        {/* 右侧按钮组 */}
                        <div className="flex gap-2 shrink-0 mt-2 md:mt-0">
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
                    </div>
                    <div className="overflow-x-auto">
                        <DataTable<KnowledgeItem, string>
                            columns={columns}
                            data={paged}
                            selected={selectedRows}
                            onSelect={v => setSelectedRows(v as string[])}
                            rowKey={row => row.id}
                            checkboxColClassName="w-6"
                        />
                    </div>
                    {/* 分页组件 */}
                    <div className="mt-6 flex justify-center">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={e => {
                                            e.preventDefault();
                                            if (page > 1) setPage(page - 1);
                                        }}
                                        aria-disabled={page === 1}
                                        tabIndex={page === 1 ? -1 : 0}
                                    />
                                </PaginationItem>
                                {/* 页码数字，最多显示7个，超出用... */}
                                {(() => {
                                    const items = [];
                                    let start = Math.max(1, page - 3);
                                    let end = Math.min(totalPages, page + 3);
                                    if (end - start < 6) {
                                        if (start === 1) end = Math.min(totalPages, start + 6);
                                        if (end === totalPages) start = Math.max(1, end - 6);
                                    }
                                    if (start > 1) {
                                        items.push(
                                            <PaginationItem key={1}>
                                                <PaginationLink isActive={page === 1} onClick={e => { e.preventDefault(); setPage(1); }}>1</PaginationLink>
                                            </PaginationItem>
                                        );
                                        if (start > 2) items.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
                                    }
                                    for (let i = start; i <= end; ++i) {
                                        items.push(
                                            <PaginationItem key={i}>
                                                <PaginationLink isActive={page === i} onClick={e => { e.preventDefault(); setPage(i); }}>{i}</PaginationLink>
                                            </PaginationItem>
                                        );
                                    }
                                    if (end < totalPages) {
                                        if (end < totalPages - 1) items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
                                        items.push(
                                            <PaginationItem key={totalPages}>
                                                <PaginationLink isActive={page === totalPages} onClick={e => { e.preventDefault(); setPage(totalPages); }}>{totalPages}</PaginationLink>
                                            </PaginationItem>
                                        );
                                    }
                                    return items;
                                })()}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={e => {
                                            e.preventDefault();
                                            if (page < totalPages) setPage(page + 1);
                                        }}
                                        aria-disabled={page === totalPages}
                                        tabIndex={page === totalPages ? -1 : 0}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default KnowledgeSummaryView; 