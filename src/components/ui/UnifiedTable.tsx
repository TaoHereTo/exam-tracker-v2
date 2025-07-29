import React, { ReactNode } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { BeautifulPagination } from "@/components/ui/BeautifulPagination";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Search, Plus, Edit, Trash2, ArrowUpFromLine } from 'lucide-react';
import { UnifiedButton } from './UnifiedButton';
import { Card, CardContent } from "@/components/ui/card";

// 数据表格列定义
export interface DataTableColumn<T> {
    key: string;
    label: string;
    render?: (row: T) => React.ReactNode;
    className?: string;
}

// 表格操作定义
export interface TableAction {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'reactbits' | 'reactbitsPrimary' | 'reactbitsSecondary' | 'reactbitsDestructive' | 'reactbitsOutline';
    className?: string;
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
    };

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
}: UnifiedTableProps<T, K>) {
    const allSelected = data.length > 0 && selected.length === data.length;
    const indeterminate = selected.length > 0 && selected.length < data.length;

    // 渲染表格内容
    const renderTableContent = () => (
        <div className="w-full">
            <div className="mb-2 flex justify-between items-center">
                <span className="text-gray-500 text-sm">共 {data.length} 条</span>
                {onBatchDelete && (
                    <UnifiedButton
                        variant="destructive"
                        size="sm"
                        disabled={selected.length === 0}
                        onClick={onBatchDelete}
                    >
                        {batchDeleteText}
                    </UnifiedButton>
                )}
            </div>
            <table className="min-w-full border text-sm table-fixed">
                <thead>
                    <tr>
                        {selectable && (
                            <th className={`border px-4 py-2 text-center bg-gray-100 dark:bg-gray-800 dark:text-gray-100 ${checkboxColClassName}`}>
                                <Checkbox
                                    checked={allSelected}
                                    indeterminate={indeterminate}
                                    onCheckedChange={checked => {
                                        if (checked) onSelect(data.map((row, idx) => rowKey(row, idx)));
                                        else onSelect([]);
                                    }}
                                />
                            </th>
                        )}
                        {columns.map(col => (
                            <th key={col.key} className={`border px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 ${col.className || ''}`}>{col.label}</th>
                        ))}
                        {renderActions && <th className="border px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100">操作</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0)} className="text-center py-4 text-gray-400">暂无数据</td>
                        </tr>
                    ) : (
                        data.map((row, idx) => {
                            const key = rowKey(row, idx);
                            const isSelected = selected.includes(key);

                            const handleRowClick = (e: React.MouseEvent) => {
                                if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                                    return;
                                }
                                if ((e.target as HTMLElement).closest('button')) {
                                    return;
                                }
                                if (isSelected) {
                                    onSelect(selected.filter(id => id !== key));
                                } else {
                                    onSelect([...selected, key]);
                                }
                            };

                            return (
                                <ContextMenu key={key}>
                                    <ContextMenuTrigger asChild>
                                        <tr
                                            onClick={handleRowClick}
                                            className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                        >
                                            {selectable && (
                                                <td className={`border px-4 py-2 text-center ${checkboxColClassName}`}>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={checked => {
                                                            if (checked) onSelect([...selected, key]);
                                                            else onSelect(selected.filter(id => id !== key));
                                                        }}
                                                    />
                                                </td>
                                            )}
                                            {columns.map(col => (
                                                <td key={col.key} className={`border px-4 py-2 ${col.className || ''}`}>
                                                    {col.render ? col.render(row) : (() => {
                                                        const value = (row as Record<string, unknown>)[col.key];
                                                        if (
                                                            typeof value === 'string' ||
                                                            typeof value === 'number' ||
                                                            typeof value === 'boolean' ||
                                                            value === null ||
                                                            value === undefined
                                                        ) {
                                                            return value ?? '';
                                                        }
                                                        return '';
                                                    })()}
                                                </td>
                                            ))}
                                            {renderActions && (
                                                <td className="border px-4 py-2 text-center">{renderActions(row)}</td>
                                            )}
                                        </tr>
                                    </ContextMenuTrigger>
                                    {contextMenuItems.length > 0 && (
                                        <ContextMenuContent>
                                            {contextMenuItems.map((item, index) => (
                                                <ContextMenuItem
                                                    key={index}
                                                    onClick={() => item.onClick(row)}
                                                    disabled={item.disabled}
                                                    variant={item.variant}
                                                >
                                                    {item.icon}
                                                    {item.label}
                                                </ContextMenuItem>
                                            ))}
                                        </ContextMenuContent>
                                    )}
                                </ContextMenu>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );

    // 渲染容器包装
    const renderContainer = () => (
        <Card className={className}>
            <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                    {/* 标题和操作区域 */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {title && <h2 className="text-2xl font-bold">{title}</h2>}

                        {/* 左侧过滤器和搜索 */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-10 flex-1 min-w-0 mr-4">
                            {filters.map((filter, index) => (
                                <div key={index} className={filter.className}>
                                    {filter.type === 'select' && filter.options && (
                                        <Select value={filter.value} onValueChange={filter.onChange}>
                                            <SelectTrigger className="w-36 border-green-300 focus:border-green-500">
                                                <SelectValue placeholder={filter.placeholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filter.options.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {filter.type === 'search' && (
                                        <div className="relative min-w-[160px] max-w-[280px]">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                placeholder={filter.placeholder || "搜索..."}
                                                value={filter.value}
                                                onChange={e => filter.onChange(e.target.value)}
                                                className="w-full h-9 py-2 pl-10"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 右侧按钮组 */}
                        <div className="flex gap-2 shrink-0 flex-wrap">
                            {/* 自定义操作按钮 */}
                            {actions.map((action, index) => (
                                <UnifiedButton
                                    key={index}
                                    variant={action.variant || "outline"}
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    className={action.className}
                                    size="sm"
                                >
                                    {action.icon}
                                    {action.label}
                                </UnifiedButton>
                            ))}

                            {/* 新建按钮 */}
                            {showNew && onNew && (
                                <UnifiedButton
                                    variant="outline"
                                    onClick={onNew}
                                    className="bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600"
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    新建
                                </UnifiedButton>
                            )}

                            {/* 导出按钮 */}
                            {showExport && onExport && (
                                <UnifiedButton
                                    variant="reactbits"
                                    gradient="green"
                                    onClick={onExport}
                                    size="sm"
                                >
                                    <ArrowUpFromLine className="w-4 h-4 mr-1" />
                                    导出为Excel
                                </UnifiedButton>
                            )}

                            {/* 编辑按钮 */}
                            {showEdit && onEdit && (
                                <UnifiedButton
                                    variant="reactbits"
                                    gradient="blue"
                                    onClick={onEdit}
                                    disabled={editDisabled}
                                    size="sm"
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    编辑
                                </UnifiedButton>
                            )}

                            {/* 删除按钮 */}
                            {showDelete && onDelete && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <UnifiedButton
                                            variant="reactbits"
                                            gradient="red"
                                            disabled={deleteDisabled}
                                            size="sm"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            批量删除
                                        </UnifiedButton>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>确认批量删除？</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {deleteConfirmText}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>取消</AlertDialogCancel>
                                            <AlertDialogAction onClick={onDelete}>确认删除</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>

                    {/* 表格内容 */}
                    <div className="overflow-x-auto">
                        {renderTableContent()}
                    </div>

                    {/* 分页组件 */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="mt-6 flex justify-center">
                            <BeautifulPagination
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={pagination.onPageChange}
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    // 根据是否有容器功能决定渲染方式
    if (title || actions.length > 0 || filters.length > 0 || pagination || showExport || showNew || showEdit || showDelete) {
        return renderContainer();
    } else {
        return renderTableContent();
    }
} 