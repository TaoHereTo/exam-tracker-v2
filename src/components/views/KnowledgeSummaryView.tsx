import React, { useState, useEffect, useMemo } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { UnifiedTable, DataTableColumn, TableFilter } from "@/components/ui/UnifiedTable";
import { SimpleLoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { KnowledgeItem } from "@/types/record";
import * as XLSX from "xlsx";
import { format } from 'date-fns';
import { MODULES, normalizeModuleName } from '@/config/exam';
import { lazy, Suspense } from 'react';

// 动态导入统一表单组件
const ModuleForm = lazy(() => import("../forms/ModuleForm").then(module => ({ default: module.default })));

import { AlertDialog as SimpleDialog, AlertDialogContent as SimpleDialogContent, AlertDialogHeader as SimpleDialogHeader, AlertDialogTitle as SimpleDialogTitle, AlertDialogDescription as SimpleDialogDescription, AlertDialogFooter as SimpleDialogFooter, AlertDialogCancel as SimpleDialogCancel } from "@/components/ui/alert-dialog";
import { Edit, Trash2, X } from 'lucide-react';
import { CloudImageViewer } from '@/components/ui/CloudImageViewer';
import { MixedText } from '@/components/ui/MixedText';
import { CapsuleButton } from '@/components/ui/CapsuleButton';

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
                                    <MixedText text={type} className="flex-1" />
                                    {imagePath && (
                                        <CloudImageViewer imageId={imagePath} size="sm" />
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
                                    <MixedText text={type} className="flex-1" />
                                    {imagePath && (
                                        <CloudImageViewer imageId={imagePath} size="sm" />
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
                                    <MixedText text={type} className="flex-1" />
                                    {imagePath && (
                                        <CloudImageViewer imageId={imagePath} size="sm" />
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
                    { key: 'type', label: '类型', className: 'w-24' },
                    { key: 'note', label: '技巧记录', className: 'w-52' },
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

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 7;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<KnowledgeItem | null>(null);
    const [editError, setEditError] = useState("");
    const [singleDeleteDialogOpen, setSingleDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);

    // 当模块改变时，重置子分类选择
    useEffect(() => {
        setSelectedSubCategory('all');
        setPage(1);
    }, [selectedModule]);

    const columns = useMemo(() => getColumns(selectedModule).map(col => {
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
    }), [selectedModule]);

    // 使用useMemo优化过滤和分页计算
    const { filtered, totalPages, paged } = useMemo(() => {
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
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

        return { filtered, totalPages, paged };
    }, [knowledge, selectedModule, selectedSubCategory, search, page, pageSize]);

    useEffect(() => {
        setSelectedRows([]);
        // 智能分页：如果当前页超出新的总页数，则跳转到最后一页
        const newTotalPages = Math.max(1, Math.ceil(
            knowledge.filter(item => {
                if (normalizeModuleName(item.module) !== normalizeModuleName(selectedModule)) return false;
                if (selectedSubCategory !== 'all' && SUB_CATEGORIES[selectedModule as keyof typeof SUB_CATEGORIES]) {
                    const subCategory = (item as Record<string, unknown>).subCategory;
                    if (subCategory !== selectedSubCategory) return false;
                }
                const searchLower = search.trim().toLowerCase();
                if (searchLower) {
                    return Object.values(item).some(
                        v => typeof v === 'string' && v.toLowerCase().includes(searchLower)
                    );
                }
                return true;
            }).length / pageSize
        ));

        if (page > newTotalPages) {
            setPage(newTotalPages);
        }
    }, [knowledge, selectedModule, selectedSubCategory, search, page, pageSize]);

    const handleDeleteSelected = () => {
        if (!onBatchDeleteKnowledge) return;
        onBatchDeleteKnowledge(selectedRows);
        setSelectedRows([]);
    };

    const handleSingleDelete = (item: KnowledgeItem) => {
        setItemToDelete(item);
        setSingleDeleteDialogOpen(true);
    };

    const handleConfirmSingleDelete = () => {
        if (!onBatchDeleteKnowledge || !itemToDelete) return;
        onBatchDeleteKnowledge([itemToDelete.id]);
        setSingleDeleteDialogOpen(false);
        setItemToDelete(null);
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
                const toEdit = filtered.find((i: KnowledgeItem) => i.id === selectedRows[0]);
                if (toEdit) {
                    setEditItem(toEdit);
                    setEditDialogOpen(true);
                    setEditError("");
                }
            }
        }
    };

    const handleEditSave = (data: Record<string, unknown>) => {
        if (!editItem) return;
        if (onEditKnowledge) {
            // 构建更新后的知识点数据，确保字段正确
            const updatedKnowledge: KnowledgeItem = {
                ...editItem,
                ...data
            } as KnowledgeItem;

            onEditKnowledge(updatedKnowledge);
        }
        setEditDialogOpen(false);
        setEditItem(null);
    };



    // 导出为Excel
    const handleExportExcel = () => {
        if (filtered.length === 0) return;
        const today = format(new Date(), 'yyyyMMdd');
        const ws = XLSX.utils.json_to_sheet(filtered.map((item: KnowledgeItem) => {
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
                const k = item as { type?: string; note?: string; sub_category?: string };
                return {
                    '言语类型': k.sub_category ?? '',
                    '类型': k.type ?? '',
                    '技巧记录': k.note ?? '',
                };
            } else if (selectedModule === 'logic') {
                const k = item as { type?: string; note?: string; sub_category?: string };
                return {
                    '推理类型': k.sub_category ?? '',
                    '类型': k.type ?? '',
                    '技巧记录': k.note ?? '',
                };
            } else if (selectedModule === 'common') {
                const k = item as { type?: string; note?: string; sub_category?: string };
                return {
                    '常识类型': k.sub_category ?? '',
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



    const filters: TableFilter[] = [
        {
            type: 'select' as const,
            placeholder: '选择模块',
            value: selectedModule,
            onChange: setSelectedModule,
            options: MODULES.map(m => ({ value: m.value, label: m.label })),
            className: 'w-36'
        },
        ...(SUB_CATEGORIES[selectedModule as keyof typeof SUB_CATEGORIES] ? [{
            type: 'select' as const,
            placeholder: '选择子分类',
            value: selectedSubCategory,
            onChange: setSelectedSubCategory,
            options: SUB_CATEGORIES[selectedModule as keyof typeof SUB_CATEGORIES].map(category => ({
                value: category.value,
                label: category.label
            })),
            className: 'w-36'
        }] : []),
        {
            type: 'search' as const,
            placeholder: '输入关键词',
            value: search,
            onChange: setSearch,
            className: 'w-36'
        }
    ];

    return (
        <div className="pt-4 px-2 md:px-8">
            <UnifiedTable<KnowledgeItem, string>
                columns={columns}
                data={paged}
                selected={selectedRows}
                onSelect={(v: string[]) => setSelectedRows(v)}
                rowKey={(row) => row.id}
                checkboxColClassName="w-6"
                contextMenuItems={[
                    {
                        label: "编辑",
                        icon: <Edit className="w-4 h-4" />,
                        onClick: (item: KnowledgeItem) => handleEdit(item),
                    },
                    {
                        label: "删除",
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: (item: KnowledgeItem) => handleSingleDelete(item),
                        variant: "destructive",
                    },
                ]}
                filters={filters}
                pagination={{
                    currentPage: page,
                    totalPages,
                    onPageChange: setPage
                }}
                showExport={true}
                onExport={handleExportExcel}
                showNew={false}
                showEdit={true}
                onEdit={() => handleEdit()}
                editDisabled={selectedRows.length !== 1}
                showDelete={true}
                onDelete={handleDeleteSelected}
                deleteDisabled={selectedRows.length === 0}
                deleteConfirmText="此操作将删除所选的知识点，删除后无法恢复。是否确认？"
                className="w-full"
            />
            {/* 编辑弹窗 */}
            <SimpleDialog open={editDialogOpen || !!editError} onOpenChange={v => { setEditDialogOpen(v); if (!v) setEditError(""); }}>
                <SimpleDialogContent>
                    <div className="flex justify-between items-center">
                        <SimpleDialogTitle>{editError ? <MixedText text="错误" /> : <MixedText text="编辑知识点" />}</SimpleDialogTitle>
                        <CapsuleButton variant="ghost" size="icon" onClick={() => setEditDialogOpen(false)} className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6">
                            <X className="w-3 h-3" />
                        </CapsuleButton>
                    </div>
                    {editError ? (
                        <SimpleDialogDescription className="text-red-500"><MixedText text={editError} /></SimpleDialogDescription>
                    ) : editItem ? (
                        <div className="py-2">
                            <Suspense fallback={<SimpleLoadingSpinner className="py-8" />}>
                                <ModuleForm
                                    module={editItem.module}
                                    onAddKnowledge={data => handleEditSave({ ...editItem, ...data })}
                                    initialData={editItem}
                                />
                            </Suspense>
                        </div>
                    ) : null}
                </SimpleDialogContent>
            </SimpleDialog>
            {/* 单个删除确认弹窗 */}
            <AlertDialog open={singleDeleteDialogOpen} onOpenChange={setSingleDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle><MixedText text="确认删除" /></AlertDialogTitle>
                        <AlertDialogDescription>
                            您确定要删除这个知识点吗？此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setSingleDeleteDialogOpen(false); setItemToDelete(null); }}><MixedText text="取消" /></AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmSingleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <MixedText text="确认删除" />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default KnowledgeSummaryView; 