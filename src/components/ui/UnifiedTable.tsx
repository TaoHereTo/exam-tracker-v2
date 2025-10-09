import React, { ReactNode } from 'react';
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { BeautifulPagination } from "@/components/ui/BeautifulPagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/animate-ui/components/animate/tooltip";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/animate-ui/components/radix/hover-card";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Search, Upload, Trash2, Edit, FileSpreadsheet, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { CircularButton } from "@/components/ui/circular-button";
import { Card, CardContent } from "@/components/ui/card";
import { MixedText } from "@/components/ui/MixedText";
import { SimpleUiverseSpinner } from "@/components/ui/UiverseSpinner";
import type { RecordItem, KnowledgeItem } from "@/types/record";
import { MODULES, normalizeModuleName } from "@/config/exam";

// 数据表格列定义
export interface DataTableColumn<T> {
    key: string;
    label: string | React.ReactNode;
    render?: (row: T) => React.ReactNode;
    className?: string;
}

// 表格操作定义
export interface TableAction {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    className?: string;
    tooltip?: string; // 添加 tooltip 支持
}

// 表格过滤器定义
export interface TableFilter {
    type: 'select' | 'search';
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    options?: { value: string; label: string }[];
    className?: string;
}

// 统一表格属性
export interface UnifiedTableProps<T, K extends string | number = string | number> {
    // 数据相关
    columns: DataTableColumn<T>[];
    data: T[];
    selected: K[];
    onSelect: (selected: K[]) => void;
    rowKey: (row: T, idx: number) => K;
    selectable?: boolean;

    // 操作相关
    renderActions?: (row: T) => React.ReactNode;
    onBatchDelete?: () => void;
    batchDeleteText?: string;
    contextMenuItems?: {
        label: string;
        icon?: React.ReactNode;
        onClick: (row: T) => void;
        variant?: "default" | "destructive";
        disabled?: boolean;
    }[];

    // 容器相关
    title?: string;
    className?: string;
    actions?: TableAction[];
    filters?: TableFilter[];

    // 分页相关
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
        totalItems?: number;
    };

    // 模块统计相关
    records?: RecordItem[];
    knowledge?: KnowledgeItem[];
    showModuleStats?: boolean;

    // 预设操作
    showExport?: boolean;
    onExport?: () => void;
    showNew?: boolean;
    onNew?: () => void;
    showEdit?: boolean;
    onEdit?: () => void;
    editDisabled?: boolean;
    showDelete?: boolean;
    onDelete?: () => void;
    deleteDisabled?: boolean;
    deleteConfirmText?: string;

    // 样式相关
    checkboxColClassName?: string;

    // 交互相关
    enableRowClick?: boolean; // 是否启用行点击选择功能
}

