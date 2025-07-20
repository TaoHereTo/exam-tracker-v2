import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SettingsView({ onExport, onImport, onClearAllData }: { onExport?: () => void; onImport?: () => void; onClearAllData?: () => void }) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">基础设置</h1>
            <Card>
                <CardHeader>
                    <CardTitle>数据管理</CardTitle>
                    <CardDescription>
                        备份、恢复或清空您的应用数据。请谨慎操作。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h3 className="font-medium">备份与恢复</h3>
                            <p className="text-sm text-muted-foreground">
                                将所有数据导出到文件，或从文件中恢复。
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onImport}>导入数据</Button>
                            <Button variant="outline" onClick={onExport}>导出数据</Button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                        <div>
                            <h3 className="font-medium text-destructive">清空所有数据</h3>
                            <p className="text-sm text-muted-foreground text-destructive/90">
                                此操作将永久删除所有刷题记录和知识点，无法撤销。
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">清空数据</Button>
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
            {/* 这里可以放其他的设置卡片，比如外观设置等 */}
        </div>
    );
} 