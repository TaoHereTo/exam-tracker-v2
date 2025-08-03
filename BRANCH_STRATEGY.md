# 分支策略说明

## 📋 分支结构

本项目使用多分支管理策略，支持在线版本和离线版本并行开发：

### 🌐 **online-version** (在线版本)
- **功能**：包含完整的在线功能
- **特性**：
  - 用户认证系统 (登录/注册/密码重置)
  - 云数据同步 (Supabase)
  - 字体管理系统
  - 用户配置文件
  - 数据导入导出功能
  - 在线数据备份
- **适用场景**：需要多设备同步、在线协作的用户

### 💻 **offline-version** (离线版本)
- **功能**：纯本地版本，无需网络连接
- **特性**：
  - 本地数据存储
  - 基础功能完整
  - 轻量级设计
  - 无需注册登录
- **适用场景**：单机使用、注重隐私、网络环境受限的用户

### 🔄 **master** (主分支)
- **功能**：稳定版本发布分支
- **用途**：发布稳定版本，作为其他分支的基础

## 🚀 使用方法

### 切换到在线版本
```bash
git checkout online-version
npm install
npm run dev
```

### 切换到离线版本
```bash
git checkout offline-version
npm install
npm run dev
```

### 查看当前分支
```bash
git branch
```

## 📝 开发流程

### 在线版本开发
1. 切换到在线版本分支：`git checkout online-version`
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 开发完成后合并到在线版本分支
4. 测试无误后推送到远程：`git push origin online-version`

### 离线版本开发
1. 切换到离线版本分支：`git checkout offline-version`
2. 创建功能分支：`git checkout -b feature/offline-feature`
3. 开发完成后合并到离线版本分支
4. 测试无误后推送到远程：`git push origin offline-version`

## 🔄 版本同步

### 从离线版本同步到在线版本
```bash
git checkout online-version
git merge offline-version
# 解决冲突（主要是移除在线功能相关代码）
git push origin online-version
```

### 从在线版本同步到离线版本
```bash
git checkout offline-version
git merge online-version
# 解决冲突（主要是移除认证、云同步等在线功能）
git push origin offline-version
```

## 📦 部署说明

### 在线版本部署
- 需要配置 Supabase 环境变量
- 需要设置认证服务
- 支持 Vercel、Netlify 等平台部署

### 离线版本部署
- 无需外部服务配置
- 可直接部署到静态托管平台
- 支持 GitHub Pages、Vercel 等

## 🛠 环境配置

### 在线版本环境变量
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 离线版本环境变量
```env
# 无需特殊配置
```

## 📋 功能对比

| 功能         | 在线版本 | 离线版本 |
| ------------ | -------- | -------- |
| 用户认证     | ✅        | ❌        |
| 数据同步     | ✅        | ❌        |
| 字体管理     | ✅        | ✅        |
| 本地存储     | ✅        | ✅        |
| 数据导入导出 | ✅        | ✅        |
| 用户配置     | ✅        | ❌        |
| 多设备同步   | ✅        | ❌        |
| 离线使用     | ✅        | ✅        |

## 🔧 维护说明

- 定期同步两个版本的核心功能
- 在线版本优先获得新功能
- 离线版本保持轻量级和稳定性
- 两个版本都支持独立发布和版本管理 