export function UnifiedTable<T, K extends string | number = string | number>({
    // 数据相关
    columns,
    data,
    selected,
    onSelect,
    rowKey,
    selectable = true,

    // 操作相关
    renderActions,
    onBatchDelete,
    batchDeleteText = "批量删除",
    contextMenuItems = [],

    // 容器相关
    title,
    className = "",
    actions = [],
    filters = [],

    // 分页相关
    pagination,

    // 模块统计相关
    records = [],
    knowledge = [],
    showModuleStats = false,

    // 预设操作
    showExport = false,
    onExport,
    showNew = false,
    onNew,
    showEdit = false,
    onEdit,
    editDisabled = false,
    showDelete = false,
    onDelete,
    deleteDisabled = false,
    deleteConfirmText = "此操作将删除所选项目，删除后无法恢复。是否确认？",

    // 样式相关
    checkboxColClassName = "",

    // 交互相关
    enableRowClick = true, // 默认启用行点击功能
}: UnifiedTableProps<T, K>) {
    const allSelected = data.length > 0 && selected.length === data.length;
    const indeterminate = selected.length > 0 && selected.length < data.length;

    // Calculate module counts for records
    const recordModuleCounts = React.useMemo(() => {
        if (!showModuleStats || !records.length) return {};

        const counts: Record<string, number> = {};
        records.forEach(record => {
            const normalizedModule = normalizeModuleName(record.module);
            counts[normalizedModule] = (counts[normalizedModule] || 0) + 1;
        });
        return counts;
    }, [records, showModuleStats]);

    // Calculate module counts for knowledge
    const knowledgeModuleCounts = React.useMemo(() => {
        if (!showModuleStats || !knowledge.length) return {};

        const counts: Record<string, number> = {};
        knowledge.forEach(item => {
            const normalizedModule = normalizeModuleName(item.module);
            counts[normalizedModule] = (counts[normalizedModule] || 0) + 1;
        });
        return counts;
    }, [knowledge, showModuleStats]);

    // Render pagination info with optional hover card
    const renderPaginationInfo = () => {
        if (!pagination) return null;

        const pageInfoText = pagination.totalItems !== undefined ? (
            <>第 {pagination.currentPage} 页，共 {pagination.totalPages} 页，总计 {pagination.totalItems} 条记录</>
        ) : (
            <>第 {pagination.currentPage} 页，共 {pagination.totalPages} 页</>
        );

        if (!showModuleStats) {
            return (
                <div className="text-sm font-semibold text-muted-foreground hover:underline">
                    {pageInfoText}
                </div>
            );
        }

        return (
            <HoverCard>
                <HoverCardTrigger asChild>
                    <div className="text-sm font-semibold text-muted-foreground cursor-pointer hover:underline">
                        {pageInfoText}
                    </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold m-0">
                            {knowledge.length > 0 ? "各模块知识点统计" : "各模块刷题记录统计"}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {MODULES.map(module => (
                                <div key={module.value} className="flex justify-between text-sm">
                                    <span>{module.label}:</span>
                                    <span className="font-medium">
                                        {knowledge.length > 0
                                            ? (knowledgeModuleCounts[module.label] || 0)
                                            : (recordModuleCounts[module.label] || 0)} 条
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </HoverCardContent>
            </HoverCard>
        );
    };

    // 渲染表格内容
    const renderTableContent = () => (
        <div className="w-full">
            <table className="min-w-full border-collapse text-sm">
                <thead>
                    <tr>
                        {selectable && (
                            <th className={`border-b px-4 py-3 text-center w-[7%] min-w-[48px] bg-[#f5f5f5] dark:bg-[#303030] ${checkboxColClassName}`}>
                                <div className="flex items-center justify-center h-full">
                                    <Checkbox
                                        size="sm"
                                        checked={indeterminate ? "indeterminate" : allSelected}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                onSelect(data.map((row, idx) => rowKey(row, idx)));
                                            } else {
                                                onSelect([]);
                                            }
                                        }}
                                    />
                                </div>
                            </th>
                        )}
                        {columns.map(col => (
                            <th key={col.key} className={`border-b px-4 py-3 font-medium text-left bg-[#f5f5f5] dark:bg-[#303030] ${col.className || ''}`}>
                                {typeof col.label === 'string' ? <MixedText text={col.label} /> : col.label}
                            </th>
                        ))}
                        {renderActions && <th className="border-b px-4 py-3 text-left w-20 bg-[#f5f5f5] dark:bg-[#303030]"><MixedText text="操作" /></th>}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                                <MixedText text="暂无数据" />
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => {
                            const key = rowKey(row, idx);
                            const isSelected = selected.includes(key);

                            const handleRowClick = (e: React.MouseEvent) => {
                                // 如果禁用了行点击功能，直接返回
                                if (!enableRowClick) {
                                    return;
                                }

                                // 检查是否点击的是按钮或其他交互元素
                                const target = e.target as HTMLElement;

                                // 如果点击的是checkbox本身，不处理行点击
                                if (target.closest('input[type="checkbox"]')) {
                                    return;
                                }

                                // 如果点击的是链接，不处理行点击
                                if (target.closest('a')) {
                                    return;
                                }

                                // 点击行时切换选择状态
                                if (isSelected) {
                                    onSelect(selected.filter(id => id !== key));
                                } else {
                                    onSelect([...selected, key]);
                                }
                            };

                            return contextMenuItems.length > 0 ? (
                                <ContextMenu key={key}>
                                    <ContextMenuTrigger asChild>
                                        <tr
                                            onClick={handleRowClick}
                                            className={`${enableRowClick ? 'cursor-pointer' : ''} transition-colors ${isSelected
                                                ? 'bg-[#f5f5f5] dark:bg-[#303030]'
                                                : 'hover:bg-[#f5f5f5] dark:hover:bg-[#303030]'
                                                }`}
                                            data-state={isSelected ? "selected" : undefined}
                                        >
                                            {selectable && (
                                                <td className={`border-b px-4 py-3 text-center ${checkboxColClassName}`}>
                                                    <div className="flex items-center justify-center h-full">
                                                        <Checkbox
                                                            size="sm"
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    onSelect([...selected, key]);
                                                                } else {
                                                                    onSelect(selected.filter(id => id !== key));
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                            )}
                                            {columns.map(col => (
                                                <td key={col.key} className={`border-b px-4 py-3 ${col.className || ''}`}>
                                                    {col.render ? col.render(row) : <MixedText text={String((row as Record<string, unknown>)[col.key])} />}
                                                </td>
                                            ))}
                                            {renderActions && (
                                                <td className="border-b px-4 py-3 text-center w-20">{renderActions(row)}</td>
                                            )}
                                        </tr>
                                    </ContextMenuTrigger>
                                    {contextMenuItems.length > 0 && (
                                        <ContextMenuContent>
                                            {contextMenuItems.map((item, index) => (
                                                <ContextMenuItem
                                                    key={`context-menu-${index}`}
                                                    onClick={() => item.onClick(row)}
                                                    disabled={item.disabled}
                                                    className={item.variant === 'destructive' ? 'text-red-600 focus:text-red-700' : ''}
                                                >
                                                    {item.icon}
                                                    {item.label}
                                                </ContextMenuItem>
                                            ))}
                                        </ContextMenuContent>
                                    )}
                                </ContextMenu>
                            ) : (
                                <tr
                                    key={String(key)}
                                    onClick={handleRowClick}
                                    className={`${enableRowClick ? 'cursor-pointer' : ''} transition-colors ${isSelected
                                        ? 'bg-[#f5f5f5] dark:bg-[#303030]'
                                        : 'hover:bg-[#f5f5f5] dark:hover:bg-[#303030]'
                                        }`}
                                    data-state={isSelected ? "selected" : undefined}
                                >
                                    {selectable && (
                                        <td className={`border-b px-4 py-3 text-center ${checkboxColClassName}`}>
                                            <div className="flex items-center justify-center h-full">
                                                <Checkbox
                                                    size="sm"
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            onSelect([...selected, key]);
                                                        } else {
                                                            onSelect(selected.filter(id => id !== key));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </td>
                                    )}
                                    {columns.map(col => (
                                        <td key={col.key} className={`border-b px-4 py-3 ${col.className || ''}`}>
                                            {col.render ? col.render(row) : <MixedText text={String((row as Record<string, unknown>)[col.key])} />}
                                        </td>
                                    ))}
                                    {renderActions && (
                                        <td className="border-b px-4 py-3 text-center w-20">{renderActions(row)}</td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );

    // 渲染容器包装 - 按照官网推荐的方式，将控件放在卡片外侧
    const renderContainer = () => (
        <TooltipProvider>
            <div className={className}>
                {/* 标题和操作区域 - 放在卡片外侧 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                    {title && <h2 className="text-2xl font-bold"><MixedText text={title} /></h2>}

                    {/* 左侧过滤器和搜索 */}
                    <div className="flex flex-row mr-4">
                        {filters.map((filter, index) => (
                            <div
                                key={`filter-${index}`}
                                className={filter.className}
                                style={{
                                    marginRight: index < filters.length - 1 ? '12px' : '0',
                                    minWidth: 'fit-content'
                                }}
                            >
                                {filter.type === 'select' && filter.options && (
                                    <Select value={filter.value} onValueChange={filter.onChange}>
                                        <SelectTrigger className="w-36">
                                            <SelectValue placeholder={filter.placeholder} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filter.options.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    <MixedText text={option.label} />
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                {filter.type === 'search' && (
                                    <div className="relative w-36">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300 w-5 h-5 z-[var(--z-focused)] pointer-events-none" />
                                        <Input
                                            placeholder={filter.placeholder || "搜索..."}
                                            value={filter.value}
                                            onChange={e => filter.onChange(e.target.value)}
                                            className="w-full h-10 py-2 pl-10"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* 右侧按钮组 */}
                    <div className="flex gap-2 shrink-0 flex-wrap">
                        {/* 新建按钮 */}
                        {showNew && onNew && (
                            <Button
                                onClick={onNew}
                                variant="default"
                                size="sm"
                                className="h-9"
                            >
                                新建
                            </Button>
                        )}

                        {/* 导出按钮 */}
                        {showExport && onExport && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={onExport}
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9"
                                    >
                                        <Upload className="w-5 h-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p><MixedText text="导出为Excel" /></p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {/* 编辑按钮 */}
                        {showEdit && onEdit && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <CircularButton
                                        onClick={onEdit}
                                        disabled={editDisabled}
                                        variant="success"
                                        size="lg"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </CircularButton>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p><MixedText text="编辑" /></p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {/* 删除按钮 */}
                        {showDelete && onDelete && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <CircularButton
                                        onClick={onDelete}
                                        disabled={deleteDisabled}
                                        variant="destructive"
                                        size="lg"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </CircularButton>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p><MixedText text="批量删除" /></p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {/* 自定义操作按钮 - 放在最右侧 */}
                        {actions.map((action, index) => {
                            const button = (
                                <Button
                                    key={`action-${index}`}
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    variant={action.variant || "default"}
                                    size="sm"
                                    className={`${action.className} h-9`}
                                >
                                    {action.icon}
                                    {action.label}
                                </Button>
                            );

                            // 如果有 tooltip，包装在 Tooltip 中
                            if (action.tooltip) {
                                return (
                                    <Tooltip key={`action-${index}`}>
                                        <TooltipTrigger asChild>
                                            {button}
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p><MixedText text={action.tooltip} /></p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return button;
                        })}

                    </div>
                </div>

                {/* 表格内容 - 只有表格放在卡片内 */}
                <div className="overflow-hidden rounded-md border">
                    {renderTableContent()}
                </div>

                {/* 分页组件 - 放在卡片外侧 */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-end gap-4 w-full py-4">
                        {/* 页码信息 */}
                        {renderPaginationInfo()}

                        {/* 分页按钮组 */}
                        <TooltipProvider>
                            <div className="flex items-center gap-2">
                                {/* 第一页按钮 */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => pagination.onPageChange(1)}
                                            disabled={pagination.currentPage <= 1}
                                            className="h-8 w-8 p-0"
                                            aria-label="Go to first page"
                                        >
                                            <ChevronsLeftIcon className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>第一页</p>
                                    </TooltipContent>
                                </Tooltip>

                                {/* 上一页按钮 */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage <= 1}
                                            className="h-8 w-8 p-0"
                                            aria-label="Go to previous page"
                                        >
                                            <ChevronLeftIcon className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>上一页</p>
                                    </TooltipContent>
                                </Tooltip>

                                {/* 下一页按钮 */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage >= pagination.totalPages}
                                            className="h-8 w-8 p-0"
                                            aria-label="Go to next page"
                                        >
                                            <ChevronRightIcon className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>下一页</p>
                                    </TooltipContent>
                                </Tooltip>

                                {/* 最后一页按钮 */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => pagination.onPageChange(pagination.totalPages)}
                                            disabled={pagination.currentPage >= pagination.totalPages}
                                            className="h-8 w-8 p-0"
                                            aria-label="Go to last page"
                                        >
                                            <ChevronsRightIcon className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>最后一页</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );

    // 根据是否有容器功能决定渲染方式
    if (title || actions.length > 0 || filters.length > 0 || pagination || showExport || showNew || showEdit || showDelete) {
        return renderContainer();
    } else {
        return renderTableContent();
    }
}
