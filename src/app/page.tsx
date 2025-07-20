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
        <h1 className="text-3xl font-bold mb-4">主内容区</h1>
      </div>
    </div>
  );
}
