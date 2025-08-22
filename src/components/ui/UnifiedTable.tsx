import React, { ReactNode } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { BeautifulPagination } from "@/components/ui/BeautifulPagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Search, Upload, Trash2, Edit, FileSpreadsheet } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MixedText } from "@/components/ui/MixedText";

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
            <div className="mb-2 flex justify-end items-center">
                {onBatchDelete && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    disabled={selected.length === 0}
                                    onClick={onBatchDelete}
                                    className="h-9 w-9"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p><MixedText text={batchDeleteText} /></p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            <table className="min-w-full border-collapse text-sm table-fixed">
                <thead>
                    <tr>
                        {selectable && (
                            <th className={`border-b px-4 py-2 text-center bg-gray-100 dark:bg-gray-800 dark:text-gray-100 ${checkboxColClassName}`}>
                                <Checkbox
                                    checked={allSelected}
                                    indeterminate={indeterminate}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            onSelect(data.map((row, idx) => rowKey(row, idx)));
                                        } else {
                                            onSelect([]);
                                        }
                                    }}
                                />
                            </th>
                        )}
                        {columns.map(col => (
                            <th key={col.key} className={`border-b px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 font-semibold ${col.className || ''}`}>
                                {typeof col.label === 'string' ? <MixedText text={col.label} /> : col.label}
                            </th>
                        ))}
                        {renderActions && <th className="border-b px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100"><MixedText text="操作" /></th>}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0)} className="text-center py-4 text-gray-400"><MixedText text="暂无数据" /></td>
                        </tr>
                    ) : (
                        data.map((row, idx) => {
                            const key = rowKey(row, idx);
                            const isSelected = selected.includes(key);

                            const handleRowClick = (e: React.MouseEvent) => {
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
                                            className={`cursor-pointer hover:bg-[#EEEDEC] dark:hover:bg-[#28282A] transition-colors duration-25 ${isSelected ? 'bg-[#EEEDEC] dark:bg-[#28282A]' : ''}`}
                                        >
                                            {selectable && (
                                                <td className={`border-b px-4 py-2 text-center ${checkboxColClassName}`}>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                onSelect([...selected, key]);
                                                            } else {
                                                                onSelect(selected.filter(id => id !== key));
                                                            }
                                                        }}
                                                    />
                                                </td>
                                            )}
                                            {columns.map(col => (
                                                <td key={col.key} className={`border-b px-4 py-2 ${col.className || ''}`}>
                                                    {col.render ? col.render(row) : <MixedText text={String((row as Record<string, unknown>)[col.key])} />}
                                                </td>
                                            ))}
                                            {renderActions && (
                                                <td className="border-b px-4 py-2 text-center">{renderActions(row)}</td>
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
                                    className={`cursor-pointer hover:bg-[#EEEDEC] dark:hover:bg-[#28282A] transition-colors duration-25 ${isSelected ? 'bg-[#EEEDEC] dark:bg-[#28282A]' : ''}`}
                                >
                                    {selectable && (
                                        <td className={`border-b px-4 py-2 text-center ${checkboxColClassName}`}>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        onSelect([...selected, key]);
                                                    } else {
                                                        onSelect(selected.filter(id => id !== key));
                                                    }
                                                }}
                                            />
                                        </td>
                                    )}
                                    {columns.map(col => (
                                        <td key={col.key} className={`border-b px-4 py-2 ${col.className || ''}`}>
                                            {col.render ? col.render(row) : <MixedText text={String((row as Record<string, unknown>)[col.key])} />}
                                        </td>
                                    ))}
                                    {renderActions && (
                                        <td className="border-b px-4 py-2 text-center">{renderActions(row)}</td>
                                    )}
                                </tr>
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
            <CardContent className="p-3 pt-1">
                <div className="flex flex-col gap-3">
                    {/* 标题和操作区域 */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {title && <h2 className="text-2xl font-bold"><MixedText text={title} /></h2>}

                        {/* 左侧过滤器和搜索 */}
                        <div className="flex flex-row mr-4">
                            {filters.map((filter, index) => (
                                <div
                                    key={index}
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
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300 w-5 h-5 z-10 pointer-events-none" />
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
                                <Button
                                    key={index}
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    variant={action.variant || "default"}
                                    size="sm"
                                    className={`${action.className} h-9`}
                                >
                                    {action.icon}
                                    {action.label}
                                </Button>
                            ))}

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
                                <TooltipProvider>
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
                                </TooltipProvider>
                            )}

                            {/* 编辑按钮 */}
                            {showEdit && onEdit && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={onEdit}
                                                disabled={editDisabled}
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p><MixedText text="编辑" /></p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}

                            {/* 删除按钮 */}
                            {showDelete && onDelete && (
                                <AlertDialog>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        disabled={deleteDisabled}
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-9 w-9"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p><MixedText text="批量删除" /></p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle><MixedText text="确认批量删除？" /></AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {deleteConfirmText}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel><MixedText text="取消" /></AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDelete()} style={{ background: '#dc2626', color: 'white' }}><MixedText text="确认删除" /></AlertDialogAction>
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
                        <div className="mt-4 flex justify-center">
                            <BeautifulPagination
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={pagination.onPageChange}
                                totalItems={pagination.totalItems}
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