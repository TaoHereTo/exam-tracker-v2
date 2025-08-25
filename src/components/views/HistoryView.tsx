import { UnifiedTable } from "@/components/ui/UnifiedTable";
import type { RecordItem } from "@/types/record";
import { format } from 'date-fns';
import { normalizeModuleName } from '@/config/exam';
import { formatDuration } from '@/lib/utils';
import { MixedText } from '@/components/ui/MixedText';


interface ExerciseRecordViewProps {
    records: RecordItem[];
    selectedRecordIds: string[];
    onSelectIds: (ids: string[]) => void;
    onBatchDelete: () => void;
    historyPage: number;
    setHistoryPage: (n: number) => void;
    totalPages: number;
    totalRecords: number;
}

export function ExerciseRecordView({
    records,
    selectedRecordIds,
    onSelectIds,
    onBatchDelete,
    historyPage,
    setHistoryPage,
    totalPages,
    totalRecords,
}: ExerciseRecordViewProps) {

    return (
        <div className="pt-2 px-2 sm:px-4 md:px-8">
            <UnifiedTable<RecordItem, string>
                columns={[
                    {
                        key: 'date',
                        label: (
                            <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm">日期</span>
                            </div>
                        ),
                        render: (row) => <MixedText text={format(new Date(row.date), 'yyyy-MM-dd')} />
                    },
                    {
                        key: 'module',
                        label: (
                            <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm">模块</span>
                            </div>
                        ),
                        render: (row) => <MixedText text={normalizeModuleName(row.module)} />
                    },
                    {
                        key: 'correct',
                        label: (
                            <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm">正确数</span>
                            </div>
                        ),
                        render: (row) => <MixedText text={`${row.correct}/${row.total}`} />
                    },
                    {
                        key: 'accuracy',
                        label: (
                            <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm">正确率</span>
                            </div>
                        ),
                        render: (row) => <MixedText text={`${((row.correct / row.total) * 100).toFixed(1)}%`} />
                    },
                    {
                        key: 'duration',
                        label: (
                            <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm">用时</span>
                            </div>
                        ),
                        render: (row) => <MixedText text={formatDuration(row.duration)} />
                    }
                ]}
                data={records}
                selected={selectedRecordIds}
                onSelect={onSelectIds}
                rowKey={(row) => row.id}
                pagination={{
                    currentPage: historyPage,
                    totalPages,
                    onPageChange: setHistoryPage,
                    totalItems: totalRecords
                }}
                onBatchDelete={onBatchDelete}
                batchDeleteText="批量删除"
            />
        </div>

    );
}