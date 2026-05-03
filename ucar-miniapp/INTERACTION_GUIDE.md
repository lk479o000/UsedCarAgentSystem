# 微信小程序交互规范指南

## 1. 概述

本文档定义 ucar-miniapp 项目中通用组件的交互行为与动效规范，确保全站交互体验一致。所有交互实现需遵循「即时反馈、防误触、优雅降级」的原则。

---

## 2. 快捷入口（Quick Actions）

### 2.1 使用场景

首页或核心页面中，提供高频功能的快速跳转或操作入口，如：我的线索、我的结算、个人中心、刷新数据等。

### 2.2 结构规范

```wxml
<view class="card-glass quick-actions">
  <view class="section-title">快捷入口</view>
  <view class="action-grid">
    <view class="action-item" bindtap="navigateTo" data-url="/pages/target/target">
      <view class="action-icon blue i-lucide-list"></view>
      <text class="action-label">功能名称</text>
    </view>
  </view>
</view>
```

| 元素 | 规范 |
|------|------|
| 容器 | 使用 `card-glass` 玻璃拟态卡片包裹 |
| 标题 | `section-title` 样式，32rpx 加粗 |
| 网格 | 4列等宽 (`grid-template-columns: repeat(4, 1fr)`)，gap 20rpx |
| 图标 | 88rpx 圆角方形，渐变背景，40rpx 图标大小 |
| 文字 | 24rpx，#475569，位于图标下方 12rpx |

### 2.3 视觉规范

图标颜色按功能语义区分：

| 颜色类 | 渐变值 | 用途 |
|--------|--------|------|
| `.blue` | `#0EA5E9 → #38BDF8` | 列表/线索/信息类 |
| `.green` | `#14B8A6 → #22D3EE` | 财务/结算/成功类 |
| `.orange` | `#F59E0B → #FBBF24` | 用户/个人/警告类 |
| `.red` | `#EF4444 → #F87171` | 刷新/删除/危险操作类 |

### 2.4 交互行为

#### 点击反馈（:active 状态）

```css
.action-item {
  transition: all 0.3s ease;
}

.action-item:active {
  background: rgba(14, 165, 233, 0.15);
  transform: scale(0.92);
}

.action-item:active .action-icon {
  opacity: 0.8;
  transform: scale(0.95);
}

.action-item:active .action-label {
  color: #0EA5E9;
}
```

| 元素 | 点击态效果 |
|------|-----------|
| 整体容器 | 背景高亮 (主色 15% 透明度) + 缩放至 0.92x |
| 图标 | 透明度降至 0.8 + 缩放至 0.95x |
| 文字 | 颜色变为主色 #0EA5E9 |
| 过渡时间 | 0.3s ease |

#### 页面跳转逻辑

```js
navigateTo(e) {
  if (!checkLogin()) {
    this.showGuest()
    wx.showToast({ title: '登录后可使用', icon: 'none' })
    return
  }
  const url = e.currentTarget.dataset.url
  const tabBarPages = ['/pages/leads/leads', '/pages/settlements/settlements', '/pages/profile/profile']

  if (this.navigateTimer) {
    clearTimeout(this.navigateTimer)
  }

  this.navigateTimer = setTimeout(() => {
    if (tabBarPages.includes(url)) {
      wx.switchTab({ url })
    } else {
      wx.navigateTo({ url })
    }
    this.navigateTimer = null
  }, 100)
}
```

| 规则 | 说明 |
|------|------|
| 登录拦截 | 未登录时显示访客态，Toast 提示「登录后可使用」 |
| TabBar 判断 | 目标页为 TabBar 页时用 `wx.switchTab`，否则用 `wx.navigateTo` |
| 防抖处理 | 100ms 定时器防止快速重复点击导致多次跳转 |

#### 本地操作逻辑（如刷新数据）

```js
refreshData() {
  if (!checkLogin()) {
    this.showGuest()
    wx.showToast({ title: '登录后可刷新', icon: 'none' })
    return
  }
  this.loadStats()
  this.loadRecentLeads()
  wx.showToast({ title: '刷新成功', icon: 'success' })
}
```

| 规则 | 说明 |
|------|------|
| 登录拦截 | 同上，未登录时阻止操作 |
| 数据重载 | 调用对应的数据加载方法重新获取 |
| 成功反馈 | Toast 提示「刷新成功」，icon 为 success |

---

## 3. 统计卡片（Stat Cards）

### 3.1 使用场景

首页数据概览区域，展示核心 KPI 数据，支持点击跳转详情。

### 3.2 交互行为

