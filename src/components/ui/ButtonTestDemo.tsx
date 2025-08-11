import React from 'react';
import { Button } from './button';
import { CapsuleButton } from './CapsuleButton';
import { RainbowButton } from '../magicui/rainbow-button';
import { InteractiveHoverButton } from '../magicui/interactive-hover-button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { MixedText } from './MixedText';

export function ButtonTestDemo() {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-6">按钮按下效果测试</h1>

            {/* 普通Button组件测试 */}
            <Card>
                <CardHeader>
                    <CardTitle>普通Button组件</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <Button variant="default">
                            <MixedText text="默认保存" />
                        </Button>
                        <Button variant="outline">
                            <MixedText text="轮廓保存" />
                        </Button>
                        <Button variant="secondary">
                            <MixedText text="次要保存" />
                        </Button>
                        <Button variant="destructive">
                            <MixedText text="删除" />
                        </Button>
                        <Button variant="ghost">
                            <MixedText text="幽灵保存" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* CapsuleButton组件测试 */}
            <Card>
                <CardHeader>
                    <CardTitle>CapsuleButton组件</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <CapsuleButton variant="default">
                            <MixedText text="胶囊保存" />
                        </CapsuleButton>
                        <CapsuleButton variant="outline">
                            <MixedText text="胶囊轮廓" />
                        </CapsuleButton>
                        <CapsuleButton variant="secondary">
                            <MixedText text="胶囊次要" />
                        </CapsuleButton>
                        <CapsuleButton variant="destructive">
                            <MixedText text="胶囊删除" />
                        </CapsuleButton>
                    </div>
                </CardContent>
            </Card>

            {/* RainbowButton组件测试 */}
            <Card>
                <CardHeader>
                    <CardTitle>RainbowButton组件</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <RainbowButton variant="default">
                            <MixedText text="彩虹保存" />
                        </RainbowButton>
                        <RainbowButton variant="outline">
                            <MixedText text="彩虹轮廓" />
                        </RainbowButton>
                    </div>
                </CardContent>
            </Card>

            {/* InteractiveHoverButton组件测试 */}
            <Card>
                <CardHeader>
                    <CardTitle>InteractiveHoverButton组件</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <InteractiveHoverButton>
                            <MixedText text="交互保存" />
                        </InteractiveHoverButton>
                        <InteractiveHoverButton hoverColor="#EF4444">
                            <MixedText text="红色删除" />
                        </InteractiveHoverButton>
                        <InteractiveHoverButton hoverColor="#10B981">
                            <MixedText text="绿色确认" />
                        </InteractiveHoverButton>
                    </div>
                </CardContent>
            </Card>

            {/* 不同尺寸测试 */}
            <Card>
                <CardHeader>
                    <CardTitle>不同尺寸测试</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Button size="sm">
                            <MixedText text="小按钮" />
                        </Button>
                        <Button size="default">
                            <MixedText text="默认按钮" />
                        </Button>
                        <Button size="lg">
                            <MixedText text="大按钮" />
                        </Button>
                        <CapsuleButton size="sm">
                            <MixedText text="小胶囊" />
                        </CapsuleButton>
                        <CapsuleButton size="default">
                            <MixedText text="默认胶囊" />
                        </CapsuleButton>
                        <CapsuleButton size="lg">
                            <MixedText text="大胶囊" />
                        </CapsuleButton>
                    </div>
                </CardContent>
            </Card>

            {/* 说明文字 */}
            <Card>
                <CardHeader>
                    <CardTitle>按下效果说明</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• 所有按钮现在都有明显的按下效果</p>
                        <p>• 按下时会缩小到95%并向下移动0.5px</p>
                        <p>• 添加了内阴影效果增强视觉反馈</p>
                        <p>• 背景色会在按下时变深</p>
                        <p>• 过渡动画更加流畅自然</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
