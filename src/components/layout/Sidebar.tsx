import React from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

// 定义 Sidebar 组件的 props 类型
type SidebarProps = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
};

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    return (
        <aside className="w-52 min-h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-6 text-center tracking-wide text-gray-800 dark:text-gray-100 w-full">
                行测每日记录
            </h1>
            {/* 使用 Accordion 替换自定义 Collapsible */}
            <Accordion type="single" collapsible defaultValue="analysis" className="w-full">
                {/* 分析分组 */}
                <AccordionItem value="analysis">
                    <AccordionTrigger className="justify-start w-full text-left">可视化</AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'overview' ? 'default' : 'ghost'}
                            className="w-full justify-start sidebar-btn text-left"
                            onClick={() => setActiveTab('overview')}
                        >
                            数据概览
                        </Button>
                        <Button
                            variant={activeTab === 'charts' ? 'default' : 'ghost'}
                            className="w-full justify-start sidebar-btn text-left"
                            onClick={() => setActiveTab('charts')}
                        >
                            数据图表
                        </Button>
                        <Button
                            variant={activeTab === 'best' ? 'default' : 'ghost'}
                            className="w-full justify-start sidebar-btn text-left"
                            onClick={() => setActiveTab('best')}
                        >
                            最佳成绩
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 管理分组 */}
                <AccordionItem value="management">
                    <AccordionTrigger className="justify-start w-full text-left">记录管理</AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'form' ? 'default' : 'ghost'}
                            className="w-full justify-start text-left"
                            onClick={() => setActiveTab('form')}
                        >
                            新的记录
                        </Button>
                        <Button
                            variant={activeTab === 'history' ? 'default' : 'ghost'}
                            className="w-full justify-start text-left"
                            onClick={() => setActiveTab('history')}
                        >
                            历史记录
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 学习计划分组 */}
                <AccordionItem value="study-plan">
                    <AccordionTrigger className="justify-start w-full text-left">学习计划</AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'plan' ? 'default' : 'ghost'}
                            className="w-full justify-start text-left"
                            onClick={() => setActiveTab('plan')}
                        >
                            制定计划
                        </Button>
                        <Button
                            variant={activeTab === 'progress' ? 'default' : 'ghost'}
                            className="w-full justify-start text-left"
                            onClick={() => setActiveTab('progress')}
                        >
                            进度追踪
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 知识点录入分组 */}
                <AccordionItem value="knowledge-entry">
                    <AccordionTrigger className="justify-start w-full text-left">知识点录入</AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'knowledge-entry' ? 'default' : 'ghost'}
                            className="w-full justify-start text-left"
                            onClick={() => setActiveTab('knowledge-entry')}
                        >
                            知识点录入
                        </Button>
                        <Button
                            variant={activeTab === 'modules' ? 'default' : 'ghost'}
                            className="w-full justify-start text-left"
                            onClick={() => setActiveTab('modules')}
                        >
                            知识点汇总
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 系统设置分组 */}
                <AccordionItem value="settings">
                    <AccordionTrigger className="justify-start w-full text-left">系统设置</AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <Button
                            variant={activeTab === 'settings-basic' ? 'default' : 'ghost'}
                            className="w-full justify-start text-left"
                            onClick={() => setActiveTab('settings-basic')}
                        >
                            基础设置
                        </Button>
                        <Button
                            variant={activeTab === 'settings-advanced' ? 'default' : 'ghost'}
                            className="w-full justify-start text-left"
                            onClick={() => setActiveTab('settings-advanced')}
                        >
                            高级设置
                        </Button>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </aside>
    );
} 