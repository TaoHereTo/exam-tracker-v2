import React from 'react';
import {
    MixedText,
    MixedTitle,
    MixedParagraph,
    MixedLabel,
    MixedButtonText,
    MixedTextContainer
} from './MixedText';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Label } from './label';

export function MixedTextExamples() {
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4">MixedText 组件使用示例</h2>

            {/* 基础 MixedText 使用 */}
            <Card>
                <CardHeader>
                    <CardTitle>基础 MixedText 组件</CardTitle>
                    <CardDescription>直接使用 MixedText 组件处理混合文字</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <MixedText text="这是中文文字" />
                    <MixedText text="This is English text" />
                    <MixedText text="混合文字 Mixed Text 123" />
                </CardContent>
            </Card>

            {/* 标题组件 */}
            <Card>
                <CardHeader>
                    <CardTitle>标题组件</CardTitle>
                    <CardDescription>使用 MixedTitle 组件创建不同级别的标题</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <MixedTitle text="一级标题 H1 Title" level={1} />
                    <MixedTitle text="二级标题 H2 Title" level={2} />
                    <MixedTitle text="三级标题 H3 Title" level={3} />
                </CardContent>
            </Card>

            {/* 段落组件 */}
            <Card>
                <CardHeader>
                    <CardTitle>段落组件</CardTitle>
                    <CardDescription>使用 MixedParagraph 组件处理段落文字</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <MixedParagraph text="这是一个包含中英文混合的段落。This is a paragraph with mixed Chinese and English text. 数字 123 也会正确显示。" />
                    <MixedParagraph text="另一个段落 Another paragraph with different content." />
                </CardContent>
            </Card>

            {/* 标签组件 */}
            <Card>
                <CardHeader>
                    <CardTitle>标签组件</CardTitle>
                    <CardDescription>使用 MixedLabel 组件处理标签文字</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <MixedLabel text="用户名 Username" />
                    <MixedLabel text="密码 Password" />
                    <MixedLabel text="邮箱 Email" />
                </CardContent>
            </Card>

            {/* 按钮文字组件 */}
            <Card>
                <CardHeader>
                    <CardTitle>按钮文字组件</CardTitle>
                    <CardDescription>使用 MixedButtonText 组件处理按钮文字</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <MixedButtonText text="保存 Save" />
                    <MixedButtonText text="取消 Cancel" />
                    <MixedButtonText text="确认 Confirm" />
                </CardContent>
            </Card>

            {/* 通用容器组件 */}
            <Card>
                <CardHeader>
                    <CardTitle>通用容器组件</CardTitle>
                    <CardDescription>使用 MixedTextContainer 组件包装任何元素</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <MixedTextContainer as="div" className="text-lg">
                        这是一个 div 容器中的混合文字 Mixed text in div container
                    </MixedTextContainer>
                    <MixedTextContainer as="p" className="text-sm text-gray-600">
                        这是一个 p 标签中的混合文字 Mixed text in p tag
                    </MixedTextContainer>
                </CardContent>
            </Card>

            {/* 集成到现有组件 */}
            <Card>
                <CardHeader>
                    <CardTitle>集成到现有组件</CardTitle>
                    <CardDescription>Button 和 Label 组件已自动支持 MixedText</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>用户名 Username</Label>
                        <input type="text" className="w-full p-2 border rounded" />
                    </div>
                    <div className="space-x-2">
                        <Button>保存 Save</Button>
                        <Button variant="outline">取消 Cancel</Button>
                    </div>
                </CardContent>
            </Card>

            {/* 复杂示例 */}
            <Card>
                <CardHeader>
                    <CardTitle>复杂示例</CardTitle>
                    <CardDescription>展示在实际应用中的使用效果</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <MixedTitle text="考试跟踪器 Exam Tracker" level={1} />
                        <MixedParagraph text="这是一个用于跟踪考试进度和成绩的应用程序。This is an application for tracking exam progress and scores. 支持多种考试类型 Support for multiple exam types." />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <MixedLabel text="考试名称 Exam Name" />
                                <input type="text" className="w-full p-2 border rounded mt-1" />
                            </div>
                            <div>
                                <MixedLabel text="考试日期 Exam Date" />
                                <input type="date" className="w-full p-2 border rounded mt-1" />
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <Button>添加考试 Add Exam</Button>
                            <Button variant="outline">查看历史 View History</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 