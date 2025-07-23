import { HistoryTable } from "@/components/tables/HistoryTable";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination";

interface HistoryViewProps {
    records: any[];
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
    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">历史记录</h1>
            <div className="flex flex-col items-center justify-center min-h-[80vh] mt-0 w-full max-w-5xl mx-auto">
                <HistoryTable
                    records={records}
                    selectedIds={selectedRecordIds}
                    onSelectIds={onSelectIds}
                    onDeleteRecord={onDeleteRecord}
                    onBatchDelete={onBatchDelete}
                />
            </div>
            {/* 分页组件 */}
            {totalPages > 1 && (
                <Pagination className="mt-6">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={e => {
                                    e.preventDefault();
                                    setHistoryPage(Math.max(1, historyPage - 1));
                                }}
                                href="#"
                                aria-disabled={historyPage === 1}
                            />
                        </PaginationItem>
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <PaginationItem key={idx}>
                                <PaginationLink
                                    isActive={historyPage === idx + 1}
                                    onClick={e => {
                                        e.preventDefault();
                                        setHistoryPage(idx + 1);
                                    }}
                                    href="#"
                                >
                                    {idx + 1}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={e => {
                                    e.preventDefault();
                                    setHistoryPage(Math.min(totalPages, historyPage + 1));
                                }}
                                href="#"
                                aria-disabled={historyPage === totalPages}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
} 