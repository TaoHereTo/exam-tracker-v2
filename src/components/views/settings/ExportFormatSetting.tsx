import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";

export function ExportFormatSetting({ exportFormat, setExportFormat }: { exportFormat: string; setExportFormat: (f: string) => void; }) {
    const [tempFormat, setTempFormat] = useState(exportFormat);
    const handleChange = (v: string) => {
        setTempFormat(v);
        try {
            setExportFormat(v);
        } catch (e) {
        }
    };
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg mt-2">
            <div>
                <div className="font-medium mb-1">导出格式</div>
                <div className="text-sm text-muted-foreground mb-2">选择数据导出的文件格式。</div>
            </div>
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
        </div>
    );
} 