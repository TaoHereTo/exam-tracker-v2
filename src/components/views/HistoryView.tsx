import { UnifiedTable } from "@/components/ui/UnifiedTable";
import type { RecordItem } from "@/types/record";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { normalizeModuleName } from '@/config/exam';

interface HistoryViewProps {
    records: RecordItem[];
    selectedRecordIds: number[];
    onSelectIds: (ids: number[]) => void;
    onDeleteRecord: (id: number) => void;
    onBatchDelete: () => void;
    historyPage: number;
    setHistoryPage: (n: number) => void;
    totalPages: number;
}

export function HistoryView({
    records,
    selectedRecordIds,
    onSelectIds,
    onDeleteRecord,
    onBatchDelete,
    historyPage,
    setHistoryPage,
    totalPages,
}: HistoryViewProps) {
    const [singleDeleteDialogOpen, setSingleDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<RecordItem | null>(null);


    const handleSingleDelete = (item: RecordItem) => {
        setItemToDelete(item);
        setSingleDeleteDialogOpen(true);
    };

    const handleConfirmSingleDelete = () => {
        if (itemToDelete) {
            onDeleteRecord(itemToDelete.id);
            setSingleDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };





    return (
        <div className="flex flex-col items-center pt-4 px-2 md:px-8">
            <UnifiedTable<RecordItem, number>
                columns={[
                    {
                        key: 'date',
                        label: '日期',
                        render: (row) => format(new Date(row.date), 'yyyy-MM-dd')
                    },
                    {
                        key: 'module',
                        label: '模块',
                        render: (row) => normalizeModuleName(row.module)
                    },
                    {
                        key: 'correct',
                        label: '正确数',
                        render: (row) => `${row.correct}/${row.total}`
                    },
                    {
                        key: 'accuracy',
                        label: '正确率',
                        render: (row) => `${((row.correct / row.total) * 100).toFixed(1)}%`
                    },
                    { key: 'duration', label: '用时' }
                ]}
                data={records}
                selected={selectedRecordIds}
                onSelect={onSelectIds}
                rowKey={(row) => row.id}
                pagination={{
                    currentPage: historyPage,
                    totalPages,
                    onPageChange: setHistoryPage
                }}
                showNew={false}
                showEdit={false}
                showDelete={true}
                onDelete={onBatchDelete}
                deleteDisabled={selectedRecordIds.length === 0}
                deleteConfirmText="删除后无法恢复，确定要删除选中的历史记录吗？"
                className="max-w-6xl w-full"
                contextMenuItems={[
                    {
                        label: "删除",
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: (item) => handleSingleDelete(item),
                        variant: "destructive",
                    },
                ]}
            />
            {/* 单个删除确认弹窗 */}
            <AlertDialog open={singleDeleteDialogOpen} onOpenChange={setSingleDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            您确定要删除这条历史记录吗？此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setSingleDeleteDialogOpen(false); setItemToDelete(null); }}>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSingleDelete} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
} 