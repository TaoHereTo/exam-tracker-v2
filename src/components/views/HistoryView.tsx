import { HistoryTable } from "@/components/ui/HistoryTable";
import { TableContainer } from "@/components/ui/TableContainer";
import type { RecordItem } from "@/types/record";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useState } from "react";

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
            <TableContainer
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
            >
                <HistoryTable
                    records={records}
                    selectedIds={selectedRecordIds}
                    onSelectIds={onSelectIds}
                    onSingleDelete={handleSingleDelete}
                />
            </TableContainer>
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