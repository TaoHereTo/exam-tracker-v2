import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function ExportFormatSetting({ exportFormat, setExportFormat }: { exportFormat: string; setExportFormat: (f: string) => void; }) {
    const [tempFormat, setTempFormat] = useState(exportFormat);
    const handleChange = (v: string) => {
        setTempFormat(v);
        try {
            setExportFormat(v);
            toast.success("导出格式已更新", { description: `当前格式：${v.toUpperCase()}` });
        } catch (e) {
            toast.error("导出格式设置失败", { description: String(e) });
        }
    };
    return (
        <Card>
            <CardHeader>
                <CardTitle>导出格式</CardTitle>
                <CardDescription>选择数据导出的文件格式。</CardDescription>
            </CardHeader>
            <CardContent>
                <Select value={tempFormat} onValueChange={handleChange}>
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder="导出格式" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="xlsx">Excel (xlsx)</SelectItem>
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );
} 