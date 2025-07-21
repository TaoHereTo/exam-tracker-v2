import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import * as React from "react";

export function AdvancedSetting({ onExport }: { onExport?: () => void }) {
    // 已彻底移除自动备份相关内容

    // 新功能1：实验性夜间护眼模式（仅切换背景色）
    const [eyeCare, setEyeCare] = React.useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('eye-care-enabled') === 'true';
        }
        return false;
    });
    React.useEffect(() => {
        localStorage.setItem('eye-care-enabled', eyeCare ? 'true' : 'false');
        if (eyeCare) {
            document.body.style.filter = 'sepia(0.15) brightness(0.95)';
        } else {
            document.body.style.filter = '';
        }
    }, [eyeCare]);

    // 新功能2：实验性数据变动提醒
    const [notifyChange, setNotifyChange] = React.useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('notify-change-enabled') === 'true';
        }
        return false;
    });
    React.useEffect(() => {
        localStorage.setItem('notify-change-enabled', notifyChange ? 'true' : 'false');
    }, [notifyChange]);

    return (
        <Card>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium">夜间护眼模式 <span className="text-xs text-muted-foreground">实验性</span></div>
                        <div className="text-sm text-muted-foreground">开启后页面整体色调更柔和，适合夜间使用。</div>
                    </div>
                    <Switch checked={eyeCare} onCheckedChange={setEyeCare} />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium">数据变动提醒 <span className="text-xs text-muted-foreground">实验性</span></div>
                        <div className="text-sm text-muted-foreground">开启后，数据有变动时会弹出提示（仅部分功能支持）。</div>
                    </div>
                    <Switch checked={notifyChange} onCheckedChange={setNotifyChange} />
                </div>
            </CardContent>
        </Card>
    );
} 