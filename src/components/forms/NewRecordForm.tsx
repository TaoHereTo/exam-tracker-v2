import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function NewRecordForm() {
    // 这里只做静态界面，不处理交互
    const [date, setDate] = React.useState<Date | undefined>(undefined);
    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>新的做题记录</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 日期选择器 */}
                <div className="flex flex-col gap-2">
                    <Label>日期</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                {date ? date.toLocaleDateString() : <span className="text-muted-foreground">选择日期</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                {/* 模块选择器 */}
                <div className="flex flex-col gap-2">
                    <Label>模块</Label>
                    <Select>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="请选择模块" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="政治理论">政治理论</SelectItem>
                            <SelectItem value="常识判断">常识判断</SelectItem>
                            <SelectItem value="判断推理">判断推理</SelectItem>
                            <SelectItem value="言语理解">言语理解</SelectItem>
                            <SelectItem value="数量关系">数量关系</SelectItem>
                            <SelectItem value="资料分析">资料分析</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* 正确数和总题数 */}
                <div className="flex gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                        <Label>正确数</Label>
                        <Input type="number" placeholder="请输入正确数" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                        <Label>总题数</Label>
                        <Input type="number" placeholder="请输入总题数" />
                    </div>
                </div>
                {/* 考试时长 */}
                <div className="flex flex-col gap-2">
                    <Label>考试时长</Label>
                    <Input type="text" placeholder="例如: 26:15" />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full">保存记录</Button>
            </CardFooter>
        </Card>
    );
} 