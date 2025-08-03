import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { useFont } from '@/contexts/FontContext';
import { FontConfig, defaultFontConfig } from '@/lib/fontUtils';
import { EnhancedMixedText } from './EnhancedMixedText';

export function FontSettings() {
    const { fontConfig, updateFontConfig, resetFontConfig } = useFont();
    const [localConfig, setLocalConfig] = React.useState<FontConfig>(fontConfig);

    const handleSave = () => {
        updateFontConfig(localConfig);
    };

    const handleReset = () => {
        setLocalConfig(defaultFontConfig);
        resetFontConfig();
    };

    const handleInputChange = (field: keyof FontConfig, value: string) => {
        setLocalConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>
                    <EnhancedMixedText text="字体设置" />
                </CardTitle>
                <CardDescription>
                    <EnhancedMixedText text="自定义中英文字体显示" />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="chinese-font">
                        <EnhancedMixedText text="中文字体" />
                    </Label>
                    <Input
                        id="chinese-font"
                        value={localConfig.chineseFont}
                        onChange={(e) => handleInputChange('chineseFont', e.target.value)}
                        placeholder="思源宋体"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="english-font">
                        <EnhancedMixedText text="英文字体" />
                    </Label>
                    <Input
                        id="english-font"
                        value={localConfig.englishFont}
                        onChange={(e) => handleInputChange('englishFont', e.target.value)}
                        placeholder="Times New Roman"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="fallback-font">
                        <EnhancedMixedText text="备用字体" />
                    </Label>
                    <Input
                        id="fallback-font"
                        value={localConfig.fallbackFont}
                        onChange={(e) => handleInputChange('fallbackFont', e.target.value)}
                        placeholder="serif"
                    />
                </div>

                <div className="space-y-2">
                    <Label>
                        <EnhancedMixedText text="预览效果" />
                    </Label>
                    <div className="p-3 border rounded-md bg-muted/50 space-y-2">
                        <div>
                            <EnhancedMixedText text="中文示例：这是一段中文文字" />
                        </div>
                        <div>
                            <EnhancedMixedText text="English Example: This is English text" />
                        </div>
                        <div>
                            <EnhancedMixedText text="混合示例：中文 English 混合 123" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1">
                        <EnhancedMixedText text="保存设置" />
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                        <EnhancedMixedText text="重置" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
} 