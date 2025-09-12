import React from "react";
import Image from "next/image";
import { BarChart2, BookOpen, ClipboardList, Target, Settings, PieChart, LineChart, Trophy, Plus, History, Calendar, FileText, BookMarked, PenTool, BookCopy, NotebookPen, ListTodo, GalleryVerticalEnd, ChartSpline, AlarmClockCheck } from "lucide-react";
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
import { useSidebar } from "@/components/ui/sidebar";

// 定义 Sidebar 组件的 props 类型
type SidebarProps = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    userInfo?: React.ReactNode;
};

// 创建一个包装器组件来处理菜单点击事件
function SidebarMenuItemWrapper({ children, onNavigate }: { children: React.ReactNode; onNavigate: () => void }) {
    const { isMobile, setOpenMobile } = useSidebar();

    // 创建一个新的点击处理函数
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();

        // 执行导航操作
        onNavigate();

        // 如果是移动端，自动关闭侧边栏
        if (isMobile) {
            setTimeout(() => {
                setOpenMobile(false);
            }, 100); // 稍微延迟关闭，确保导航已经完成
        }
    };

    // 克隆子元素并替换 onClick 处理函数
    if (React.isValidElement(children)) {
        return React.cloneElement(children, {
            onClick: handleClick
        } as React.Attributes & { onClick: (e: React.MouseEvent) => void });
    }

    return children;
}

export function Sidebar({ activeTab, setActiveTab, userInfo }: SidebarProps) {
    return (
        <SidebarUI collapsible="icon" className="group" data-side="left">
            <SidebarHeader className="p-4">
                <div className="flex items-center justify-center px-2 py-3 gap-2">
                    <Image src="/trace.svg" alt="App Icon" className="h-8 w-8 sm:h-9 sm:w-9" width={36} height={36} />
                    <span className="text-lg sm:text-xl font-medium leading-none">
                        <MixedText text="行测记录" />
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent className="gap-0 px-2">
                {/* 可视化分组 */}
                <SidebarGroup className="p-0 pt-1">
                    <SidebarGroupLabel className="text-sm sm:text-base">
                        <MixedText text="可视化" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0">
                            <SidebarMenuItem className="py-0">
                                <SidebarMenuItemWrapper onNavigate={() => setActiveTab('overview')}>
                                    <SidebarMenuButton asChild isActive={activeTab === 'overview'} tooltip="成绩概览" size="sm">
                                        <a href="#">
                                            <GalleryVerticalEnd className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="text-sm sm:text-base"><MixedText text="成绩概览" /></span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItemWrapper>
                            </SidebarMenuItem>
                            <SidebarMenuItem className="py-0">
                                <SidebarMenuItemWrapper onNavigate={() => setActiveTab('charts')}>
                                    <SidebarMenuButton asChild isActive={activeTab === 'charts'} tooltip="数据图表" size="sm">
                                        <a href="#">
                                            <ChartSpline className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="text-sm sm:text-base"><MixedText text="数据图表" /></span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItemWrapper>
                            </SidebarMenuItem>
                            <SidebarMenuItem className="py-0">
                                <SidebarMenuItemWrapper onNavigate={() => setActiveTab('personal-best')}>
                                    <SidebarMenuButton asChild isActive={activeTab === 'personal-best'} tooltip="最佳成绩" size="sm">
                                        <a href="#">
                                            <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="text-sm sm:text-base"><MixedText text="最佳成绩" /></span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItemWrapper>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 记录管理分组 */}
                <SidebarGroup className="p-0 pt-1">
                    <SidebarGroupLabel className="text-sm sm:text-base">
                        <MixedText text="记录管理" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0">
                            <SidebarMenuItem className="py-0">
                                <SidebarMenuItemWrapper onNavigate={() => setActiveTab('form')}>
                                    <SidebarMenuButton asChild isActive={activeTab === 'form'} tooltip="新的记录" size="sm">
                                        <a href="#">
                                            <PenTool className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="text-sm sm:text-base"><MixedText text="新的记录" /></span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItemWrapper>
                            </SidebarMenuItem>
                            <SidebarMenuItem className="py-0">
                                <SidebarMenuItemWrapper onNavigate={() => setActiveTab('history')}>
                                    <SidebarMenuButton asChild isActive={activeTab === 'history'} tooltip="刷题历史" size="sm">
                                        <a href="#">
                                            <BookCopy className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="text-sm sm:text-base"><MixedText text="刷题历史" /></span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItemWrapper>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 学习计划分组 */}
                <SidebarGroup className="p-0 pt-1">
                    <SidebarGroupLabel className="text-sm sm:text-base">
                        <MixedText text="学习计划" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0">
                            <SidebarMenuItem className="py-0">
                                <SidebarMenuItemWrapper onNavigate={() => setActiveTab('plan-list')}>
                                    <SidebarMenuButton asChild isActive={activeTab === 'plan-list'} tooltip="制定计划" size="sm">
                                        <a href="#">
                                            <ListTodo className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="text-sm sm:text-base"><MixedText text="制定计划" /></span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItemWrapper>
                            </SidebarMenuItem>
                            <SidebarMenuItem className="py-0">
                                <SidebarMenuItemWrapper onNavigate={() => setActiveTab('countdown')}>
                                    <SidebarMenuButton asChild isActive={activeTab === 'countdown'} tooltip="考试倒计时" size="sm">
                                        <a href="#">
                                            <AlarmClockCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="text-sm sm:text-base"><MixedText text="考试倒计时" /></span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItemWrapper>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 知识点录入分组 */}
                <SidebarGroup className="p-0 pt-1">
                    <SidebarGroupLabel className="text-sm sm:text-base">
                        <MixedText text="知识点录入" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0">
                            <SidebarMenuItem className="py-0">
                                <SidebarMenuItemWrapper onNavigate={() => setActiveTab('knowledge-entry')}>
                                    <SidebarMenuButton asChild isActive={activeTab === 'knowledge-entry'} tooltip="知识点录入" size="sm">
                                        <a href="#">
                                            <NotebookPen className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="text-sm sm:text-base"><MixedText text="知识点录入" /></span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItemWrapper>
                            </SidebarMenuItem>
                            <SidebarMenuItem className="py-0">
                                <SidebarMenuItemWrapper onNavigate={() => setActiveTab('knowledge-summary')}>
                                    <SidebarMenuButton asChild isActive={activeTab === 'knowledge-summary'} tooltip="知识点汇总" size="sm">
                                        <a href="#">
                                            <BookMarked className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="text-sm sm:text-base"><MixedText text="知识点汇总" /></span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItemWrapper>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* 用户信息区域 */}
            <SidebarFooter>
                {(() => {
                    return (
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="flex items-center gap-3">
                                {userInfo ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{userInfo}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">未登录</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </SidebarFooter>
            <SidebarRail />
        </SidebarUI>
    );
}
