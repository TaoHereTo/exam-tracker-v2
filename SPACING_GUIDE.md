# 统一边距系统使用指南

## 概述

本项目已实现统一的边距系统，基于 4px 网格系统，提供语义化的间距变量和工具类。

## 边距系统分类

### 1. 基础间距刻度

```css
--space-0: 0px;        /* 无间距 */
--space-1: 0.25rem;    /* 4px - 最小间距 */
--space-2: 0.5rem;     /* 8px - 小间距 */
--space-3: 0.75rem;    /* 12px - 中小间距 */
--space-4: 1rem;       /* 16px - 基础间距 */
--space-5: 1.25rem;    /* 20px - 中等间距 */
--space-6: 1.5rem;     /* 24px - 大间距 */
--space-8: 2rem;       /* 32px - 超大间距 */
--space-10: 2.5rem;    /* 40px - 特大间距 */
--space-12: 3rem;      /* 48px - 巨大间距 */
--space-16: 4rem;      /* 64px - 最大间距 */
```

### 2. 语义化间距变量

#### 组件间距
- `--spacing-component-inner`: 组件内部元素间距 (12px)
- `--spacing-component-outer`: 组件外部间距 (16px)
- `--spacing-component-section`: 组件区块间距 (24px)

#### 布局间距
- `--spacing-layout-small`: 小布局间距 (8px)
- `--spacing-layout-medium`: 中等布局间距 (16px)
- `--spacing-layout-large`: 大布局间距 (24px)
- `--spacing-layout-xl`: 超大布局间距 (32px)

#### 表单间距
- `--spacing-form-field`: 表单字段间距 (12px)
- `--spacing-form-group`: 表单组间距 (16px)
- `--spacing-form-section`: 表单区块间距 (24px)
- `--spacing-form-actions`: 表单操作按钮间距 (16px)

#### 卡片间距
- `--spacing-card-padding`: 卡片内边距 (16px)
- `--spacing-card-gap`: 卡片间距 (16px)
- `--spacing-card-content`: 卡片内容间距 (12px)

#### 按钮间距
- `--spacing-button-gap`: 按钮组间距 (8px)
- `--spacing-button-padding`: 按钮内边距 (12px)
- `--spacing-button-group`: 按钮组间距 (16px)

#### 列表间距
- `--spacing-list-item`: 列表项间距 (8px)
- `--spacing-list-group`: 列表组间距 (16px)
- `--spacing-list-section`: 列表区块间距 (24px)

#### 网格间距
- `--spacing-grid-small`: 小网格间距 (12px)
- `--spacing-grid-medium`: 中等网格间距 (16px)
- `--spacing-grid-large`: 大网格间距 (24px)

#### 页面间距
- `--spacing-page-padding`: 页面内边距 (16px)
- `--spacing-page-section`: 页面区块间距 (32px)
- `--spacing-page-content`: 页面内容间距 (24px)

#### 侧边栏间距
- `--spacing-sidebar-padding`: 侧边栏内边距 (16px)
- `--spacing-sidebar-item`: 侧边栏项目间距 (8px)
- `--spacing-sidebar-group`: 侧边栏组间距 (16px)

## 工具类使用

### 基础间距工具类

```html
<!-- Gap 间距 -->
<div class="gap-component">组件内部间距</div>
<div class="gap-layout-sm">小布局间距</div>
<div class="gap-layout-md">中等布局间距</div>
<div class="gap-layout-lg">大布局间距</div>
<div class="gap-layout-xl">超大布局间距</div>

<!-- Padding 内边距 -->
<div class="p-component">组件内边距</div>
<div class="p-card">卡片内边距</div>
<div class="p-page">页面内边距</div>
<div class="p-sidebar">侧边栏内边距</div>

<!-- Margin 外边距 -->
<div class="m-component">组件外边距</div>
<div class="m-layout-sm">小布局外边距</div>
<div class="m-layout-md">中等布局外边距</div>
<div class="m-layout-lg">大布局外边距</div>
```

### 语义化工具类

```html
<!-- 表单布局 -->
<form class="form-stack">表单垂直布局</form>
<div class="form-section">表单区块</div>
<div class="form-field">表单字段</div>
<div class="form-actions">表单操作按钮</div>

<!-- 卡片布局 -->
<div class="card-content">卡片内容</div>
<div class="card-grid">卡片网格</div>

<!-- 按钮布局 -->
<div class="button-group">按钮组</div>
<div class="button-group-lg">大按钮组</div>

<!-- 列表布局 -->
<div class="list-group">列表组</div>
<div class="list-item">列表项</div>
<div class="list-section">列表区块</div>

<!-- 网格布局 -->
<div class="grid-sm">小网格</div>
<div class="grid-md">中等网格</div>
<div class="grid-lg">大网格</div>

<!-- 页面布局 -->
<div class="page-content">页面内容</div>
<div class="page-section">页面区块</div>

<!-- 侧边栏布局 -->
<div class="sidebar-content">侧边栏内容</div>
<div class="sidebar-item">侧边栏项目</div>
```

### 响应式工具类

```html
<!-- 响应式间距 - 自动适配不同屏幕尺寸 -->
<div class="gap-responsive">响应式间距</div>
<div class="p-responsive">响应式内边距</div>
<div class="m-responsive">响应式外边距</div>
```

## 使用原则

### 1. 优先使用语义化工具类
```html
<!-- ✅ 推荐 -->
<div class="form-stack">
  <div class="form-field">字段1</div>
  <div class="form-field">字段2</div>
</div>

<!-- ❌ 避免 -->
<div class="flex flex-col gap-4">
  <div class="flex flex-col gap-2">字段1</div>
  <div class="flex flex-col gap-2">字段2</div>
</div>
```

### 2. 使用响应式工具类处理不同屏幕
```html
<!-- ✅ 推荐 -->
<div class="gap-responsive p-responsive">响应式布局</div>

<!-- ❌ 避免 -->
<div class="gap-2 sm:gap-4 md:gap-6 p-2 sm:p-4 md:p-6">手动响应式</div>
```

### 3. 保持一致性
- 相同功能区域使用相同的间距变量
- 避免混用不同的间距系统
- 优先使用预定义的语义化变量

### 4. 特殊情况处理
如果预定义的间距不满足需求，可以：
1. 使用基础间距刻度：`gap-3`, `p-4`, `m-6` 等
2. 在 CSS 中定义新的语义化变量
3. 使用内联样式（不推荐）

## 迁移指南

### 从硬编码值迁移
```html
<!-- 旧代码 -->
<div class="flex flex-col gap-4 p-4">
  <div class="flex gap-2">按钮组</div>
</div>

<!-- 新代码 -->
<div class="form-stack p-card">
  <div class="button-group">按钮组</div>
</div>
```

### 从 Tailwind 类迁移
```html
<!-- 旧代码 -->
<div class="space-y-4 p-6">
  <div class="flex gap-2">内容</div>
</div>

<!-- 新代码 -->
<div class="form-stack p-card">
  <div class="button-group">内容</div>
</div>
```

## 最佳实践

1. **组件开发**：优先使用语义化工具类
2. **页面布局**：使用响应式工具类
3. **表单设计**：使用表单相关的工具类
4. **卡片设计**：使用卡片相关的工具类
5. **列表设计**：使用列表相关的工具类

## 注意事项

1. 所有工具类都基于 CSS 变量，可以通过修改变量值来全局调整
2. 响应式工具类会自动适配不同屏幕尺寸
3. 保持向后兼容性，旧的 Tailwind 类仍然可以使用
4. 建议逐步迁移，不要一次性修改所有文件