#### 点击反馈

```css
.stat-card {
  transition: all 0.3s ease;
}

.stat-card:active {
  transform: scale(0.96);
  box-shadow: 0 8rpx 24rpx rgba(14, 165, 233, 0.15);
}
```

| 元素 | 点击态效果 |
|------|-----------|
| 卡片整体 | 缩放至 0.96x + 阴影增强 |
| 过渡时间 | 0.3s ease |

#### 跳转传参

```js
onStatTap(e) {
  if (!checkLogin()) {
    this.showGuest()
    wx.showToast({ title: '登录后可查看', icon: 'none' })
    return
  }
  const target = e.currentTarget.dataset.target
  const filter = e.currentTarget.dataset.filter
  // 根据 target 和 filter 构造带参 URL 跳转
}
```

| 规则 | 说明 |
|------|------|
| 数据透传 | 通过 `data-*` 属性传递目标页面和筛选条件 |
| 条件跳转 | 根据 `target` 字段决定跳转到线索页或结算页 |
| 筛选状态 | `filter` 字段作为 URL 参数传入，进入页面后自动应用筛选 |

---

## 4. 列表项（List Items）

### 4.1 使用场景

最近线索、线索列表、结算列表等数据列表中的单行条目。

### 4.2 交互行为

```css
.lead-item {
  transition: all 0.3s ease;
}

.lead-item:active {
  background: rgba(14, 165, 233, 0.06);
}
```

| 元素 | 点击态效果 |
|------|-----------|
| 列表项 | 背景变为浅蓝色 (主色 6% 透明度) |
| 过渡时间 | 0.3s ease |

#### 点击跳转

```js
onLeadTap(e) {
  if (!checkLogin()) {
    this.showGuest()
    wx.showToast({ title: '登录后可查看', icon: 'none' })
    return
  }
  const id = e.currentTarget.dataset.id
  wx.navigateTo({ url: `/pages/leads/detail?id=${id}` })
}
```

---

## 5. 通用交互原则

### 5.1 登录拦截统一处理

所有需要登录才能操作的交互元素，必须在事件处理函数开头调用 `checkLogin()`：

```js
if (!checkLogin()) {
  this.showGuest()
  wx.showToast({ title: '登录后可使用', icon: 'none' })
  return
}
```

| 场景 | Toast 文案 |
|------|-----------|
| 页面跳转 | 登录后可使用 |
| 数据查看 | 登录后可查看 |
| 刷新操作 | 登录后可刷新 |

### 5.2 防抖节流规范

| 场景 | 策略 | 延迟 |
|------|------|------|
| 按钮点击/跳转 | 防抖 (debounce) | 100ms |
| 搜索输入 | 防抖 (debounce) | 300ms |
| 滚动加载 | 节流 (throttle) | 200ms |

### 5.3 操作反馈规范

| 操作结果 | 反馈方式 | 持续时间 |
|----------|---------|---------|
| 成功 | `wx.showToast({ icon: 'success' })` | 默认 1500ms |
| 失败 | `wx.showToast({ icon: 'none' })` 或 `wx.showModal` | 根据场景 |
| 加载中 | `wx.showLoading({ title: '加载中...' })` | 需手动 hide |
| 确认操作 | `wx.showModal({ title, content })` | 用户确认后关闭 |

### 5.4 动效参数统一

```css
/* 通用过渡 */
.transition-base {
  transition: all 0.3s ease;
}

/* 点击缩放 */
.scale-tap:active {
  transform: scale(0.96);
}

/* 强点击缩放（用于小面积元素） */
.scale-tap-strong:active {
  transform: scale(0.92);
}

/* 页面淡入 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page {
  animation: fadeIn 0.4s ease-out;
}
```

| 动效类型 | 时长 | 缓动函数 |
|----------|------|---------|
| 点击反馈 | 0.3s | ease |
| 页面进入 | 0.4s | ease-out |
| 背景高亮 | 0.3s | ease |
| 阴影变化 | 0.3s | ease |

---

## 6. 组件交互速查表

| 组件 | 点击态 | 缩放比 | 额外效果 | 登录拦截 |
|------|--------|--------|---------|---------|
| 快捷入口项 | 背景高亮 + 图标淡化 | 0.92x | 文字变色 | 是 |
| 统计卡片 | 阴影增强 | 0.96x | — | 是 |
| 列表项 | 背景浅蓝 | — | — | 是 |
| 按钮（全局） | 阴影增强 | 0.96x | — | 按需 |
| 标签/徽章 | — | — | — | 否 |
