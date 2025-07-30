import React from "react";
import Image from "next/image";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BarChart2, BookOpen, ClipboardList, Settings, Target } from "lucide-react";

// 定义 Sidebar 组件的 props 类型
type SidebarProps = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
};

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    return (
        <aside className="w-52 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center">
            <h1 className="text-xl font-bold mb-6 text-center tracking-wide text-gray-800 dark:text-gray-100 w-full flex items-center justify-center gap-1">
                <Image src="/icon.png" alt="应用图标" width={40} height={40} className="w-10 h-10" />
                行测记录
            </h1>
            {/* 使用 Accordion 替换自定义 Collapsible */}
            <Accordion type="single" collapsible defaultValue="analysis" className="w-full">
                {/* 分析分组 */}
                <AccordionItem value="analysis">
                    <AccordionTrigger className="sidebar-parent w-full text-left font-bold">
                        <BarChart2 className="inline-block mr-2 size-5 text-primary flex-shrink-0" />
                        <span className="truncate">可视化</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'overview' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left font-bold"
                            onClick={() => setActiveTab('overview')}
                        >
                            <span className="truncate">数据概览</span>
                        </Button>
                        <Button
                            variant={activeTab === 'charts' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left font-bold"
                            onClick={() => setActiveTab('charts')}
                        >
                            <span className="truncate">数据图表</span>
                        </Button>
                        <Button
                            variant={activeTab === 'best' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left font-bold"
                            onClick={() => setActiveTab('best')}
                        >
                            <span className="truncate">最佳成绩</span>
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 管理分组 */}
                <AccordionItem value="management">
                    <AccordionTrigger className="sidebar-parent w-full text-left font-bold">
                        <ClipboardList className="inline-block mr-2 size-5 text-primary flex-shrink-0" />
                        <span className="truncate">记录管理</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'form' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left font-bold"
                            onClick={() => setActiveTab('form')}
                        >
                            <span className="truncate">新的记录</span>
                        </Button>
                        <Button
                            variant={activeTab === 'history' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left font-bold"
                            onClick={() => setActiveTab('history')}
                        >
                            <span className="truncate">历史记录</span>
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 学习计划分组 */}
                <AccordionItem value="study-plan">
                    <AccordionTrigger className="sidebar-parent w-full text-left font-bold">
                        <Target className="inline-block mr-2 size-5 text-primary flex-shrink-0" />
                        <span className="truncate">学习计划</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'plan' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left font-bold"
                            onClick={() => setActiveTab('plan')}
                        >
                            <span className="truncate">制定计划</span>
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 知识点录入分组 */}
                <AccordionItem value="knowledge-entry">
                    <AccordionTrigger className="sidebar-parent w-full text-left font-bold">
                        <BookOpen className="inline-block mr-2 size-5 text-primary flex-shrink-0" />
                        <span className="truncate">知识点录入</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'knowledge-entry' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left font-bold"
                            onClick={() => setActiveTab('knowledge-entry')}
                        >
                            <span className="truncate">知识点录入</span>
                        </Button>
                        <Button
                            variant={activeTab === 'modules' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left font-bold"
                            onClick={() => setActiveTab('modules')}
                        >
                            <span className="truncate">知识点汇总</span>
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 系统设置分组 */}
                <AccordionItem value="settings">
                    <AccordionTrigger className="sidebar-parent w-full text-left font-bold">
                        <Settings className="inline-block mr-2 size-5 text-primary flex-shrink-0" />
                        <span className="truncate">系统设置</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'settings-basic' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left font-bold"
                            onClick={() => setActiveTab('settings-basic')}
                        >
                            <span className="truncate">基础设置</span>
                        </Button>
                        <Button
                            variant={activeTab === 'settings-advanced' ? 'default' : 'ghost'}
                            className="sidebar-child w-full justify-start text-left font-bold"
                            onClick={() => setActiveTab('settings-advanced')}
                        >
                            <span className="truncate">高级设置</span>
                        </Button>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </aside>
    );
} 