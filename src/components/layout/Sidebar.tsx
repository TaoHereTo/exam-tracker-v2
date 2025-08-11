import React from "react";
import Image from "next/image";
import { BarChart2, BookOpen, ClipboardList, Target, Settings, PieChart, LineChart, Trophy, Plus, History, Calendar, FileText, BookMarked } from "lucide-react";
import { MixedText } from "@/components/ui/MixedText";
import {
    Sidebar as SidebarUI,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    SidebarRail,
} from "@/components/ui/sidebar";

// 定义 Sidebar 组件的 props 类型
type SidebarProps = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    userInfo?: React.ReactNode;
};

export function Sidebar({ activeTab, setActiveTab, userInfo }: SidebarProps) {
    return (
        <SidebarUI collapsible="icon" className="group" data-side="left">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <div className="flex items-center gap-3 px-2 py-3 group-data-[collapsible=icon]:group-data-[state=collapsed]:justify-center group-data-[collapsible=icon]:group-data-[state=collapsed]:gap-0 group-data-[collapsible=icon]:group-data-[state=collapsed]:px-0 group-data-[collapsible=icon]:group-data-[state=collapsed]:py-0">
                                <Image
                                    src="/icon.png"
                                    alt="应用图标"
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 flex-shrink-0 group-data-[collapsible=icon]:group-data-[state=collapsed]:w-8 group-data-[collapsible=icon]:group-data-[state=collapsed]:h-8"
                                />
                                <span className="text-xl font-bold group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">
                                    <MixedText text="行测记录" />
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* 可视化分组 */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <MixedText text="可视化" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'overview'} tooltip="数据概览">
                                    <button onClick={() => setActiveTab('overview')}>
                                        <PieChart className="w-6 h-6" />
                                        <span><MixedText text="数据概览" /></span>
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'charts'} tooltip="数据图表">
                                    <button onClick={() => setActiveTab('charts')}>
                                        <LineChart className="w-6 h-6" />
                                        <span><MixedText text="数据图表" /></span>
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'personal-best'} tooltip="最佳成绩">
                                    <button onClick={() => setActiveTab('personal-best')}>
                                        <Trophy className="w-6 h-6" />
                                        <span><MixedText text="最佳成绩" /></span>
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 记录管理分组 */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <MixedText text="记录管理" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'form'} tooltip="新的记录">
                                    <button onClick={() => setActiveTab('form')}>
                                        <Plus className="w-6 h-6" />
                                        <span><MixedText text="新的记录" /></span>
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'history'} tooltip="刷题记录">
                                    <button onClick={() => setActiveTab('history')}>
                                        <History className="w-6 h-6" />
                                        <span><MixedText text="刷题记录" /></span>
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 学习计划分组 */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <MixedText text="学习计划" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'plan-list'} tooltip="制定计划">
                                    <button onClick={() => setActiveTab('plan-list')}>
                                        <Calendar className="w-6 h-6" />
                                        <span><MixedText text="制定计划" /></span>
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 知识点录入分组 */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <MixedText text="知识点录入" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'knowledge-entry'} tooltip="知识点录入">
                                    <button onClick={() => setActiveTab('knowledge-entry')}>
                                        <FileText className="w-6 h-6" />
                                        <span><MixedText text="知识点录入" /></span>
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'knowledge-summary'} tooltip="知识点汇总">
                                    <button onClick={() => setActiveTab('knowledge-summary')}>
                                        <BookMarked className="w-6 h-6" />
                                        <span><MixedText text="知识点汇总" /></span>
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* 用户信息区域 */}
            {userInfo && (
                <SidebarFooter>
                    <div className="flex items-center gap-3 px-2">
                        {userInfo}
                    </div>
                </SidebarFooter>
            )}
            <SidebarRail />
        </SidebarUI>
    );
} 