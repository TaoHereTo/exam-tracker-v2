import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ExportFormatSetting({ exportFormat, setExportFormat, onSave }: { exportFormat: string; setExportFormat: (f: string) => void; onSave: () => void }) {
    const [tempFormat, setTempFormat] = useState(exportFormat);
    return (
        <Card>
            <CardHeader>
                <CardTitle>导出格式</CardTitle>
                <CardDescription>选择数据导出的文件格式。</CardDescription>
            </CardHeader>
            <CardContent>
                <Select value={tempFormat} onValueChange={setTempFormat}>
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
            <CardFooter>
                <Button onClick={() => { setExportFormat(tempFormat); onSave(); }}>保存</Button>
            </CardFooter>
        </Card>
    );
} 