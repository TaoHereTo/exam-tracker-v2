import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTheme } from "next-themes";

export function AppearanceSetting() {
    const { theme, setTheme } = useTheme();
    return (
        <Card>
            <CardHeader>
                <CardTitle>外观模式</CardTitle>
                <CardDescription>切换浅色、深色或跟随系统。</CardDescription>
            </CardHeader>
            <CardContent>
                <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="选择外观" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="light">浅色模式</SelectItem>
                        <SelectItem value="dark">深色模式</SelectItem>
                        <SelectItem value="system">跟随系统</SelectItem>
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );
} 