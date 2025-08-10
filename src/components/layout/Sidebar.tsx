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
        <SidebarUI collapsible="icon" className="group/sidebar" data-side="left">
            <SidebarHeader>
                <div className="flex items-center gap-3 px-3 group-data-[collapsible=icon]:group-data-[state=collapsed]:justify-center group-data-[collapsible=icon]:group-data-[state=collapsed]:gap-0 group-data-[collapsible=icon]:group-data-[state=collapsed]:px-0 group-data-[collapsible=icon]:group-data-[state=collapsed]:w-full">
                    <Image src="/icon.png" alt="应用图标" width={40} height={40} className="w-10 h-10" />
                    <span className="text-xl font-bold truncate group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">
                        <MixedText text="行测记录" />
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* 可视化分组 */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <BarChart2 className="w-6 h-6" />
                        <span><MixedText text="可视化" /></span>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'overview'}
                                    onClick={() => setActiveTab('overview')}
                                    tooltip="查看您的刷题统计概览"
                                >
                                    <PieChart className="w-6 h-6" />
                                    <span><MixedText text="数据概览" /></span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'charts'}
                                    onClick={() => setActiveTab('charts')}
                                    tooltip="查看详细的图表分析"
                                >
                                    <LineChart className="w-6 h-6" />
                                    <span><MixedText text="数据图表" /></span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'personal-best'}
                                    onClick={() => setActiveTab('personal-best')}
                                    tooltip="查看您的最佳成绩记录"
                                >
                                    <Trophy className="w-6 h-6" />
                                    <span><MixedText text="最佳成绩" /></span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 记录管理分组 */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <ClipboardList className="w-6 h-6" />
                        <span><MixedText text="记录管理" /></span>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'form'}
                                    onClick={() => setActiveTab('form')}
                                    tooltip="添加新的刷题记录"
                                >
                                    <Plus className="w-6 h-6" />
                                    <span><MixedText text="新的记录" /></span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'history'}
                                    onClick={() => setActiveTab('history')}
                                    tooltip="查看和管理所有刷题记录"
                                >
                                    <History className="w-6 h-6" />
                                    <span><MixedText text="刷题记录" /></span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 学习计划分组 */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <Target className="w-6 h-6" />
                        <span><MixedText text="学习计划" /></span>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'plan-list'}
                                    onClick={() => setActiveTab('plan-list')}
                                    tooltip="制定和管理学习计划"
                                >
                                    <Calendar className="w-6 h-6" />
                                    <span><MixedText text="制定计划" /></span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 知识点录入分组 */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <BookOpen className="w-6 h-6" />
                        <span><MixedText text="知识点录入" /></span>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'knowledge-entry'}
                                    onClick={() => setActiveTab('knowledge-entry')}
                                    tooltip="录入和管理知识点"
                                >
                                    <FileText className="w-6 h-6" />
                                    <span><MixedText text="知识点录入" /></span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'knowledge-summary'}
                                    onClick={() => setActiveTab('knowledge-summary')}
                                    tooltip="查看所有知识点汇总"
                                >
                                    <BookMarked className="w-6 h-6" />
                                    <span><MixedText text="知识点汇总" /></span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* 用户信息区域 */}
            {userInfo && (
                <SidebarFooter>
                    <div className="flex items-center gap-3 group-data-[collapsible=icon]:group-data-[state=collapsed]:justify-center group-data-[collapsible=icon]:group-data-[state=collapsed]:gap-0">
                        {userInfo}
                    </div>
                </SidebarFooter>
            )}
            <SidebarRail />
        </SidebarUI>
    );
} 