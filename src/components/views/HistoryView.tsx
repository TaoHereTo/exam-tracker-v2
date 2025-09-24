import { UnifiedTable } from "@/components/ui/UnifiedTable";
import type { RecordItem } from "@/types/record";
import { format } from 'date-fns';
import { normalizeModuleName, MODULES } from '@/config/exam';
import { formatDuration } from '@/lib/utils';
import { MixedText } from '@/components/ui/MixedText';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/animate-ui/components/radix/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimePicker } from '@/components/ui/TimePicker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Edit, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { zhCN } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/FormField';
import { FormError } from '@/components/ui/form-error';
import toast from 'react-hot-toast';


interface ExerciseRecordViewProps {
    records: RecordItem[]; // Current page records
    allRecords: RecordItem[]; // All records
    selectedRecordIds: string[];
    onSelectIds: (ids: string[]) => void;
    onBatchDelete: () => void;
    onUpdateRecord: (record: RecordItem) => void; // 添加更新记录的回调
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
    onUpdateRecord,
    historyPage,
    setHistoryPage,
    totalPages,
    totalRecords,
    moduleFilter,
    onModuleFilterChange,
}: ExerciseRecordViewProps) {
    // 编辑状态管理
    const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [date, setDate] = useState<Date>();
    const [dateOpen, setDateOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    // 表单状态
    const [formData, setFormData] = useState<Partial<RecordItem>>({
        date: '',
        module: 'data-analysis',
        total: 0,
        correct: 0,
        duration: '00:00'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // 打开编辑Sheet
    const handleEditRecord = () => {
        console.log('handleEditRecord called, selectedRecordIds:', selectedRecordIds);

        if (selectedRecordIds.length !== 1) {
            toast.error('请选择一个记录进行编辑');
            return;
        }

        const recordId = selectedRecordIds[0];
        const record = allRecords.find(r => r.id === recordId);

        console.log('Found record:', record);

        if (!record) {
            toast.error('未找到要编辑的记录');
            return;
        }

        setEditingRecord(record);
        setFormData({
            date: record.date,
            module: record.module,
            total: record.total,
            correct: record.correct,
            duration: record.duration
        });

        // 设置日期
        if (record.date) {
            setDate(new Date(record.date));
        }

        console.log('Opening edit sheet');
        setIsEditSheetOpen(true);
    };

    // 关闭编辑Sheet
    const handleCloseEditSheet = () => {
        setIsEditSheetOpen(false);
        setEditingRecord(null);
        setDate(undefined);
        setDateOpen(false);
        setFormData({
            date: '',
            module: 'data-analysis',
            total: 0,
            correct: 0,
            duration: '00:00'
        });
        setErrors({});
    };

    // 处理表单输入变化
    const handleFormChange = (field: keyof RecordItem, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // 提交编辑
    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingRecord) return;

        // 验证数据
        const newErrors: Record<string, string> = {};

        if (!formData.date) {
            newErrors.date = '请选择日期';
        }
        if (!formData.module) {
            newErrors.module = '请选择模块';
        }
        if (!formData.total || formData.total <= 0) {
            newErrors.total = '总题数必须大于0';
        }
        if (formData.correct === undefined || formData.correct < 0 || formData.correct > formData.total!) {
            newErrors.correct = '正确数不能小于0或大于总题数';
        }
        if (!formData.duration) {
            newErrors.duration = '请选择用时';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // 更新记录
        const updatedRecord: RecordItem = {
            ...editingRecord,
            ...formData,
            updatedAt: new Date().toISOString()
        };

        onUpdateRecord(updatedRecord);
        toast.success('记录更新成功');
        handleCloseEditSheet();
    };

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
                    showEdit={true}
                    onEdit={() => handleEditRecord()}
                    editDisabled={selectedRecordIds.length !== 1}
                    showDelete={true}
                    onDelete={onBatchDelete}
                    deleteDisabled={selectedRecordIds.length === 0}
                    deleteConfirmText="此操作将删除所选的刷题记录，删除后无法恢复。是否确认？"
                />
            </div>

            {/* 编辑记录Sheet */}
            <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
                <SheetContent side="right" className="w-[350px] sm:w-[400px] p-6 overflow-y-auto">
                    <SheetHeader className="px-0 pb-4">
                        <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                            <Edit className="w-6 h-6" />
                            <MixedText text="编辑刷题记录" />
                        </SheetTitle>
                        <SheetDescription>
                            <MixedText text="修改刷题记录的信息" />
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmitEdit} className="flex flex-col gap-6 px-0 relative">
                        {/* 日期选择 */}
                        <div className="space-y-2">
                            <Label htmlFor="date">
                                <MixedText text="日期" />
                            </Label>
                            <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-start text-left font-normal border px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-md h-10 bg-white dark:bg-[#303030]"
                                        style={{
                                            transition: 'none',
                                            transform: 'none',
                                            boxShadow: 'none'
                                        }}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {date ? format(date, "PPP", { locale: zhCN }) : <span className="text-gray-400 dark:text-gray-500">选择日期</span>}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0 z-[60]"
                                    align="start"
                                    side="bottom"
                                    sideOffset={4}
                                >
                                    <Calendar
                                        mode="single"
                                        captionLayout="dropdown"
                                        month={currentMonth}
                                        onMonthChange={setCurrentMonth}
                                        selected={date}
                                        onSelect={(selectedDate) => {
                                            setDate(selectedDate);
                                            if (selectedDate) {
                                                handleFormChange('date', format(selectedDate, 'yyyy-MM-dd'));
                                            }
                                            setDateOpen(false);
                                        }}
                                        initialFocus={false}
                                        locale={zhCN}
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                        </div>

                        {/* 模块选择 */}
                        <div className="space-y-2">
                            <Label htmlFor="module">
                                <MixedText text="模块" />
                            </Label>
                            <Select
                                value={formData.module}
                                onValueChange={(value) => handleFormChange('module', value)}
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="选择模块" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MODULES.map((module) => (
                                        <SelectItem key={module.value} value={module.value}>
                                            {module.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.module && <p className="text-sm text-red-500">{errors.module}</p>}
                        </div>

                        {/* 总题数和正确数 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="total">
                                    <MixedText text="总题数" />
                                </Label>
                                <Input
                                    id="total"
                                    type="number"
                                    min="1"
                                    value={formData.total || ''}
                                    onChange={(e) => handleFormChange('total', parseInt(e.target.value) || 0)}
                                    className="h-10"
                                />
                                {errors.total && <p className="text-sm text-red-500">{errors.total}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="correct">
                                    <MixedText text="正确数" />
                                </Label>
                                <Input
                                    id="correct"
                                    type="number"
                                    min="0"
                                    value={formData.correct || ''}
                                    onChange={(e) => handleFormChange('correct', parseInt(e.target.value) || 0)}
                                    className="h-10"
                                />
                                {errors.correct && <p className="text-sm text-red-500">{errors.correct}</p>}
                            </div>
                        </div>

                        {/* 用时 */}
                        <div className="space-y-2">
                            <Label htmlFor="duration">
                                <MixedText text="用时" />
                            </Label>
                            <TimePicker
                                value={formData.duration || '00:00'}
                                onChange={(value) => handleFormChange('duration', value)}
                                className="h-10"
                            />
                            {errors.duration && <p className="text-sm text-red-500">{errors.duration}</p>}
                        </div>

                        {/* 按钮组 */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                className="flex-1 rounded-full bg-[#0d9488] hover:bg-[#0d9488]/90 text-white"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                <MixedText text="保存" />
                            </Button>
                            <SheetClose asChild>
                                <Button type="button" variant="outline" className="px-6 rounded-full">
                                    <X className="w-4 h-4 mr-2" />
                                    <MixedText text="关闭" />
                                </Button>
                            </SheetClose>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </div>

    );
}