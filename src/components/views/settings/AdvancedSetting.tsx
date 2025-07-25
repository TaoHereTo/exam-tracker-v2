import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import * as React from "react";
import { useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import ReactBitsButton from "@/components/ui/ReactBitsButton";

export function AdvancedSetting({ onClearRecords, onClearKnowledge, onClearPlans }: {
    onClearRecords?: () => void;
    onClearKnowledge?: () => void;
    onClearPlans?: () => void;
}) {
    // 已彻底移除自动备份相关内容

    // 新功能1：实验性夜间护眼模式（仅切换背景色）
    const [eyeCare, setEyeCare] = React.useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('eye-care-enabled') === 'true';
        }
        return false;
    });
    React.useEffect(() => {
        localStorage.setItem('eye-care-enabled', eyeCare ? 'true' : 'false');
        if (eyeCare) {
            document.body.classList.add('eye-care');
        } else {
            document.body.classList.remove('eye-care');
        }
    }, [eyeCare]);

    const [clearType, setClearType] = useState<string>("records");
    const [showDialog, setShowDialog] = useState(false);
    const clearTypeLabel: Record<string, string> = {
        records: "历史记录",
        knowledge: "知识点",
        plans: "学习计划",
    };
    const handleClear = () => {
        if (clearType === "records" && onClearRecords) onClearRecords();
        if (clearType === "knowledge" && onClearKnowledge) onClearKnowledge();
        if (clearType === "plans" && onClearPlans) onClearPlans();
        setShowDialog(false);
    };

    return (
        <>
            <Card>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">夜间护眼模式 <span className="text-xs text-muted-foreground">实验性</span></div>
                            <div className="text-sm text-muted-foreground">开启后页面整体色调更柔和，适合夜间使用。</div>
                        </div>
                        <Switch checked={eyeCare} onCheckedChange={setEyeCare} />
                    </div>
                </CardContent>
            </Card>
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>批量清空数据</CardTitle>
                    <CardDescription>选择要清空的数据类型，操作不可恢复，请谨慎！</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Select value={clearType} onValueChange={setClearType}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="请选择类型" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="records">历史记录</SelectItem>
                                <SelectItem value="knowledge">知识点</SelectItem>
                                <SelectItem value="plans">学习计划</SelectItem>
                            </SelectContent>
                        </Select>
                        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
                            <AlertDialogTrigger asChild>
                                <ReactBitsButton variant="destructive" size="sm">
                                    清空
                                </ReactBitsButton>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>确认清空？</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        此操作将永久删除所有{clearTypeLabel[clearType]}，无法撤销。是否确认？
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClear}>确认清空</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </>
    );
} 