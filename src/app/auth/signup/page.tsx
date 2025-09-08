"use client";

import React from "react";
import { StepperSignUpForm } from "@/components/auth/StepperSignUpForm";
import { MagicCard } from "@/components/magicui/magic-card";
import { BentoGrid, BentoCard } from "@/components/magicui/bento-grid";
import { useThemeMode } from "@/hooks/useThemeMode";
import Link from "next/link";
import Image from "next/image";
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";
import { useRouter } from "next/navigation";
import { BarChart3, BookOpen, Calendar as CalendarIcon, BookCopy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/TimePicker";
import { UnifiedTable } from "@/components/ui/UnifiedTable";
import { ModulePieChart } from "@/components/ui/ModulePieChart";
import { zhCN } from "date-fns/locale";

export default function SignUpPage() {
  const { getBackgroundStyle } = useThemeMode();
  const router = useRouter();

  const handleSwitchToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative" style={getBackgroundStyle() as React.CSSProperties}>
      {/* 顶部右侧应用图标和主题切换器 */}
      <div className="absolute right-4 top-4 z-[50] inline-flex items-center gap-3">
        <Link href="/" className="inline-flex items-center gap-3">
          <Image src="/trace.svg" alt="App Icon" className="h-10 w-10 sm:h-12 sm:w-12" width={48} height={48} />
          <span className="hidden sm:inline text-lg sm:text-xl font-semibold text-foreground/90">行测每日记录</span>
        </Link>
        <AnimatedThemeToggler className="w-10 h-10" />
      </div>

      {/* 左侧功能展示 - 交换位置 */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 order-2 lg:order-1">
        <div className="w-full max-w-4xl">
          <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-4">
            <BentoCard
              name="刷题记录"
              className="col-span-1 md:col-span-2"
              background={
                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-lg bg-background/50">
                  <div className="absolute left-25 top-7 w-full origin-top-left scale-100 rounded-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                    <Card className="p-4 w-full max-w-[70%]">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">模块</Label>
                          <Select defaultValue="data-analysis">
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="选择模块" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="data-analysis" className="text-sm">资料分析</SelectItem>
                              <SelectItem value="verbal" className="text-sm">言语理解</SelectItem>
                              <SelectItem value="logic" className="text-sm">判断推理</SelectItem>
                              <SelectItem value="math" className="text-sm">数量关系</SelectItem>
                              <SelectItem value="politics" className="text-sm">政治理论</SelectItem>
                              <SelectItem value="common-sense" className="text-sm">常识判断</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">日期</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="w-full flex items-center justify-start text-left font-normal border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-md h-9 bg-white dark:bg-[#303030] mt-1"
                                style={{
                                  transition: 'none',
                                  transform: 'none',
                                  boxShadow: 'none'
                                }}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                <span className="text-muted-foreground text-sm">选择日期</span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                captionLayout="dropdown"
                                selected={new Date()}
                                onSelect={() => { }}
                                initialFocus={false}
                                locale={zhCN}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">总题数</Label>
                            <Input type="number" className="h-9 text-sm" defaultValue="20" />
                          </div>
                          <div>
                            <Label className="text-sm">正确数</Label>
                            <Input type="number" className="h-9 text-sm" defaultValue="18" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">做题时长</Label>
                          <TimePicker
                            value=""
                            placeholder="选择时长"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="pt-2">
                          <Button className="w-full h-9 text-sm">添加记录</Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              }
              Icon={BookCopy}
              description="快速录入和管理刷题记录"
              cta="开始记录"
              titleClassName="text-yellow-600 dark:text-yellow-400"
              descriptionClassName="text-yellow-500/80 dark:text-yellow-300/80"
              iconClassName="text-yellow-600 dark:text-yellow-400"
              onCtaClick={() => {}}
            />
            <BentoCard
              name="学习计划"
              className="col-span-1"
              background={
                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-lg bg-background/50">
                  <div className="absolute left-10 top-10 w-full h-full origin-top-left scale-110 rounded-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                    <div className="flex-1 space-y-3 w-full max-w-[100%]">
                      <Card className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium truncate">资料分析专项训练</span>
                          <span className="text-xs text-muted-foreground">65/100</span>
                        </div>
                        <Progress value={65} className="h-2.5" />
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-muted-foreground">资料分析</span>
                          <span className="text-xs text-green-500">进行中</span>
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium truncate">言语理解提升计划</span>
                          <span className="text-xs text-muted-foreground">15/50</span>
                        </div>
                        <Progress value={30} className="h-2.5" />
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-muted-foreground">言语理解</span>
                          <span className="text-xs text-green-500">进行中</span>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              }
              Icon={CalendarIcon}
              description="制定个性化学习计划"
              cta="制定计划"
              titleClassName="text-orange-600 dark:text-orange-400"
              descriptionClassName="text-orange-500/80 dark:text-orange-300/80"
              iconClassName="text-orange-600 dark:text-orange-400"
              onCtaClick={() => {}}
            />
            <BentoCard
              name="数据可视化"
              className="col-span-1"
              background={
                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-md bg-background/40 dark:bg-background/30">
                  <div className="absolute left-0 top-0 w-full h-full origin-top-left scale-110 rounded-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                    <div className="w-full h-64 relative bg-white/50 dark:bg-[#1E1E1F] backdrop-blur-md rounded-lg p-4">
                      <ModulePieChart
                        data={[
                          { date: '2023-01-01', module: '资料分析', score: 1.5, duration: 25 },
                          { date: '2023-01-02', module: '政治理论', score: 1.2, duration: 30 },
                          { date: '2023-01-03', module: '数量关系', score: 1.8, duration: 20 },
                          { date: '2023-01-04', module: '常识判断', score: 1.6, duration: 28 },
                          { date: '2023-01-05', module: '言语理解', score: 1.3, duration: 32 },
                          { date: '2023-01-06', module: '判断推理', score: 1.7, duration: 22 },
                          { date: '2023-01-07', module: '资料分析', score: 1.4, duration: 26 },
                          { date: '2023-01-08', module: '政治理论', score: 1.1, duration: 31 },
                          { date: '2023-01-09', module: '数量关系', score: 1.9, duration: 19 },
                          { date: '2023-01-10', module: '常识判断', score: 1.5, duration: 29 },
                          { date: '2023-01-11', module: '言语理解', score: 1.4, duration: 33 },
                          { date: '2023-01-12', module: '判断推理', score: 1.6, duration: 23 }
                        ]}
                        showLegend={false}
                      />
                    </div>
                  </div>
                </div>
              }
              Icon={BarChart3}
              description="直观的图表展示学习进度和成绩趋势"
              cta="了解更多"
              titleClassName="text-blue-600 dark:text-blue-400"
              descriptionClassName="text-blue-500/80 dark:text-blue-300/80"
              iconClassName="text-blue-600 dark:text-blue-400"
              onCtaClick={() => {}}
            />
            <BentoCard
              name="知识点录入"
              className="col-span-1 md:col-span-2"
              background={
                <div className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backdrop-blur-md bg-background/40 dark:bg-background/30">
                  <div className="absolute left-10 top-10 w-full h-full origin-top-left scale-110 rounded-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                    <div className="flex-1 overflow-hidden w-full max-w-[90%] bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-md border border-white/40 dark:border-white/30 rounded-lg p-2">
                      <UnifiedTable
                        columns={[
                          { key: 'module', label: '模块', className: 'w-24 text-xs' },
                          { key: 'type', label: '类型', className: 'w-28 text-xs' },
                          { key: 'note', label: '笔记', className: 'w-48 text-xs' },
                        ]}
                        data={[
                          { id: '1', module: '资料分析', type: '计算技巧', note: '快速计算百分比变化的方法' },
                          { id: '2', module: '言语理解', type: '成语积累', note: '望洋兴叹：比喻做事时因力不胜任或没有条件而感到无可奈何' },
                          { id: '3', module: '判断推理', type: '图形推理', note: '对称轴旋转规律' },
                          { id: '4', module: '数量关系', type: '数学公式', note: '等差数列求和公式：Sn=n(a1+an)/2' },
                          { id: '5', module: '政治理论', type: '重要会议', note: '十九大报告提出的新时代中国特色社会主义思想' },
                          { id: '6', module: '常识判断', type: '历史知识', note: '中国四大发明：造纸术、指南针、火药、印刷术' },
                        ]}
                        selected={[]}
                        onSelect={() => { }}
                        rowKey={(row) => row.id}
                        selectable={false}
                        className="text-xs bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              }
              Icon={BookOpen}
              description="便捷录入和整理知识点"
              cta="开始使用"
              titleClassName="text-green-600 dark:text-green-400"
              descriptionClassName="text-green-500/80 dark:text-green-300/80"
              iconClassName="text-green-600 dark:text-green-400"
              onCtaClick={() => {}}
            />
          </BentoGrid>
        </div>
      </div>

      {/* 右侧注册表单 - 交换位置 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 order-1 lg:order-2 relative z-30">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
          <div className="space-y-4">
            <MagicCard
              className="rounded-xl w-full overflow-hidden relative z-20"
              gradientSize={240}
              gradientColor="rgba(0, 0, 0, 0.08)"
              gradientOpacity={0.5}
            >
              <div className="w-full p-6 sm:p-8 relative z-10">
                <StepperSignUpForm onSwitchToLogin={handleSwitchToLogin} />
              </div>
            </MagicCard>
          </div>
        </div>
      </div>
    </div>
  );
}
