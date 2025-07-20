"use client";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      {/* 左侧侧边栏容器 */}
      <div className="w-64 bg-muted/40 h-screen">
        {/* 这里将放置侧边栏内容 */}
      </div>
      {/* 右侧主内容区 */}
      <div className="flex-1 h-screen overflow-y-auto">
        {/* 这里将放置主内容区内容 */}
      </div>
    </div>
  );
}
