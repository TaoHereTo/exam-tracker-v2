import React from "react";
import { BarChart2, BookOpen, ClipboardList, Target, Settings, PieChart, LineChart, Trophy, Plus, History, Calendar, FileText, BookMarked, PenTool, BookCopy, NotebookPen, ListTodo, GalleryVerticalEnd, ChartSpline } from "lucide-react";
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
            <SidebarHeader className="p-4">
                <div className="flex items-center justify-center px-2 py-3">
                    <span className="text-2xl sm:text-3xl font-normal" style={{ fontSize: '24px', fontWeight: '400' }}>
                        <MixedText text="行测记录" />
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent className="gap-0 px-2">
                {/* 可视化分组 */}
                <SidebarGroup className="p-0">
                    <SidebarGroupLabel className="text-sm sm:text-base">
                        <MixedText text="可视化" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'overview'} tooltip="数据概览" className="h-10 sm:h-12">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }}>
                                        <GalleryVerticalEnd className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-sm sm:text-base"><MixedText text="数据概览" /></span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'charts'} tooltip="数据图表" className="h-10 sm:h-12">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('charts'); }}>
                                        <ChartSpline className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-sm sm:text-base"><MixedText text="数据图表" /></span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'personal-best'} tooltip="最佳成绩" className="h-10 sm:h-12">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('personal-best'); }}>
                                        <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-sm sm:text-base"><MixedText text="最佳成绩" /></span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 记录管理分组 */}
                <SidebarGroup className="p-0">
                    <SidebarGroupLabel className="text-sm sm:text-base">
                        <MixedText text="记录管理" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'form'} tooltip="新的记录" className="h-10 sm:h-12">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('form'); }}>
                                        <PenTool className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-sm sm:text-base"><MixedText text="新的记录" /></span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'history'} tooltip="刷题历史" className="h-10 sm:h-12">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('history'); }}>
                                        <BookCopy className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-sm sm:text-base"><MixedText text="刷题历史" /></span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 学习计划分组 */}
                <SidebarGroup className="p-0">
                    <SidebarGroupLabel className="text-sm sm:text-base">
                        <MixedText text="学习计划" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'plan-list'} tooltip="制定计划" className="h-10 sm:h-12">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('plan-list'); }}>
                                        <ListTodo className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-sm sm:text-base"><MixedText text="制定计划" /></span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 知识点录入分组 */}
                <SidebarGroup className="p-0">
                    <SidebarGroupLabel className="text-sm sm:text-base">
                        <MixedText text="知识点录入" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'knowledge-entry'} tooltip="知识点录入" className="h-10 sm:h-12">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('knowledge-entry'); }}>
                                        <NotebookPen className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-sm sm:text-base"><MixedText text="知识点录入" /></span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={activeTab === 'knowledge-summary'} tooltip="知识点汇总" className="h-10 sm:h-12">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('knowledge-summary'); }}>
                                        <BookMarked className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-sm sm:text-base"><MixedText text="知识点汇总" /></span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* 用户信息区域 */}
            {userInfo && (
                <SidebarFooter className="p-4">
                    {userInfo}
                </SidebarFooter>
            )}
            <SidebarRail />
        </SidebarUI>
    );
}