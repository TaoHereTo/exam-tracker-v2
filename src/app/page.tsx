"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview'); // 默认显示'数据概览'
  return (
    <div className="flex min-h-screen">
      {/* 左侧侧边栏，宽度固定 */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* 右侧主内容区，占据剩余空间 */}
      <div className="flex-1 p-8 bg-white">
        {activeTab === 'overview' && <div><h1>数据概览</h1></div>}
        {activeTab === 'charts' && <div><h1>数据图表</h1></div>}
        {activeTab === 'best' && <div><h1>最佳成绩</h1></div>}
        {activeTab === 'modules' && <div><h1>模块知识点</h1></div>}
        {activeTab === 'form' && <div><h1>新的记录</h1></div>}
        {activeTab === 'history' && <div><h1>历史记录</h1></div>}
        {activeTab === 'plan' && <div><h1>制定计划</h1></div>}
        {activeTab === 'progress' && <div><h1>进度追踪</h1></div>}
        {activeTab === 'settings-basic' && <div><h1>基础设置</h1></div>}
        {activeTab === 'settings-advanced' && <div><h1>高级设置</h1></div>}
      </div>
    </div>
  );
}
