import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/FormField";
import { FormError } from "@/components/ui/form-error";
import { format } from "date-fns";
import { Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle, Trash, Pin, PinOff } from "lucide-react";
import { useState } from "react";
import { MixedText } from "@/components/ui/MixedText";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/animate-ui/components/animate/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger, HoverCardPortal } from "@/components/animate-ui/components/radix/hover-card";
import { AnimatePresence, motion } from "motion/react";

import { CustomDateRangePicker } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { generateUUID } from "@/lib/utils";
import { BorderBeamCard } from "@/components/magicui/border-beam-card";
import toast from 'react-hot-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/simple-tabs";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import { BeautifulPagination } from "@/components/ui/BeautifulPagination";

interface StudyPlan {
    id: string;
    name: string;
    module: string;
    type: "题量" | "正确率" | "错题数";
    startDate: string;
    endDate: string;
    target: number;
    progress: number;
    status: "未开始" | "进行中" | "已完成" | "未达成";
    description?: string;
    isPinned?: boolean;
}

interface PlanListViewProps {
    plans: StudyPlan[];
    onCreate: (plan: StudyPlan) => void;
    onUpdate: (plan: StudyPlan) => void;
    onDelete: (id: string) => void;
    onBatchDelete?: (ids: string[]) => void;
}

