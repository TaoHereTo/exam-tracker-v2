import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function PaginationSetting({ pageSize, setPageSize, onSave }: { pageSize: number; setPageSize: (n: number) => void; onSave: () => void }) {
    const [tempSize, setTempSize] = useState(pageSize.toString());
    return (
        <Card>
            <CardHeader>
                <CardTitle>分页设置</CardTitle>
                <CardDescription>设置历史记录每页显示的条数。</CardDescription>
            </CardHeader>
            <CardContent>
                <Select value={tempSize} onValueChange={setTempSize}>
                    <SelectTrigger className="w-32">
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
            <CardFooter>
                <Button onClick={() => { setPageSize(Number(tempSize)); onSave(); }}>保存</Button>
            </CardFooter>
        </Card>
    );
} 