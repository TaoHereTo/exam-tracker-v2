import { UnifiedTable } from "@/components/ui/UnifiedTable";
import type { RecordItem } from "@/types/record";
import { format } from 'date-fns';
import { normalizeModuleName } from '@/config/exam';
import { formatDuration } from '@/lib/utils';
import { MixedText } from '@/components/ui/MixedText';

interface ExerciseRecordViewProps {
    records: RecordItem[];
    selectedRecordIds: number[];
    onSelectIds: (ids: number[]) => void;
    onBatchDelete: () => void;
    historyPage: number;
    setHistoryPage: (n: number) => void;
    totalPages: number;
}

export function ExerciseRecordView({
    records,
    selectedRecordIds,
    onSelectIds,
    onBatchDelete,
    historyPage,
    setHistoryPage,
    totalPages,
}: ExerciseRecordViewProps) {

    // 阻止事件冒泡的函数
    const handleMixedTextClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="pt-2 px-2 md:px-8">
            <UnifiedTable<RecordItem, number>
                columns={[
                    {
                        key: 'date',
                        label: '日期',
                        render: (row) => <MixedText text={format(new Date(row.date), 'yyyy-MM-dd')} onClick={handleMixedTextClick} />
                    },
                    {
                        key: 'module',
                        label: '模块',
                        render: (row) => <MixedText text={normalizeModuleName(row.module)} onClick={handleMixedTextClick} />
                    },
                    {
                        key: 'correct',
                        label: '正确数',
                        render: (row) => <MixedText text={`${row.correct}/${row.total}`} onClick={handleMixedTextClick} />
                    },
                    {
                        key: 'accuracy',
                        label: '正确率',
                        render: (row) => <MixedText text={`${((row.correct / row.total) * 100).toFixed(1)}%`} onClick={handleMixedTextClick} />
                    },
                    {
                        key: 'duration',
                        label: '用时',
                        render: (row) => <MixedText text={formatDuration(row.duration)} onClick={handleMixedTextClick} />
                    }
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
                onBatchDelete={onBatchDelete}
                batchDeleteText="批量删除"
            />
        </div>
    );
} 