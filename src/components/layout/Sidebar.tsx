import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { BarChart2, BookOpen, ClipboardList, Target, Settings, PieChart, LineChart, Trophy, Plus, History, Calendar, FileText, BookMarked, PenTool, BookCopy, NotebookPen, ListTodo, GalleryVerticalEnd, ChartSpline, AlarmClockCheck, ChevronRight, ChevronsUpDown, ChartLine, BookOpenText, FileText as FileTextIcon, FileEdit, Brain } from "lucide-react";
import { MixedText } from "@/components/ui/MixedText";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
    Sidebar as AnimateSidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarMenuAction,
} from '@/components/animate-ui/components/radix/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-with-animation';
import { useSidebar } from '@/components/animate-ui/components/radix/sidebar';
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

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

// 导航数据配置
const NAV_DATA = {
    navMain: [
        {
            title: '数据可视化',
            icon: ChartLine,
            isActive: false,
            items: [
                {
                    title: '成绩概览',
                    url: '#',
                    tab: 'overview',
                    icon: PieChart,
                },
                {
                    title: '数据图表',
                    url: '#',
                    tab: 'charts',
                    icon: LineChart,
                },
                {
                    title: 'AI分析',
                    url: '#',
                    tab: 'ai-analysis',
                    icon: Brain,
                },
                {
                    title: '最佳成绩',
                    url: '#',
                    tab: 'personal-best',
                    icon: Trophy,
                },
            ],
        },
        {
            title: '记录管理',
            icon: PenTool,
            isActive: false,
            items: [
                {
                    title: '刷题记录',
                    url: '#',
                    tab: 'history',
                    icon: History,
                },
            ],
        },
        {
            title: '制定计划',
            icon: ChartLine,
            isActive: false,
            items: [
                {
                    title: '学习计划',
                    url: '#',
                    tab: 'plan-list',
                    icon: ListTodo,
                },
                {
                    title: '倒计时',
                    url: '#',
                    tab: 'countdown',
                    icon: AlarmClockCheck,
                },
                {
                    title: '日程管理',
                    url: '#',
                    tab: 'calendar',
                    icon: Calendar,
                },
            ],
        },
        {
            title: '知识点管理',
            icon: BookOpenText,
            isActive: false,
            items: [
                {
                    title: '知识点录入',
                    url: '#',
                    tab: 'knowledge-entry',
                    icon: PenTool,
                },
                {
                    title: '知识点汇总',
                    url: '#',
                    tab: 'knowledge-summary',
                    icon: BookMarked,
                },
            ],
        },
        {
            title: '笔记管理',
            icon: FileTextIcon,
            isActive: false,
            items: [
                {
                    title: '我的笔记',
                    url: '#',
                    tab: 'notes',
                    icon: FileEdit,
                },
            ],
        },
    ],
};

export function Sidebar({ activeTab, setActiveTab, userInfo }: SidebarProps) {
    const { theme } = useTheme();
    const { state } = useSidebar();
    // 默认展开所有项目
    const [openItems, setOpenItems] = React.useState<Set<string>>(
        new Set(NAV_DATA.navMain.map(item => item.title))
    );

    // 检查侧边栏是否收起
    const isCollapsed = state === 'collapsed';

    // 处理菜单项点击
    const handleMenuClick = (tab: string) => {
        setActiveTab(tab);
    };

    // 处理折叠项点击
    const handleCollapsibleClick = (itemTitle: string) => {
        setOpenItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemTitle)) {
                newSet.delete(itemTitle);
            } else {
                newSet.add(itemTitle);
            }
            return newSet;
        });
    };

    return (
        <AnimateSidebar collapsible="icon">
            <SidebarHeader>
                {/* 应用标题 */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-center gap-3 px-2 py-4 unselectable">
                            <Image src="/trace.svg" alt="App Icon" className="size-8" width={32} height={32} />
                            <span className="truncate font-semibold text-lg leading-none">
                                <MixedText text="行测记录" />
                            </span>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* 主导航菜单 */}
                <SidebarGroup>
                    <SidebarGroupLabel></SidebarGroupLabel>
                    <SidebarMenu>
                        {NAV_DATA.navMain.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    tooltip={item.title}
                                    onClick={() => handleCollapsibleClick(item.title)}
                                    className="unselectable"
                                >
                                    {item.icon && <item.icon />}
                                    <span><MixedText text={item.title} /></span>
                                    <ChevronRight className={`ml-auto transition-transform duration-300 group-data-[collapsible=icon]:!hidden ${openItems.has(item.title) ? 'rotate-90' : ''}`} />
                                </SidebarMenuButton>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openItems.has(item.title)
                                        ? 'max-h-96 opacity-100'
                                        : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <SidebarMenuSub>
                                        {item.items?.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={activeTab === subItem.tab}
                                                    className="data-[state=open]:bg-[#EEEDED] dark:data-[state=open]:bg-muted unselectable font-medium"
                                                >
                                                    <button
                                                        onClick={() => handleMenuClick(subItem.tab || '')}
                                                        className="w-full text-left unselectable font-medium"
                                                    >
                                                        <span><MixedText text={subItem.title} /></span>
                                                    </button>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </div>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                {/* 用户信息区域 */}
                {userInfo}
            </SidebarFooter>
            <SidebarRail />
        </AnimateSidebar>
    );
}