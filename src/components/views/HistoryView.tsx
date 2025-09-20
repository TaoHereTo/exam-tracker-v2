import { UnifiedTable } from "@/components/ui/UnifiedTable";
import type { RecordItem } from "@/types/record";
import { format } from 'date-fns';
import { normalizeModuleName, MODULES } from '@/config/exam';
import { formatDuration } from '@/lib/utils';
import { MixedText } from '@/components/ui/MixedText';


interface ExerciseRecordViewProps {
    records: RecordItem[]; // Current page records
    allRecords: RecordItem[]; // All records
    selectedRecordIds: string[];
    onSelectIds: (ids: string[]) => void;
    onBatchDelete: () => void;
    historyPage: number;
    setHistoryPage: (n: number) => void;
    totalPages: number;
    totalRecords: number;
    moduleFilter: string;
    onModuleFilterChange: (module: string) => void;
}

export function ExerciseRecordView({
    records,
    allRecords,
    selectedRecordIds,
    onSelectIds,
    onBatchDelete,
    historyPage,
    setHistoryPage,
    totalPages,
    totalRecords,
    moduleFilter,
    onModuleFilterChange,
}: ExerciseRecordViewProps) {

    // 创建模块筛选器选项
    const moduleFilterOptions = [
        { value: 'all', label: '全部模块' },
        ...MODULES.map(module => ({
            value: module.label,
            label: module.label
        }))
    ];

    return (
        // Simplified container to match KnowledgeSummaryView approach
        <div className="pt-4 px-2 md:px-8">
            <div className="w-full">
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
                    filters={[
                        {
                            type: 'select',
                            placeholder: '选择模块',
                            value: moduleFilter,
                            onChange: onModuleFilterChange,
                            options: moduleFilterOptions,
                            className: 'mr-3'
                        }
                    ]}
                    pagination={{
                        currentPage: historyPage,
                        totalPages,
                        onPageChange: setHistoryPage,
                        totalItems: totalRecords
                    }}
                    records={allRecords}
                    showModuleStats={true}
                    showDelete={true}
                    onDelete={onBatchDelete}
                    deleteDisabled={selectedRecordIds.length === 0}
                    deleteConfirmText="此操作将删除所选的刷题记录，删除后无法恢复。是否确认？"
                />
            </div>
        </div>

    );
}