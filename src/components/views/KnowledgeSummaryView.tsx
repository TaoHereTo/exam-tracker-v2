import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
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
import { MODULES, normalizeModuleName } from '@/config/exam';
import { KnowledgeForm } from "../forms/KnowledgeForm";
import VerbalForm from "../forms/VerbalForm";
import PoliticsForm from "../forms/PoliticsForm";
import { LogicForm } from "../forms/LogicForm";
import { CommonForm } from "../forms/CommonForm";
import { AlertDialog as SimpleDialog, AlertDialogContent as SimpleDialogContent, AlertDialogHeader as SimpleDialogHeader, AlertDialogTitle as SimpleDialogTitle, AlertDialogDescription as SimpleDialogDescription, AlertDialogFooter as SimpleDialogFooter, AlertDialogCancel as SimpleDialogCancel } from "@/components/ui/alert-dialog";
import { ArrowUpFromLine, Pencil, Search } from 'lucide-react';
import ReactBitsButton from '@/components/ui/ReactBitsButton';
import { ImageViewer } from '@/components/ui/ImageViewer';

interface KnowledgeSummaryViewProps {
    knowledge: KnowledgeItem[];
    onBatchDeleteKnowledge?: (ids: string[]) => void;
    onEditKnowledge?: (item: KnowledgeItem) => void;
}

// 定义每个模块的子分类选项
const SUB_CATEGORIES = {
    'logic': [
        { value: 'all', label: '全部推理类型' },
        { value: '图形推理', label: '图形推理' },
        { value: '定义判断', label: '定义判断' },
        { value: '类比推理', label: '类比推理' },
        { value: '逻辑判断', label: '逻辑判断' }
    ],
    'common': [
        { value: 'all', label: '全部常识类型' },
        { value: '经济常识', label: '经济常识' },
        { value: '法律常识', label: '法律常识' },
        { value: '科技常识', label: '科技常识' },
        { value: '人文常识', label: '人文常识' },
        { value: '地理国情', label: '地理国情' }
    ],
    'verbal': [
        { value: 'all', label: '全部言语类型' },
        { value: '逻辑填空', label: '逻辑填空' },
        { value: '片段阅读', label: '片段阅读' },
        { value: '成语积累', label: '成语积累' }
    ]
} as const;

const getColumns = (module: string): DataTableColumn<KnowledgeItem>[] => {
    const baseColumns = (() => {
        switch (module) {
            case 'data-analysis':
            case 'math':
                return [
                    {
                        key: 'type',
                        label: '类型',
                        className: 'w-24',
                        render: (row: KnowledgeItem) => {
                            const type = (row as Record<string, unknown>).type as string;
                            const imagePath = (row as Record<string, unknown>).imagePath as string;
                            return (
                                <div className="flex items-center justify-between">
                                    <span className="flex-1">{type}</span>
                                    {imagePath && (
                                        <ImageViewer imageId={imagePath} size="sm" />
                                    )}
                                </div>
                            );
                        }
                    },
                    { key: 'note', label: '技巧记录', className: 'w-48' },
                ];
            case 'logic':
                return [
                    { key: 'subCategory', label: '推理类型', className: 'w-20' },
                    {
                        key: 'type',
                        label: '类型',
                        className: 'w-24',
                        render: (row: KnowledgeItem) => {
                            const type = (row as Record<string, unknown>).type as string;
                            const imagePath = (row as Record<string, unknown>).imagePath as string;
                            return (
                                <div className="flex items-center justify-between">
                                    <span className="flex-1">{type}</span>
                                    {imagePath && (
                                        <ImageViewer imageId={imagePath} size="sm" />
                                    )}
                                </div>
                            );
                        }
                    },
                    { key: 'note', label: '技巧记录', className: 'w-52' },
                ];
            case 'common':
                return [
                    { key: 'subCategory', label: '常识类型', className: 'w-20' },
                    {
                        key: 'type',
                        label: '类型',
                        className: 'w-24',
                        render: (row: KnowledgeItem) => {
                            const type = (row as Record<string, unknown>).type as string;
                            const imagePath = (row as Record<string, unknown>).imagePath as string;
                            return (
                                <div className="flex items-center justify-between">
                                    <span className="flex-1">{type}</span>
                                    {imagePath && (
                                        <ImageViewer imageId={imagePath} size="sm" />
                                    )}
                                </div>
                            );
                        }
                    },
                    { key: 'note', label: '技巧记录', className: 'w-52' },
                ];
            case 'politics':
                return [
                    { key: 'date', label: '发布日期', className: 'w-24' },
                    { key: 'source', label: '文件来源', className: 'w-32' },
                    { key: 'note', label: '相关重点', className: 'w-48' },
                ];
            case 'verbal':
                return [
                    { key: 'subCategory', label: '言语类型', className: 'w-20' },
                    { key: 'idiom', label: '成语', className: 'w-24' },
                    { key: 'meaning', label: '含义', className: 'w-52' },
                ];
            default:
                return [];
        }
    })();

    return baseColumns;
};

