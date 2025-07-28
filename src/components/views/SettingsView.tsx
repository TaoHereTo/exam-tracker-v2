import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AppearanceSetting } from "./settings/AppearanceSetting";
import { PaginationSetting } from "./settings/PaginationSetting";

import { DataImportExport } from "@/components/features/DataImportExport";
import { AdvancedSetting } from "./settings/AdvancedSetting";
import SaveSettingsButton from "./settings/SaveSettingsButton";
import { UnifiedButton } from "@/components/ui/UnifiedButton";

export function SettingsView({
    onExport, onImport, onClearAllData,
    pageSize, setPageSize,
    activeTab,
    onClearRecords, onClearKnowledge, onClearPlans,
    navMode
}: {
    onExport?: () => void;
    onImport?: () => void;
    onClearAllData?: () => void;
    pageSize: number;
    setPageSize: (n: number) => void;
    // onSaveSettings?: () => void; // 移除未使用的props
    activeTab?: string;
    onClearRecords?: () => void;
    onClearKnowledge?: () => void;
    onClearPlans?: () => void;
    navMode?: string;
}) {
    if (activeTab === 'settings-advanced') {
        return (
            <>
                <AdvancedSetting onClearRecords={onClearRecords} onClearKnowledge={onClearKnowledge} onClearPlans={onClearPlans} />
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>危险操作</CardTitle>
                        <CardDescription>此处操作不可逆，请谨慎使用！</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                            <div>
                                <h3 className="font-medium text-destructive">清空所有数据</h3>
                                <p className="text-sm text-muted-foreground text-destructive/90">
                                    此操作将永久删除所有刷题记录和知识点，无法撤销。
                                </p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <UnifiedButton
                                        variant="reactbits"
                                        size="sm"
                                        className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                                    >
                                        清空数据
                                    </UnifiedButton>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>您确定要这么做吗？</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            这个操作无法撤销。这将永久删除您的所有刷题记录和知识点数据。
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>取消</AlertDialogCancel>
                                        <AlertDialogAction onClick={onClearAllData}>
                                            确认清空
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </>
        );
    }
    // 已彻底移除自动备份相关内容

    return (
        <div className="space-y-6">
            {/* <h1 className="text-3xl font-bold">基础设置</h1> */}
            <Card>
                <CardHeader>
                    <CardTitle>数据管理</CardTitle>
                    <CardDescription>
                        备份、恢复您的应用数据。请及时保存。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h3 className="font-medium">备份与恢复</h3>
                            <p className="text-sm text-muted-foreground">
                                将所有数据导出到文件、或从文件恢复。
                            </p>
                        </div>
                        <DataImportExport onImport={onImport!} onExport={onExport!} />
                    </div>

                </CardContent>
            </Card>
            {/* 新增设置卡片 */}
            <AppearanceSetting />
            <PaginationSetting pageSize={pageSize} setPageSize={setPageSize} />
            <div className="flex justify-end mt-4">
                {navMode && <SaveSettingsButton navMode={navMode as 'sidebar' | 'dock'} />}
            </div>
        </div>
    );
} 