import React from "react";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { BarChart2, PlusSquare, History as HistoryIcon, CalendarCheck, FileEdit, ListChecks } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { MixedText } from "@/components/ui/MixedText";

interface DockNavigationProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    navMode: 'sidebar' | 'dock';
    userInfo?: React.ReactNode;
}

// 精简 Dock：仅保留用户指定的主要入口
const primaryDockItems = [
    { key: 'charts', label: '数据图表', icon: <BarChart2 /> },
    { key: 'form', label: '新增做题记录', icon: <PlusSquare /> },
    { key: 'history', label: '历史做题记录', icon: <HistoryIcon /> },
    { key: 'knowledge-entry', label: '知识点录入', icon: <FileEdit /> },
    { key: 'knowledge-summary', label: '知识点汇总', icon: <ListChecks /> },
    { key: 'plan-list', label: '学习计划', icon: <CalendarCheck /> },
];

// 旧的 dockChildIcons 已废弃

export default function DockNavigation({ activeTab, setActiveTab, navMode, userInfo }: DockNavigationProps) {
    // Dock 母项悬停展开子项弹窗（如后续需要可加）
    // const [dockHover, setDockHover] = useState<string | null>(null);
    // const [dockPos, setDockPos] = useState<{ left: number, width: number } | null>(null);
    // const dockRefs = useRef<Record<string, HTMLDivElement | null>>({});

    if (navMode !== 'dock') return null;
    return (
        <div className="fixed bottom-[70px] left-0 w-full z-50 flex justify-center bg-transparent pointer-events-none">
            <TooltipProvider>
                <Dock>
                    {primaryDockItems.map(child => (
                        <DockIcon key={`dock-primary-${child.key}`}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label={child.label}
                                        onClick={() => setActiveTab(child.key)}
                                        className={
                                            "size-12 rounded-full flex items-center justify-center pointer-events-auto relative transition-all duration-150 active:scale-95 " +
                                            (activeTab === child.key ? "" : "hover:bg-gray-200/70 dark:hover:bg-gray-700/60")
                                        }
                                    >
                                        {child.icon}
                                        {/* 当前页面底部主色小圆点 */}
                                        {activeTab === child.key && (
                                            <span
                                                className="absolute left-1/2 -translate-x-1/2 bottom-1 w-1.5 h-1.5 rounded-full bg-green-500 shadow"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p><MixedText text={child.label} /></p>
                                </TooltipContent>
                            </Tooltip>
                        </DockIcon>
                    ))}

                    {/* 用户信息 */}
                    {userInfo && (
                        <DockIcon className="pointer-events-auto">
                            {/* 去掉嵌套 Tooltip，避免重复弹出 */}
                            <div className="pointer-events-auto">
                                {userInfo}
                            </div>
                        </DockIcon>
                    )}

                    {/* 更多按钮已移除，额外入口转移到用户地球菜单 */}
                </Dock>
            </TooltipProvider>
        </div>
    );
} 