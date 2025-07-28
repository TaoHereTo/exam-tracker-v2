import React, { ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Search, Plus, Edit, Trash2, ArrowUpFromLine } from 'lucide-react';
import ReactBitsButton from '@/components/ui/ReactBitsButton';

export interface TableAction {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'primary';
    className?: string;
}

export interface TableFilter {
    type: 'select' | 'search';
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    options?: { value: string; label: string }[];
    className?: string;
}

export interface TableContainerProps {
    title?: string;
    children: ReactNode;
    actions?: TableAction[];
    filters?: TableFilter[];
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
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
    className?: string;
}

export function TableContainer({
    title,
    children,
    actions = [],
    filters = [],
    pagination,
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
    className = ""
}: TableContainerProps) {
    return (
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
                                <ReactBitsButton
                                    key={index}
                                    variant={action.variant || "outline"}
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    className={action.className}
                                    size="sm"
                                >
                                    {action.icon}
                                    {action.label}
                                </ReactBitsButton>
                            ))}

                            {/* 新建按钮 */}
                            {showNew && onNew && (
                                <ReactBitsButton
                                    variant="outline"
                                    onClick={onNew}
                                    className="bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600"
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    新建
                                </ReactBitsButton>
                            )}

                            {/* 导出按钮 */}
                            {showExport && onExport && (
                                <ReactBitsButton
                                    variant="outline"
                                    onClick={onExport}
                                    className="bg-gray-500 hover:bg-gray-600 text-white border-gray-500 hover:border-gray-600"
                                    size="sm"
                                >
                                    <ArrowUpFromLine className="w-4 h-4 mr-1" />
                                    导出为Excel
                                </ReactBitsButton>
                            )}

                            {/* 编辑按钮 */}
                            {showEdit && onEdit && (
                                <ReactBitsButton
                                    variant="outline"
                                    onClick={onEdit}
                                    disabled={editDisabled}
                                    className="bg-blue-400 hover:bg-blue-500 text-white border-blue-400 hover:border-blue-500"
                                    size="sm"
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    编辑
                                </ReactBitsButton>
                            )}

                            {/* 删除按钮 */}
                            {showDelete && onDelete && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <ReactBitsButton
                                            variant="outline"
                                            disabled={deleteDisabled}
                                            className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                                            size="sm"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            批量删除
                                        </ReactBitsButton>
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
                        {children}
                    </div>

                    {/* 分页组件 */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="mt-6 flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={e => {
                                                e.preventDefault();
                                                if (pagination.currentPage > 1) {
                                                    pagination.onPageChange(pagination.currentPage - 1);
                                                }
                                            }}
                                            aria-disabled={pagination.currentPage === 1}
                                            tabIndex={pagination.currentPage === 1 ? -1 : 0}
                                        />
                                    </PaginationItem>

                                    {/* 智能分页显示，最多显示5个页码，超出用省略号 */}
                                    {(() => {
                                        const items = [];
                                        const maxVisiblePages = 5;

                                        if (pagination.totalPages <= maxVisiblePages) {
                                            for (let i = 1; i <= pagination.totalPages; i++) {
                                                items.push(
                                                    <PaginationItem key={i}>
                                                        <PaginationLink
                                                            isActive={pagination.currentPage === i}
                                                            onClick={e => { e.preventDefault(); pagination.onPageChange(i); }}
                                                        >
                                                            {i}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            }
                                        } else {
                                            let start = 1;
                                            let end = pagination.totalPages;

                                            if (pagination.currentPage <= 3) {
                                                end = 5;
                                            } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                                start = pagination.totalPages - 4;
                                            } else {
                                                start = pagination.currentPage - 2;
                                                end = pagination.currentPage + 2;
                                            }

                                            if (start > 1) {
                                                items.push(
                                                    <PaginationItem key={1}>
                                                        <PaginationLink
                                                            isActive={pagination.currentPage === 1}
                                                            onClick={e => { e.preventDefault(); pagination.onPageChange(1); }}
                                                        >
                                                            1
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );

                                                if (start > 2) {
                                                    items.push(
                                                        <PaginationItem key="start-ellipsis">
                                                            <PaginationEllipsis />
                                                        </PaginationItem>
                                                    );
                                                }
                                            }

                                            for (let i = start; i <= end; i++) {
                                                items.push(
                                                    <PaginationItem key={i}>
                                                        <PaginationLink
                                                            isActive={pagination.currentPage === i}
                                                            onClick={e => { e.preventDefault(); pagination.onPageChange(i); }}
                                                        >
                                                            {i}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            }

                                            if (end < pagination.totalPages) {
                                                if (end < pagination.totalPages - 1) {
                                                    items.push(
                                                        <PaginationItem key="end-ellipsis">
                                                            <PaginationEllipsis />
                                                        </PaginationItem>
                                                    );
                                                }
                                                items.push(
                                                    <PaginationItem key={pagination.totalPages}>
                                                        <PaginationLink
                                                            isActive={pagination.currentPage === pagination.totalPages}
                                                            onClick={e => { e.preventDefault(); pagination.onPageChange(pagination.totalPages); }}
                                                        >
                                                            {pagination.totalPages}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            }
                                        }

                                        return items;
                                    })()}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={e => {
                                                e.preventDefault();
                                                if (pagination.currentPage < pagination.totalPages) {
                                                    pagination.onPageChange(pagination.currentPage + 1);
                                                }
                                            }}
                                            aria-disabled={pagination.currentPage === pagination.totalPages}
                                            tabIndex={pagination.currentPage === pagination.totalPages ? -1 : 0}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 