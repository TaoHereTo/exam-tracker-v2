import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { UnifiedTable, DataTableColumn, TableFilter } from "@/components/ui/UnifiedTable";
import { SimpleLoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SimpleUiverseSpinner } from "@/components/ui/UiverseSpinner";
import type { KnowledgeItem } from "@/types/record";
import * as XLSX from "xlsx";
import { format } from 'date-fns';
import { MODULES, normalizeModuleName } from '@/config/exam';
import { lazy, Suspense } from 'react';

// 动态导入统一表单组件
const ModuleForm = lazy(() => import("../forms/ModuleForm").then(module => ({ default: module.default })));

import { Edit, Trash2, X, Info } from 'lucide-react';
import { CloudImageViewer } from '@/components/ui/CloudImageViewer';
import { MixedText } from '@/components/ui/MixedText';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { useCloudData } from '@/contexts/CloudDataContext';
import { cn } from '@/lib/utils';

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

const getColumns = (module: string, isCloudDataLoading: boolean): DataTableColumn<KnowledgeItem>[] => {
    const baseColumns = (() => {
        switch (module) {
            case 'data-analysis':
            case 'math':
                return [
                    {
                        key: 'type',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>类型</span>
                            </div>
                        ),
                        className: 'w-[25%]',
                        render: (row: KnowledgeItem) => {
                            const type = (row as Record<string, unknown>).type as string;
                            const imagePath = (row as Record<string, unknown>).imagePath as string;
                            return (
                                <span className="flex items-center justify-between w-full">
                                    <MixedText text={type} className="flex-1" />
                                    {imagePath && (
                                        <CloudImageViewer imageId={imagePath} size="sm" />
                                    )}
                                </span>
                            );
                        }
                    },
                    {
                        key: 'note',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>技巧记录</span>
                            </div>
                        ),
                        className: 'w-[75%]',
                        render: (row: KnowledgeItem) => {
                            const note = (row as Record<string, unknown>).note as string;

                            return (
                                <div className="text-sm leading-relaxed flex items-center h-full">
                                    <MarkdownRenderer content={note || ''} className="mb-0" />
                                </div>
                            );
                        }
                    },
                ];
            case 'logic':
                return [
                    {
                        key: 'subCategory',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>推理类型</span>
                            </div>
                        ),
                        className: 'w-[10%]'
                    },
                    {
                        key: 'type',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>类型</span>
                            </div>
                        ),
                        className: 'w-[25%]',
                        render: (row: KnowledgeItem) => {
                            const type = (row as Record<string, unknown>).type as string;
                            const imagePath = (row as Record<string, unknown>).imagePath as string;
                            return (
                                <span className="flex items-center justify-between w-full">
                                    <MixedText text={type} className="flex-1" />
                                    {imagePath && (
                                        <CloudImageViewer imageId={imagePath} size="sm" />
                                    )}
                                </span>
                            );
                        }
                    },
                    {
                        key: 'note',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>技巧记录</span>
                            </div>
                        ),
                        className: 'w-[55%]',
                        render: (row: KnowledgeItem) => {
                            const note = (row as Record<string, unknown>).note as string;
                            return (
                                <div className="text-sm leading-relaxed flex items-center h-full">
                                    <MarkdownRenderer content={note || ''} className="mb-0" />
                                </div>
                            );
                        }
                    },
                ];
            case 'common':
                return [
                    {
                        key: 'subCategory',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>常识类型</span>
                            </div>
                        ),
                        className: 'w-[10%]'
                    },
                    {
                        key: 'type',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>类型</span>
                            </div>
                        ),
                        className: 'w-[25%]',
                        render: (row: KnowledgeItem) => {
                            const type = (row as Record<string, unknown>).type as string;
                            const imagePath = (row as Record<string, unknown>).imagePath as string;
                            return (
                                <span className="flex items-center justify-between w-full">
                                    <MixedText text={type} className="flex-1" />
                                    {imagePath && (
                                        <CloudImageViewer imageId={imagePath} size="sm" />
                                    )}
                                </span>
                            );
                        }
                    },
                    {
                        key: 'note',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>技巧记录</span>
                            </div>
                        ),
                        className: 'w-[55%]',
                        render: (row: KnowledgeItem) => {
                            const note = (row as Record<string, unknown>).note as string;
                            return (
                                <div className="text-sm leading-relaxed flex items-center h-full">
                                    <MarkdownRenderer content={note || ''} className="mb-0" />
                                </div>
                            );
                        }
                    },
                ];
            case 'politics':
                return [
                    {
                        key: 'date',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>发布日期</span>
                            </div>
                        ),
                        className: 'w-[12%]',
                        render: (row: KnowledgeItem) => {
                            const value = (row as Record<string, unknown>).date as string;
                            const imagePath = (row as Record<string, unknown>).imagePath as string;
                            if (!value || typeof value !== 'string') return '';
                            const d = new Date(value);
                            if (!isNaN(d.getTime())) {
                                return (
                                    <div className="flex items-center justify-between">
                                        <span className="flex-1">{format(d, 'yyyy-MM-dd')}</span>
                                        {imagePath && (
                                            <CloudImageViewer imageId={imagePath} size="sm" />
                                        )}
                                    </div>
                                );
                            }
                            return (
                                <div className="flex items-center justify-between">
                                    <span className="flex-1">{value}</span>
                                    {imagePath && (
                                        <CloudImageViewer imageId={imagePath} size="sm" />
                                    )}
                                </div>
                            );
                        }
                    },
                    {
                        key: 'source',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>文件来源</span>
                            </div>
                        ),
                        className: 'w-[25%]'
                    },
                    {
                        key: 'note',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>相关重点</span>
                            </div>
                        ),
                        className: 'w-[60%]',
                        render: (row: KnowledgeItem) => {
                            const note = (row as Record<string, unknown>).note as string;
                            return (
                                <div className="text-sm leading-relaxed flex items-center h-full">
                                    <MarkdownRenderer content={note || ''} className="mb-0" />
                                </div>
                            );
                        }
                    },
                ];
            case 'verbal':
                return [
                    {
                        key: 'subCategory',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>言语类型</span>
                            </div>
                        ),
                        className: 'w-[10%]'
                    },
                    {
                        key: 'type',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>类型</span>
                            </div>
                        ),
                        className: 'w-[25%]',
                        render: (row: KnowledgeItem) => {
                            const type = (row as Record<string, unknown>).type as string;
                            const imagePath = (row as Record<string, unknown>).imagePath as string;
                            return (
                                <span className="flex items-center justify-between w-full">
                                    <MixedText text={type} className="flex-1" />
                                    {imagePath && (
                                        <CloudImageViewer imageId={imagePath} size="sm" />
                                    )}
                                </span>
                            );
                        }
                    },
                    {
                        key: 'note',
                        label: (
                            <div className="flex items-center gap-1">
                                <span>技巧记录</span>
                            </div>
                        ),
                        className: 'w-[55%]',
                        render: (row: KnowledgeItem) => {
                            const note = (row as Record<string, unknown>).note as string;
                            return (
                                <div className="text-sm leading-relaxed flex items-center h-full">
                                    <MarkdownRenderer content={note || ''} className="mb-0" />
                                </div>
                            );
                        }
                    },
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
    const { isCloudDataLoading } = useCloudData();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 7;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<KnowledgeItem | null>(null);
    const [editError, setEditError] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // 当模块改变时，重置子分类选择
    useEffect(() => {
        setSelectedSubCategory('all');
        setPage(1);
    }, [selectedModule]);

    const columns = useMemo(() => getColumns(selectedModule, isCloudDataLoading), [selectedModule, isCloudDataLoading]);

    // Calculate module counts for hover card
    const moduleCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        MODULES.forEach(module => {
            counts[module.label] = knowledge.filter(item =>
                normalizeModuleName(item.module) === module.label
            ).length;
        });
        return counts;
    }, [knowledge]);

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
        if (selectedRows.length === 0) {
            return;
        }
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!onBatchDeleteKnowledge) {
            return;
        }
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
                const k = item as { type?: string; note?: string; subCategory?: string };
                return {
                    '言语类型': k.subCategory ?? '',
                    '类型': k.type ?? '',
                    '技巧记录': k.note ?? '',
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

    const debugData = useMemo(() => {
        const moduleKnowledge = knowledge.filter(item => normalizeModuleName(item.module) === normalizeModuleName(selectedModule));
        return moduleKnowledge.slice(0, 3).map(item => {
            const note = (item as Record<string, unknown>).note as string || '';
            const type = (item as Record<string, unknown>).type as string || '';
            return {
                id: item.id,
                note,
                type,
                hasBoldInNote: /\*\*[^*]+\*\*/.test(note),
                hasItalicInNote: /\*[^*]+\*/.test(note),
                hasRedInNote: /\{red\}[^{}]+\{\/red\}/.test(note),
                hasBoldInType: /\*\*[^*]+\*\*/.test(type),
                hasItalicInType: /\*[^*]+\*/.test(type),
                hasRedInType: /\{red\}[^{}]+\{\/red\}/.test(type)
            };
        });
    }, [knowledge, selectedModule]);

    return (
        <div className="pt-4 px-2 md:px-8">

            <UnifiedTable<KnowledgeItem, string>
                columns={columns}
                data={paged}
                selected={selectedRows}
                onSelect={(v: string[]) => setSelectedRows(v)}
                rowKey={(row) => row.id}
                checkboxColClassName=""
                filters={filters}
                pagination={{
                    currentPage: page,
                    totalPages,
                    onPageChange: setPage,
                    totalItems: knowledge.length
                }}
                knowledge={knowledge}
                showModuleStats={true}
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
                enableRowClick={false} // 禁用行点击功能，避免影响复制操作
            />
            {/* 删除确认弹窗 */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle><MixedText text="确认删除" /></DialogTitle>
                        <DialogDescription>
                            <MixedText text={`确定要删除选中的 ${selectedRows.length} 个知识点吗？`} />
                            <br />
                            <br />
                            <MixedText text="此操作不可撤销，删除后无法恢复。" />
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            <MixedText text="取消" />
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            <MixedText text="确认删除" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* 编辑弹窗 */}
            <Dialog open={editDialogOpen || !!editError} onOpenChange={v => { setEditDialogOpen(v); if (!v) setEditError(""); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editError ? <MixedText text="错误" /> : <MixedText text="编辑知识点" />}</DialogTitle>
                        {editError && (
                            <DialogDescription className="text-red-500"><MixedText text={editError} /></DialogDescription>
                        )}
                    </DialogHeader>
                    {editItem && !editError && (
                        <div className="py-2">
                            <Suspense fallback={<SimpleUiverseSpinner className="py-8" />}>
                                <ModuleForm
                                    module={editItem.module}
                                    onAddKnowledge={data => handleEditSave({ ...editItem, ...data })}
                                    initialData={editItem}
                                    isInDialog={true}
                                />
                            </Suspense>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default KnowledgeSummaryView;
