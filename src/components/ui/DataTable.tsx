import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import ReactBitsButton from "@/components/ui/ReactBitsButton";

export interface DataTableColumn<T> {
    key: string;
    label: string;
    render?: (row: T) => React.ReactNode;
    className?: string;
}

export interface DataTableProps<T, K extends string | number = string | number> {
    columns: DataTableColumn<T>[];
    data: T[];
    selected: K[];
    onSelect: (selected: K[]) => void;
    onBatchDelete?: () => void;
    renderActions?: (row: T) => React.ReactNode;
    rowKey: (row: T, idx: number) => K;
    selectable?: boolean;
    batchDeleteText?: string;
    checkboxColClassName?: string;
}

export function DataTable<T, K extends string | number = string | number>({
    columns,
    data,
    selected,
    onSelect,
    onBatchDelete,
    renderActions,
    rowKey,
    selectable = true,
    batchDeleteText = "批量删除",
    checkboxColClassName = "",
}: DataTableProps<T, K>) {
    const allSelected = data.length > 0 && selected.length === data.length;
    const indeterminate = selected.length > 0 && selected.length < data.length;

    return (
        <div className="w-full">
            <div className="mb-2 flex justify-between items-center">
                <span className="text-gray-500 text-sm">共 {data.length} 条</span>
                {onBatchDelete && (
                    <ReactBitsButton
                        variant="destructive"
                        size="sm"
                        disabled={selected.length === 0}
                        onClick={onBatchDelete}
                    >
                        {batchDeleteText}
                    </ReactBitsButton>
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
                                // 如果点击的是checkbox本身，不处理（避免重复触发）
                                if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                                    return;
                                }

                                // 如果点击的是操作按钮，不处理
                                if ((e.target as HTMLElement).closest('button')) {
                                    return;
                                }

                                // 切换选中状态
                                if (isSelected) {
                                    onSelect(selected.filter(id => id !== key));
                                } else {
                                    onSelect([...selected, key]);
                                }
                            };

                            return (
                                <tr
                                    key={key}
                                    onClick={handleRowClick}
                                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
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
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
} 