export default function PlanListView({ plans, onCreate, onUpdate, onDelete, onBatchDelete }: PlanListViewProps) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<StudyPlan>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dateRange, setDateRange] = useState<DateRange>();
    const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set()); // Track selected plans for bulk operations
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // Control delete confirmation dialog

    // 分页相关状态
    const [completedPage, setCompletedPage] = useState(1);
    const [completedPageSize, setCompletedPageSize] = useState(7);

    const handleOpenForm = (plan?: StudyPlan) => {
        if (plan) {
            setEditId(plan.id);
            setForm(plan);
            setDateRange({
                from: new Date(plan.startDate),
                to: new Date(plan.endDate)
            });
        } else {
            setEditId(null);
            setForm({});
            setDateRange(undefined);
        }
        setErrors({});
        // 使用setTimeout确保状态更新完成后再显示表单
        setTimeout(() => {
            setShowForm(true);
        }, 0);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditId(null);
        setForm({});
        setErrors({});
        setDateRange(undefined);
    };

    const handleDialogClose = () => {
        // 只重置表单状态，不直接设置showForm，让Dialog自己处理关闭
        setEditId(null);
        setForm({});
        setErrors({});
        setDateRange(undefined);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        // 只在有日期变化时才更新form状态
        if (range?.from || range?.to) {
            setForm(prev => ({
                ...prev,
                startDate: range?.from ? format(range.from, 'yyyy-MM-dd') : prev.startDate,
                endDate: range?.to ? format(range.to, 'yyyy-MM-dd') : prev.endDate
            }));
        }
        // 清除日期相关的错误
        if (errors.startDate || errors.endDate) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.startDate;
                delete newErrors.endDate;
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.name?.trim()) {
            newErrors.name = '计划名称不能为空';
            toast.error('计划名称不能为空');
            setErrors(newErrors);
            return false;
        }

        if (!form.module) {
            newErrors.module = '请选择模块';
            toast.error('请选择模块');
            setErrors(newErrors);
            return false;
        }

        if (!form.type) {
            newErrors.type = '请选择计划类型';
            toast.error('请选择计划类型');
            setErrors(newErrors);
            return false;
        }

        if (!form.startDate) {
            newErrors.startDate = '请选择开始日期';
            toast.error('请选择开始日期');
            setErrors(newErrors);
            return false;
        }

        if (!form.endDate) {
            newErrors.endDate = '请选择结束日期';
            toast.error('请选择结束日期');
            setErrors(newErrors);
            return false;
        }

        if (form.startDate && form.endDate) {
            const startDate = new Date(form.startDate);
            const endDate = new Date(form.endDate);
            if (startDate > endDate) {
                newErrors.endDate = '结束日期不能早于开始日期';
                toast.error('结束日期不能早于开始日期');
                setErrors(newErrors);
                return false;
            }
        }

        if (!form.target) {
            newErrors.target = '请输入目标值';
            toast.error('请输入目标值');
            setErrors(newErrors);
            return false;
        }

        const target = parseInt(form.target.toString());
        if (isNaN(target) || target <= 0) {
            newErrors.target = '目标值必须是大于0的数字';
            toast.error('目标值必须是大于0的数字');
            setErrors(newErrors);
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const planData: StudyPlan = {
            id: editId || generateUUID(),
            name: form.name!,
            module: form.module!,
            type: form.type!,
            startDate: form.startDate!,
            endDate: form.endDate!,
            target: form.target!,
            progress: form.progress || 0,
            status: form.status || '未开始',
            description: form.description
        };

        if (editId) {
            onUpdate(planData);

        } else {
            onCreate(planData);

        }

        handleCloseForm();
    };

    const handleDelete = (id: string) => {
        onDelete(id);
    };

    // 处理置顶功能
    const handleTogglePin = (plan: StudyPlan) => {
        const updatedPlan = {
            ...plan,
            isPinned: !plan.isPinned
        };
        onUpdate(updatedPlan);
        toast.success(updatedPlan.isPinned ? '已置顶' : '已取消置顶');
    };

    // 处理单个复选框选择
    const handlePlanSelect = (id: string, checked: boolean) => {
        setSelectedPlans(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };

    // 处理全选/取消全选
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedPlans(new Set(paginatedCompletedPlans.map(p => p.id)));
        } else {
            setSelectedPlans(new Set());
        }
    };

    // 批量编辑
    const handleBulkEdit = () => {
        if (selectedPlans.size === 0) return;

        // 如果只选中一个，直接编辑
        if (selectedPlans.size === 1) {
            const planId = Array.from(selectedPlans)[0];
            const plan = paginatedCompletedPlans.find(p => p.id === planId);
            if (plan) {
                handleOpenForm(plan);
            }
        } else {
            // 多个选中时，提示用户
            toast.error('请选择一个计划进行编辑');
        }
    };

    // 批量删除 - 显示确认对话框
    const handleBulkDelete = () => {
        if (selectedPlans.size === 0) return;
        setDeleteDialogOpen(true);
    };

    // 确认删除
    const confirmDelete = async () => {
        const planIds = Array.from(selectedPlans);

        // 先关闭对话框
        setDeleteDialogOpen(false);

        // 清空选中状态
        setSelectedPlans(new Set());

        // 如果有批量删除函数，使用它；否则使用单个删除
        if (onBatchDelete) {
            await onBatchDelete(planIds);
        } else {
            // 执行删除操作
            planIds.forEach(id => {
                onDelete(id);
            });
            // 显示统一的成功toast
            toast.success(`已删除 ${planIds.length} 个学习计划`);
        }
    };

    const getProgressPercentage = (plan: StudyPlan) => {
        if (plan.target === 0) return 0;
        return Math.min((plan.progress / plan.target) * 100, 100);
    };

    // 分离进行中和已完成的计划，并添加排序逻辑
    const activePlans = plans
        .filter(plan => plan.status !== "已完成")
        .sort((a, b) => {
            // 置顶的排在前面
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // 如果置顶状态相同，按开始时间排序（最新的在前）
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });

    const completedPlans = plans
        .filter(plan => plan.status === "已完成")
        .sort((a, b) => {
            // 置顶的排在前面
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // 如果置顶状态相同，按结束时间排序（最近的在前）
            return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
        });

    // 分页处理
    const totalCompletedPages = Math.ceil(completedPlans.length / completedPageSize);
    const paginatedCompletedPlans = completedPlans.slice(
        (completedPage - 1) * completedPageSize,
        completedPage * completedPageSize
    );

    // 处理分页变化
    const handleCompletedPageChange = (page: number) => {
        setCompletedPage(page);
        // 清空选中状态
        setSelectedPlans(new Set());
    };

    const handleCompletedPageSizeChange = (size: number) => {
        setCompletedPageSize(size);
        setCompletedPage(1); // 重置到第一页
        // 清空选中状态
        setSelectedPlans(new Set());
    };

    // 获取状态图标和颜色
    const getStatusIcon = (status: StudyPlan["status"]) => {
        switch (status) {
            case "已完成":
                return <CheckCircle className="w-5 h-5" style={{ color: '#0284c7' }} />;
            case "进行中":
                return <Clock className="w-5 h-5" style={{ color: '#10b981' }} />;
            case "未开始":
                return <Clock className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
            case "未达成":
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
        }
    };

    // 获取状态显示文本
    const getStatusText = (status: StudyPlan["status"]) => {
        switch (status) {
            case "已完成":
                return "已完成";
            case "进行中":
                return "进行中";
            case "未开始":
                return "未开始";
            case "未达成":
                return "未达成";
            default:
                return status;
        }
    };

    return (
        <TooltipProvider>
            <div className="flex justify-between items-center">
                <div></div> {/* Empty div to maintain layout structure */}
                <ButtonGroup spacing="sm">
                    <Button
                        onClick={() => handleOpenForm()}
                        className="h-9 text-white shadow-sm rounded-full bg-[#2A4DD0] hover:bg-[#2A4DD0]/90"
                        data-plan-button
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        <MixedText text="新建计划" />
                    </Button>
                </ButtonGroup>
            </div>

            {/* 使用统一的 Tabs 组件 */}
            <Tabs defaultValue="active" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="grid w-fit min-w-[200px] grid-cols-2">
                        <TabsTrigger value="active">
                            <MixedText text="进行中" />
                        </TabsTrigger>
                        <TabsTrigger value="completed">
                            <MixedText text="已完成" />
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContents className="py-6 px-2">
                    <TabsContent value="active" className="outline-none">
                        <AnimatePresence mode="popLayout">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto w-full items-stretch px-4 pb-4">
                                {activePlans.map(plan => (
                                    <HoverCard key={plan.id}>
                                        <HoverCardTrigger asChild>
                                            <motion.div
                                                layoutId={`active-plan-${plan.id}`}
                                                layout
                                            >
                                                <BorderBeamCard className="w-full rounded-2xl overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors">
                                                    <div className="p-6 flex flex-col h-full">
                                                        {/* Header with title and actions */}
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-xl font-bold text-foreground truncate">
                                                                    {plan.name}
                                                                </h3>
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {plan.type === '题量' ? '题量计划' : plan.type === '正确率' ? '正确率计划' : '错题数计划'}
                                                                </p>
                                                            </div>
                                                            {/* Action buttons */}
                                                            <div className="flex gap-1 ml-2 flex-shrink-0">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleTogglePin(plan);
                                                                            }}
                                                                            variant="outline"
                                                                            size="icon"
                                                                            className={`h-8 w-8 rounded-full ${plan.isPinned
                                                                                    ? 'bg-[#f59e0b] border-[#f59e0b] hover:bg-[#f59e0b]/90'
                                                                                    : 'bg-[#6b7280] border-[#6b7280] hover:bg-[#6b7280]/90'
                                                                                }`}
                                                                        >
                                                                            {plan.isPinned ? <Pin className="w-4 h-4 text-white" /> : <PinOff className="w-4 h-4 text-white" />}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p><MixedText text={plan.isPinned ? "取消置顶" : "置顶"} /></p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            onClick={() => handleOpenForm(plan)}
                                                                            variant="outline"
                                                                            size="icon"
                                                                            className="h-8 w-8 rounded-full bg-[#2C9678] border-[#2C9678] hover:bg-[#2C9678]/90"
                                                                        >
                                                                            <Edit className="w-4 h-4 text-white" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p><MixedText text="编辑" /></p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Dialog>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <DialogTrigger asChild>
                                                                                <Button
                                                                                    variant="destructive"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 rounded-full"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p><MixedText text="删除" /></p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle><MixedText text="确认删除" /></DialogTitle>
                                                                        </DialogHeader>
                                                                        <DialogDescription>
                                                                            <MixedText text={`确定要删除学习计划"${plan.name}"吗？`} />
                                                                            <br />
                                                                            <br />
                                                                            <MixedText text="此操作不可撤销，删除后无法恢复。" />
                                                                        </DialogDescription>
                                                                        <DialogFooter>
                                                                            <DialogClose asChild>
                                                                                <Button variant="outline">
                                                                                    <MixedText text="取消" />
                                                                                </Button>
                                                                            </DialogClose>
                                                                            <Button
                                                                                onClick={() => handleDelete(plan.id)}
                                                                                variant="destructive"
                                                                            >
                                                                                <MixedText text="确认删除" />
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>
                                                        </div>

                                                        {/* Plan progress display - main focus */}
                                                        <div className="flex-1 flex flex-col justify-center my-4">
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-sm text-muted-foreground">
                                                                        <MixedText text={`${plan.startDate} ~ ${plan.endDate}`} />
                                                                    </div>
                                                                    <div className="text-sm font-medium">
                                                                        <span style={{ color: plan.status === '已完成' ? '#0284c7' : plan.status === '进行中' ? '#10b981' : '#6b7280' }}>
                                                                            <MixedText text={getStatusText(plan.status)} />
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between text-sm">
                                                                        <span className="text-muted-foreground">
                                                                            {plan.type === '正确率' ? <MixedText text="目标正确率" /> : <MixedText text={`目标${plan.type === '题量' ? '题量' : '错题数'}`} />}
                                                                        </span>
                                                                        <span className="font-medium">
                                                                            {plan.type === '正确率' ? <MixedText text={`${plan.target}%`} /> : <MixedText text={`${plan.target}${plan.type === '题量' ? '题' : plan.type === '错题数' ? '道' : ''}`} />}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex justify-between text-sm">
                                                                        <span className="text-muted-foreground">
                                                                            <MixedText text="当前进度" />
                                                                        </span>
                                                                        <span className="font-medium">
                                                                            {plan.type === '正确率' ? <MixedText text={`${plan.progress}%`} /> : <MixedText text={`${plan.progress}/${plan.target}${plan.type === '题量' ? '题' : plan.type === '错题数' ? '道' : ''}`} />}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="pt-2">
                                                                    <Progress
                                                                        value={getProgressPercentage(plan)}
                                                                        variant="plan"
                                                                        showText={true}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Footer with module and description */}
                                                        <div className="mt-4 pt-4 border-t border-border">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-sm">
                                                                    <span className="text-muted-foreground"><MixedText text="板块：" /></span>
                                                                    <span className="font-medium"><MixedText text={normalizeModuleName(plan.module)} /></span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </BorderBeamCard>
                                            </motion.div>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-80">
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold">
                                                    <MixedText text="计划描述" />
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    <MixedText text={plan.description || '暂无描述'} />
                                                </p>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                ))}

                                {/* 空状态 - 始终渲染，使用CSS控制显示 */}
                                <div className="col-span-full" style={{ display: activePlans.length > 0 ? 'none' : 'block' }}>
                                    <div className="p-12 text-center">
                                        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                                            <Clock className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground mb-3">
                                            <MixedText text="暂无进行中的计划" />
                                        </h3>
                                        <p className="text-muted-foreground mb-6 max-w-md mx-auto text-lg">
                                            <MixedText text="创建一个新的学习计划开始您的学习之旅" />
                                        </p>
                                        <Button
                                            onClick={() => handleOpenForm()}
                                            className="h-10 px-6 rounded-md font-medium bg-[#1d4ed8] text-white hover:bg-[#1d4ed8]/90"
                                            variant="default"
                                        >
                                            <Plus className="w-5 h-5 mr-2" />
                                            <MixedText text="创建第一个计划" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </AnimatePresence>
                    </TabsContent>

                    <TabsContent value="completed" className="outline-none flex flex-col gap-6">
                        <div className="w-full max-w-6xl mx-auto pb-4 px-4 sm:px-6 lg:px-8">
                            <div className="min-h-[500px]">
                                {completedPlans.length > 0 ? (
                                    <div className="space-y-4">
                                        {/* 批量操作栏 */}
                                        <div className="flex items-center justify-between px-6 py-3 rounded-lg bg-[#EEEDED] dark:bg-[#262626]">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={selectedPlans.size === paginatedCompletedPlans.length && paginatedCompletedPlans.length > 0}
                                                    onCheckedChange={handleSelectAll}
                                                    size="sm"
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    已选择 {selectedPlans.size} / {paginatedCompletedPlans.length} 项
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            onClick={handleBulkEdit}
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full bg-[#2C9678] border-[#2C9678] hover:bg-[#2C9678]/90"
                                                            disabled={selectedPlans.size === 0}
                                                        >
                                                            <Edit className="w-4 h-4 text-white" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p><MixedText text="编辑选中项" /></p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            onClick={handleBulkDelete}
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full"
                                                            disabled={selectedPlans.size === 0}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p><MixedText text="删除选中项" /></p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        {/* 横向长条卡片列表 */}
                                        <AnimatePresence mode="popLayout">
                                            <div className="space-y-2">
                                                {paginatedCompletedPlans.map(plan => {
                                                    const isSelected = selectedPlans.has(plan.id);
                                                    return (
                                                        <HoverCard key={plan.id}>
                                                            <HoverCardTrigger asChild>
                                                                <motion.div
                                                                    layoutId={`completed-plan-${plan.id}`}
                                                                    layout
                                                                    className="w-full rounded-xl overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors shadow-none"
                                                                    onClick={() => handlePlanSelect(plan.id, !isSelected)}
                                                                >
                                                                    <div className="px-6 py-3 flex items-center gap-3">
                                                                        {/* 复选框 */}
                                                                        <Checkbox
                                                                            checked={isSelected}
                                                                            onCheckedChange={(checked) => handlePlanSelect(plan.id, checked as boolean)}
                                                                            size="sm"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />

                                                                        {/* 计划信息 */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <h3 className="text-base font-bold text-foreground truncate">
                                                                                        {plan.name}
                                                                                    </h3>
                                                                                    <div className="flex items-center gap-4 mt-0.5 text-xs text-muted-foreground">
                                                                                        <span>{plan.startDate} ~ {plan.endDate}</span>
                                                                                        <span>•</span>
                                                                                        <span>{normalizeModuleName(plan.module)}</span>
                                                                                        <span>•</span>
                                                                                        <span>{plan.type === '题量' ? '题量计划' : plan.type === '正确率' ? '正确率计划' : '错题数计划'}</span>
                                                                                    </div>
                                                                                </div>

                                                                                {/* 状态显示 */}
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <CheckCircle className="w-4 h-4" style={{ color: '#0284c7' }} />
                                                                                        <span className="text-xs font-medium" style={{ color: '#0284c7' }}>
                                                                                            {getStatusText(plan.status)}
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* 操作按钮 */}
                                                                                    <div className="flex gap-1 ml-2 flex-shrink-0">
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <Button
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        handleTogglePin(plan);
                                                                                                    }}
                                                                                                    variant="outline"
                                                                                                    size="icon"
                                                                                                    className={`h-6 w-6 rounded-full ${plan.isPinned
                                                                                                            ? 'bg-[#f59e0b] border-[#f59e0b] hover:bg-[#f59e0b]/90'
                                                                                                            : 'bg-[#6b7280] border-[#6b7280] hover:bg-[#6b7280]/90'
                                                                                                        }`}
                                                                                                >
                                                                                                    {plan.isPinned ? <Pin className="w-3 h-3 text-white" /> : <PinOff className="w-3 h-3 text-white" />}
                                                                                                </Button>
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent>
                                                                                                <p><MixedText text={plan.isPinned ? "取消置顶" : "置顶"} /></p>
                                                                                            </TooltipContent>
                                                                                        </Tooltip>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                    </div>
                                                                </motion.div>
                                                            </HoverCardTrigger>
                                                            <HoverCardContent className="w-80">
                                                                <div className="space-y-2">
                                                                    <h4 className="text-sm font-semibold">
                                                                        <MixedText text="计划描述" />
                                                                    </h4>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        <MixedText text={plan.description || '暂无描述'} />
                                                                    </p>
                                                                </div>
                                                            </HoverCardContent>
                                                        </HoverCard>
                                                    )
                                                })}
                                            </div>
                                        </AnimatePresence>

                                        {/* 分页组件 */}
                                        {totalCompletedPages > 1 && (
                                            <div className="mt-6">
                                                <BeautifulPagination
                                                    currentPage={completedPage}
                                                    totalPages={totalCompletedPages}
                                                    onPageChange={handleCompletedPageChange}
                                                    totalItems={completedPlans.length}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* 空状态 */
                                    <div className="p-12 text-center">
                                        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                                            <CheckCircle className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground mb-3">
                                            <MixedText text="暂无已完成的计划" />
                                        </h3>
                                        <p className="text-muted-foreground mb-6 max-w-md mx-auto text-lg">
                                            <MixedText text="完成计划后，它们将显示在这里，帮助您回顾学习历程" />
                                        </p>
                                    </div>
                                )
                                }
                            </div >
                        </div >
                    </TabsContent >
                </TabsContents >
            </Tabs >

            <Dialog open={showForm} onOpenChange={(open) => {
                if (!open) {
                    handleDialogClose();
                }
                setShowForm(open);
            }}>
                <DialogContent className="w-11/12 max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {editId ? <MixedText text="编辑计划" /> : <MixedText text="新建计划" />}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <FormField label={<MixedText text="计划名称" />} htmlFor="name" required>
                                <Input
                                    id="name"
                                    name="name"
                                    value={form.name || ''}
                                    onChange={handleFormChange}
                                    className="h-11"
                                    placeholder="请输入计划名称"
                                />
                            </FormField>
                            <FormError error={errors.name} />
                        </div>

                        <div className="space-y-2">
                            <FormField label={<MixedText text="计划时间范围" />}>
                                <CustomDateRangePicker
                                    dateRange={dateRange}
                                    onDateRangeChange={handleDateRangeChange}
                                    placeholder="选择开始和结束日期"
                                    page="study-plan"
                                />
                            </FormField>
                            <FormError error={errors.startDate || errors.endDate} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormField label={<MixedText text="板块" />} htmlFor="module">
                                    <Select
                                        value={form.module || ''}
                                        onValueChange={v => {
                                            setForm(f => ({ ...f, module: v }));
                                            if (errors.module) {
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.module;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="请选择板块">
                                                {form.module ? normalizeModuleName(form.module) : '请选择板块'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* 统一顺序：资料分析、政治理论、数量关系、言语理解、常识判断、判断推理 */}
                                            <SelectItem value="data-analysis"><MixedText text="资料分析" /></SelectItem>
                                            <SelectItem value="politics"><MixedText text="政治理论" /></SelectItem>
                                            <SelectItem value="math"><MixedText text="数量关系" /></SelectItem>
                                            <SelectItem value="verbal"><MixedText text="言语理解" /></SelectItem>
                                            <SelectItem value="common"><MixedText text="常识判断" /></SelectItem>
                                            <SelectItem value="logic"><MixedText text="判断推理" /></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormField>
                                <FormError error={errors.module} />
                            </div>

                            <div className="space-y-2">
                                <FormField label={<MixedText text="目标类型" />} htmlFor="type">
                                    <Select
                                        value={form.type || ''}
                                        onValueChange={v => {
                                            setForm(f => ({ ...f, type: v as "题量" | "正确率" | "错题数" }));
                                            if (errors.type) {
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.type;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="选择类型">
                                                {form.type || '选择类型'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="题量"><MixedText text="题量" /></SelectItem>
                                            <SelectItem value="正确率"><MixedText text="正确率" /></SelectItem>
                                            <SelectItem value="错题数"><MixedText text="错题数" /></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormField>
                                <FormError error={errors.type} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <FormField label={<MixedText text="目标值" />} htmlFor="target" required>
                                <Input
                                    id="target"
                                    name="target"
                                    type="number"
                                    value={form.target || ''}
                                    onChange={handleFormChange}
                                    className="h-11"
                                    placeholder="请输入目标值"
                                />
                            </FormField>
                            <FormError error={errors.target} />
                        </div>

                        <div className="space-y-2">
                            <FormField label={<MixedText text="计划描述" />} htmlFor="description">
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={form.description || ''}
                                    onChange={handleFormChange}
                                    rows={3}
                                    placeholder="可选：添加计划描述"
                                    className="resize-none"
                                />
                            </FormField>
                        </div>

                        <DialogFooter className="flex-col sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseForm}
                                className="w-full sm:w-auto rounded-full"
                            >
                                <MixedText text="取消" />
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                className="w-full sm:w-auto rounded-full bg-[#324CC8] hover:bg-[#324CC8]/90"
                            >
                                {editId ? <MixedText text="更新计划" /> : <MixedText text="创建计划" />}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle><MixedText text="确认删除" /></DialogTitle>
                        <DialogDescription>
                            <MixedText text={`确定要删除选中的 ${selectedPlans.size} 个学习计划吗？`} />
                            <br />
                            <br />
                            <MixedText text="此操作不可撤销，删除后无法恢复。" />
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-full">
                                <MixedText text="取消" />
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={confirmDelete}
                            variant="destructive"
                            className="rounded-full"
                        >
                            <MixedText text="确认删除" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider >
    );
}

// Add this helper function at the end of the file
function normalizeModuleName(module: string): string {
    const moduleMap: Record<string, string> = {
        'data-analysis': '资料分析',
        'politics': '政治理论',
        'math': '数量关系',
        'verbal': '言语理解',
        'common': '常识判断',
        'logic': '判断推理',
    };
    return moduleMap[module] || module;
}