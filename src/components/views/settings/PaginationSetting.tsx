import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";
import { useNotification } from "@/components/magicui/NotificationProvider";

export function PaginationSetting({ pageSize, setPageSize }: { pageSize: number; setPageSize: (n: number) => void; }) {
    const [tempSize, setTempSize] = useState(pageSize.toString());
    const { notify } = useNotification();
    const handleChange = (v: string) => {
        setTempSize(v);
        try {
            setPageSize(Number(v));
            notify({ type: "success", message: "分页设置已更新", description: `每页${v}条` });
        } catch (e) {
            notify({ type: "error", message: "分页设置失败", description: String(e) });
        }
    };
    return (
        <Card>
            <CardHeader>
                <CardTitle>分页设置</CardTitle>
                <CardDescription>设置历史记录每页显示的条数。</CardDescription>
            </CardHeader>
            <CardContent>
                <Select value={tempSize} onValueChange={handleChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="每页条数" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">5 条/页</SelectItem>
                        <SelectItem value="10">10 条/页</SelectItem>
                        <SelectItem value="20">20 条/页</SelectItem>
                        <SelectItem value="50">50 条/页</SelectItem>
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );
} 