const KnowledgeSummaryView: React.FC<KnowledgeSummaryViewProps> = ({ knowledge, onBatchDeleteKnowledge, onEditKnowledge }) => {
    const [selectedModule, setSelectedModule] = useState('data-analysis');
    const [selectedSubCategory, setSelectedSubCategory] = useState('all');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 7;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<KnowledgeItem | null>(null);
    const [editError, setEditError] = useState("");

    // 当模块改变时，重置子分类选择
    useEffect(() => {
        setSelectedSubCategory('all');
        setPage(1);
    }, [selectedModule]);

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
    let filtered = knowledge.filter(item => normalizeModuleName(item.module) === normalizeModuleName(selectedModule));

    // 再按子分类过滤
    if (selectedSubCategory !== 'all' && SUB_CATEGORIES[selectedModule as keyof typeof SUB_CATEGORIES]) {
        filtered = filtered.filter(item => {
            const subCategory = (item as Record<string, unknown>).subCategory;
            return subCategory === selectedSubCategory;
        });
    }

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
    }, [knowledge, selectedModule, selectedSubCategory, search]);

    const handleDeleteSelected = () => {
        if (!onBatchDeleteKnowledge) return;
        onBatchDeleteKnowledge(selectedRows);
        setSelectedRows([]);
        setDeleteDialogOpen(false);
    };

    const handleEdit = (item?: KnowledgeItem) => {
        if (item) {
            setEditItem(item);
            setEditDialogOpen(true);
            setEditError("");
        } else {
            if (selectedRows.length !== 1) {
                setEditError("一次只能编辑一个知识点，请只勾选一个。");
                setEditDialogOpen(false);
            } else {
                const toEdit = filtered.find(i => i.id === selectedRows[0]);
                if (toEdit) {
                    setEditItem(toEdit);
                    setEditDialogOpen(true);
                    setEditError("");
                }
            }
        }
    };

    const handleEditSave = (data: Partial<KnowledgeItem>) => {
        if (!editItem) return;
        if (onEditKnowledge) {
            onEditKnowledge({ ...editItem, ...data } as KnowledgeItem);
        }
        setEditDialogOpen(false);
        setEditItem(null);
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
                const k = item as { idiom?: string; meaning?: string; subCategory?: string };
                return {
                    '言语类型': k.subCategory ?? '',
                    '成语': k.idiom ?? '',
                    '含义': k.meaning ?? '',
                };
            } else if (selectedModule === 'logic') {
                const k = item as { type?: string; note?: string; subCategory?: string };
                return {
                    '推理类型': k.subCategory ?? '',
                    '类型': k.type ?? '',
                    '技巧记录': k.note ?? '',
                };
            } else if (selectedModule === 'common') {
                const k = item as { type?: string; note?: string; subCategory?: string };
                return {
                    '常识类型': k.subCategory ?? '',
                    '类型': k.type ?? '',
                    '技巧记录': k.note ?? '',
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
        <div className="flex flex-col items-center pt-4 px-2 md:px-8">
            <Card className="max-w-6xl w-full relative">
                <CardContent>
                    {/* 顶部操作区：下拉、搜索、按钮一行对齐 */}
                    <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 flex-1">
                            {/* 大模块选择 - 使用蓝色边框区分 */}
                            <Select value={selectedModule} onValueChange={setSelectedModule}>
                                <SelectTrigger className="w-36 border-blue-300 focus:border-blue-500">
                                    <SelectValue placeholder="选择模块" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MODULES.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* 子分类选择 - 使用绿色边框区分 */}
                            {SUB_CATEGORIES[selectedModule as keyof typeof SUB_CATEGORIES] && (
                                <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                                    <SelectTrigger className="w-40 border-green-300 focus:border-green-500">
                                        <SelectValue placeholder="选择子分类" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUB_CATEGORIES[selectedModule as keyof typeof SUB_CATEGORIES].map(category => (
                                            <SelectItem key={category.value} value={category.value}>
                                                {category.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* 搜索框 - 添加搜索图标 */}
                            <div className="flex-1 min-w-[120px] max-w-[200px] relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    id="knowledge-search"
                                    placeholder="输入关键词搜索..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full h-9 py-2 pl-10"
                                />
                            </div>

                        </div>
                        {/* 右侧按钮组 */}
                        <div className="flex gap-2 shrink-0 mt-2 md:mt-0">
                            <ReactBitsButton
                                variant="outline"
                                onClick={handleExportExcel}
                                className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white border-gray-500 hover:border-gray-600"
                                size="sm"
                            >
                                <ArrowUpFromLine className="w-4 h-4 mr-1" /> 导出为Excel
                            </ReactBitsButton>
                            <ReactBitsButton
                                variant="outline"
                                className="flex items-center gap-1 bg-blue-400 hover:bg-blue-500 text-white border-blue-400 hover:border-blue-500"
                                disabled={selectedRows.length !== 1}
                                onClick={() => handleEdit()}
                                size="sm"
                            >
                                <Pencil className="w-4 h-4 mr-1" /> 编辑
                            </ReactBitsButton>
                            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <ReactBitsButton
                                        variant="outline"
                                        disabled={selectedRows.length === 0}
                                        onClick={() => setDeleteDialogOpen(true)}
                                        size="sm"
                                        className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                                    >
                                        批量删除
                                    </ReactBitsButton>
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
            {/* 编辑弹窗 */}
            <SimpleDialog open={editDialogOpen || !!editError} onOpenChange={v => { setEditDialogOpen(v); if (!v) setEditError(""); }}>
                <SimpleDialogContent>
                    <SimpleDialogHeader>
                        <SimpleDialogTitle>编辑知识点</SimpleDialogTitle>
                    </SimpleDialogHeader>
                    {editError ? (
                        <SimpleDialogDescription className="text-red-500">{editError}</SimpleDialogDescription>
                    ) : editItem ? (
                        <div className="py-2">
                            {editItem.module === 'verbal' ? (
                                <VerbalForm
                                    onAddKnowledge={data => handleEditSave({ ...editItem, ...data })}
                                    initialData={editItem}
                                />
                            ) : editItem.module === 'politics' ? (
                                <PoliticsForm
                                    onAddKnowledge={data => handleEditSave({
                                        ...editItem,
                                        ...data,
                                        date: data.date instanceof Date ? (data.date ? data.date.toISOString() : null) : data.date
                                    })}
                                    initialData={{
                                        date: editItem.date ? (typeof editItem.date === 'string' ? (editItem.date ? new Date(editItem.date) : null) : editItem.date) : null,
                                        source: editItem.source,
                                        note: editItem.note
                                    }}
                                />
                            ) : editItem.module === 'logic' ? (
                                <LogicForm
                                    onAddKnowledge={data => handleEditSave({ ...editItem, ...data })}
                                    initialData={editItem}
                                />
                            ) : editItem.module === 'common' ? (
                                <CommonForm
                                    onAddKnowledge={data => handleEditSave({ ...editItem, ...data })}
                                    initialData={editItem}
                                />
                            ) : (
                                <KnowledgeForm
                                    title="编辑知识点"
                                    typePlaceholder="类型"
                                    notePlaceholder="技巧记录"
                                    onAddKnowledge={data => handleEditSave({ ...editItem, ...data })}
                                    initialData={editItem}
                                />
                            )}
                        </div>
                    ) : null}
                    <SimpleDialogFooter>
                        <SimpleDialogCancel onClick={() => { setEditDialogOpen(false); setEditError(""); }}>取消</SimpleDialogCancel>
                    </SimpleDialogFooter>
                </SimpleDialogContent>
            </SimpleDialog>
        </div>
    );
};

export default KnowledgeSummaryView; 