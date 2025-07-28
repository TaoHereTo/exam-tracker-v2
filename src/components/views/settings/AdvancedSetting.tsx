import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import ReactBitsButton from "@/components/ui/ReactBitsButton";
import { ThemeSwitchSelector, ThemeSwitchType } from "@/components/ui/ThemeSwitchSelector";
import StyledSwitch from "@/components/ui/StyledSwitch";
import PreviewSwitch from "@/components/ui/PreviewSwitch";
import { useSwitchStyle } from "@/contexts/SwitchStyleContext";
import { getLocalStorageInfo, formatStorageSize, getLargestStorageItems, type StorageInfo } from "@/lib/storageUtils";
import { BeautifulProgress } from "@/components/ui/BeautifulProgress";

// 定义 OtherSwitchType 类型
type OtherSwitchType = 'default' | 'sparkle' | '3d' | 'glass' | 'plane';

export function AdvancedSetting({ onClearRecords, onClearKnowledge, onClearPlans }: {
    onClearRecords?: () => void;
    onClearKnowledge?: () => void;
    onClearPlans?: () => void;
}) {
    // 新功能1：减弱动态效果
    const [reduceMotion, setReduceMotion] = React.useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('reduce-motion-enabled') === 'true';
        }
        return false;
    });

    // 新功能2：深浅色主题切换按钮风格选择
    const [themeSwitchType, setThemeSwitchType] = React.useState<ThemeSwitchType>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme-switch-type') as ThemeSwitchType) || 'beautiful';
        }
        return 'beautiful';
    });

    // 新功能3：其他开关样式选择
    const { otherSwitchType, setOtherSwitchType } = useSwitchStyle();

    // 预览状态（独立于实际功能状态）
    const [previewState, setPreviewState] = React.useState(false);

    // 新功能4：localStorage使用量监控
    const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
    const [largestItems, setLargestItems] = useState<Array<{ key: string; size: number; sizeKB: number }>>([]);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            updateStorageInfo();
        }

        // 清理函数
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const updateStorageInfo = () => {
        const info = getLocalStorageInfo();
        const largest = getLargestStorageItems(3);
        setStorageInfo(info);
        setLargestItems(largest);
    };

    React.useEffect(() => {
        localStorage.setItem('reduce-motion-enabled', reduceMotion ? 'true' : 'false');
        if (reduceMotion) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
        // 触发自定义事件通知其他组件
        window.dispatchEvent(new CustomEvent('reduceMotionChanged'));
        updateStorageInfo();
    }, [reduceMotion]);

    React.useEffect(() => {
        localStorage.setItem('theme-switch-type', themeSwitchType);
        updateStorageInfo();
    }, [themeSwitchType]);

    const [clearType, setClearType] = useState<string>("records");
    const [showDialog, setShowDialog] = useState(false);
    const clearTypeLabels = {
        records: "历史记录",
        knowledge: "知识点",
        plans: "学习计划",
    };
    const handleClear = () => {
        if (clearType === "records" && onClearRecords) onClearRecords();
        if (clearType === "knowledge" && onClearKnowledge) onClearKnowledge();
        if (clearType === "plans" && onClearPlans) onClearPlans();
        setShowDialog(false);
        // 清空后更新存储信息，使用ref管理timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(updateStorageInfo, 100);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>界面设置</CardTitle>
                    <CardDescription>自定义界面显示效果和交互体验。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 减弱动态效果设置 */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                            <h3 className="font-medium">减弱动态效果</h3>
                            <p className="text-sm text-muted-foreground">
                                开启后将禁用卡片动画、按钮动效等，提供更简洁的界面体验。
                            </p>
                        </div>
                        <StyledSwitch
                            checked={reduceMotion}
                            onChange={setReduceMotion}
                        />
                    </div>

                    {/* 主题切换按钮风格选择 */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                            <h3 className="font-medium">主题切换按钮风格</h3>
                            <p className="text-sm text-muted-foreground">
                                选择深浅色主题切换按钮的显示风格。
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={themeSwitchType} onValueChange={(value) => setThemeSwitchType(value as ThemeSwitchType)}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="simple">简约风格</SelectItem>
                                    <SelectItem value="beautiful">太阳月亮</SelectItem>
                                    <SelectItem value="bb8">星球大战</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex-shrink-0">
                                <ThemeSwitchSelector
                                    type={themeSwitchType}
                                    previewOnly={true}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 其他开关样式选择 */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                            <h3 className="font-medium">其他开关样式</h3>
                            <p className="text-sm text-muted-foreground">
                                选择其他开关控件的显示样式（如护眼模式、减弱动态效果等开关）。
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={otherSwitchType} onValueChange={(value) => setOtherSwitchType(value as OtherSwitchType)}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">默认样式</SelectItem>
                                    <SelectItem value="glass">玻璃质感</SelectItem>
                                    <SelectItem value="plane">飞机主题</SelectItem>
                                    <SelectItem value="sparkle">闪烁效果</SelectItem>
                                    <SelectItem value="3d">3D翻转</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex-shrink-0">
                                <PreviewSwitch
                                    checked={previewState}
                                    onChange={setPreviewState}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 存储管理 */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>存储管理</CardTitle>
                    <CardDescription>监控和管理本地存储使用情况。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {storageInfo && (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                                <h3 className="font-medium">本地存储使用情况</h3>
                                <p className="text-sm text-muted-foreground">
                                    已使用 {formatStorageSize(storageInfo.usedSize)} / {formatStorageSize(5 * 1024 * 1024)} ({storageInfo.usagePercentage.toFixed(1)}%)
                                </p>
                                <BeautifulProgress value={storageInfo.usagePercentage} className="mt-2" />
                            </div>
                        </div>
                    )}

                    {largestItems.length > 0 && (
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">占用空间最大的项目：</h4>
                            <div className="space-y-1">
                                {largestItems.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{item.key}</span>
                                        <span>{item.sizeKB.toFixed(1)} KB</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                            <h3 className="font-medium">清空数据</h3>
                            <p className="text-sm text-muted-foreground">
                                选择要清空的数据类型，此操作不可逆。
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={clearType} onValueChange={setClearType}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="records">{clearTypeLabels.records}</SelectItem>
                                    <SelectItem value="knowledge">{clearTypeLabels.knowledge}</SelectItem>
                                    <SelectItem value="plans">{clearTypeLabels.plans}</SelectItem>
                                </SelectContent>
                            </Select>
                            <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
                                <AlertDialogTrigger asChild>
                                    <ReactBitsButton
                                        variant="outline"
                                        size="sm"
                                        className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                                    >
                                        清空
                                    </ReactBitsButton>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>确认清空{clearTypeLabels[clearType as keyof typeof clearTypeLabels]}？</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            此操作将永久删除所有{clearTypeLabels[clearType as keyof typeof clearTypeLabels]}，无法撤销。是否确认？
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>取消</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleClear}>确认清空</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
} 