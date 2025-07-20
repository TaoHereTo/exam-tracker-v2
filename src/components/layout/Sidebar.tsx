import React, { useState } from "react";

// 可折叠分组组件
function Collapsible({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="mb-2">
            <button
                className="w-full flex items-center justify-between px-4 py-2 font-semibold bg-gray-100 hover:bg-gray-200 rounded-t transition-colors"
                onClick={() => setOpen((v) => !v)}
                type="button"
            >
                <span>{title}</span>
                <span className="ml-2">{open ? "▲" : "▼"}</span>
            </button>
            {open && <div className="bg-white border border-t-0 border-gray-200 rounded-b px-4 py-2 space-y-1">{children}</div>}
        </div>
    );
}

export function Sidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
    // 高亮样式
    const activeClass = "bg-blue-600 text-white font-bold";
    return (
        <aside className="w-64 min-h-screen bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-center tracking-wide text-gray-800">行测每日记录</h1>
            <nav className="flex-1 space-y-4">
                {/* 分析分组 */}
                <Collapsible title="分析">
                    <button data-tab="overview" className={`block w-full text-left px-2 py-1 rounded transition-colors hover:bg-blue-100 ${activeTab === 'overview' ? activeClass : ''}`} onClick={() => setActiveTab('overview')}>数据概览</button>
                    <button data-tab="charts" className={`block w-full text-left px-2 py-1 rounded transition-colors hover:bg-blue-100 ${activeTab === 'charts' ? activeClass : ''}`} onClick={() => setActiveTab('charts')}>数据图表</button>
                    <button data-tab="best" className={`block w-full text-left px-2 py-1 rounded transition-colors hover:bg-blue-100 ${activeTab === 'best' ? activeClass : ''}`} onClick={() => setActiveTab('best')}>最佳成绩</button>
                    <button data-tab="modules" className={`block w-full text-left px-2 py-1 rounded transition-colors hover:bg-blue-100 ${activeTab === 'modules' ? activeClass : ''}`} onClick={() => setActiveTab('modules')}>模块知识点</button>
                </Collapsible>
                {/* 管理分组 */}
                <Collapsible title="管理">
                    <button data-tab="form" className={`block w-full text-left px-2 py-1 rounded transition-colors hover:bg-green-100 ${activeTab === 'form' ? activeClass : ''}`} onClick={() => setActiveTab('form')}>新的记录</button>
                    <button data-tab="history" className={`block w-full text-left px-2 py-1 rounded transition-colors hover:bg-green-100 ${activeTab === 'history' ? activeClass : ''}`} onClick={() => setActiveTab('history')}>历史记录</button>
                </Collapsible>
                {/* 学习计划分组 */}
                <Collapsible title="学习计划">
                    <button data-tab="plan" className={`block w-full text-left px-2 py-1 rounded transition-colors hover:bg-yellow-100 ${activeTab === 'plan' ? activeClass : ''}`} onClick={() => setActiveTab('plan')}>制定计划</button>
                    <button data-tab="progress" className={`block w-full text-left px-2 py-1 rounded transition-colors hover:bg-yellow-100 ${activeTab === 'progress' ? activeClass : ''}`} onClick={() => setActiveTab('progress')}>进度追踪</button>
                </Collapsible>
                {/* 知识点录入分组 */}
                <Collapsible title="知识点录入">
                    <div className="text-gray-400 text-sm">（示例内容）</div>
                </Collapsible>
                {/* 系统设置分组 */}
                <Collapsible title="系统设置">
                    <button data-tab="settings-basic" className={`block w-full text-left px-2 py-1 rounded transition-colors hover:bg-purple-100 ${activeTab === 'settings-basic' ? activeClass : ''}`} onClick={() => setActiveTab('settings-basic')}>基础设置</button>
                    <button data-tab="settings-advanced" className={`block w-full text-left px-2 py-1 rounded transition-colors hover:bg-purple-100 ${activeTab === 'settings-advanced' ? activeClass : ''}`} onClick={() => setActiveTab('settings-advanced')}>高级设置</button>
                </Collapsible>
            </nav>
        </aside>
    );
} 