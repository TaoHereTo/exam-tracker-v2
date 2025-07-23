import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

export function AppearanceSetting() {
    const { theme, setTheme } = useTheme();
    // 新增：侧边栏/底部Dock切换
    const [navMode, setNavMode] = useLocalStorageState<'sidebar' | 'dock'>("exam-tracker-nav-mode", "sidebar");
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
                {/* 新增：导航模式切换 */}
                <div className="flex items-center gap-4 mt-6">
                    <span className="text-sm text-muted-foreground">导航模式：</span>
                    <span className="text-sm font-medium">侧边栏</span>
                    <Switch
                        checked={navMode === 'dock'}
                        onCheckedChange={checked => setNavMode(checked ? 'dock' : 'sidebar')}
                        id="nav-mode-switch"
                    />
                    <span className="text-sm font-medium">底部Dock</span>
                </div>
            </CardContent>
        </Card>
    );
} 