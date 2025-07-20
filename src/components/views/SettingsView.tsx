import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

export function SettingsView({ onExport, onImport }: { onExport?: () => void; onImport?: () => void }) {
    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>数据管理</CardTitle>
                <CardDescription>
                    您可以备份所有刷题记录到本地文件，或从备份文件中恢复数据。
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4">
                    <Button variant="outline" className="flex items-center gap-2" onClick={onExport}>
                        <Download className="w-4 h-4" /> 导出数据到 JSON
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2" onClick={onImport}>
                        <Upload className="w-4 h-4" /> 从 JSON 文件导入
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
} 