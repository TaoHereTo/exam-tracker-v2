import React from "react";
import Image from "next/image";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BarChart2, BookOpen, ClipboardList, Target, ChevronRight } from "lucide-react";
import { MixedText } from "@/components/ui/MixedText";

// 定义 Sidebar 组件的 props 类型
type SidebarProps = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    userInfo?: React.ReactNode;
};

export function Sidebar({ activeTab, setActiveTab, userInfo }: SidebarProps) {
    return (
        <aside className="w-52 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center">
            <h1 className="text-xl font-bold mb-6 tracking-wide text-gray-800 dark:text-gray-100 w-full flex items-center justify-start gap-1 pl-2">
                <Image src="/icon.png" alt="应用图标" width={40} height={40} className="w-10 h-10" />
                <MixedText text="行测记录" />
            </h1>
            {/* 使用 Accordion 替换自定义 Collapsible */}
            <Accordion type="single" collapsible defaultValue="analysis" className="w-full">
                {/* 分析分组 */}
                <AccordionItem value="analysis">
                    <AccordionTrigger className="sidebar-parent w-full flex items-center text-left font-bold group">
                        <BarChart2 className="inline-block mr-2 size-5 text-primary flex-shrink-0" />
                        <span className="truncate flex-1"><MixedText text="可视化" /></span>
                        <ChevronRight className="ml-2 h-4 w-4 sidebar-chevron" aria-hidden="true" />
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'overview' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left"
                            onClick={() => setActiveTab('overview')}
                        >
                            <span className="truncate"><MixedText text="数据概览" /></span>
                        </Button>
                        <Button
                            variant={activeTab === 'charts' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left"
                            onClick={() => setActiveTab('charts')}
                        >
                            <span className="truncate"><MixedText text="数据图表" /></span>
                        </Button>
                        <Button
                            variant={activeTab === 'personal-best' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left"
                            onClick={() => setActiveTab('personal-best')}
                        >
                            <span className="truncate"><MixedText text="最佳成绩" /></span>
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 管理分组 */}
                <AccordionItem value="management">
                    <AccordionTrigger className="sidebar-parent w-full flex items-center text-left font-bold group">
                        <ClipboardList className="inline-block mr-2 size-5 text-primary flex-shrink-0" />
                        <span className="truncate flex-1"><MixedText text="记录管理" /></span>
                        <ChevronRight className="ml-2 h-4 w-4 sidebar-chevron" aria-hidden="true" />
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'form' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left"
                            onClick={() => setActiveTab('form')}
                        >
                            <span className="truncate"><MixedText text="新的记录" /></span>
                        </Button>
                        <Button
                            variant={activeTab === 'history' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left"
                            onClick={() => setActiveTab('history')}
                        >
                            <span className="truncate"><MixedText text="刷题记录" /></span>
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 学习计划分组 */}
                <AccordionItem value="study-plan">
                    <AccordionTrigger className="sidebar-parent w-full flex items-center text-left font-bold group">
                        <Target className="inline-block mr-2 size-5 text-primary flex-shrink-0" />
                        <span className="truncate flex-1"><MixedText text="学习计划" /></span>
                        <ChevronRight className="ml-2 h-4 w-4 sidebar-chevron" aria-hidden="true" />
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'plan-list' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left"
                            onClick={() => setActiveTab('plan-list')}
                        >
                            <span className="truncate"><MixedText text="制定计划" /></span>
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 知识点录入分组 */}
                <AccordionItem value="knowledge-entry">
                    <AccordionTrigger className="sidebar-parent w-full flex items-center text-left font-bold group">
                        <BookOpen className="inline-block mr-2 size-5 text-primary flex-shrink-0" />
                        <span className="truncate flex-1"><MixedText text="知识点录入" /></span>
                        <ChevronRight className="ml-2 h-4 w-4 sidebar-chevron" aria-hidden="true" />
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'knowledge-entry' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left"
                            onClick={() => setActiveTab('knowledge-entry')}
                        >
                            <span className="truncate"><MixedText text="知识点录入" /></span>
                        </Button>
                        <Button
                            variant={activeTab === 'knowledge-summary' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left"
                            onClick={() => setActiveTab('knowledge-summary')}
                        >
                            <span className="truncate"><MixedText text="知识点汇总" /></span>
                        </Button>
                    </AccordionContent>
                </AccordionItem>


            </Accordion>

            {/* 用户信息区域 */}
            {userInfo && (
                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 w-full">
                    {userInfo}
                </div>
            )}
        </aside>
    );
} 