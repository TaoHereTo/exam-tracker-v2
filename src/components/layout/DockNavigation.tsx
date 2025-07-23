import React, { useRef, useState } from "react";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { BarChart2, ClipboardList, Target, BookOpen, Settings, LineChart, Trophy, PlusSquare, History as HistoryIcon, CalendarCheck, TrendingUp, FileEdit, ListChecks, SlidersHorizontal } from "lucide-react";

interface DockNavigationProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    navMode: 'sidebar' | 'dock';
}

const dockNavs = [
    {
        key: 'analysis',
        icon: <BarChart2 />, label: '可视化',
        children: [
            { key: 'overview', label: '数据概览' },
            { key: 'charts', label: '数据图表' },
            { key: 'best', label: '最佳成绩' },
        ]
    },
    {
        key: 'management',
        icon: <ClipboardList />, label: '记录管理',
        children: [
            { key: 'form', label: '新的记录' },
            { key: 'history', label: '历史记录' },
        ]
    },
    {
        key: 'study-plan',
        icon: <Target />, label: '学习计划',
        children: [
            { key: 'plan', label: '制定计划' },
        ]
    },
    {
        key: 'knowledge-entry',
        icon: <BookOpen />, label: '知识点录入',
        children: [
            { key: 'knowledge-entry', label: '知识点录入' },
            { key: 'modules', label: '知识点汇总' },
        ]
    },
    {
        key: 'settings',
        icon: <Settings />, label: '系统设置',
        children: [
            { key: 'settings-basic', label: '基础设置' },
            { key: 'settings-advanced', label: '高级设置' },
        ]
    },
];

const dockChildIcons: Record<string, React.ReactNode> = {
    overview: <BarChart2 />,
    charts: <LineChart />,
    best: <Trophy />,
    form: <PlusSquare />,
    history: <HistoryIcon />,
    plan: <CalendarCheck />,
    progress: <TrendingUp />,
    "knowledge-entry": <FileEdit />,
    modules: <ListChecks />,
    "settings-basic": <Settings />,
    "settings-advanced": <SlidersHorizontal />,
};

export default function DockNavigation({ activeTab, setActiveTab, navMode }: DockNavigationProps) {
    // Dock 母项悬停展开子项弹窗（如后续需要可加）
    // const [dockHover, setDockHover] = useState<string | null>(null);
    // const [dockPos, setDockPos] = useState<{ left: number, width: number } | null>(null);
    // const dockRefs = useRef<Record<string, HTMLDivElement | null>>({});

    if (navMode !== 'dock') return null;
    return (
        <div className="fixed bottom-[70px] left-0 w-full z-50 flex justify-center bg-transparent">
            <Dock>
                {dockNavs.flatMap(nav =>
                    nav.children ? nav.children.map(child => (
                        <DockIcon
                            key={`dock-child-${nav.key}-${child.key}`}
                            onClick={() => setActiveTab(child.key)}
                            className="pointer-events-auto"
                            title={child.label}
                        >
                            {dockChildIcons[child.key] || <Settings />}
                        </DockIcon>
                    )) : []
                )}
            </Dock>
        </div>
    );
} 