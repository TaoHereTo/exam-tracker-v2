import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage, useLocalStorageBoolean } from "@/hooks/useLocalStorage";
import { useEffect } from "react";
import { MixedText } from "@/components/ui/MixedText";

export function AppearanceSetting() {
    const { theme, setTheme } = useTheme();
    // 新增：侧边栏/底部Dock切换
    const [navMode, setNavMode] = useLocalStorage<'sidebar' | 'dock'>("exam-tracker-nav-mode", "sidebar");

    // 护眼模式设置
    const [eyeCare, setEyeCare] = useLocalStorageBoolean('eye-care-enabled', false);

    // 护眼模式只在浅色模式下生效
    useEffect(() => {
        localStorage.setItem('eye-care-enabled', eyeCare ? 'true' : 'false');
        if (eyeCare && theme === 'light') {
            document.body.classList.add('eye-care');
        } else {
            document.body.classList.remove('eye-care');
        }
    }, [eyeCare, theme]);

    // 当主题切换时，如果切换到深色模式，自动关闭护眼模式
    useEffect(() => {
        if (theme === 'dark' && eyeCare) {
            setEyeCare(false);
        }
    }, [theme, eyeCare, setEyeCare]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base sm:text-lg"><MixedText text="外观模式" /></CardTitle>
                <CardDescription className="text-xs sm:text-sm"><MixedText text="设置应用的外观和导航方式。" /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
                {/* 深浅色切换设置 */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                    <div className="flex-1">
                        <h3 className="font-medium text-sm sm:text-base"><MixedText text="深浅色切换" /></h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1"><MixedText text="切换浅色、深色或跟随系统。" /></p>
                    </div>
                    <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-full sm:w-[180px] h-8 sm:h-10 text-sm">
                            <SelectValue placeholder="选择外观" className="text-sm" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light" className="text-sm"><MixedText text="浅色模式" /></SelectItem>
                            <SelectItem value="dark" className="text-sm"><MixedText text="深色模式" /></SelectItem>
                            <SelectItem value="system" className="text-sm"><MixedText text="跟随系统" /></SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 护眼模式设置 */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                    <div className="flex-1">
                        <h3 className="font-medium text-sm sm:text-base"><MixedText text="护眼模式" /></h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {theme === 'dark'
                                ? <MixedText text="护眼模式仅在浅色模式下可用，请先切换到浅色模式。" />
                                : <MixedText text="开启后页面整体色调更柔和，减少视觉疲劳。" />
                            }
                        </p>
                    </div>
                    <Switch
                        checked={eyeCare}
                        onCheckedChange={setEyeCare}
                        disabled={theme === 'dark'}
                        className="mt-2 sm:mt-0"
                    />
                </div>

                {/* 导航模式切换 */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                    <div className="flex-1">
                        <h3 className="font-medium text-sm sm:text-base"><MixedText text="导航模式" /></h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1"><MixedText text="选择侧边栏或底部Dock导航方式。" /></p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <span className="text-xs sm:text-sm font-medium"><MixedText text="侧边栏" /></span>
                        <Switch
                            checked={navMode === 'dock'}
                            onCheckedChange={checked => setNavMode(checked ? 'dock' : 'sidebar')}
                        />
                        <span className="text-xs sm:text-sm font-medium"><MixedText text="底部Dock" /></span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 